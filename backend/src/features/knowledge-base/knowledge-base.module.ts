import { Module } from '@nestjs/common';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { DifyService } from '../../shared/services/dify.service';

@Module({
  controllers: [KnowledgeBaseController],
  providers: [DifyService],
})
export class KnowledgeBaseModule {}
