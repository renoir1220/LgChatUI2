import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import type { KnowledgeBase } from '@lg/shared';

@UseGuards(JwtAuthGuard)
@Controller('api')
export class KnowledgeBaseController {
  
  // GET /api/knowledge-bases - 获取知识库列表
  @Get('knowledge-bases')
  async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    // 这里返回模拟的知识库数据
    // 实际项目中这里会从Dify API或数据库获取
    return [
      {
        id: 'kb-1',
        name: '技术文档',
        description: '包含技术相关的文档和资料',
        enabled: true,
      },
      {
        id: 'kb-2', 
        name: '产品手册',
        description: '产品使用手册和说明',
        enabled: true,
      },
      {
        id: 'kb-3',
        name: '常见问题',
        description: 'FAQ和常见问题解答',
        enabled: false,
      },
    ];
  }
}