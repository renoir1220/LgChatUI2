import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { MessagesController } from './messages.controller';
import { ChatHistoryController } from './chat-history.controller';
import { ConversationsRepository } from './repositories/conversations.repository';
import { MessagesRepository } from './repositories/messages.repository';
import { DifyService } from '../../shared/services/dify.service';

@Module({
  controllers: [ChatController, MessagesController, ChatHistoryController],
  providers: [ConversationsRepository, MessagesRepository, DifyService],
  exports: [ConversationsRepository, MessagesRepository],
})
export class ChatModule {}
