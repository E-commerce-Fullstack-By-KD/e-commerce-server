import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ProductStatus } from 'src/common/enum';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  sku: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsOptional()
  @IsArray()
  image_url: string[];

  @IsNumber()
  @Min(0)
  list_price: number;

  @IsNumber()
  @Min(0)
  offer_price: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  collectionIds: string[];

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}

export class UpdateProductDto extends CreateProductDto {
  // @IsOptional()
  // @IsEnum(ProductStatus)
  // status?: ProductStatus;
}
