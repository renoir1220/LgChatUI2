import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AppLoggerService } from '../services/logger.service';

/**
 * 统一错误处理工具类
 * 提供标准化的错误处理和日志记录
 */
export class ErrorHandlerUtil {
  private static logger = new AppLoggerService();

  /**
   * 处理数据库操作错误
   * @param error 原始错误
   * @param context 错误上下文信息
   * @param operation 操作描述
   */
  static handleDatabaseError(
    error: any,
    context: Record<string, any>,
    operation: string,
  ): never {
    this.logger.error(`数据库操作失败: ${operation}`, error.stack, context);

    // 根据错误类型返回适当的HTTP异常
    if (error.number === 2) {
      // SQL Server连接错误
      throw new InternalServerErrorException('数据库连接失败');
    }

    if (error.number === 547) {
      // 外键约束错误
      throw new BadRequestException('数据关联性错误');
    }

    if (error.number === 2627) {
      // 主键冲突
      throw new BadRequestException('数据已存在');
    }

    // 通用数据库错误
    throw new InternalServerErrorException('数据库操作失败');
  }

  /**
   * 处理外部服务错误
   * @param error 原始错误
   * @param context 错误上下文信息
   * @param serviceName 服务名称
   */
  static handleExternalServiceError(
    error: any,
    context: Record<string, any>,
    serviceName: string,
  ): never {
    this.logger.error(`外部服务调用失败: ${serviceName}`, error.stack, context);

    if (error.code === 'ECONNREFUSED') {
      throw new InternalServerErrorException(`${serviceName}服务不可用`);
    }

    if (error.response?.status === 401) {
      throw new InternalServerErrorException(`${serviceName}认证失败`);
    }

    if (error.response?.status === 429) {
      throw new InternalServerErrorException(`${serviceName}请求过于频繁`);
    }

    throw new InternalServerErrorException(`${serviceName}服务异常`);
  }

  /**
   * 处理流式响应错误
   * @param error 原始错误
   * @param response Express响应对象
   * @param context 错误上下文信息
   */
  static handleStreamingError(
    error: any,
    response: any,
    context: Record<string, any>,
  ): void {
    this.logger.error('流式响应处理错误', error.stack, context);

    // 发送错误事件到前端
    try {
      response.write(
        `data: ${JSON.stringify({
          event: 'error',
          error: '处理请求时发生错误，请稍后再试',
        })}\n\n`,
      );
    } catch (writeError) {
      // 连接可能已经断开，记录但不抛出异常
      this.logger.warn('无法发送错误响应', { writeError: writeError.message });
    }
  }

  /**
   * 处理验证错误
   * @param error 验证错误
   * @param context 错误上下文
   */
  static handleValidationError(
    error: any,
    context: Record<string, any>,
  ): never {
    this.logger.warn('数据验证失败', {
      errorMessage: error.message,
      ...context,
    });
    throw new BadRequestException(`数据验证失败: ${error.message}`);
  }

  /**
   * 安全地处理敏感信息，用于日志记录
   * @param data 可能包含敏感信息的数据
   * @returns 脱敏后的数据
   */
  static sanitizeForLogging(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'jwt',
      'apiKey',
      'accessToken',
      'refreshToken',
    ];

    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
