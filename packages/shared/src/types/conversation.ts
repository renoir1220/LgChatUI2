// Shared types for conversations
import { z } from 'zod';

export interface Conversation {
  id: string; // UUID
  title: string;
  userId: string;
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
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  messageCount: z.number().optional(),
  lastMessageAt: z.string().optional(),
});

export const CreateConversationRequestSchema = z.object({
  title: z.string().optional(),
  firstMessage: z.string().optional(),
});

export const UpdateConversationRequestSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
});

export type CreateConversationRequest = z.infer<typeof CreateConversationRequestSchema>;
export type UpdateConversationRequest = z.infer<typeof UpdateConversationRequestSchema>;

