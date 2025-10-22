import {
  BadRequestException,
  Controller,
  Post,
  Body,
  Req,
} from '@nestjs/common';
import { FeatureSearchService } from './feature-search.service';
import { AppLoggerService } from '../../shared/services/logger.service';

interface SearchGroup {
  or: string[];
}

@Controller('api/feature-search')
export class FeatureSearchController {
  constructor(
    private readonly featureSearchService: FeatureSearchService,
    private readonly logger: AppLoggerService,
  ) {}

  @Post()
  async search(
    @Body() body: { keywordGroups: SearchGroup[] },
    @Req() req?: any,
  ): Promise<any> {
    const { keywordGroups } = body;

    this.logger.log('功能查询请求', {
      keywordGroups,
      userAgent: req?.headers?.['user-agent'] || 'unknown',
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
      const items = await this.featureSearchService.searchFeatures(keywordGroups);
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
}
