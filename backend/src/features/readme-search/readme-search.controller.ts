import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { ReadmeSearchService } from './readme-search.service';
import { ReadmeSearchDto } from './dto/readme-search.dto';
import { AppLoggerService } from '../../shared/services/logger.service';

/**
 * README配置信息搜索控制器
 * 提供基于关键词的README配置信息查询功能，供Dify调用
 */
@Controller('api/readme-search')
export class ReadmeSearchController {
  constructor(
    private readonly readmeSearchService: ReadmeSearchService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * 搜索README配置信息
   * @param query 搜索参数
   * @returns 格式化的README配置信息列表
   */
  @Get()
  async searchReadme(@Query() query: any, @Req() req?: any) {
    // 处理搜索关键词
    const dto = new ReadmeSearchDto();
    dto.keywords = query.keywords;
    const keywords = dto.getKeywords();

    this.logger.log('README搜索请求', {
      keywords,
      userAgent: req?.headers?.['user-agent'] || 'unknown',
    });

    // 验证关键词参数
    if (!query.keywords) {
      throw new BadRequestException(
        '请提供keywords参数，例如: ?keywords=切片,列表',
      );
    }

    if (keywords.length === 0) {
      throw new BadRequestException('请提供至少一个有效的搜索关键词');
    }

    if (keywords.length > 10) {
      throw new BadRequestException('搜索关键词数量不能超过10个');
    }

    // 验证关键词长度
    for (const keyword of keywords) {
      if (!keyword || keyword.trim().length === 0) {
        throw new BadRequestException('关键词不能为空');
      }
      if (keyword.length > 50) {
        throw new BadRequestException('单个关键词长度不能超过50个字符');
      }
    }

    try {
      const result =
        await this.readmeSearchService.searchReadmeConfigs(keywords);

      this.logger.log('README搜索完成', {
        keywords,
        resultLength: result.length,
      });

      // 使用正确的分隔符计算实际记录数量
      const separator = '='.repeat(50);
      const actualRecordCount = result.includes(separator)
        ? result.split(separator).filter((item) => item.trim()).length
        : result.trim()
          ? 1
          : 0;

      return {
        success: true,
        data: result,
        message:
          result === '查询结果过大，请缩小查询范围'
            ? '查询结果过大，请缩小查询范围'
            : `找到 ${actualRecordCount} 条相关配置信息`,
      };
    } catch (error) {
      this.logger.error('README搜索失败', error, {
        keywords,
      });

      throw new BadRequestException(`搜索失败: ${error.message}`);
    }
  }

  /**
   * 获取搜索建议（可选功能）
   * @returns 常用搜索关键词建议
   */
  @Get('suggestions')
  async getSearchSuggestions() {
    try {
      const suggestions = await this.readmeSearchService.getSearchSuggestions();

      return {
        success: true,
        data: suggestions,
        message: '获取搜索建议成功',
      };
    } catch (error) {
      this.logger.error('获取搜索建议失败', error);

      throw new BadRequestException(`获取搜索建议失败: ${error.message}`);
    }
  }

  /**
   * POST方式搜索README配置信息（兼容不同HTTP客户端）
   * @param body 搜索参数
   * @returns 格式化的README配置信息列表
   */
  @Post()
  async searchReadmePost(@Body() body: any, @Req() req?: any) {
    this.logger.log('README搜索请求(POST)', {
      keywords: body.keywords || body.query || body.search,
    });

    // 将body转换为query格式并调用GET方法的逻辑
    const mockQuery = {
      keywords: body.keywords || body.query || body.search,
    };

    return this.searchReadme(mockQuery, req);
  }
}
