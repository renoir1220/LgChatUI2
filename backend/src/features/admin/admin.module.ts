import { Module } from '@nestjs/common';
import { AdminConfigService } from './admin.config.service';
import { AdminGuard } from './admin.guard';
import { AdminController } from './admin.controller';
import { NewsAdminController } from './news.controller';
import { NewsAdminService } from './news.service';
import { KnowledgeBaseAdminController } from './knowledge-bases.controller';
import { KnowledgeBaseAdminService } from './knowledge-base-admin.service';
import { AdminConversationsController } from './admin-conversations.controller';
import { AdminConversationsService } from './admin-conversations.service';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [AuthModule, SharedModule],
  controllers: [
    AdminController,
    NewsAdminController,
    KnowledgeBaseAdminController,
    AdminConversationsController,
    DashboardController,
  ],
  providers: [
    AdminConfigService,
    AdminGuard,
    NewsAdminService,
    KnowledgeBaseAdminService,
    AdminConversationsService,
    DashboardService,
  ],
  exports: [AdminConfigService],
})
export class AdminModule {}
