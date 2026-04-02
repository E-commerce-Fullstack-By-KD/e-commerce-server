import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class VerifyPaymentDto {
  @IsNumber()
  order_id: number;

  @IsString()
  razorpay_order_id: string;

  @IsString()
  razorpay_payment_id: string;

  @IsString()
  razorpay_signature: string;
}

export class CreatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  orderId: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;
}

export class RefundPaymentDto {
  @IsNumber()
  @IsNotEmpty()
  orderId: number;
}
 