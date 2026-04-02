import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AuthMiddleware } from 'src/common/middleware/auth.middleware';
import { ProductModule } from './product/product.module';
import { CollectionModule } from './collection/collection.module';
import { PUBLIC_ROUTES } from 'src/common/utils/public.routes';
import { CartModule } from './cart/cart.module';
import { AddressModule } from './address/address.module';
import { PaymentModule } from './payment/payment.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [AuthModule, CollectionModule, ProductModule, CartModule, AddressModule, PaymentModule, OrderModule],
})
export class IndexModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(...PUBLIC_ROUTES)
      .forRoutes('*');
  }
}
