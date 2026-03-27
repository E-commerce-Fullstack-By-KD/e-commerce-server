import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as entities from './entity/index';
import 'dotenv/config';

const configService = new ConfigService();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: configService.get<string>('DB_URL'),
  entities,
  synchronize: false,
  migrations: [__dirname + '/migrations/*-migration.ts'],
});

export default AppDataSource;
