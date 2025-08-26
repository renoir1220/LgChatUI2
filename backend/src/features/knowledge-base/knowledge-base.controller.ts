import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KnowledgeBaseService } from './knowledge-base.service';
import { AppLoggerService } from '../../shared/services/logger.service';
import type { KnowledgeBase } from '../../types';

@UseGuards(JwtAuthGuard)
@Controller('api')
export class KnowledgeBaseController {
  private readonly logger = new AppLoggerService();

  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {
    this.logger.setContext(KnowledgeBaseController.name);
  }

  // GET /api/knowledge-bases - 获取知识库列表
  @Get('knowledge-bases')
  async getKnowledgeBases(@Request() req: any): Promise<KnowledgeBase[]> {
    const username = req.user?.username;
    this.logger.log('接收获取知识库列表请求', { username });

    try {
      const result = await this.knowledgeBaseService.getKnowledgeBases(username);
      
      this.logger.log('知识库列表获取成功', { count: result.length, username });
      return result;
    } catch (error) {
      this.logger.error('获取知识库列表失败', error.stack, {
        errorMessage: error.message,
        username,
      });
      throw error;
    }
  }
}
