import { Module } from '@nestjs/common';
import { AdminConfigService } from './admin.config.service';
import { AdminGuard } from './admin.guard';
import { AdminController } from './admin.controller';
import { NewsAdminController } from './news.controller';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [AuthModule, SharedModule],
  controllers: [AdminController, NewsAdminController],
  providers: [AdminConfigService, AdminGuard],
  exports: [AdminConfigService],
})
export class AdminModule {}

