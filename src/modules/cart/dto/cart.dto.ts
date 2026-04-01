import { IsNumber, Min } from 'class-validator';

export class CartDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class UpdateCartDto {
  @IsNumber()
  @Min(1)
  quantity: number;
}
