import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CustomException } from '../exceptions/custom.exception';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) return value;

    const trimmedValue = this.trimStrings(value) ?? {};
    0;
    const object = plainToInstance(metatype, trimmedValue);
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const errorMessage = this.formatErrors(errors);
      throw new CustomException(errorMessage);
    }

    return object;
  }

  private trimStrings(value: any): any {
    if (typeof value === 'string') {
      return value.replace(/\s+/g, ' ').trim();
    } else if (Array.isArray(value)) {
      return value.map((item) => this.trimStrings(item));
    } else if (value && typeof value === 'object' && value !== null) {
      const trimmedObject: Record<string, any> = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          if (key === 'email')
            trimmedObject[key] = this.trimStrings(value[key]).toLowerCase();
          else trimmedObject[key] = this.trimStrings(value[key]);
        }
      }
      return trimmedObject;
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: ValidationError[]): string {
    return errors
      .map((error) => {
        if (error.constraints) {
          return Object.values(error.constraints).join(', ');
        } else if (error.children) {
          return this.formatErrors(error.children);
        }
      })
      .join(', ');
  }
}
