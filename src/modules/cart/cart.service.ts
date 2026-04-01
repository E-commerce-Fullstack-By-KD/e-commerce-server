import { Injectable } from '@nestjs/common';
import { CartDto, UpdateCartDto } from './dto/cart.dto';
import { Repository } from 'typeorm';
import { Cart } from 'src/core/database/entity';
import { OrmService } from 'src/core/database/database.service';
import {
  successResponse,
  successResponseWithResult,
} from 'src/common/utils/helper';
import { ERROR_MSG, SUCCESS_MSG } from 'src/common/utils/constants';
import { CustomException } from 'src/common/exceptions/custom.exception';

@Injectable()
export class CartService {
  private cartRepository: Repository<Cart>;

  constructor(private ormService: OrmService) {
    this.cartRepository = this.ormService.getRepo(Cart);
  }

  async create(createCartDto: CartDto, userId: number) {
    // If the same product already exists, just increment quantity
    const existing = await this.cartRepository.findOne({
      where: { user: { id: userId }, product: { id: createCartDto.productId } },
    });

    if (existing) {
      existing.quantity += createCartDto.quantity;
      const saved = await this.cartRepository.save(existing);
      return successResponseWithResult(SUCCESS_MSG.UPDATED, { cart: saved });
    }

    const newCart = this.cartRepository.create({
      user: { id: userId },
      product: { id: createCartDto.productId },
      quantity: createCartDto.quantity,
    });
    const saved = await this.cartRepository.save(newCart);
    return successResponseWithResult(SUCCESS_MSG.CREATED, { cart: saved });
  }

  async findAll(userId: number) {
    const carts = await this.cartRepository.find({
      where: { user: { id: userId } },
      relations: ['product', 'product.collections'],
      order: { created_at: 'DESC' },
    });
    return successResponseWithResult(SUCCESS_MSG.FETCHED, { carts });
  }

  async findOne(id: number, userId: number) {
    const cart = await this.checkCartExists(id, userId);
    return successResponseWithResult(SUCCESS_MSG.FETCHED, { cart });
  }

  async update(id: number, updateCartDto: UpdateCartDto, userId: number) {
    const cart = await this.checkCartExists(id, userId);
    cart.quantity = updateCartDto.quantity;
    const saved = await this.cartRepository.save(cart);
    return successResponseWithResult(SUCCESS_MSG.UPDATED, { cart: saved });
  }

  async remove(id: number, userId: number) {
    const cart = await this.checkCartExists(id, userId);
    await this.cartRepository.remove(cart);
    return successResponse(SUCCESS_MSG.DELETED);
  }

  /** Find a cart row by its own primary-key id and owner userId */
  private async checkCartExists(id: number, userId: number) {
    const cart = await this.cartRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['product'],
    });
    if (!cart) throw new CustomException(ERROR_MSG.RECORD_NOT_FOUND);
    return cart;
  }
}
