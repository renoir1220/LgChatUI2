import { Injectable } from '@nestjs/common';
import {
  KnowledgeBaseRepository,
  KnowledgeBaseEntity,
} from './knowledge-base.repository';
import { AppLoggerService } from '../../shared/services/logger.service';
import type { KnowledgeBase } from '../../types';

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new AppLoggerService();

  constructor(private readonly repository: KnowledgeBaseRepository) {
    this.logger.setContext(KnowledgeBaseService.name);
  }

  /**
   * 获取指定用户可用的知识库列表
   * 从数据库获取完整配置信息，并根据用户权限过滤
   */
  async getKnowledgeBases(username?: string): Promise<KnowledgeBase[]> {
    this.logger.log('开始获取知识库列表');

    try {
      // 从数据库获取用户可访问的知识库配置
      const entities = await this.repository.findEnabledByUser(username);
      this.logger.debug('从数据库获取到用户可访问的知识库数据', {
        count: entities.length,
        username: username || '未指定用户',
      });

      // 将数据库实体转换为API响应格式
      const knowledgeBases: KnowledgeBase[] = entities.map((entity) => ({
        id: entity.kbKey, // 直接使用kbKey作为id
        name: entity.name,
        description: entity.description,
        enabled: entity.enabled,
        // 注意：不在API响应中包含敏感的apiKey和apiUrl信息
      }));

      // 如果没有找到任何知识库，返回默认配置
      if (knowledgeBases.length === 0) {
        this.logger.warn('未找到任何知识库配置，返回默认配置');
        return [
          {
            id: 'kb-default',
            name: '默认聊天',
            description: '普通聊天模式，不使用知识库',
            enabled: true,
          },
        ];
      }

      this.logger.log('知识库列表获取成功', { count: knowledgeBases.length });
      return knowledgeBases;
    } catch (error) {
      this.logger.error('获取知识库列表失败', error.stack, {
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * 根据ID获取知识库信息（包含API配置）
   * 内部使用，包含敏感信息
   */
  async getKnowledgeBaseConfigById(
    id: string,
  ): Promise<KnowledgeBaseEntity | null> {
    this.logger.debug('根据ID获取知识库配置', { id });

    try {
      const entity = await this.repository.findByKbKey(id);

      if (!entity) {
        this.logger.debug('未找到指定的知识库', { id });
        return null;
      }

      this.logger.debug('找到知识库配置', {
        kbKey: entity.kbKey,
        name: entity.name,
      });

      return entity;
    } catch (error) {
      this.logger.error('根据ID获取知识库配置失败', error.stack, {
        id,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * 根据ID获取知识库信息（公开API）
   */
  async getKnowledgeBaseById(id: string): Promise<KnowledgeBase | null> {
    const entity = await this.getKnowledgeBaseConfigById(id);

    if (!entity) {
      return null;
    }

    return {
      id: entity.kbKey,
      name: entity.name,
      description: entity.description,
      enabled: entity.enabled,
    };
  }
}
