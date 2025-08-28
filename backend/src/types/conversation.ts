// Shared types for conversations
import { z } from 'zod';

export interface Conversation {
  id: string; // UUID
  title: string;
  userId: string;
  knowledgeBaseId?: string; // 关联的知识库ID
  modelId?: string; // 关联的模型ID
  difyConversationId?: string; // Dify对话记忆ID，用于维持连续对话
  createdAt: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
  messageCount?: number;
  lastMessageAt?: string;
}

// Zod schemas for validation
export const ConversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  userId: z.string(),
  knowledgeBaseId: z.string().optional(),
  modelId: z.string().optional(),
  difyConversationId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  messageCount: z.number().optional(),
  lastMessageAt: z.string().optional(),
});

export const CreateConversationRequestSchema = z.object({
  title: z.string().optional(),
  firstMessage: z.string().optional(),
  knowledgeBaseId: z.string().optional(),
});

export const UpdateConversationRequestSchema = z.object({
  title: z.string().min(1, '标题不能为空').optional(),
  knowledgeBaseId: z.string().optional(),
  modelId: z.string().optional(),
});

export type CreateConversationRequest = z.infer<
  typeof CreateConversationRequestSchema
>;
export type UpdateConversationRequest = z.infer<
  typeof UpdateConversationRequestSchema
>;
