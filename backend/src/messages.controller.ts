import { Body, Controller, Get, Post } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UserRole, MessageCreateSchema } from '@lg/shared';

@Controller('messages')
export class MessagesController {
  @Get('example')
  example() {
    return {
      id: randomUUID(),
      userId: 'demo-user',
      role: UserRole.User,
      content: 'Hello from backend (@lg/shared)!',
      createdAt: new Date(),
    };
  }

  @Post()
  async create(@Body() body: unknown) {
    const input = await MessageCreateSchema.parseAsync(body);
    const created = {
      id: randomUUID(),
      userId: 'u-1',
      role: input.role,
      content: input.content,
      createdAt: new Date(),
    };
    return created;
  }
}
