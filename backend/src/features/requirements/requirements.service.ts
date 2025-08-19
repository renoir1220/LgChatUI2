import { Injectable } from '@nestjs/common';
import { RequirementsRepository } from './requirements.repository';
import { AppLoggerService } from '../../shared/services/logger.service';
import type { RequirementItem, RequirementListResponse } from '@lg/shared';

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
        this.requirementsRepository.findByCustomerName(customerName, page, pageSize),
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
   * 根据客户名称获取需求总数
   * @param customerName 客户名称
   * @returns 总数
   */
  async getRequirementsCountByCustomer(customerName: string): Promise<number> {
    this.logger.log('开始获取客户需求总数', { customerName });

    try {
      const total = await this.requirementsRepository.countByCustomerName(customerName);

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