import { Injectable, Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { OrmService } from 'src/core/database/database.service';
import { Payment } from 'src/core/database/entity/transaction.entity';
import { Order } from 'src/core/database/entity/order.entity';
import { Cart } from 'src/core/database/entity/cart.entity';
import { VerifyPaymentDto } from './dto/payment.dto';
import {
  successResponse,
  successResponseWithResult,
} from 'src/common/utils/helper';
import { ERROR_MSG, SUCCESS_MSG } from 'src/common/utils/constants';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { OrderStatus, PaymentStatus } from 'src/common/enum';
import Razorpay from 'razorpay';

@Injectable()
export class PaymentService {
  private paymentRepo: Repository<Payment>;
  private orderRepo: Repository<Order>;
  private cartRepo: Repository<Cart>;

  constructor(
    private ormService: OrmService,
    @Inject('RzpToken') private rzpClient: Razorpay,
  ) {
    this.paymentRepo = this.ormService.getRepo(Payment);
    this.orderRepo = this.ormService.getRepo(Order);
    this.cartRepo = this.ormService.getRepo(Cart);
  }

  async createOrder(orderId: number, amount: number) {
    try {
      const order = await this.orderRepo.findOne({ where: { id: orderId } });
      if (!order) throw new CustomException(ERROR_MSG.RECORD_NOT_FOUND);

      const rzpOrder = await this.rzpClient.orders.create({
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency: 'INR',
        receipt: `order_${orderId}`,
      });

      return successResponseWithResult(SUCCESS_MSG.CREATED, {
        razorpay_order_id: rzpOrder.id,
        amount: amount,
        currency: 'INR',
      });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(ERROR_MSG.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyAndConfirm(dto: VerifyPaymentDto) {
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
      throw new CustomException(ERROR_MSG.PAYMENT_VERIFICATION_FAILED);
    }

    // Find payment record
    const payment = await this.paymentRepo.findOne({
      where: { order: { id: dto.order_id } },
      relations: ['order', 'order.user'],
    });

    if (!payment) throw new CustomException(ERROR_MSG.RECORD_NOT_FOUND);

    // Update payment status
    payment.razorpay_payment_id = dto.razorpay_payment_id;
    payment.razorpay_signature = dto.razorpay_signature;
    payment.status = PaymentStatus.PAID;
    await this.paymentRepo.save(payment);

    // Update order status to confirmed
    await this.orderRepo.update(payment.order.id, {
      status: OrderStatus.CONFIRMED,
    });

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
    } catch (error) {
      throw new CustomException(ERROR_MSG.INTERNAL_SERVER_ERROR);
    }
  }
}
