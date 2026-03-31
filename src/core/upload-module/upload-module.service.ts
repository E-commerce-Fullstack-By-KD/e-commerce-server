import { Injectable } from '@nestjs/common';
import { successResponseWithResult } from 'src/common/utils/helper';

@Injectable()
export class UploadService {
  handleMultipleUpload(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    const urls = files.map((file) => {
      const filePath = `/uploads/${file.filename}`;
      return `${process.env.SERVER_URL}${filePath}`;
    });

    return successResponseWithResult('Uploaded', { urls });
  }
}
