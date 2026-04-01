import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CartDto, UpdateCartDto } from './dto/cart.dto';
import { CurrentUser } from 'src/common/decorator/user.decorator';
import type { AuthUser } from 'src/common/types';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  create(@Body() createCartDto: CartDto, @CurrentUser() user: AuthUser) {
    return this.cartService.create(createCartDto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.cartService.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.cartService.findOne(id, user.id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCartDto: UpdateCartDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.cartService.update(id, updateCartDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.cartService.remove(id, user.id);
  }
}
