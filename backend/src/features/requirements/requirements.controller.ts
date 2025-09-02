import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import { RequirementsService } from './requirements.service';
import { AppLoggerService } from '../../shared/services/logger.service';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { z } from 'zod';
import type { RequirementListResponse } from '../../types';

// 定义查询参数的验证模式
const GetRequirementsByCustomerQuerySchema = z.object({
  customerName: z.string().min(1, '客户名称不能为空'),
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

const SearchRequirementsByKeywordsQuerySchema = z.object({
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

const GetRequirementsCountQuerySchema = z.object({
  customerName: z.string().min(1, '客户名称不能为空'),
});

type GetRequirementsByCustomerQuery = z.infer<
  typeof GetRequirementsByCustomerQuerySchema
>;
type SearchRequirementsByKeywordsQuery = z.infer<
  typeof SearchRequirementsByKeywordsQuerySchema
>;
type GetRequirementsCountQuery = z.infer<
  typeof GetRequirementsCountQuerySchema
>;

@Controller('api/requirements')
export class RequirementsController {
  constructor(
    private readonly requirementsService: RequirementsService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * 根据客户名称查询需求列表（支持分页）
   * GET /api/requirements/by-customer?customerName=xxx&page=1&pageSize=10
   */
  @Get('by-customer')
  @UsePipes(new ZodValidationPipe(GetRequirementsByCustomerQuerySchema))
  async getRequirementsByCustomer(
    @Query() query: GetRequirementsByCustomerQuery,
  ): Promise<RequirementListResponse> {
    const { customerName, page = 1, pageSize = 10 } = query;

    this.logger.log('接收到客户需求列表查询请求', {
      customerName,
      page,
      pageSize,
    });

    try {
      const result = await this.requirementsService.getRequirementsByCustomer(
        customerName,
        page,
        pageSize,
      );

      this.logger.log('客户需求列表查询成功', {
        customerName,
        page,
        pageSize,
        total: result.total,
        returnedCount: result.requirements.length,
      });

      return result;
    } catch (error) {
      this.logger.error('客户需求列表查询失败', error, {
        customerName,
        page,
        pageSize,
      });

      throw new HttpException(
        {
          message: '查询客户需求列表失败',
          error: error instanceof Error ? error.message : '未知错误',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 根据关键词搜索需求列表（支持多关键词）
   * GET /api/requirements/search?keywords=关键词1 关键词2&page=1&pageSize=10
   */
  @Get('search')
  @UsePipes(new ZodValidationPipe(SearchRequirementsByKeywordsQuerySchema))
  async searchRequirementsByKeywords(
    @Query() query: SearchRequirementsByKeywordsQuery,
  ): Promise<RequirementListResponse> {
    const { keywords, page = 1, pageSize = 10 } = query;

    this.logger.log('接收到关键词搜索需求列表请求', {
      keywords,
      page,
      pageSize,
    });

    try {
      const result = await this.requirementsService.searchRequirementsByKeywords(
        keywords,
        page,
        pageSize,
      );

      this.logger.log('关键词搜索需求列表成功', {
        keywords,
        page,
        pageSize,
        total: result.total,
        returnedCount: result.requirements.length,
      });

      return result;
    } catch (error) {
      this.logger.error('关键词搜索需求列表失败', error, {
        keywords,
        page,
        pageSize,
      });

      throw new HttpException(
        {
          message: '搜索需求列表失败',
          error: error instanceof Error ? error.message : '未知错误',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 根据客户名称查询需求总数
   * GET /api/requirements/count-by-customer?customerName=xxx
   */
  @Get('count-by-customer')
  @UsePipes(new ZodValidationPipe(GetRequirementsCountQuerySchema))
  async getRequirementsCountByCustomer(
    @Query() query: GetRequirementsCountQuery,
  ): Promise<{ total: number }> {
    const { customerName } = query;

    this.logger.log('接收到客户需求总数查询请求', { customerName });

    try {
      const total =
        await this.requirementsService.getRequirementsCountByCustomer(
          customerName,
        );

      this.logger.log('客户需求总数查询成功', {
        customerName,
        total,
      });

      return { total };
    } catch (error) {
      this.logger.error('客户需求总数查询失败', error, {
        customerName,
      });

      throw new HttpException(
        {
          message: '查询客户需求总数失败',
          error: error instanceof Error ? error.message : '未知错误',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
