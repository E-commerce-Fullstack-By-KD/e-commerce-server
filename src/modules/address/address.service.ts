import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { OrmService } from 'src/core/database/database.service';
import { AddressDto } from './dto/address.dto';
import {
  successResponse,
  successResponseWithResult,
} from 'src/common/utils/helper';
import { SUCCESS_MSG } from 'src/common/utils/constants';
import { ResourceNotFound } from 'src/common/exceptions/custom.exception';
import { User } from 'src/core/database/entity';
import { Address } from 'src/core/database/entity/address.entity';

@Injectable()
export class AddressService {
  private addressRepo: Repository<Address>;

  constructor(private ormService: OrmService) {
    this.addressRepo = this.ormService.getRepo(Address);
  }

  async create(userId: number, dto: AddressDto) {
    if (dto.is_default) {
      await this.addressRepo.update(
        { user: { id: userId }, is_default: true },
        { is_default: false },
      );
    }

    const address = this.addressRepo.create({
      ...dto,
      user: { id: userId } as User,
    });

    const saved = await this.addressRepo.save(address);

    return successResponseWithResult(SUCCESS_MSG.CREATED, {
      address: saved,
    });
  }

  async findAll(userId: number) {
    const addresses = await this.addressRepo.find({
      where: { user: { id: userId } },
      order: { is_default: 'DESC', created_at: 'DESC' },
    });

    return successResponseWithResult(SUCCESS_MSG.FETCHED, {
      addresses,
    });
  }

  async findOne(id: number, userId: number) {
    const address = await this.checkExists(id, userId);

    return successResponseWithResult(SUCCESS_MSG.FETCHED, {
      address,
    });
  }

  async update(id: number, userId: number, dto: AddressDto) {
    const address = await this.checkExists(id, userId);

    if (dto.is_default) {
      await this.addressRepo.update(
        { user: { id: userId }, is_default: true },
        { is_default: false },
      );
    }

    Object.assign(address, dto);

    const saved = await this.addressRepo.save(address);

    return successResponseWithResult(SUCCESS_MSG.UPDATED, {
      address: saved,
    });
  }

  async remove(id: number, userId: number) {
    await this.checkExists(id, userId);

    await this.addressRepo.delete({ id });

    return successResponse(SUCCESS_MSG.DELETED);
  }

  private async checkExists(id: number, userId: number) {
    const address = await this.addressRepo.findOne({
      where: { id, user: { id: userId } },
    });

    if (!address) throw new ResourceNotFound('Address');

    return address;
  }
}
