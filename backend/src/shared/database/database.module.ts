import { Global, Module } from '@nestjs/common';
import {
  CrmDatabaseService,
  LgChatUIDatabaseService,
} from './database.service';

@Global()
@Module({
  providers: [CrmDatabaseService, LgChatUIDatabaseService],
  exports: [CrmDatabaseService, LgChatUIDatabaseService],
})
export class DatabaseModule {}
