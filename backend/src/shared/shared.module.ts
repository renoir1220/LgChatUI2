import { Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { DifyService } from './services/dify.service';
import { AppLoggerService } from './services/logger.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { RequestIdInterceptor } from './interceptors/request-id.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    DifyService,
    AppLoggerService,
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // 请求ID拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestIdInterceptor,
    },
    // 日志拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [DatabaseModule, DifyService, AppLoggerService],
})
export class SharedModule {}
