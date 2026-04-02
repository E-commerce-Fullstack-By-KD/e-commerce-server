import { DynamicModule, Global, Module } from '@nestjs/common';
import { RzpOptions } from 'src/common/enum';
import { getRzpClient } from 'src/common/utils/helper';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';

export function createRzpProvider(options: RzpOptions) {
  return {
    provide: 'RzpToken',
    useValue: getRzpClient(options),
  };
}

@Global()
@Module({})
export class RazorpayModule {
  public static forRoot(options: RzpOptions): DynamicModule {
    const provider = createRzpProvider(options);
    return {
      module: RazorpayModule,
      providers: [provider],
      exports: [provider],
    };
  }
}

@Module({
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
