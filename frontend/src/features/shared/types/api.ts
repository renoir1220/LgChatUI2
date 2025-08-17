// 从共享包导入聊天相关类型
export type {
  ChatRole,
  ClientRole,
  Citation,
  ChatMessage,
  ChatRequest,
  KnowledgeBase,
  ChatStreamEvent
} from '@lg/shared';

export {
  toClientRole,
  fromClientRole
} from '@lg/shared';

// 对话相关类型
export interface Conversation {
  id: string;
  title: string;
  userId: string;
  knowledgeBaseId?: string;
  createdAt: string;
  updatedAt?: string;
  messageCount?: number;
  lastMessageAt?: string;
}

export interface CreateConversationRequest {
  title?: string;
  firstMessage?: string;
  knowledgeBaseId?: string;
}

export interface UpdateConversationRequest {
  title?: string;
  knowledgeBaseId?: string;
}

// 用户相关类型
export interface User {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  roles?: string[];
  createdAt?: string;
}

export interface AuthToken {
  accessToken: string;
  expiresAt?: number;
}

export interface LoginRequest {
  username: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    roles?: string[];
  };
}

// API配置和错误处理
export interface ApiConfig {
  baseUrl: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
  authToken?: string;
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: '',
};

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export const AuthErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
} as const;

export type AuthErrorCode = typeof AuthErrorCode[keyof typeof AuthErrorCode];

// UI相关类型 - 从共享包导入ClientRole和Citation类型
export interface BubbleDataType {
  role: import('@lg/shared').ClientRole;
  content: string;
  citations?: import('@lg/shared').Citation[];
}

export interface ConversationItem {
  key: string;
  label: string;
  group: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  knowledgeBaseId?: string;
  createdAt: string;
  updatedAt: string;
}

