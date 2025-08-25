import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { LogContext } from '../../types';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements LoggerService {
  private context?: string;

  setContext(context: string): void {
    this.context = context;
  }

  private formatMessage(
    level: string,
    message: string,
    context?: LogContext,
    trace?: string,
  ): string {
    const timestamp = new Date().toISOString();
    const ctx = this.context || 'Application';

    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      context: ctx,
      message,
      ...(context && { ...context }),
      ...(trace && { trace }),
    };

    return JSON.stringify(logEntry);
  }

  log(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));
  }

  error(message: string, trace?: string, context?: LogContext): void {
    console.error(this.formatMessage('error', message, context, trace));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  verbose(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.formatMessage('verbose', message, context));
    }
  }

  // 便捷方法：带请求上下文的日志
  logWithRequest(
    level: 'log' | 'error' | 'warn' | 'debug',
    message: string,
    request?: any,
    additionalContext?: any,
  ): void {
    const context: LogContext = {
      ...(request && {
        requestId: request.headers?.['x-request-id'],
        method: request.method,
        url: request.url,
        userAgent: request.headers?.['user-agent'],
        ip: request.ip || request.connection?.remoteAddress,
      }),
      ...additionalContext,
    };

    switch (level) {
      case 'log':
        this.log(message, context);
        break;
      case 'error':
        this.error(message, undefined, context);
        break;
      case 'warn':
        this.warn(message, context);
        break;
      case 'debug':
        this.debug(message, context);
        break;
    }
  }

  // HTTP请求日志
  logHttpRequest(request: any, response: any, duration: number): void {
    const context: LogContext = {
      requestId: request.headers?.['x-request-id'],
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      duration: `${duration}ms`,
      userAgent: request.headers?.['user-agent'],
      ip: request.ip || request.connection?.remoteAddress,
    };

    const message = `${request.method} ${request.url} - ${response.statusCode} (${duration}ms)`;

    if (response.statusCode >= 400) {
      this.error(message, undefined, context);
    } else {
      this.log(message, context);
    }
  }
}
