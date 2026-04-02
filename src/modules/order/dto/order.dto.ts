import { IsNumber, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @IsNotEmpty()
  addressId: number;

  @IsArray()
  @IsOptional()
  cartIds?: number[]; // If specific cart items, else use all user's cart items
}

export class UpdateOrderDto {
  @IsNumber()
  @IsOptional()
  addressId?: number;
}

export class OrderItemDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  unitPrice: number;

  @IsNumber()
  @IsNotEmpty()
  totalPrice: number;
}
