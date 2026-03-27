import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_MSG } from '../utils/constants';

export class ResourceNotFound extends HttpException {
  constructor(resourceName: string, resourceId?: string) {
    super(
      resourceId
        ? `${resourceName} with ${resourceId} not found`
        : `${resourceName} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class Unauthorized extends HttpException {
  constructor() {
    super(ERROR_MSG.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }
}

export class CustomException extends HttpException {
  constructor(
    message: string = ERROR_MSG.INTERNAL_SERVER_ERROR,
    status_code: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, status_code);
  }
}
