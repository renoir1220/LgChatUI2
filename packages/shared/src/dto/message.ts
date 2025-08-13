import { z } from 'zod'
import { UserRole } from '../common'

export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  role: z.nativeEnum(UserRole),
  content: z.string().min(1),
  createdAt: z.coerce.date(),
})

export type ChatMessage = z.infer<typeof ChatMessageSchema>

export const MessageCreateSchema = z.object({
  role: z.nativeEnum(UserRole),
  content: z.string().min(1),
})

export type MessageCreateDto = z.infer<typeof MessageCreateSchema>
