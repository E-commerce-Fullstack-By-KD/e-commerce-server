import { Module } from '@nestjs/common';
import { UploadController } from './upload-module.controller';
import { UploadService } from './upload-module.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModuleModule {}
