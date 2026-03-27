import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from './entity/index';
import { OrmService } from './database.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DB_URL'),
        entities,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [OrmService],
  exports: [OrmService],
})
export class DatabaseModule {}
