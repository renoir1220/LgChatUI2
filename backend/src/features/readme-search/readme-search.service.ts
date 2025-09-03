import { Injectable } from '@nestjs/common';
import { CrmDatabaseService } from '../../shared/database/database.service';
import { AppLoggerService } from '../../shared/services/logger.service';
import { ReadmeEntity } from './dto/readme-search.dto';

/**
 * README配置信息搜索服务
 * 负责处理README配置信息的数据库查询和结果格式化
 */
@Injectable()
export class ReadmeSearchService {
  private readonly MAX_RESULT_LENGTH = 10000; // 最大返回结果长度限制（保留但不再使用二次查询）
  private readonly MAX_RECORDS = 50; // 单次返回最大记录数

  constructor(
    private readonly databaseService: CrmDatabaseService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * 根据关键词搜索README配置信息
   * @param keywords 搜索关键词数组
   * @returns 格式化的搜索结果或长度限制提示
   */
  async searchReadmeConfigs(keywords: string[]): Promise<string> {
    // 构建动态WHERE条件：
    // - 同一个字段内对多个关键词使用 AND（该字段需同时匹配所有关键词）
    // - 各字段之间使用 OR（任一字段满足上面的 AND 条件即可）
    // 形如：
    // (FUNCTION1 LIKE @p0 AND FUNCTION1 LIKE @p1 ...) 
    //   OR (SWITCH LIKE @p0 AND SWITCH LIKE @p1 ...)
    //   OR (CUSTOMER_NAME LIKE @p0 AND ...)
    const searchFields = ['FUNCTION1', 'SWITCH', 'CUSTOMER_NAME', 'SITE_TYPE', 'MODULE_NAME'];
    const whereConditions = keywords.length === 0
      ? '1=1'
      : searchFields
          .map((field) => `(${keywords.map((_, idx) => `${field} LIKE @p${idx}`).join(' AND ')})`)
          .join(' OR ');

    // 单次查询：按有SWITCH优先排序，并限制返回条数
    const basicSql = `
      SELECT 
        '## 说明:' + ISNULL(FUNCTION1, '') + CHAR(13) + CHAR(10) +
        '站点名称:' + ISNULL(SITE_TYPE, '') + CHAR(13) + CHAR(10) +
        '模块名称:' + ISNULL(MODULE_NAME, '') + CHAR(13) + CHAR(10) +
        '参数:' + ISNULL(SWITCH, '') + CHAR(13) + CHAR(10) +
        '版本:' + ISNULL(CAST(VER AS NVARCHAR), '') + ' - ' + ISNULL(CONVERT(NVARCHAR, VER_DATE, 120), '') + CHAR(13) + CHAR(10) +
        '用户:' + ISNULL(CUSTOMER_NAME, '') + CHAR(13) + CHAR(10) +
        'SQL:' + ISNULL(SQL, '') + CHAR(13) + CHAR(10) +
        '原文链接：'+ '[BUTTON:查看|showReadme|readmeId='+convert(varchar(50),README_ID)+'|style=link]' + CHAR(13) + CHAR(10) 
          AS formatted_result,
        README_ID,
        SEQ_NO
      FROM BUS_README_LIST
      WHERE ${whereConditions}
      ORDER BY 
        CASE WHEN SWITCH IS NOT NULL AND SWITCH != '' THEN 0 ELSE 1 END,
        CREATE_TIME DESC, SEQ_NO DESC
      OFFSET 0 ROWS FETCH NEXT ${this.MAX_RECORDS} ROWS ONLY
    `;

    try {
      // 准备参数，使用数据库服务的query方法
      const params = keywords.map((keyword) => `%${keyword.trim()}%`);

      console.log('Executing SQL:', basicSql);
      console.log('With parameters:', params);

      // 执行第一次查询
      const result = await this.databaseService.queryWithErrorHandling(
        basicSql,
        params,
        'README配置信息查询',
      );

      if (!result || result.length === 0) {
        return '未找到匹配的配置信息，请尝试其他关键词。';
      }

      // 格式化结果
      const formattedResults = result.map((row: any) => row.formatted_result);
      const combinedResult = formattedResults.join(
        '\n\n' + '='.repeat(50) + '\n\n',
      );

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
   * 根据README_ID查询单条README配置信息
   * @param readmeId README记录的ID
   * @returns README配置信息对象
   */
  async getReadmeById(readmeId: string): Promise<ReadmeEntity | null> {
    const sql = `
      SELECT 
        README_ID,
        FUNCTION1,
        SITE_TYPE,
        MODULE_NAME,
        SWITCH,
        VER,
        VER_DATE,
        CUSTOMER_NAME,
        SQL,
        CREATE_TIME,
        SEQ_NO
      FROM BUS_README_LIST
      WHERE README_ID = @p0
    `;

    try {
      const result: any[] = await this.databaseService.queryWithErrorHandling(
        sql,
        [readmeId],
        'README根据ID查询',
      );

      if (!result || result.length === 0) {
        return null;
      }

      const readmeData: any = result[0];

      this.logger.log('README根据ID查询成功', {
        readmeId,
        hasData: !!readmeData,
        function1Length: readmeData.FUNCTION1?.length || 0,
      });

      // 将数据库结果转换为ReadmeEntity格式
      const readmeEntity: ReadmeEntity = {
        id: readmeData.README_ID as string,
        title: readmeData.FUNCTION1 || '无标题',
        siteType: readmeData.SITE_TYPE as string | undefined,
        moduleName: readmeData.MODULE_NAME as string | undefined,
        switch: readmeData.SWITCH as string | undefined,
        version: readmeData.VER as number | undefined,
        versionDate: readmeData.VER_DATE as Date | undefined,
        customerName: readmeData.CUSTOMER_NAME as string | undefined,
        sql: readmeData.SQL as string | undefined,
        createTime: readmeData.CREATE_TIME as Date | undefined,
        seqNo: readmeData.SEQ_NO as number | undefined,
      };

      return readmeEntity;
    } catch (error: any) {
      this.logger.error('README根据ID查询失败', error, {
        readmeId,
      });
      throw new Error(`根据ID查询README失败: ${error.message}`);
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
      const result = await this.databaseService.queryWithErrorHandling(
        sql,
        [],
        '获取搜索统计信息',
      );
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
