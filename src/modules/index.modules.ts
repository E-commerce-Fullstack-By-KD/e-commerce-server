import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AuthMiddleware } from 'src/common/middleware/auth.middleware';
import { ProductModule } from './product/product.module';
import { CollectionModule } from './collection/collection.module';

@Module({
  imports: [AuthModule, CollectionModule, ProductModule],
})
export class IndexModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude('auth/login', 'auth/signup', 'uploads/*path')
      .forRoutes('*');
  }
}
