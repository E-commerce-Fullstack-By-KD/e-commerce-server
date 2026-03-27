import { Injectable } from '@nestjs/common';
import { CreateCollectionDto } from './dto/collection.dto';
import { UpdateCollectionDto } from './dto/collection.dto';
import { Repository } from 'typeorm';
import { OrmService } from 'src/core/database/database.service';
import { Collection } from 'src/core/database/entity';
import { ERROR_MSG, SUCCESS_MSG } from 'src/common/utils/constants';
import {
  successResponse,
  successResponseWithResult,
} from 'src/common/utils/helper';
import { CustomException } from 'src/common/exceptions/custom.exception';

@Injectable()
export class CollectionService {
  private collectionRepository: Repository<Collection>;

  constructor(private ormService: OrmService) {
    this.collectionRepository = this.ormService.getRepo(Collection);
  }

  async create(createCollectionDto: CreateCollectionDto) {
    const existing = await this.collectionRepository.findOne({
      where: { name: createCollectionDto.name },
    });
    if (existing) {
      throw new CustomException(SUCCESS_MSG.COLLECTION_EXISTS);
    }
    const collection = this.collectionRepository.create(createCollectionDto);
    await this.collectionRepository.save(collection);
    return successResponse(SUCCESS_MSG.CREATED);
  }

  async findAll() {
    const collection = await this.collectionRepository.find({
      select: ['id', 'name'],
    });
    return successResponseWithResult(SUCCESS_MSG.FETCHED, {
      collection,
    });
  }

  async findOne(id: number) {
    const collection = await this.collectionRepository.findOne({
      where: { id },
      select: ['id', 'name'],
    });

    if (!collection) {
      throw new CustomException(ERROR_MSG.RECORD_NOT_FOUND);
    }
    return successResponseWithResult(SUCCESS_MSG.FETCHED, {
      collection,
    });
  }

  async update(updateCollectionDto: UpdateCollectionDto) {
    const collection = await this.checkCollectionExists(updateCollectionDto.id);
    Object.assign(collection, updateCollectionDto);
    await this.collectionRepository.save(collection);
    return successResponse(SUCCESS_MSG.UPDATED);
  }

  async remove(id: number) {
    const collection = await this.checkCollectionExists(id);

    await this.collectionRepository.remove(collection);
    return successResponse(SUCCESS_MSG.DELETED);
  }

  private async checkCollectionExists(id: number) {
    const existing = await this.collectionRepository.findOne({
      where: { id },
    });
    if (!existing) {
      throw new CustomException(ERROR_MSG.RECORD_NOT_FOUND);
    }
    return existing;
  }
}
