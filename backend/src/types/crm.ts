/**
 * CRM登录验证相关类型定义
 */

/**
 * CRM登录请求参数
 */
export interface CrmLoginRequest {
  Account: string;
  Token: string;
}

/**
 * CRM登录响应结构
 */
export interface CrmLoginResponse {
  Message: string;
  Success: boolean;
  Code: string;
  Content: {
    CRM_USER_ID?: string;
  } | null;
}

/**
 * CRM登录验证结果枚举
 */
export enum CrmLoginCode {
  SUCCESS = '1',                    // 登录验证成功
  ACCOUNT_OR_TOKEN_EMPTY = '-1',    // 账号或Token为空
  TOKEN_DECRYPT_FAILED = '-2',      // Token解密失败
  TOKEN_FORMAT_ERROR = '-3',        // Token格式不正确
  ACCOUNT_MISMATCH = '-4',          // Token中的账号与请求账号不匹配
  TOKEN_EXPIRED = '-5',             // Token已过期（有效期10分钟）
  USER_NOT_EXISTS = '-6',           // 用户不存在
  LOGIN_ATTEMPTS_EXCEEDED = '-7',   // 用户登录失败次数超过5次
  PASSWORD_INCORRECT = '-8',        // 密码不正确
  SYSTEM_ERROR = '-99',             // 系统异常
}

/**
 * 扩展的登录请求（包含密码）
 */
export interface ExtendedLoginRequest {
  username: string;
  password: string;
}

/**
 * Token解析结果
 */
export interface ParsedToken {
  account: string;
  password: string;
  timestamp: number;
}

/**
 * CRM验证配置
 */
export interface CrmConfig {
  apiUrl: string;
  timeout: number;
  retryAttempts: number;
}