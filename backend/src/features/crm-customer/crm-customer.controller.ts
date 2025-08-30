import {
  Controller,
  Get,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmCustomerRepository } from './repositories/crm-customer.repository';
import { AppLoggerService } from '../../shared/services/logger.service';
import { GetCrmSitesResponse } from '../../types';

@UseGuards(JwtAuthGuard)
@Controller('api/crm-customer')
export class CrmCustomerController {
  private readonly logger = new AppLoggerService();

  constructor(
    private readonly crmCustomerRepository: CrmCustomerRepository,
  ) {
    this.logger.setContext('CrmCustomerController');
  }

  /**
   * 根据客户ID获取CRM站点列表
   * GET /api/crm-customer/sites/:customerId
   */
  @Get('sites/:customerId')
  async getCrmSitesByCustomerId(
    @Param('customerId') customerId: string,
  ): Promise<GetCrmSitesResponse> {
    this.logger.log('开始查询客户站点列表', {
      customerId,
    });

    // 验证参数
    if (!customerId || customerId.trim() === '') {
      this.logger.warn('客户ID参数无效', { customerId });
      throw new BadRequestException('客户ID不能为空');
    }

    try {
      // 查询CRM站点信息
      const sites = await this.crmCustomerRepository.findSitesByCustomerId(customerId);

      this.logger.log('查询客户站点列表完成', {
        customerId,
        siteCount: sites.length,
      });

      return {
        sites,
        total: sites.length,
      };
    } catch (error) {
      this.logger.error('查询客户站点列表失败', error instanceof Error ? error.stack : undefined, {
        customerId,
        errorMessage: error instanceof Error ? error.message : '未知错误',
      });

      throw new BadRequestException(
        error instanceof Error ? error.message : '查询站点信息失败',
      );
    }
  }

  /**
   * 根据客户名称获取CRM站点列表
   * GET /api/crm-customer/sites-by-name/:customerName
   */
  @Get('sites-by-name/:customerName')
  async getCrmSitesByCustomerName(
    @Param('customerName') customerName: string,
  ): Promise<GetCrmSitesResponse> {
    this.logger.log('开始根据客户名称查询站点列表', {
      customerName,
    });

    // 验证参数
    if (!customerName || customerName.trim() === '') {
      this.logger.warn('客户名称参数无效', { customerName });
      throw new BadRequestException('客户名称不能为空');
    }

    try {
      // 查询站点信息
      const sites = await this.crmCustomerRepository.findSitesByCustomerName(customerName);

      this.logger.log('根据客户名称查询站点列表完成', {
        customerName,
        siteCount: sites.length,
      });

      return {
        sites,
        total: sites.length,
      };
    } catch (error) {
      this.logger.error('根据客户名称查询站点列表失败', error instanceof Error ? error.stack : undefined, {
        customerName,
        errorMessage: error instanceof Error ? error.message : '未知错误',
      });

      throw new BadRequestException(
        error instanceof Error ? error.message : '查询站点信息失败',
      );
    }
  }

}