import {
  BadRequestException,
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import { FeatureSearchService } from './feature-search.service';
import { AppLoggerService } from '../../shared/services/logger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface SearchGroup {
  or: string[];
}

@UseGuards(JwtAuthGuard)
@Controller('api/feature-search')
export class FeatureSearchController {
  constructor(
    private readonly featureSearchService: FeatureSearchService,
    private readonly logger: AppLoggerService,
  ) {}

  @Post()
  async search(
    @Body() body: { keywordGroups: SearchGroup[]; rawKeywords?: string },
    @Req() req?: any,
  ): Promise<any> {
    const { keywordGroups, rawKeywords } = body;

    this.logger.log('功能查询请求', {
      keywordGroups,
      userAgent: req?.headers?.['user-agent'] || 'unknown',
      rawKeywords,
    });

    if (!keywordGroups || keywordGroups.length === 0) {
      throw new BadRequestException(
        '请提供至少一个搜索关键字',
      );
    }

    // Basic validation for keywordGroups structure
    for (const group of keywordGroups) {
      if (!group.or || !Array.isArray(group.or) || group.or.length === 0) {
        throw new BadRequestException('搜索关键字组格式不正确');
      }
      for (const keyword of group.or) {
        if (typeof keyword !== 'string' || keyword.length === 0) {
          throw new BadRequestException('搜索关键字不能为空');
        }
        if (keyword.length > 50) {
          throw new BadRequestException('单个关键字长度不能超过50个字符');
        }
      }
    }

    try {
      const items = await this.featureSearchService.searchFeatures(keywordGroups, {
        userId: req?.user?.id,
        rawKeywords: rawKeywords,
      });
      const message =
        items.length === 0
          ? '未找到匹配的功能记录'
          : `查询到 ${items.length} 条功能记录`;

      return {
        success: true,
        data: {
          items,
          total: items.length,
        },
        message,
      };
    } catch (error) {
      this.logger.error('功能查询失败', error, {
        keywordGroups,
      });
      throw new BadRequestException(`查询失败: ${error.message}`);
    }
  }

  @Get('history')
  async getUserHistory(
    @Req() req: any,
    @Query('limit') limit = '10',
  ) {
    const parsedLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const userId = req?.user?.id;
    if (!userId) {
      throw new BadRequestException('未获取到用户信息，无法查询历史记录');
    }

    const records = await this.featureSearchService.getUserHistory(userId, parsedLimit);
    return {
      success: true,
      data: records,
    };
  }

  @Get('popular')
  async getPopularQueries(
    @Query('limit') limit = '10',
    @Query('days') days = '30',
  ) {
    const parsedLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const parsedDays = Math.min(Math.max(Number(days) || 30, 1), 365);

    const items = await this.featureSearchService.getPopularQueries(parsedLimit, parsedDays);
    return {
      success: true,
      data: items,
    };
  }

  @Get('latest')
  async getLatestFeatures(
    @Query('days') days = '7',
    @Query('limit') limit = '50',
  ) {
    const parsedDays = Math.min(Math.max(Number(days) || 7, 1), 90);
    const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

    const items = await this.featureSearchService.getLatestFeatures(parsedDays, parsedLimit);
    return {
      success: true,
      data: {
        items,
      },
    };
  }
}
