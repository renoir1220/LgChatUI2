import { Injectable } from '@nestjs/common';
import { QuestionsRepository } from './questions.repository';
import { AppLoggerService } from '../../shared/services/logger.service';
import type { QuestionItem, QuestionListResponse } from './types';

@Injectable()
export class QuestionsService {
  constructor(
    private readonly questionsRepository: QuestionsRepository,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * 根据关键词搜索常见问题列表（支持多关键词）
   * @param keywords 关键词数组
   * @param page 页码，默认1
   * @param pageSize 每页数量，默认10
   * @returns 常见问题列表响应
   */
  async searchQuestionsByKeywords(
    keywords: string[],
    page: number = 1,
    pageSize: number = 10,
  ): Promise<QuestionListResponse> {
    // 过滤掉空关键词
    const validKeywords = keywords.filter(keyword => keyword.trim().length > 0);
    
    this.logger.log('开始根据关键词搜索常见问题列表', {
      originalKeywords: keywords,
      validKeywords,
      page,
      pageSize,
    });

    if (validKeywords.length === 0) {
      this.logger.log('没有有效的搜索关键词，返回空结果');
      return {
        questions: [],
        total: 0,
      };
    }

    try {
      // 并行查询列表和总数
      const [questions, total] = await Promise.all([
        this.questionsRepository.searchByKeywords(
          validKeywords,
          page,
          pageSize,
        ),
        this.questionsRepository.countByKeywords(validKeywords),
      ]);

      this.logger.log('关键词搜索常见问题列表成功', {
        validKeywords,
        page,
        pageSize,
        total,
        resultCount: questions.length,
      });

      return {
        questions,
        total,
      };
    } catch (error) {
      this.logger.error('根据关键词搜索常见问题列表失败', error, {
        validKeywords,
        page,
        pageSize,
      });
      throw error;
    }
  }
}