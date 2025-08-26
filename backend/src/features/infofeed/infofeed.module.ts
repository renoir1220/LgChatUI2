/**
 * 信息流功能模块
 *
 * 注册信息流功能相关的控制器和服务
 */

import { Module } from '@nestjs/common';
import { InfoFeedController } from './infofeed.controller';
import { InfoFeedService } from './infofeed.service';
import { SharedModule } from '../../shared/shared.module';
import { InfoFeedsRepository } from './repositories/feeds.repository';
import { InfoFeedCommentsRepository } from './repositories/comments.repository';
import { InfoFeedLikesRepository } from './repositories/likes.repository';

@Module({
  imports: [
    SharedModule, // 导入共享模块，包含DatabaseService和LoggerService
  ],
  controllers: [InfoFeedController],
  providers: [
    InfoFeedService,
    InfoFeedsRepository,
    InfoFeedCommentsRepository,
    InfoFeedLikesRepository,
  ],
  exports: [
    InfoFeedService, // 导出服务供其他模块使用
  ],
})
export class InfoFeedModule {}
