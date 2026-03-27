import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CreateCollectionDto, UpdateCollectionDto } from './dto/collection.dto';

@Controller('collection')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Post('create')
  create(@Body() createCollectionDto: CreateCollectionDto) {
    return this.collectionService.create(createCollectionDto);
  }

  @Get('findAll')
  findAll() {
    return this.collectionService.findAll();
  }

  @Get('findOne/:id')
  findOne(@Param('id') id: string) {
    return this.collectionService.findOne(+id);
  }

  @Patch('update')
  update(@Body() updateCollectionDto: UpdateCollectionDto) {
    return this.collectionService.update(updateCollectionDto);
  }

  @Delete('remove/:id')
  remove(@Param('id') id: string) {
    return this.collectionService.remove(+id);
  }
}
