import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagesController } from './messages.controller';
import { DatabaseModule } from './database/database.module';
import { ConversationsRepository } from './repositories/conversations.repository';
import { MessagesRepository } from './repositories/messages.repository';
import { UsersRepository } from './repositories/users.repository';
import { HealthController } from './health.controller';
import { ChatHistoryController } from './chat-history.controller';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    AppController,
    MessagesController,
    HealthController,
    ChatHistoryController,
  ],
  providers: [
    AppService,
    ConversationsRepository,
    MessagesRepository,
    UsersRepository,
  ],
})
export class AppModule {}
