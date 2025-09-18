import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { MessagesController } from './messages.controller';
import { ChatHistoryController } from './chat-history.controller';
import { FeedbackController, AdminFeedbackController } from './feedback.controller';
import { ConversationsRepository } from './repositories/conversations.repository';
import { MessagesRepository } from './repositories/messages.repository';
import { FeedbackRepository } from './repositories/feedback.repository';
import { FeedbackService } from './feedback.service';
import { DifyService } from '../../shared/services/dify.service';
import { SharedModule } from '../../shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [SharedModule, AuthModule, AdminModule],
  controllers: [
    ChatController,
    MessagesController,
    ChatHistoryController,
    FeedbackController,
    AdminFeedbackController,
  ],
  providers: [
    ConversationsRepository,
    MessagesRepository,
    FeedbackRepository,
    FeedbackService,
    DifyService,
  ],
  exports: [
    ConversationsRepository,
    MessagesRepository,
    FeedbackRepository,
    FeedbackService,
  ],
})
export class ChatModule {}
