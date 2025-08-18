import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../shared/database/database.service';
import { AppLoggerService } from '../../shared/services/logger.service';

/**
 * README配置信息搜索服务
 * 负责处理README配置信息的数据库查询和结果格式化
 */
@Injectable()
export class ReadmeSearchService {
  private readonly MAX_RESULT_LENGTH = 10000; // 最大返回结果长度限制

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * 根据关键词搜索README配置信息
   * @param keywords 搜索关键词数组
   * @returns 格式化的搜索结果或长度限制提示
   */
  async searchReadmeConfigs(keywords: string[]): Promise<string> {
    // 构建动态WHERE条件
    const whereConditions = keywords.map((_, index) => 
      `FUNCTION1 LIKE @p${index}`
    ).join(' AND ');

    // 第一次查询：不过滤SWITCH
    const basicSql = `
      SELECT 
        '## 说明:' + ISNULL(FUNCTION1, '') + CHAR(13) + CHAR(10) +
        '站点名称:' + ISNULL(SITE_TYPE, '') + CHAR(13) + CHAR(10) +
        '模块名称:' + ISNULL(MODULE_NAME, '') + CHAR(13) + CHAR(10) +
        '参数:' + ISNULL(SWITCH, '') + CHAR(13) + CHAR(10) +
        '版本:' + ISNULL(CAST(VER AS NVARCHAR), '') + ' - ' + ISNULL(CONVERT(NVARCHAR, VER_DATE, 120), '') + CHAR(13) + CHAR(10) +
        '用户:' + ISNULL(CUSTOMER_NAME, '') + CHAR(13) + CHAR(10) +
        'SQL:' + ISNULL(SQL, '') + CHAR(13) + CHAR(10) AS formatted_result,
        README_ID,
        SEQ_NO
      FROM BUS_README_LIST
      WHERE ${whereConditions}
      ORDER BY CREATE_TIME DESC, SEQ_NO DESC
    `;


    try {
      // 准备参数，使用数据库服务的query方法
      const params = keywords.map(keyword => `%${keyword.trim()}%`);
      
      // 执行第一次查询
      const result = await this.databaseService.query(basicSql, ...params);

      if (!result || result.length === 0) {
        return '未找到匹配的配置信息，请尝试其他关键词。';
      }

      // 格式化结果
      const formattedResults = result.map((row: any) => row.formatted_result);
      const combinedResult = formattedResults.join('\n\n' + '='.repeat(50) + '\n\n');

      // 检查结果长度
      if (combinedResult.length > this.MAX_RESULT_LENGTH) {
        this.logger.warn('README搜索结果过大，尝试只查询有开关配置的记录', {
          keywords,
          resultLength: combinedResult.length,
          maxLength: this.MAX_RESULT_LENGTH,
          recordCount: result.length,
        });

        // 第二次查询：只查询SWITCH不为null的记录
        const filteredSql = `
          SELECT 
            '## 说明:' + ISNULL(FUNCTION1, '') + CHAR(13) + CHAR(10) +
            '站点名称:' + ISNULL(SITE_TYPE, '') + CHAR(13) + CHAR(10) +
            '模块名称:' + ISNULL(MODULE_NAME, '') + CHAR(13) + CHAR(10) +
            '参数:' + ISNULL(SWITCH, '') + CHAR(13) + CHAR(10) +
            '版本:' + ISNULL(CAST(VER AS NVARCHAR), '') + ' - ' + ISNULL(CONVERT(NVARCHAR, VER_DATE, 120), '') + CHAR(13) + CHAR(10) +
            '用户:' + ISNULL(CUSTOMER_NAME, '') + CHAR(13) + CHAR(10) +
            'SQL:' + ISNULL(SQL, '') + CHAR(13) + CHAR(10) AS formatted_result,
            README_ID,
            SEQ_NO
          FROM BUS_README_LIST
          WHERE ${whereConditions}
            AND SWITCH IS NOT NULL 
            AND SWITCH != ''
          ORDER BY CREATE_TIME DESC, SEQ_NO DESC
        `;


        // 执行过滤后的查询
        const filteredResult = await this.databaseService.query(filteredSql, ...params);

        if (!filteredResult || filteredResult.length === 0) {
          return '查询结果过大且没有找到带开关配置的项目，请使用更具体的关键词。';
        }

        // 格式化过滤后的结果
        const filteredFormattedResults = filteredResult.map((row: any) => row.formatted_result);
        const filteredCombinedResult = filteredFormattedResults.join('\n\n' + '='.repeat(50) + '\n\n');

        // 再次检查长度
        if (filteredCombinedResult.length > this.MAX_RESULT_LENGTH) {
          this.logger.warn('过滤后结果仍然过大', {
            keywords,
            filteredRecordCount: filteredResult.length,
          });
          return '查询结果过大，请缩小查询范围';
        }

        this.logger.log('README搜索成功（已过滤）', {
          keywords,
          originalCount: result.length,
          filteredCount: filteredResult.length,
          resultLength: filteredCombinedResult.length,
        });

        return `${filteredCombinedResult}\n\n**注意**: 由于结果较多，已自动过滤为只显示有开关配置的 ${filteredResult.length} 条记录（原始匹配 ${result.length} 条）。`;
      }

      this.logger.log('README搜索成功', {
        keywords,
        resultLength: combinedResult.length,
        recordCount: result.length,
      });

      return combinedResult;

    } catch (error) {
      this.logger.error('README搜索数据库错误', error, {
        keywords,
        sql: basicSql.substring(0, 200) + '...',
      });
      throw new Error(`数据库查询失败: ${error.message}`);
    }
  }

