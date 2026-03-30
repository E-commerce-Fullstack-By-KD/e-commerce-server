import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { CollectionModule } from 'src/modules/collection/collection.module';
import { MailerModule } from '../mailer/mailer.module';
import { JwtModule } from '../jwt/jwt.module';

@Module({
  imports: [
    DatabaseModule,
    JwtModule,
    AuthModule,
    MailerModule,
    CollectionModule,
  ],
})
export class CoreModule {}
