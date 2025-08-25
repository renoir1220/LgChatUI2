import { Injectable, NotFoundException } from '@nestjs/common';
import { SuggestionsRepository } from './suggestions.repository';
import { AppLoggerService } from '../../shared/services/logger.service';
import type {
  Suggestion,
  CreateSuggestionRequest,
  UpdateSuggestionRequest,
  SuggestionQuery,
  SuggestionListResponse,
} from '../../types';

@Injectable()
export class SuggestionsService {
  constructor(
    private readonly suggestionsRepository: SuggestionsRepository,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * 创建建议
   */
  async createSuggestion(
    submitterName: string,
    data: CreateSuggestionRequest,
  ): Promise<Suggestion> {
    this.logger.log('用户提交建议', {
      submitterName,
      title: data.title,
      contentLength: data.content.length,
    });

    try {
      const suggestion = await this.suggestionsRepository.create(
        submitterName,
        data,
      );

      this.logger.log('建议提交成功', {
        suggestionId: suggestion.id,
        submitterName,
        title: data.title,
      });

      return suggestion;
    } catch (error) {
      this.logger.error('建议提交失败', error, {
        submitterName,
        title: data.title,
      });
      throw error;
    }
  }

  /**
   * 查询建议列表
   */
  async getSuggestions(
    query: SuggestionQuery,
  ): Promise<SuggestionListResponse> {
    this.logger.log('查询建议列表', query);

    try {
      const { suggestions, total } =
        await this.suggestionsRepository.findMany(query);

      this.logger.log('建议列表查询成功', {
        total,
        count: suggestions.length,
        page: query.page,
      });

      return {
        suggestions,
        total,
        page: query.page,
        pageSize: query.pageSize,
      };
    } catch (error) {
      this.logger.error('查询建议列表失败', error, query);
      throw error;
    }
  }

  /**
   * 获取建议详情
   */
  async getSuggestionById(suggestionId: string): Promise<Suggestion> {
    this.logger.log('查询建议详情', { suggestionId });

    try {
      const suggestion =
        await this.suggestionsRepository.findById(suggestionId);

      if (!suggestion) {
        throw new NotFoundException('建议不存在');
      }

      return suggestion;
    } catch (error) {
      this.logger.error('查询建议详情失败', error, { suggestionId });
      throw error;
    }
  }

  /**
   * 更新建议（管理员用）
   */
  async updateSuggestion(
    suggestionId: string,
    data: UpdateSuggestionRequest,
  ): Promise<void> {
    this.logger.log('更新建议', {
      suggestionId,
      updates: Object.keys(data),
    });

    try {
      // 先检查建议是否存在
      const existingSuggestion =
        await this.suggestionsRepository.findById(suggestionId);
      if (!existingSuggestion) {
        throw new NotFoundException('建议不存在');
      }

      await this.suggestionsRepository.update(suggestionId, data);

      this.logger.log('建议更新成功', {
        suggestionId,
        updates: Object.keys(data),
      });
    } catch (error) {
      this.logger.error('更新建议失败', error, {
        suggestionId,
        data,
      });
      throw error;
    }
  }

  /**
   * 删除建议
   */
  async deleteSuggestion(suggestionId: string): Promise<void> {
    this.logger.log('删除建议', { suggestionId });

    try {
      // 先检查建议是否存在
      const existingSuggestion =
        await this.suggestionsRepository.findById(suggestionId);
      if (!existingSuggestion) {
        throw new NotFoundException('建议不存在');
      }

      await this.suggestionsRepository.delete(suggestionId);

      this.logger.log('建议删除成功', { suggestionId });
    } catch (error) {
      this.logger.error('删除建议失败', error, { suggestionId });
      throw error;
    }
  }
}
