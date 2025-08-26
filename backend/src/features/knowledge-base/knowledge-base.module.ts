import { Module } from '@nestjs/common';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseRepository } from './knowledge-base.repository';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule], // 导入SharedModule以使用数据库服务
  controllers: [KnowledgeBaseController],
  providers: [
    KnowledgeBaseService,
    KnowledgeBaseRepository,
  ],
  exports: [KnowledgeBaseService], // 导出服务供其他模块使用
})
export class KnowledgeBaseModule {}
