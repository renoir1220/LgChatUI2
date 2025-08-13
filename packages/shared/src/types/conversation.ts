// Shared types for conversations

export interface Conversation {
  id: string; // UUID
  title: string;
  createdAt: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
}

