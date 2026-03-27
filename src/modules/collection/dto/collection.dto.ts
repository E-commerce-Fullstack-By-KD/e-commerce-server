import { IsNumber, IsString } from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  name: string;
}

export class UpdateCollectionDto extends CreateCollectionDto {
  @IsNumber()
  id: number;
}
