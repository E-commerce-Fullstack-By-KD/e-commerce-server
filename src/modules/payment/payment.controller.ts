import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  VerifyPaymentDto,
  CreatePaymentDto,
  RefundPaymentDto,
} from './dto/payment.dto';
import { CurrentUser } from 'src/common/decorator/user.decorator';
import type { AuthUser } from 'src/common/types';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('verify')
  verify(@Body() dto: VerifyPaymentDto) {
    return this.paymentService.verifyAndConfirm(dto);
  }

  @Get('orders/:orderId')
  getPaymentDetails(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.paymentService.getPaymentDetails(orderId, user.id);
  }

  @Post('orders/:orderId/refund')
  refundPayment(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.paymentService.refundPayment(orderId, user.id);
  }

  @Post('orders/:orderId/create')
  createOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() body: { amount: number },
    @CurrentUser() user: AuthUser,
  ) {
    return this.paymentService.createOrder(orderId, body.amount);
  }
}
