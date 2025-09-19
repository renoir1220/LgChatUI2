// Shared types for chatbot message interaction and storage
import { z } from 'zod';

export enum ChatRole {
  User = 'USER',
  Assistant = 'ASSISTANT',
  System = 'SYSTEM',
}

// Client-friendly role values used by UI libraries/components
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

export interface ChatMessageBase {
  role: ChatRole;
  content: string;
  citations?: Citation[];
  metadata?: Record<string, unknown>;
}

export interface ChatMessage extends ChatMessageBase {
  id: string;
  conversationId: string;
  userId?: string;
  createdAt: string; // ISO timestamp
}

// Request shape for initiating/continuing a chat with the assistant
export interface ChatRequest {
  message: string;
  conversationId?: string;
  knowledgeBaseId?: string;
  userId?: string;
  modelId?: string;
  clientType?: string;
  clientPlatform?: string;
  clientBrowser?: string;
  userAgent?: string;
}

// Streaming event shape aligned with Dify-like responses used in LgChatUI
export type ChatStreamEvent = {
  event: 'message' | 'agent_message' | 'message_end' | string;
  answer?: string;
  metadata?: { retriever_resources?: Citation[] } & Record<string, unknown>;
  retriever_resources?: Citation[];
};

// Zod schemas for validation
export const CitationSchema = z.object({
  source: z.string(),
  content: z.string(),
  document_name: z.string().optional(),
  score: z.number().optional(),
  dataset_id: z.string().optional(),
  document_id: z.string().optional(),
  segment_id: z.string().optional(),
  position: z.number().optional(),
});

export const ChatMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  userId: z.string().optional(),
  role: z.nativeEnum(ChatRole),
  content: z.string(),
  createdAt: z.string(), // ISO timestamp
  citations: z.array(CitationSchema).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1, '消息不能为空'),
  conversationId: z.string().optional(),
  knowledgeBaseId: z.string().optional(),
  userId: z.string().optional(),
  modelId: z.string().optional(),
  // 客户端信息
  clientType: z.string().optional(),
  clientPlatform: z.string().optional(),
  clientBrowser: z.string().optional(),
  userAgent: z.string().optional(),
});

export const MessageCreateSchema = z.object({
  content: z.string().min(1, '消息内容不能为空'),
  role: z.nativeEnum(ChatRole).default(ChatRole.User),
  conversationId: z.string().optional(),
  userId: z.string().optional(),
});

// Knowledge Base types
export const KnowledgeBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  canSelectModel: z.boolean().default(false),
  apiKey: z.string().optional(), // Dify API key
  apiUrl: z.string().optional(), // Dify API URL
});

export type KnowledgeBase = z.infer<typeof KnowledgeBaseSchema>;
export type MessageCreateRequest = z.infer<typeof MessageCreateSchema>;
