import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/core_module/core.module';
import { IndexModule } from './modules/index.modules';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CoreModule, IndexModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
