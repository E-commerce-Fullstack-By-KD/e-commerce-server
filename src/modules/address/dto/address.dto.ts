import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddressDto {
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  address_line_1: string;

  @IsOptional()
  @IsString()
  address_line_2?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  postal_code: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
