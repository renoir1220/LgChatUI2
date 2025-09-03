import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { AppLoggerService } from '../../shared/services/logger.service';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { z } from 'zod';
import type { QuestionListResponse } from './types';

// 定义查询参数的验证模式
const SearchQuestionsByKeywordsQuerySchema = z.object({
  keywords: z
    .string()
    .min(1, '搜索关键词不能为空')
    .transform((val) => {
      // 将关键词字符串按空格或逗号分割成数组，并去除空白
      return val
        .split(/[\s,，]+/)
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0);
    })
    .refine((keywords) => keywords.length > 0, {
      message: '至少需要一个有效的搜索关键词',
    }),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1 && Number.isInteger(val), {
      message: '页码必须是大于等于1的整数',
    }),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val >= 1 && val <= 100 && Number.isInteger(val), {
      message: '每页数量必须是1-100之间的整数',
    }),
});

type SearchQuestionsByKeywordsQuery = z.infer<
  typeof SearchQuestionsByKeywordsQuerySchema
>;

@Controller('api/questions')
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * 根据关键词搜索常见问题列表（支持多关键词）
   * GET /api/questions/search?keywords=关键词1 关键词2&page=1&pageSize=10
   */
  @Get('search')
  @UsePipes(new ZodValidationPipe(SearchQuestionsByKeywordsQuerySchema))
  async searchQuestionsByKeywords(
    @Query() query: SearchQuestionsByKeywordsQuery,
  ): Promise<QuestionListResponse> {
    const { keywords, page = 1, pageSize = 10 } = query;

    this.logger.log('接收到关键词搜索常见问题列表请求', {
      keywords,
      page,
      pageSize,
    });

    try {
      const result = await this.questionsService.searchQuestionsByKeywords(
        keywords,
        page,
        pageSize,
      );

      this.logger.log('关键词搜索常见问题列表成功', {
        keywords,
        page,
        pageSize,
        total: result.total,
        returnedCount: result.questions.length,
      });

      return result;
    } catch (error) {
      this.logger.error('关键词搜索常见问题列表失败', error, {
        keywords,
        page,
        pageSize,
      });

      throw new HttpException(
        {
          message: '搜索常见问题列表失败',
          error: error instanceof Error ? error.message : '未知错误',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}