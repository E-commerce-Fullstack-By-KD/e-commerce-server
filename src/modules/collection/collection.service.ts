import { Injectable } from '@nestjs/common';
import { CreateCollectionDto, UpdateCollectionDto } from './dto/collection.dto';
import { Repository } from 'typeorm';
import { OrmService } from 'src/core/database/database.service';
import { Collection } from 'src/core/database/entity';
import {
  ERROR_MSG,
  RESOURCE_NAMES,
  SUCCESS_MSG,
} from 'src/common/utils/constants';
import {
  successResponse,
  successResponseWithResult,
} from 'src/common/utils/helper';
import {
  CustomException,
  ResourceFound,
} from 'src/common/exceptions/custom.exception';

@Injectable()
export class CollectionService {
  private collectionRepository: Repository<Collection>;

  constructor(private ormService: OrmService) {
    this.collectionRepository = this.ormService.getRepo(Collection);
  }

  async create(createCollectionDto: CreateCollectionDto) {
    // Reject if an active (non-deleted) collection with same name exists
    const existing = await this.collectionRepository.findOne({
      where: { name: createCollectionDto.name, is_deleted: false },
    });
    if (existing) throw new ResourceFound(RESOURCE_NAMES.COLLECTION);

    const collection = this.collectionRepository.create(createCollectionDto);
    await this.collectionRepository.save(collection);
    return successResponse(SUCCESS_MSG.CREATED);
  }

  async findAll() {
    // Only return non-deleted collections
    const collection = await this.collectionRepository.find({
      where: { is_deleted: false },
      select: ['id', 'name'],
      order: { created_at: 'DESC' },
    });
    return successResponseWithResult(SUCCESS_MSG.FETCHED, { collection });
  }

  async findOne(id: number) {
    const collection = await this.checkCollectionExists(id);
    return successResponseWithResult(SUCCESS_MSG.FETCHED, { collection });
  }

  async update(updateCollectionDto: UpdateCollectionDto) {
    const collection = await this.checkCollectionExists(updateCollectionDto.id);
    Object.assign(collection, { name: updateCollectionDto.name });
    await this.collectionRepository.save(collection);
    return successResponse(SUCCESS_MSG.UPDATED);
  }

  // Soft delete — sets is_deleted = true
  async remove(id: number) {
    const collection = await this.checkCollectionExists(id);
    collection.is_deleted = true;
    await this.collectionRepository.save(collection);
    return successResponse(SUCCESS_MSG.DELETED);
  }

  // ── private ──────────────────────────────────────────────────────────────
  private async checkCollectionExists(id: number) {
    const existing = await this.collectionRepository.findOne({
      where: { id, is_deleted: false }, // never operate on deleted records
      select: ['id', 'name', 'is_deleted'],
    });
    if (!existing) throw new CustomException(ERROR_MSG.RECORD_NOT_FOUND);
    return existing;
  }
}
