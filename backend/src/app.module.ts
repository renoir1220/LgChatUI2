import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagesController } from './messages.controller';
import { ChatController } from './chat.controller';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { DatabaseModule } from './database/database.module';
import { ConversationsRepository } from './repositories/conversations.repository';
import { MessagesRepository } from './repositories/messages.repository';
import { UsersRepository } from './repositories/users.repository';
import { HealthController } from './health.controller';
import { ChatHistoryController } from './chat-history.controller';
import { FilesController } from './files.controller';
import { AuthModule } from './auth/auth.module';
import { TtsModule } from './tts/tts.module';
import { DifyService } from './services/dify.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    TtsModule,
  ],
  controllers: [
    AppController,
    MessagesController,
    ChatController,
    KnowledgeBaseController,
    HealthController,
    ChatHistoryController,
    FilesController,
  ],
  providers: [
    AppService,
    ConversationsRepository,
    MessagesRepository,
    UsersRepository,
    DifyService,
  ],
})
export class AppModule {}
