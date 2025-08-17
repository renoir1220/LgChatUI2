// 聊天相关类型定义
export enum ChatRole {
  User = 'USER',
  Assistant = 'ASSISTANT',
  System = 'SYSTEM',
}

// 客户端友好的角色值，用于UI组件
export type ClientRole = 'user' | 'assistant' | 'system';

export function toClientRole(role: ChatRole): ClientRole {
  switch (role) {
    case ChatRole.User:
      return 'user';
    case ChatRole.Assistant:
      return 'assistant';
    default:
      return 'system';
  }
}

export function fromClientRole(role: ClientRole): ChatRole {
  switch (role) {
    case 'user':
      return ChatRole.User;
    case 'assistant':
      return ChatRole.Assistant;
    default:
      return ChatRole.System;
  }
}

export interface Citation {
  source: string;
  content: string;
  document_name?: string;
  score?: number;
  dataset_id?: string;
  document_id?: string;
  segment_id?: string;
  position?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  userId?: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  citations?: Citation[];
  metadata?: Record<string, unknown>;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  knowledgeBaseId?: string;
  userId?: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  apiKey?: string;
  apiUrl?: string;
}

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

export enum AuthErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
}

// UI相关类型
export interface BubbleDataType {
  role: ClientRole;
  content: string;
  citations?: Citation[];
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

// 流式聊天事件类型
export type ChatStreamEvent = {
  event: 'message' | 'agent_message' | 'message_end' | string;
  answer?: string;
  metadata?: { retriever_resources?: Citation[] } & Record<string, unknown>;
  retriever_resources?: Citation[];
};