// Shared types for user information
import { z } from 'zod'

export interface User {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  roles?: string[];
  createdAt?: string; // ISO timestamp
}

export interface AuthToken {
  accessToken: string;
  expiresAt?: number; // epoch millis
}

// 认证相关的 Zod 模式和类型定义
export const LoginRequestSchema = z.object({
  username: z.string().min(2, '用户名至少2个字符').max(50, '用户名最多50个字符').trim(),
  password: z.string().min(1, '密码不能为空').max(100, '密码最多100个字符'),
})

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    displayName: z.string().optional(),
    roles: z.array(z.string()).optional(),
  }),
})

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  roles: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
})

// 从 Zod 模式推导类型
export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type LoginResponse = z.infer<typeof LoginResponseSchema>
export type UserType = z.infer<typeof UserSchema>

