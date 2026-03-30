import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';
import { Unauthorized } from 'src/common/exceptions/custom.exception';
import { AuthService } from 'src/modules/auth/auth.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    console.log('authHeader: ', authHeader);
    if (!authHeader) throw new Unauthorized();

    const token = authHeader.split(' ')[1];
    console.log(token, 'token');
    const user = await this.authService.verifyToken(token);
    if (!user) throw new Unauthorized();

    req['user'] = user;
    next();
  }
}
