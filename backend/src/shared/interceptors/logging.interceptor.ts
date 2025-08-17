import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AppLoggerService } from '../services/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.logHttpRequest(request, response, duration);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          
          // 记录错误请求
          this.logger.logWithRequest(
            'error',
            `请求处理失败: ${error.message}`,
            request,
            {
              duration: `${duration}ms`,
              errorType: error.constructor.name,
            },
          );
        },
      }),
    );
  }
}