  /**
   * 获取搜索建议关键词
   * @returns 常用关键词建议列表
   */
  async getSearchSuggestions(): Promise<string[]> {
    const sql = `
      SELECT TOP 20
        VALUE as keyword,
        COUNT(*) as usage_count
      FROM (
        SELECT DISTINCT 
          CASE 
            WHEN CHARINDEX('切片', FUNCTION1) > 0 THEN '切片'
            WHEN CHARINDEX('报告', FUNCTION1) > 0 THEN '报告'
            WHEN CHARINDEX('列表', FUNCTION1) > 0 THEN '列表'
            WHEN CHARINDEX('打印', FUNCTION1) > 0 THEN '打印'
            WHEN CHARINDEX('查询', FUNCTION1) > 0 THEN '查询'
            WHEN CHARINDEX('登记', FUNCTION1) > 0 THEN '登记'
            WHEN CHARINDEX('工作站', FUNCTION1) > 0 THEN '工作站'
            WHEN CHARINDEX('状态', FUNCTION1) > 0 THEN '状态'
            WHEN CHARINDEX('设置', FUNCTION1) > 0 THEN '设置'
            WHEN CHARINDEX('导出', FUNCTION1) > 0 THEN '导出'
          END as VALUE
        FROM BUS_README_LIST
        WHERE FUNCTION1 IS NOT NULL AND LEN(FUNCTION1) > 0
      ) keywords
      WHERE VALUE IS NOT NULL
      GROUP BY VALUE
      ORDER BY COUNT(*) DESC
    `;

    try {
      const result = await this.databaseService.query(sql);
      
      const suggestions = result.map((row: any) => row.keyword);
      
      this.logger.log('获取搜索建议成功', {
        suggestionCount: suggestions.length,
      });

      return suggestions;

    } catch (error) {
      this.logger.error('获取搜索建议失败', error);
      
      // 返回默认建议
      return ['切片', '报告', '列表', '打印', '查询', '登记', '工作站', '状态', '设置', '导出'];
    }
  }

  /**
   * 获取搜索统计信息（可选功能）
   * @returns 搜索相关的统计数据
   */
  async getSearchStats(): Promise<{
    totalRecords: number;
    recordsWithFunction: number;
    avgFunctionLength: number;
  }> {
    const sql = `
      SELECT 
        COUNT(*) as totalRecords,
        COUNT(CASE WHEN FUNCTION1 IS NOT NULL AND LEN(FUNCTION1) > 0 THEN 1 END) as recordsWithFunction,
        AVG(CASE WHEN FUNCTION1 IS NOT NULL THEN LEN(FUNCTION1) ELSE 0 END) as avgFunctionLength
      FROM BUS_README_LIST
    `;

    try {
      const result = await this.databaseService.query(sql);
      return result[0];
    } catch (error) {
      this.logger.error('获取搜索统计失败', error);
      return {
        totalRecords: 0,
        recordsWithFunction: 0,
        avgFunctionLength: 0,
      };
    }
  }
}