import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagesController } from './messages.controller';
import { DatabaseModule } from './database/database.module';
import { ConversationsRepository } from './repositories/conversations.repository';
import { MessagesRepository } from './repositories/messages.repository';
import { UsersRepository } from './repositories/users.repository';
import { HealthController } from './health.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AppController, MessagesController, HealthController],
  providers: [AppService, ConversationsRepository, MessagesRepository, UsersRepository],
})
export class AppModule {}
