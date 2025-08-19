import { Injectable } from '@nestjs/common';
import {
  CustomerDictResponse,
  CustomerDictQuery,
  CustomerDictItem,
} from '@lg/shared';
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
   * 获取所有客户字典（不分页，用于选择器）
   */
  async getAllCustomerDict(): Promise<{ customers: CustomerDictItem[] }> {
    this.logger.log('开始获取所有客户字典');

    try {
      const result = await this.customerDictRepository.findAllCustomers();

      this.logger.log('获取所有客户字典成功', {
        count: result.customers.length,
      });

      return {
        customers: result.customers,
      };
    } catch (error) {
      this.logger.error('获取所有客户字典失败', error.stack, {
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
}
