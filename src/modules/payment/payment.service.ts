import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { OrmService } from 'src/core/database/database.service';
import { Payment } from 'src/core/database/entity/transaction.entity';
import { Order } from 'src/core/database/entity/order.entity';
import { Cart } from 'src/core/database/entity/cart.entity';
import { Product } from 'src/core/database/entity/product.entity';
import { OrderItem } from 'src/core/database/entity/orderItems.entity';
import { VerifyPaymentDto } from './dto/payment.dto';
import {
  successResponse,
  successResponseWithResult,
} from 'src/common/utils/helper';
import { ERROR_MSG, SUCCESS_MSG } from 'src/common/utils/constants';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { OrderStatus, PaymentStatus } from 'src/common/enum';
import Razorpay from 'razorpay';
import { RedisService } from 'src/core/redis/redis.service';

@Injectable()
export class PaymentService {
  private paymentRepo: Repository<Payment>;
  private orderRepo: Repository<Order>;
  private cartRepo: Repository<Cart>;
  private productRepo: Repository<Product>;
  private orderItemRepo: Repository<OrderItem>;

  constructor(
    private ormService: OrmService,
    private dataSource: DataSource,
    private redisService: RedisService,
    @Inject('RzpToken') private rzpClient: Razorpay,
  ) {
    this.paymentRepo = this.ormService.getRepo(Payment);
    this.orderRepo = this.ormService.getRepo(Order);
    this.cartRepo = this.ormService.getRepo(Cart);
    this.productRepo = this.ormService.getRepo(Product);
    this.orderItemRepo = this.ormService.getRepo(OrderItem);
  }

