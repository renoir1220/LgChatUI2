import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import type { KnowledgeBase } from '@lg/shared';

@UseGuards(JwtAuthGuard)
@Controller('api')
export class KnowledgeBaseController {
  constructor(private configService: ConfigService) {}

  // GET /api/knowledge-bases - 获取知识库列表
  @Get('knowledge-bases')
  async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    // 从环境变量读取知识库配置
    const knowledgeBases: KnowledgeBase[] = [];

    // 读取配置的知识库
    for (let i = 1; i <= 3; i++) {
      const name = this.configService.get(`KB_${i}_NAME`);
      const apiKey = this.configService.get(`KB_${i}_API_KEY`);
      const url = this.configService.get(`KB_${i}_URL`);

      if (name && apiKey && url) {
        knowledgeBases.push({
          id: `kb-${i}`,
          name: name,
          description: `${name} - Dify 知识库`,
          enabled: true,
          apiKey: apiKey, // 在实际使用中，不应该直接返回API key
          apiUrl: url,
        });
      }
    }

    // 如果没有配置知识库，返回默认的
    if (knowledgeBases.length === 0) {
      return [
        {
          id: 'kb-default',
          name: '默认聊天',
          description: '普通聊天模式，不使用知识库',
          enabled: true,
        },
      ];
    }

    return knowledgeBases;
  }
}
