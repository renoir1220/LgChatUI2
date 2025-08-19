import { Module } from '@nestjs/common';
import { ReadmeSearchController } from './readme-search.controller';
import { ReadmeSearchService } from './readme-search.service';
import { SharedModule } from '../../shared/shared.module';

/**
 * README搜索模块
 * 提供README配置信息搜索功能的模块定义
 */
@Module({
  imports: [SharedModule], // 导入共享模块，获取数据库服务和日志服务
  controllers: [ReadmeSearchController],
  providers: [ReadmeSearchService],
  exports: [ReadmeSearchService], // 导出服务，供其他模块使用
})
export class ReadmeSearchModule {}
