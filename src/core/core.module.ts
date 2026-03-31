import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { MailerModule } from './mailer/mailer.module';
import { JwtModule } from './jwt/jwt.module';
import { UploadModuleModule } from './upload-module/upload-module.module';

@Module({
  imports: [
    DatabaseModule,
    JwtModule,
    MailerModule,
    UploadModuleModule,
  ],
})
export class CoreModule {}
