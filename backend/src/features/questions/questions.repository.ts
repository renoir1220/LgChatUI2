import { Injectable } from '@nestjs/common';
import { CrmDatabaseService } from '../../shared/database/database.service';
import { AppLoggerService } from '../../shared/services/logger.service';
import { convertArrayPaths } from '../../shared/utils/path-converter';
import type { QuestionItem } from './types';

@Injectable()
export class QuestionsRepository {
  constructor(
    private readonly databaseService: CrmDatabaseService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * 根据关键词搜索常见问题列表（支持多关键词）
   * @param keywords 关键词数组
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 常见问题列表
   */
  async searchByKeywords(
    keywords: string[],
    page: number = 1,
    pageSize: number = 10,
  ): Promise<QuestionItem[]> {
    const offset = (page - 1) * pageSize;

    // 构建搜索条件，每个关键词都必须在任意一个搜索字段中出现
    const searchFields = [
      'ISNULL([DESC],\'\')',
      'ISNULL(REASON,\'\')',
      'ISNULL(RESOLVENT,\'\')',
      'ISNULL(REMARK,\'\')',
    ];

    // 为每个关键词构建搜索条件
    let whereConditions: string[] = [];
    let parameterIndex = 0;
    const parameters: any[] = [];

    keywords.forEach(keyword => {
      if (keyword.trim()) {
        // 每个关键词必须在至少一个搜索字段中出现
        const keywordConditions = searchFields.map(() => {
          const paramIndex = parameterIndex++;
          parameters.push(`%${keyword.trim()}%`);
          return `@p${paramIndex}`;
        });
        
        const keywordCondition = searchFields
          .map((field, index) => `${field} LIKE ${keywordConditions[index]}`)
          .join(' OR ');
        
        whereConditions.push(`(${keywordCondition})`);
      }
    });

    // 如果没有有效关键词，返回空结果
    if (whereConditions.length === 0) {
      return [];
    }

    // 所有关键词都必须匹配（AND关系）
    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT
        [QUESTION_ID] AS questionId,
        ISNULL([CUSTOMER_NAME],'') AS customerName,
        ISNULL([SITE_TYPE],'') AS siteName,
        ISNULL([PRODUCT_TYPE],'') AS productType,
        ISNULL([MODULE],'') AS module,
        ISNULL([DESC],'') AS description,
        ISNULL([CREATE_USER],'') AS createUser,
        CONVERT(varchar,[CREATE_TIME],23) AS createTime,
        ISNULL([RESOLVENT],'') AS resolvent,
        ISNULL([REASON],'') AS reason,
        ISNULL([STATUS],'') AS status,
        ISNULL([REMARK],'') AS remark,
        ISNULL([REPAIR_USER_NAME],'') AS repairUserName,
        CONVERT(varchar,[REPAIR_DATE],23) AS repairDate,
        ISNULL([SUPPORT_USER_NAME],'') AS supportUserName,
        CONVERT(varchar,[HANDLE_DATE],23) AS handleDate,
        ISNULL([PHR_USER_NAME],'') AS phrUserName
      FROM [LogeneCrm].[dbo].[BUS_QUESTION_LIST]
      WHERE ${whereClause}
      ORDER BY [QUESTION_ID] DESC
      OFFSET @p${parameters.length} ROWS
      FETCH NEXT @p${parameters.length + 1} ROWS ONLY
    `;

    // 添加分页参数
    parameters.push(...[offset, pageSize]);

    try {
      this.logger.log('根据关键词搜索常见问题列表', {
        keywords,
        page,
        pageSize,
        offset,
        whereConditions: whereConditions.length,
      });

      const result = await this.databaseService.queryWithErrorHandling(
        query,
        parameters,
        '根据关键词搜索常见问题列表',
      );

      this.logger.log('关键词搜索常见问题列表成功', {
        keywords,
        resultCount: result.length,
      });

      // 转换文本字段中的相对路径为完整URL
      const convertedResult = convertArrayPaths(
        result,
        [
          'description',
          'reason',
          'resolvent',
          'remark',
        ],
        'https://crm.logene.com',
      );

      return convertedResult;
    } catch (error) {
      this.logger.error('根据关键词搜索常见问题列表失败', error, {
        keywords,
        page,
        pageSize,
      });
      throw error;
    }
  }

  /**
   * 根据关键词搜索常见问题总数（支持多关键词）
   * @param keywords 关键词数组
   * @returns 总数
   */
  async countByKeywords(keywords: string[]): Promise<number> {
    // 构建搜索条件，每个关键词都必须在任意一个搜索字段中出现
    const searchFields = [
      'ISNULL([DESC],\'\')',
      'ISNULL(REASON,\'\')',
      'ISNULL(RESOLVENT,\'\')',
      'ISNULL(REMARK,\'\')',
    ];

    // 为每个关键词构建搜索条件
    let whereConditions: string[] = [];
    let parameterIndex = 0;
    const parameters: any[] = [];

    keywords.forEach(keyword => {
      if (keyword.trim()) {
        // 每个关键词必须在至少一个搜索字段中出现
        const keywordConditions = searchFields.map(() => {
          const paramIndex = parameterIndex++;
          parameters.push(`%${keyword.trim()}%`);
          return `@p${paramIndex}`;
        });
        
        const keywordCondition = searchFields
          .map((field, index) => `${field} LIKE ${keywordConditions[index]}`)
          .join(' OR ');
        
        whereConditions.push(`(${keywordCondition})`);
      }
    });

    // 如果没有有效关键词，返回0
    if (whereConditions.length === 0) {
      return 0;
    }

    // 所有关键词都必须匹配（AND关系）
    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT COUNT(*) as total
      FROM [LogeneCrm].[dbo].[BUS_QUESTION_LIST]
      WHERE ${whereClause}
    `;

    try {
      this.logger.log('根据关键词统计常见问题总数', { keywords });

      const result = await this.databaseService.queryWithErrorHandling(
        query,
        parameters,
        '根据关键词统计常见问题总数',
      );

      const total = result[0]?.total || 0;

      this.logger.log('关键词统计常见问题总数成功', {
        keywords,
        total,
      });

      return total;
    } catch (error) {
      this.logger.error('根据关键词统计常见问题总数失败', error, {
        keywords,
      });
      throw error;
    }
  }
}