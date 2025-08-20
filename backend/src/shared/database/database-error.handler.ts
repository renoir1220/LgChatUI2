import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 数据库错误类型枚举
 */
export enum DatabaseErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED', // 连接失败
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED', // 认证失败
  TIMEOUT = 'TIMEOUT', // 超时
  QUERY_ERROR = 'QUERY_ERROR', // 查询错误
  UNKNOWN = 'UNKNOWN', // 未知错误
}

/**
 * 自定义数据库异常类
 */
export class DatabaseException extends HttpException {
  constructor(
    public readonly errorType: DatabaseErrorType,
    public readonly originalError: any,
    message: string,
    httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(message, httpStatus);
  }
}

/**
 * 数据库错误处理工具类
 */
export class DatabaseErrorHandler {
  /**
   * 分析错误类型
   */
  static analyzeError(error: any): DatabaseErrorType {
    if (!error) return DatabaseErrorType.UNKNOWN;

    const errorMessage = error.message || '';
    const errorCode = error.code;

    // 连接相关错误
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ETIMEDOUT') ||
      errorCode === 'ECONNRESET' ||
      errorCode === 'ECONNREFUSED' ||
      errorCode === 'ETIMEOUT'
    ) {
      return errorMessage.includes('timeout') ||
        errorCode === 'ETIMEOUT' ||
        errorCode === 'ETIMEDOUT'
        ? DatabaseErrorType.TIMEOUT
        : DatabaseErrorType.CONNECTION_FAILED;
    }

    // 认证错误
    if (
      errorMessage.includes('Login failed') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('login') ||
      errorCode === 18456 // SQL Server 登录失败错误码
    ) {
      return DatabaseErrorType.AUTHENTICATION_FAILED;
    }

    // SQL查询错误
    if (
      errorMessage.includes('syntax') ||
      errorMessage.includes('Invalid object name') ||
      errorMessage.includes('Cannot insert') ||
      errorMessage.includes('violation')
    ) {
      return DatabaseErrorType.QUERY_ERROR;
    }

    return DatabaseErrorType.UNKNOWN;
  }

  /**
   * 将数据库错误转换为合适的HTTP异常
   */
  static handleError(error: any, context: string = '数据库操作'): never {
    const errorType = this.analyzeError(error);
    const originalMessage = error?.message || '未知错误';

    switch (errorType) {
      case DatabaseErrorType.CONNECTION_FAILED:
        throw new DatabaseException(
          errorType,
          error,
          `数据库连接失败，请检查网络连接或联系系统管理员`,
          HttpStatus.SERVICE_UNAVAILABLE,
        );

      case DatabaseErrorType.TIMEOUT:
        throw new DatabaseException(
          errorType,
          error,
          `数据库操作超时，请稍后重试`,
          HttpStatus.REQUEST_TIMEOUT,
        );

      case DatabaseErrorType.AUTHENTICATION_FAILED:
        throw new DatabaseException(
          errorType,
          error,
          `数据库认证失败，请联系系统管理员`,
          HttpStatus.SERVICE_UNAVAILABLE,
        );

      case DatabaseErrorType.QUERY_ERROR:
        throw new DatabaseException(
          errorType,
          error,
          `${context}失败：${originalMessage}`,
          HttpStatus.BAD_REQUEST,
        );

      default:
        throw new DatabaseException(
          DatabaseErrorType.UNKNOWN,
          error,
          `${context}失败，请稍后重试`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
  }

  /**
   * 判断是否为业务层应该感知的错误
   * 如果返回true，业务层应该处理；false则让框架处理
   */
  static shouldPropagateToBusinessLayer(error: any): boolean {
    const errorType = this.analyzeError(error);

    // 连接失败和超时错误应该传播到业务层，让业务层决定如何响应用户
    return (
      errorType === DatabaseErrorType.CONNECTION_FAILED ||
      errorType === DatabaseErrorType.TIMEOUT ||
      errorType === DatabaseErrorType.AUTHENTICATION_FAILED
    );
  }
}
