import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { MailerModule } from './mailer/mailer.module';
import { JwtModule } from './jwt/jwt.module';
import { UploadModuleModule } from './upload-module/upload-module.module';
import { RedisModule } from './redis/redis.module';
@Module({
  imports: [
    DatabaseModule,
    JwtModule,
    MailerModule,
    UploadModuleModule,
    RedisModule,
  ],
})
export class CoreModule {}
