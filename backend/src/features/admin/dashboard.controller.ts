import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { DashboardService } from './dashboard.service';
import { AppLoggerService } from '../../shared/services/logger.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('api/admin/dashboard')
export class DashboardController {
  private readonly logger = new AppLoggerService();

  constructor(private readonly dashboardService: DashboardService) {
    this.logger.setContext('DashboardController');
  }

  /**
   * 1. 总用量和按天趋势
   * GET /api/admin/dashboard/daily-usage?days=30
   */
  @Get('daily-usage')
  async getDailyUsage(@Query('days') days?: string) {
    this.logger.log('获取每日用量趋势请求', { days });

    const daysParsed = days ? parseInt(days, 10) : 30;
    const result = await this.dashboardService.getDailyUsageTrends(daysParsed);

    this.logger.log('每日用量趋势数据返回', { dataPoints: result.length });

    return {
      success: true,
      data: result,
      metadata: {
        days: daysParsed,
        dataPoints: result.length
      }
    };
  }

  /**
   * 2. 按用户用量排行
   * GET /api/admin/dashboard/user-ranking?limit=10
   */
  @Get('user-ranking')
  async getUserRanking(@Query('limit') limit?: string) {
    this.logger.log('获取用户用量排行请求', { limit });

    const limitParsed = limit ? parseInt(limit, 10) : 10;
    const result = await this.dashboardService.getUserRanking(limitParsed);

    this.logger.log('用户用量排行数据返回', { usersCount: result.length });

    return {
      success: true,
      data: result,
      metadata: {
        limit: limitParsed,
        usersCount: result.length
      }
    };
  }

  /**
   * 3. 评价趋势（点赞、点踩）
   * GET /api/admin/dashboard/feedback-trends?days=30
   */
  @Get('feedback-trends')
  async getFeedbackTrends(@Query('days') days?: string) {
    this.logger.log('获取评价趋势请求', { days });

    const daysParsed = days ? parseInt(days, 10) : 30;
    const result = await this.dashboardService.getFeedbackTrends(daysParsed);

    this.logger.log('评价趋势数据返回', { dataPoints: result.length });

    return {
      success: true,
      data: result,
      metadata: {
        days: daysParsed,
        dataPoints: result.length
      }
    };
  }

  /**
   * 4. 按客户端用量分析
   * GET /api/admin/dashboard/client-usage
   */
  @Get('client-usage')
  async getClientUsage() {
    this.logger.log('获取客户端用量分析请求');

    const result = await this.dashboardService.getClientUsage();

    this.logger.log('客户端用量分析数据返回', { clientsCount: result.length });

    return {
      success: true,
      data: result,
      metadata: {
        clientsCount: result.length
      }
    };
  }
}