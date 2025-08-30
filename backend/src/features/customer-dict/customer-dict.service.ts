import { Injectable } from '@nestjs/common';
import {
  CustomerDictResponse,
  CustomerDictSelectorResponse,
  CustomerDictQuery,
  CustomerDictItem,
} from '../../types';
import { CustomerDictRepository } from './customer-dict.repository';
import { AppLoggerService } from '../../shared/services/logger.service';

@Injectable()
export class CustomerDictService {
  private readonly logger = new AppLoggerService();

  constructor(private readonly customerDictRepository: CustomerDictRepository) {
    this.logger.setContext(CustomerDictService.name);
  }

  /**
   * 查询客户字典列表
   * @param query 查询参数
   */
  async getCustomerDict(
    query: CustomerDictQuery,
  ): Promise<CustomerDictResponse> {
    const { keyword, page = 1, pageSize = 50 } = query;

    this.logger.log('开始查询客户字典', {
      keyword: keyword || '无',
      page,
      pageSize,
    });

    try {
      const result = await this.customerDictRepository.findCustomers(
        keyword,
        page,
        pageSize,
      );

      this.logger.log('客户字典查询成功', {
        total: result.total,
        returnedCount: result.customers.length,
        keyword: keyword || '无',
      });

      return {
        customers: result.customers,
        total: result.total,
      };
    } catch (error) {
      this.logger.error('客户字典查询失败', error.stack, {
        keyword: keyword || '无',
        page,
        pageSize,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * 获取客户字典（用于选择器，支持搜索和分页）
   * @param keyword 搜索关键词（可选）
   * @param page 页码（默认1）
   * @param pageSize 每页数量（默认20）
   */
  async getAllCustomerDict(
    keyword?: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<CustomerDictSelectorResponse> {
    this.logger.log('开始获取选择器客户字典', {
      keyword: keyword || '无',
      page,
      pageSize,
    });

    try {
      const result = await this.customerDictRepository.findAllCustomers(
        keyword,
        page,
        pageSize,
      );

      this.logger.log('获取选择器客户字典成功', {
        count: result.customers.length,
        total: result.total,
        hasMore: result.hasMore,
        keyword: keyword || '无',
      });

      return {
        customers: result.customers,
        total: result.total,
        hasMore: result.hasMore,
      };
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
   */
  async getCustomerStats(): Promise<{ totalCustomers: number }> {
    this.logger.log('获取客户字典统计信息');

    try {
      const result = await this.customerDictRepository.findCustomers(
        undefined,
        1,
        1,
      );

      this.logger.log('客户字典统计信息获取成功', {
        totalCustomers: result.total,
      });

      return { totalCustomers: result.total };
    } catch (error) {
      this.logger.error('获取客户字典统计信息失败', error.stack, {
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * 获取全量客户字典（用于前端缓存）
   */
  async getAllCustomersForCache(): Promise<CustomerDictResponse> {
    this.logger.log('开始获取全量客户字典用于缓存');

    try {
      const result = await this.customerDictRepository.findAllCustomersForCache();

      this.logger.log('获取全量客户字典成功', {
        count: result.customers.length,
        total: result.total,
      });

      return {
        customers: result.customers,
        total: result.total,
      };
    } catch (error) {
      this.logger.error('获取全量客户字典失败', error.stack, {
        errorMessage: error.message,
      });
      throw error;
    }
  }
}
