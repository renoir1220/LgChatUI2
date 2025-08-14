// Shared API configuration types
import { z } from 'zod'

export interface ApiConfig {
  baseUrl: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
  authToken?: string; // e.g., Bearer token
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: '',
};

// API 错误响应类型定义
export const ApiErrorSchema = z.object({
  message: z.string(),
  statusCode: z.number(),
  error: z.string().optional(),
})

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
})

// 认证错误码枚举
export enum AuthErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
}

// 从 Zod 模式推导类型
export type ApiError = z.infer<typeof ApiErrorSchema>
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
}

