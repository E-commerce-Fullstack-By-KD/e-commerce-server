import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload-module.service';
import { multerConfig } from './multer.config';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig)) // max 10 files
  uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadService.handleMultipleUpload(files);
  }
}
