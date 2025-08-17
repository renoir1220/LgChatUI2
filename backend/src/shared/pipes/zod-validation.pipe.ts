import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error.errors) {
        const errorMessages = error.errors.map((err: any) => {
          return `${err.path.join('.')}: ${err.message}`;
        });
        throw new BadRequestException(`验证失败: ${errorMessages.join(', ')}`);
      }
      throw new BadRequestException('验证失败');
    }
  }
}
