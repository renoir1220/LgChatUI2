import { Injectable } from '@nestjs/common';
import { RequirementsRepository } from './requirements.repository';
import { AppLoggerService } from '../../shared/services/logger.service';
import type { RequirementItem, RequirementListResponse } from '../../types';

@Injectable()
export class RequirementsService {
  constructor(
    private readonly requirementsRepository: RequirementsRepository,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * 根据客户名称获取需求列表
   * @param customerName 客户名称
   * @param page 页码，默认1
   * @param pageSize 每页数量，默认10
   * @returns 需求列表响应
   */
  async getRequirementsByCustomer(
    customerName: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<RequirementListResponse> {
    this.logger.log('开始获取客户需求列表', {
      customerName,
      page,
      pageSize,
    });

    try {
      // 并行查询列表和总数
      const [requirements, total] = await Promise.all([
        this.requirementsRepository.findByCustomerName(
          customerName,
          page,
          pageSize,
        ),
        this.requirementsRepository.countByCustomerName(customerName),
      ]);

      this.logger.log('客户需求列表获取成功', {
        customerName,
        page,
        pageSize,
        total,
        resultCount: requirements.length,
      });

      return {
        requirements,
        total,
      };
    } catch (error) {
      this.logger.error('获取客户需求列表失败', error, {
        customerName,
        page,
        pageSize,
      });
      throw error;
    }
  }

  /**
   * 根据关键词搜索需求列表（支持多关键词）
   * @param keywords 关键词数组
   * @param page 页码，默认1
   * @param pageSize 每页数量，默认10
   * @returns 需求列表响应
   */
  async searchRequirementsByKeywords(
    keywords: string[],
    page: number = 1,
    pageSize: number = 10,
  ): Promise<RequirementListResponse> {
    // 过滤掉空关键词
    const validKeywords = keywords.filter(keyword => keyword.trim().length > 0);
    
    this.logger.log('开始根据关键词搜索需求列表', {
      originalKeywords: keywords,
      validKeywords,
      page,
      pageSize,
    });

    if (validKeywords.length === 0) {
      this.logger.log('没有有效的搜索关键词，返回空结果');
      return {
        requirements: [],
        total: 0,
      };
    }

    try {
      // 并行查询列表和总数
      const [requirements, total] = await Promise.all([
        this.requirementsRepository.searchByKeywords(
          validKeywords,
          page,
          pageSize,
        ),
        this.requirementsRepository.countByKeywords(validKeywords),
      ]);

      this.logger.log('关键词搜索需求列表成功', {
        validKeywords,
        page,
        pageSize,
        total,
        resultCount: requirements.length,
      });

      return {
        requirements,
        total,
      };
    } catch (error) {
      this.logger.error('根据关键词搜索需求列表失败', error, {
        validKeywords,
        page,
        pageSize,
      });
      throw error;
    }
  }

  /**
   * 根据客户名称获取需求总数
   * @param customerName 客户名称
   * @returns 总数
   */
  async getRequirementsCountByCustomer(customerName: string): Promise<number> {
    this.logger.log('开始获取客户需求总数', { customerName });

    try {
      const total =
        await this.requirementsRepository.countByCustomerName(customerName);

      this.logger.log('客户需求总数获取成功', {
        customerName,
        total,
      });

      return total;
    } catch (error) {
      this.logger.error('获取客户需求总数失败', error, {
        customerName,
      });
      throw error;
    }
  }
}
