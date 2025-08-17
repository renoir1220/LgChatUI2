import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StandardErrorResponse } from '@lg/shared';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = request.headers['x-request-id'] as string;

    let status: number;
    let message: string;
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || exception.name;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message;
      error = 'Internal Server Error';

      // 记录未处理的错误
      this.logger.error(
        `未处理的错误: ${exception.message}`,
        exception.stack,
        `GlobalExceptionFilter`,
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      error = 'Internal Server Error';

      this.logger.error(
        `未知错误类型: ${String(exception)}`,
        undefined,
        `GlobalExceptionFilter`,
      );
    }

    const errorResponse: StandardErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(requestId && { requestId }),
    };

    // 记录错误日志（4xx不记录为错误，5xx记录为错误）
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} ${error}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
        `HTTP-${status}`,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} ${error}: ${message}`,
        `HTTP-${status}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
