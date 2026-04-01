import { Injectable } from '@nestjs/common';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { In, Repository } from 'typeorm';
import { Collection, Product, User } from 'src/core/database/entity';
import { OrmService } from 'src/core/database/database.service';
import {
  ResourceFound,
  ResourceNotFound,
} from 'src/common/exceptions/custom.exception';
import { RESOURCE_NAMES, SUCCESS_MSG } from 'src/common/utils/constants';
import {
  successResponse,
  successResponseWithResult,
} from 'src/common/utils/helper';

@Injectable()
export class ProductService {
  private productRepository: Repository<Product>;
  private collectionRepo: Repository<Collection>;

  constructor(private ormService: OrmService) {
    this.productRepository = this.ormService.getRepo(Product);
    this.collectionRepo = this.ormService.getRepo(Collection);
  }

  async create(userId: number, createProductDto: CreateProductDto) {
    // Reject if SKU already exists (even soft-deleted — SKU must be globally unique)
    const existing = await this.productRepository.findOne({
      where: { sku: createProductDto.sku, is_deleted: false },
    });
    if (existing) throw new ResourceFound(RESOURCE_NAMES.PRODUCT);

    let collections: Collection[] = [];
    if (createProductDto.collectionIds?.length) {
      collections = await this.collectionRepo.findBy({
        id: In(createProductDto.collectionIds),
        is_deleted: false, // only attach non-deleted collections
      });
    }

    const product = this.productRepository.create({
      ...createProductDto,
      created_by: { id: userId } as User,
      collections,
    });

    const saved = await this.productRepository.save(product);
    return successResponseWithResult(SUCCESS_MSG.CREATED, { product: saved });
  }

  async findAll() {
    const products = await this.productRepository.find({
      where: { is_deleted: false },
      relations: ['collections'],
      order: { created_at: 'DESC' },
    });
    return successResponseWithResult(SUCCESS_MSG.FETCHED, { products });
  }

  async findOne(id: number) {
    const product = await this.checkProductExists(id);
    return successResponseWithResult(SUCCESS_MSG.FETCHED, { product });
  }

  async update(id: number, updateProductDto: UpdateProductDto, userId: number) {
    const product = await this.checkProductExists(id, userId);

    // Re-resolve collections if collectionIds changed
    if (updateProductDto.collectionIds !== undefined) {
      product.collections = updateProductDto.collectionIds?.length
        ? await this.collectionRepo.findBy({
            id: In(updateProductDto.collectionIds),
            is_deleted: false,
          })
        : [];
    }

    Object.assign(product, updateProductDto);
    const saved = await this.productRepository.save(product);
    return successResponseWithResult(SUCCESS_MSG.UPDATED, { product: saved });
  }

  // Soft delete — sets is_deleted = true, never removes the row
  async remove(id: number, userId: number) {
    const product = await this.checkProductExists(id, userId);
    product.is_deleted = true;
    await this.productRepository.save(product);
    return successResponse(SUCCESS_MSG.DELETED);
  }

  // ── private ──────────────────────────────────────────────────────────────
  private async checkProductExists(id: number, userId?: number) {
    const product = await this.productRepository.findOne({
      where: {
        id,
        ...(userId && { created_by: { id: userId } }),
        is_deleted: false,
      },
      relations: ['collections'],
    });
    if (!product) throw new ResourceNotFound(RESOURCE_NAMES.PRODUCT);
    return product;
  }
}
