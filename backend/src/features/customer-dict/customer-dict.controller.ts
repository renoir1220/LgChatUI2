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
  CustomerDictQuerySchema,
} from '@lg/shared';
import type { CustomerDictQuery } from '@lg/shared';
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
    @Query(new ZodValidationPipe(CustomerDictQuerySchema)) query: CustomerDictQuery,
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

}