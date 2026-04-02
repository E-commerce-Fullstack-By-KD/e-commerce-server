import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressDto } from './dto/address.dto';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  create(@Body() dto: AddressDto, @Req() req: any) {
    return this.addressService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.addressService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: number, @Req() req: any) {
    return this.addressService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: AddressDto, @Req() req: any) {
    return this.addressService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number, @Req() req: any) {
    return this.addressService.remove(id, req.user.id);
  }
}
