import { Injectable } from '@nestjs/common';
import { User } from 'src/core/database/entity';
import { CustomException } from 'src/common/exceptions/custom.exception';
import {
  bcryptCompare,
  bcryptHash,
  decryptData,
  encryptData,
  successResponse,
  successResponseWithResult,
} from 'src/common/utils/helper';
import { OrmService } from 'src/core/database/database.service';
import { Repository } from 'typeorm';
import { LoginDto, SignupDto } from './dto';
import { MailService } from 'src/core/mailer/mailer.service';
import { JwtService } from 'src/core/jwt/jwt.service';
import { ERROR_MSG, SUCCESS_MSG } from 'src/common/utils/constants';

@Injectable()
export class AuthService {
  private userRepository: Repository<User>;

  constructor(
    private ormService: OrmService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {
    this.userRepository = this.ormService.getRepo(User);
  }

  async signup(dto: SignupDto) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) throw new CustomException(ERROR_MSG.EMAIL_EXISTS);

    const hashPassword = await bcryptHash(dto.password);

    const user = this.userRepository.create({
      ...dto,
      password: hashPassword,
    });

    const jwtToken = await this.jwtService.tokenGenerator({}, '1d');
    const token = encryptData(
      JSON.stringify({ email: user.email, token: jwtToken }),
    );

    await this.userRepository.save(user);
    this.mailService.sendVerificationEmail(user.email, token);

    return successResponse(SUCCESS_MSG.REGISTERED);
  }

  async login(dto: LoginDto) {
    const findUser = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: dto.email })
      .getOne();

    if (!findUser) throw new CustomException(ERROR_MSG.INVALID_CREDENTIALS);

    if (!findUser.is_verified) {
      throw new CustomException(ERROR_MSG.VERIFY_EMAIL);
    }

    const isPasswordValid = await bcryptCompare(
      dto.password,
      findUser.password,
    );

    if (!isPasswordValid)
      throw new CustomException(ERROR_MSG.INVALID_CREDENTIALS);

    const payload = {
      sub: findUser.id,
      email: findUser.email,
    };

    const jwtToken = await this.jwtService.tokenGenerator(payload, '1d');

    return successResponseWithResult(SUCCESS_MSG.LOG_IN, {
      jwtToken,
      user: {
        id: findUser.id,
        name: findUser.name,
        email: findUser.email,
        isVerified: findUser.is_verified,
        createdAt: findUser.created_at,
      },
    });
  }

  async verifyUser(body: string) {
    const payload = JSON.parse(decryptData(body));

    const user = await this.userRepository.findOne({
      where: { email: payload.email },
    });
    if (!user) throw new CustomException(ERROR_MSG.USER_NOT_FOUND);
    if (user.is_verified)
      return successResponse(SUCCESS_MSG.ACCOUNT_ALREADY_VERIFIED);

    await this.jwtService.tokenVerifier(payload.token);

    user.is_verified = true;
    await this.userRepository.save(user);

    return successResponse(SUCCESS_MSG.ACCOUNT_VERIFIED);
  }
}
