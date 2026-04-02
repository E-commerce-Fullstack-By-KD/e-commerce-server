import { Injectable, Inject } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { OrmService } from 'src/core/database/database.service';
import {
  Order,
  Cart,
  Address,
  User,
  Payment,
  OrderItem,
  Product,
} from 'src/core/database/entity';
import {
  successResponse,
  successResponseWithResult,
} from 'src/common/utils/helper';
import { SUCCESS_MSG, ERROR_MSG } from 'src/common/utils/constants';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { OrderStatus, PaymentStatus } from 'src/common/enum';
import { CreateOrderDto, UpdateOrderDto } from './dto/order.dto';
import Razorpay from 'razorpay';

@Injectable()
export class OrderService {
  private orderRepo: Repository<Order>;
  private cartRepo: Repository<Cart>;
  private addressRepo: Repository<Address>;
  private paymentRepo: Repository<Payment>;
  private productRepo: Repository<Product>;
  private orderItemRepo: Repository<OrderItem>;

  constructor(
    private ormService: OrmService,
    @Inject('RzpToken') private rzpClient: Razorpay,
  ) {
    this.orderRepo = this.ormService.getRepo(Order);
    this.cartRepo = this.ormService.getRepo(Cart);
    this.addressRepo = this.ormService.getRepo(Address);
    this.paymentRepo = this.ormService.getRepo(Payment);
    this.productRepo = this.ormService.getRepo(Product);
    this.orderItemRepo = this.ormService.getRepo(OrderItem);
  }

  async create(userId: number, dto: CreateOrderDto) {
    // Verify address exists and belongs to user
    const address = await this.addressRepo.findOne({
      where: { id: dto.addressId, user: { id: userId } },
    });
    if (!address) throw new CustomException(ERROR_MSG.RECORD_NOT_FOUND);

    // Get cart items for this user
    let cartItems = await this.cartRepo.find({
      where: { user: { id: userId } },
      relations: ['product'],
    });

    if (dto.cartIds && dto.cartIds.length > 0) {
      cartItems = cartItems.filter((c) => dto.cartIds!.includes(c.id));
    }

    if (!cartItems.length) {
      throw new CustomException('No items in cart');
    }

    // Calculate total amount and validate stock
    let totalAmount = 0;
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        throw new CustomException(
          `Insufficient stock for product: ${item.product.name}`,
        );
      }
      const price = item.product.offer_price ?? item.product.list_price;
      totalAmount += price * item.quantity;
    }

    // Create order
    const order = this.orderRepo.create({
      user: { id: userId } as User,
      address,
      total_amount: totalAmount,
      status: OrderStatus.PENDING,
      items: [] as OrderItem[],
    });

    const savedOrder = await this.orderRepo.save(order);

    // Create order items
    for (const cartItem of cartItems) {
      const price = cartItem.product.offer_price ?? cartItem.product.list_price;
      const orderItem = this.orderItemRepo.create({
        order: savedOrder,
        product: cartItem.product,
        quantity: cartItem.quantity,
        unit_price: price,
        total_price: price * cartItem.quantity,
      });
      await this.orderItemRepo.save(orderItem);
    }

    // Create Razorpay order
    const rzpOrder = await this.rzpClient.orders.create({
      amount: Math.round(totalAmount * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `order_${savedOrder.id}`,
    });

    // Create payment record
    const payment = this.paymentRepo.create({
      order: savedOrder,
      razorpay_order_id: rzpOrder.id,
      amount: totalAmount,
      currency: 'INR',
      status: PaymentStatus.PENDING,
    });

    await this.paymentRepo.save(payment);

    return successResponseWithResult(SUCCESS_MSG.ORDER_CREATED, {
      order: {
        id: savedOrder.id,
        total_amount: savedOrder.total_amount,
        razorpay_order_id: rzpOrder.id,
      },
    });
  }

  async findAll(userId: number) {
    const orders = await this.orderRepo.find({
      where: { user: { id: userId } },
      relations: ['address', 'items', 'items.product', 'payment'],
      order: { created_at: 'DESC' },
    });
    return successResponseWithResult(SUCCESS_MSG.FETCHED, { orders });
  }

  async findOne(id: number, userId: number) {
    const order = await this.checkOrderExists(id, userId);
    return successResponseWithResult(SUCCESS_MSG.FETCHED, { order });
  }

  async update(id: number, userId: number, dto: UpdateOrderDto) {
    const order = await this.checkOrderExists(id, userId);

    if (order.status !== OrderStatus.PENDING) {
      throw new CustomException('Cannot update non-pending orders');
    }

    if (dto.addressId) {
      const address = await this.addressRepo.findOne({
        where: { id: dto.addressId, user: { id: userId } },
      });
      if (!address) throw new CustomException(ERROR_MSG.RECORD_NOT_FOUND);
      order.address = address;
    }

    const saved = await this.orderRepo.save(order);
    return successResponseWithResult(SUCCESS_MSG.UPDATED, { order: saved });
  }

  async cancel(id: number, userId: number) {
    const order = await this.checkOrderExists(id, userId);

    if (order.status !== OrderStatus.PENDING) {
      throw new CustomException('Can only cancel pending orders');
    }

    const payment = await this.paymentRepo.findOne({
      where: { order: { id } },
    });

    if (payment && payment.status === PaymentStatus.PAID) {
      throw new CustomException('Cannot cancel paid orders');
    }

    order.status = OrderStatus.CANCELLED;
    await this.orderRepo.save(order);

    return successResponse(SUCCESS_MSG.UPDATED);
  }

  async getStatus(id: number, userId: number) {
    const order = await this.checkOrderExists(id, userId);
    const payment = await this.paymentRepo.findOne({
      where: { order: { id } },
    });

    return successResponseWithResult(SUCCESS_MSG.FETCHED, {
      orderStatus: order.status,
      paymentStatus: payment?.status,
    });
  }

  private async checkOrderExists(id: number, userId: number) {
    const order = await this.orderRepo.findOne({
      where: { id, user: { id: userId } },
      relations: ['address', 'items', 'items.product', 'payment'],
    });
    if (!order) throw new CustomException(ERROR_MSG.RECORD_NOT_FOUND);
    return order;
  }
}
