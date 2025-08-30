import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  CustomerDictResponse,
  CustomerDictSelectorResponse,
  CustomerDictQuerySchema,
  CustomerDictItem,
} from '../../types';
import type { CustomerDictQuery } from '../../types';
import { CustomerDictService } from './customer-dict.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { AppLoggerService } from '../../shared/services/logger.service';

@Controller('api/customer-dict')
@UseGuards(JwtAuthGuard)
export class CustomerDictController {
  private readonly logger = new AppLoggerService();

  constructor(private readonly customerDictService: CustomerDictService) {
    this.logger.setContext(CustomerDictController.name);
  }

  /**
   * 获取客户字典列表
   * GET /api/customer-dict?keyword=xxx&page=1&pageSize=50
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getCustomerDict(
    @Query(new ZodValidationPipe(CustomerDictQuerySchema))
    query: CustomerDictQuery,
  ): Promise<CustomerDictResponse> {
    this.logger.log('接收客户字典查询请求', query);

    try {
      const result = await this.customerDictService.getCustomerDict(query);

      this.logger.log('客户字典查询请求处理成功', {
        total: result.total,
        returnedCount: result.customers.length,
      });

      return result;
    } catch (error) {
      this.logger.error('客户字典查询请求处理失败', error.stack, {
        query,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * 获取客户字典（用于选择器，支持搜索和分页）
   * GET /api/customer-dict/all?keyword=xxx&page=1&pageSize=20
   */
  @Get('all')
  @HttpCode(HttpStatus.OK)
  async getAllCustomerDict(
    @Query(new ZodValidationPipe(CustomerDictQuerySchema))
    query: CustomerDictQuery,
  ): Promise<CustomerDictSelectorResponse> {
    // 为选择器设置合适的默认值
    const { keyword, page = 1, pageSize = 20 } = query;
    
    this.logger.log('接收获取选择器客户字典请求', {
      keyword: keyword || '无',
      page,
      pageSize,
    });

    try {
      const result = await this.customerDictService.getAllCustomerDict(
        keyword,
        page,
        pageSize,
      );

      this.logger.log('获取选择器客户字典成功', {
        count: result.customers.length,
        total: result.total,
        hasMore: result.hasMore,
      });

      return result;
    } catch (error) {
      this.logger.error('获取选择器客户字典失败', error.stack, {
        keyword: keyword || '无',
        page,
        pageSize,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * 获取客户字典统计信息
   * GET /api/customer-dict/stats
   */
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getCustomerStats(): Promise<{ totalCustomers: number }> {
    this.logger.log('接收客户字典统计信息查询请求');

    try {
      const result = await this.customerDictService.getCustomerStats();

      this.logger.log('客户字典统计信息查询成功', result);

      return result;
    } catch (error) {
      this.logger.error('客户字典统计信息查询失败', error.stack, {
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * 获取全量客户字典（用于前端缓存）
   * GET /api/customer-dict/cache
   */
  @Get('cache')
  @HttpCode(HttpStatus.OK)
  async getAllCustomersForCache(): Promise<CustomerDictResponse> {
    this.logger.log('接收获取全量客户字典请求（用于缓存）');

    try {
      const result = await this.customerDictService.getAllCustomersForCache();

      this.logger.log('获取全量客户字典成功', {
        count: result.customers.length,
        total: result.total,
      });

      return result;
    } catch (error) {
      this.logger.error('获取全量客户字典失败', error.stack, {
        errorMessage: error.message,
      });
      throw error;
    }
  }
}
