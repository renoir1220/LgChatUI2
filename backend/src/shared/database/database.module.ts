import { Global, Module } from '@nestjs/common';
import {
  DatabaseService,
  CrmDatabaseService,
  LgChatUIDatabaseService,
} from './database.service';

@Global()
@Module({
  providers: [
    CrmDatabaseService,
    LgChatUIDatabaseService,
    DatabaseService, // 保持向后兼容性
  ],
  exports: [
    CrmDatabaseService,
    LgChatUIDatabaseService,
    DatabaseService, // 保持向后兼容性
  ],
})
export class DatabaseModule {}