  async createOrder(orderId: number, userId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: ['payment', 'items', 'items.product'],
    });

    if (!order) throw new CustomException(ERROR_MSG.RECORD_NOT_FOUND);

    if (order.status === OrderStatus.CANCELLED) {
      throw new CustomException(
        'Cannot create payment for a cancelled order',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (order.payment?.status === PaymentStatus.PAID) {
      throw new CustomException(
        'Order is already paid',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      order.payment?.status === PaymentStatus.PENDING &&
      order.payment.razorpay_order_id
    ) {
      return successResponseWithResult(SUCCESS_MSG.CREATED, {
        order_id: order.id,
        razorpay_order_id: order.payment.razorpay_order_id,
        amount: Number(order.total_amount),
        currency: order.payment.currency,
      });
    }

    let reservedItems: Array<{
      productId: number;
      qty: number;
      reservationId: string;
    }> = [];

    try {
      reservedItems = await this.reserveForOrder(order);

      const amount = Number(order.total_amount);
      const amountInPaise = Math.round(amount * 100);
      if (!Number.isFinite(amountInPaise) || amountInPaise < 100) {
        throw new CustomException(
          ERROR_MSG.MIN_PAYMENT_AMOUNT,
          HttpStatus.BAD_REQUEST,
        );
      }

      const rzpOrder = await this.rzpClient.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `order_${orderId}`,
      });

      if (order.payment) {
        order.payment.razorpay_order_id = rzpOrder.id;
        order.payment.razorpay_payment_id = '';
        order.payment.razorpay_signature = '';
        order.payment.amount = amount;
        order.payment.currency = 'INR';
        order.payment.status = PaymentStatus.PENDING;
        await this.paymentRepo.save(order.payment);
      } else {
        const payment = this.paymentRepo.create({
          order,
          razorpay_order_id: rzpOrder.id,
          amount,
          currency: 'INR',
          status: PaymentStatus.PENDING,
        });
        await this.paymentRepo.save(payment);
      }

      return successResponseWithResult(SUCCESS_MSG.CREATED, {
        order_id: order.id,
        razorpay_order_id: rzpOrder.id,
        amount,
        currency: 'INR',
      });
    } catch (error) {
      if (reservedItems.length) {
        await this.releaseReservedItems(reservedItems);
      }

      if (error instanceof CustomException) {
        throw error;
      }
      throw new CustomException(ERROR_MSG.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyAndConfirm(dto: VerifyPaymentDto, userId: number) {
    const payment = await this.paymentRepo.findOne({
      where: { order: { id: dto.order_id, user: { id: userId } } },
      relations: ['order', 'order.user', 'order.items', 'order.items.product'],
    });

    if (!payment) throw new CustomException(ERROR_MSG.RECORD_NOT_FOUND);

    if (payment.status === PaymentStatus.PAID) {
      return successResponse(SUCCESS_MSG.UPDATED);
    }

    if (payment.order.status === OrderStatus.CANCELLED) {
      throw new CustomException(
        'Cannot verify payment for a cancelled order',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (payment.razorpay_order_id !== dto.razorpay_order_id) {
      throw new CustomException(ERROR_MSG.PAYMENT_VERIFICATION_FAILED);
    }

    // Verify HMAC signature
    const body = `${dto.razorpay_order_id}|${dto.razorpay_payment_id}`;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new CustomException(ERROR_MSG.INTERNAL_SERVER_ERROR);
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expected !== dto.razorpay_signature) {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepo.save(payment);
      await this.releaseOrderReservations(payment.order.id);
      throw new CustomException(ERROR_MSG.PAYMENT_VERIFICATION_FAILED);
    }

    await this.dataSource.transaction(async (manager) => {
      for (const item of payment.order.items) {
        if (!item.product) {
          throw new CustomException(ERROR_MSG.RECORD_NOT_FOUND);
        }

        const product = await manager.findOne(Product, {
          where: { id: item.product.id },
        });

        if (!product) {
          throw new CustomException(ERROR_MSG.RECORD_NOT_FOUND);
        }

        if (product.stock < item.quantity) {
          throw new CustomException(ERROR_MSG.INTERNAL_SERVER_ERROR);
        }

        product.stock -= item.quantity;
        await manager.save(Product, product);
      }

      payment.razorpay_payment_id = dto.razorpay_payment_id;
      payment.razorpay_signature = dto.razorpay_signature;
      payment.status = PaymentStatus.PAID;
      await manager.save(Payment, payment);

      await manager.update(Order, payment.order.id, {
        status: OrderStatus.CONFIRMED,
      });
    });

    for (const item of payment.order.items) {
      if (!item.product) {
        throw new CustomException(ERROR_MSG.RECORD_NOT_FOUND);
      }

      const reservationId = this.buildReservationId(
        payment.order.id,
        item.product.id,
      );
      const confirmResult = await this.redisService.confirmReservation(
        String(item.product.id),
        item.quantity,
        reservationId,
      );

      if (!confirmResult.ok) {
        throw new CustomException(ERROR_MSG.INTERNAL_SERVER_ERROR);
      }
    }

    // Clear user's cart after successful payment
    await this.cartRepo.delete({ user: { id: payment.order.user.id } });

    return successResponse(SUCCESS_MSG.UPDATED);
  }

  /**
   * Get payment details for an order
   */
  async getPaymentDetails(orderId: number, userId: number) {
    const payment = await this.paymentRepo.findOne({
      where: { order: { id: orderId, user: { id: userId } } },
      relations: ['order'],
    });

    if (!payment) {
      throw new CustomException(ERROR_MSG.RECORD_NOT_FOUND);
    }

    return successResponseWithResult(SUCCESS_MSG.FETCHED, {
      payment: {
        id: payment.id,
        order_id: payment.order.id,
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
      },
    });
  }

  /**
   * Refund a payment
   */
  async refundPayment(orderId: number, userId: number) {
    const payment = await this.paymentRepo.findOne({
      where: { order: { id: orderId, user: { id: userId } } },
      relations: ['order'],
    });

    if (!payment) {
      throw new CustomException(ERROR_MSG.RECORD_NOT_FOUND);
    }

    if (payment.status !== PaymentStatus.PAID) {
      throw new CustomException('Payment must be PAID to refund');
    }

    try {
      // Process refund through Razorpay
      await this.rzpClient.payments.refund(payment.razorpay_payment_id, {
        amount: Math.round(payment.amount * 100),
      });

      // Update payment status
      payment.status = PaymentStatus.REFUNDED;
      await this.paymentRepo.save(payment);

      // Update order status
      await this.orderRepo.update(orderId, {
        status: OrderStatus.CANCELLED,
      });

      return successResponse(SUCCESS_MSG.UPDATED);
    } catch {
      throw new CustomException(ERROR_MSG.INTERNAL_SERVER_ERROR);
    }
  }

  private buildReservationId(orderId: number, productId: number) {
    return `order:${orderId}:product:${productId}`;
  }

  private async reserveForOrder(
    order: Order,
  ): Promise<Array<{ productId: number; qty: number; reservationId: string }>> {
    const reservedItems: Array<{
      productId: number;
      qty: number;
      reservationId: string;
    }> = [];

    for (const item of order.items) {
      if (!item.product) {
        throw new CustomException(ERROR_MSG.RECORD_NOT_FOUND);
      }

      const reservationId = this.buildReservationId(order.id, item.product.id);

      await this.redisService.seedIfAbsent(
        String(item.product.id),
        item.product.stock,
      );

      const reserveResult = await this.redisService.reserveStock(
        String(item.product.id),
        item.quantity,
        reservationId,
      );

      if (!reserveResult.ok) {
        await this.releaseReservedItems(reservedItems);

        if (reserveResult.code === 'INSUFFICIENT_STOCK') {
          throw new CustomException(
            `Insufficient stock for product: ${item.product.name}`,
            HttpStatus.BAD_REQUEST,
          );
        }

        throw new CustomException(ERROR_MSG.INTERNAL_SERVER_ERROR);
      }

      reservedItems.push({
        productId: item.product.id,
        qty: item.quantity,
        reservationId,
      });
    }

    return reservedItems;
  }

  private async releaseReservedItems(
    reservedItems: Array<{
      productId: number;
      qty: number;
      reservationId: string;
    }>,
  ) {
    for (const reservedItem of reservedItems) {
      await this.redisService.releaseReservation(
        String(reservedItem.productId),
        reservedItem.qty,
        reservedItem.reservationId,
      );
    }
  }

  private async releaseOrderReservations(orderId: number) {
    const orderItems = await this.orderItemRepo.find({
      where: { order: { id: orderId } },
      relations: ['product'],
    });

    for (const item of orderItems) {
      if (!item.product) continue;

      const reservationId = this.buildReservationId(orderId, item.product.id);
      await this.redisService.releaseReservation(
        String(item.product.id),
        item.quantity,
        reservationId,
      );
    }
  }
}
