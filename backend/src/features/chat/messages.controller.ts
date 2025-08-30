import { Body, Controller, Get, Post } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ChatRole, ChatRequest } from '../../types';
import { getCurrentLocalDateTime } from '../../shared/utils/date.util';

@Controller('messages')
export class MessagesController {
  @Get('example')
  example() {
    return {
      id: randomUUID(),
      userId: 'demo-user',
      role: ChatRole.User,
      content: 'Hello from backend (../../types)!',
      createdAt: getCurrentLocalDateTime(),
    };
  }

  @Post()
  create(
    @Body() body: Partial<ChatRequest> & { role?: string; content?: string },
  ) {
    const role =
      (body?.role || '').toLowerCase() === 'assistant'
        ? ChatRole.Assistant
        : ChatRole.User;
    const content = (body?.message ?? body?.content ?? '').toString();
    return {
      id: randomUUID(),
      userId: 'u-1',
      role,
      content,
      createdAt: getCurrentLocalDateTime(),
    };
  }
}
