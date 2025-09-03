import { Injectable } from '@nestjs/common';
import { CrmDatabaseService } from '../../shared/database/database.service';
import { AppLoggerService } from '../../shared/services/logger.service';
import { convertArrayPaths } from '../../shared/utils/path-converter';
import type { RequirementItem } from '../../types';

@Injectable()
export class RequirementsRepository {
  constructor(
    private readonly databaseService: CrmDatabaseService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * 根据客户名称查询需求列表
   * @param customerName 客户名称
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 需求列表
   */
  async findByCustomerName(
    customerName: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<RequirementItem[]> {
    const offset = (page - 1) * pageSize;

    const query = `
      SELECT
        ISNULL(XQ_CODE,'') AS requirementCode,
        ISNULL(SITE_TYPE,'') AS siteName,
        ISNULL(PRODUCT_TYPE,'') AS product,
        ISNULL(xq_name,'') AS requirementName,
        ISNULL(dhthj_name,'') AS currentStage,
        ISNULL(CONTENT,'') AS content,
        ISNULL(XQPG_YHGS,'') AS requirementEvaluation,
        ISNULL(XQSJ_SJNR,'') AS designContent,
        ISNULL(CPYZ_cp_README,'') AS productDescription,
        ISNULL(CPYZ_yf_README,'') AS developmentDescription,
        ISNULL(CREATE_USER_NAME,'') AS creator,
        ISNULL(CUSTOMER_NAME,'') AS customerName,
        ISNULL(YFFP_VERSION_NAME,'') AS versionName,
        CONVERT(varchar,create_time,23) AS createDate,
        CONVERT(varchar,LAST_UPDATE_TIME,23) AS lastUpdateDate
      FROM [BUS_XQ] xq 
	      inner join BASE_CUSTOMER c on xq.CUSTOMER_ID=c.CUSTOMER_ID
      WHERE c.Name = @p0
      ORDER BY XQ_CODE DESC
      OFFSET @p1 ROWS
      FETCH NEXT @p2 ROWS ONLY
    `;

    try {
      this.logger.log('查询客户需求列表', {
        customerName,
        page,
        pageSize,
        offset,
      });

      const result = await this.databaseService.queryWithErrorHandling(
        query,
        [customerName, offset, pageSize],
        '查询客户需求列表',
      );

      this.logger.log('客户需求列表查询成功', {
        customerName,
        resultCount: result.length,
      });

      // 转换文本字段中的相对路径为完整URL
      const convertedResult = convertArrayPaths(
        result,
        [
          'content',
          'requirementEvaluation',
          'designContent',
          'productDescription',
          'developmentDescription',
        ],
        'https://crm.logene.com',
      );

      return convertedResult;
    } catch (error) {
      this.logger.error('查询客户需求列表失败', error, {
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
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 需求列表
   */
  async searchByKeywords(
    keywords: string[],
    page: number = 1,
    pageSize: number = 10,
  ): Promise<RequirementItem[]> {
    const offset = (page - 1) * pageSize;

    // 构建搜索条件，每个关键词都必须在任意一个搜索字段中出现
    const searchFields = [
      'ISNULL(xq_name,\'\')',
      'ISNULL(CONTENT,\'\')',
      'ISNULL(XQPG_YHGS,\'\')',
      'ISNULL(XQSJ_SJNR,\'\')',
      'ISNULL(CPYZ_cp_README,\'\')',
      'ISNULL(CPYZ_yf_README,\'\')',
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
        ISNULL(XQ_CODE,'') AS requirementCode,
        ISNULL(SITE_TYPE,'') AS siteName,
        ISNULL(PRODUCT_TYPE,'') AS product,
        ISNULL(xq_name,'') AS requirementName,
        ISNULL(dhthj_name,'') AS currentStage,
        ISNULL(CONTENT,'') AS content,
        ISNULL(XQPG_YHGS,'') AS requirementEvaluation,
        ISNULL(XQSJ_SJNR,'') AS designContent,
        ISNULL(CPYZ_cp_README,'') AS productDescription,
        ISNULL(CPYZ_yf_README,'') AS developmentDescription,
        ISNULL(CREATE_USER_NAME,'') AS creator,
        ISNULL(CUSTOMER_NAME,'') AS customerName,
        ISNULL(YFFP_VERSION_NAME,'') AS versionName,
        CONVERT(varchar,create_time,23) AS createDate,
        CONVERT(varchar,LAST_UPDATE_TIME,23) AS lastUpdateDate
      FROM [dbo].[BUS_XQ]
      WHERE ${whereClause}
      ORDER BY XQ_CODE DESC
      OFFSET @p${parameters.length} ROWS
      FETCH NEXT @p${parameters.length + 1} ROWS ONLY
    `;

    // 添加分页参数
    parameters.push(...[offset, pageSize]);

    try {
      this.logger.log('根据关键词搜索需求列表', {
        keywords,
        page,
        pageSize,
        offset,
        whereConditions: whereConditions.length,
      });

      const result = await this.databaseService.queryWithErrorHandling(
        query,
        parameters,
        '根据关键词搜索需求列表',
      );

      this.logger.log('关键词搜索需求列表成功', {
        keywords,
        resultCount: result.length,
      });

      // 转换文本字段中的相对路径为完整URL
      const convertedResult = convertArrayPaths(
        result,
        [
          'content',
          'requirementEvaluation',
          'designContent',
          'productDescription',
          'developmentDescription',
        ],
        'https://crm.logene.com',
      );

      return convertedResult;
    } catch (error) {
      this.logger.error('根据关键词搜索需求列表失败', error, {
        keywords,
        page,
        pageSize,
      });
      throw error;
    }
  }

  /**
   * 根据关键词搜索需求总数（支持多关键词）
   * @param keywords 关键词数组
   * @returns 总数
   */
  async countByKeywords(keywords: string[]): Promise<number> {
    // 构建搜索条件，每个关键词都必须在任意一个搜索字段中出现
    const searchFields = [
      'ISNULL(xq_name,\'\')',
      'ISNULL(CONTENT,\'\')',
      'ISNULL(XQPG_YHGS,\'\')',
      'ISNULL(XQSJ_SJNR,\'\')',
      'ISNULL(CPYZ_cp_README,\'\')',
      'ISNULL(CPYZ_yf_README,\'\')',
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
      FROM [BUS_XQ]
      WHERE ${whereClause}
    `;

    try {
      this.logger.log('根据关键词统计需求总数', { keywords });

      const result = await this.databaseService.queryWithErrorHandling(
        query,
        parameters,
        '根据关键词统计需求总数',
      );

      const total = result[0]?.total || 0;

      this.logger.log('关键词统计需求总数成功', {
        keywords,
        total,
      });

      return total;
    } catch (error) {
      this.logger.error('根据关键词统计需求总数失败', error, {
        keywords,
      });
      throw error;
    }
  }

  /**
   * 根据客户名称查询需求总数
   * @param customerName 客户名称
   * @returns 总数
   */
  async countByCustomerName(customerName: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as total
      FROM [BUS_XQ] xq 
	      inner join BASE_CUSTOMER c on xq.CUSTOMER_ID=c.CUSTOMER_ID
      WHERE c.Name = @p0
    `;

    try {
      this.logger.log('查询客户需求总数', { customerName });

      const result = await this.databaseService.queryWithErrorHandling(
        query,
        [customerName],
        '查询客户需求总数',
      );

      const total = result[0]?.total || 0;

      this.logger.log('客户需求总数查询成功', {
        customerName,
        total,
      });

      return total;
    } catch (error) {
      this.logger.error('查询客户需求总数失败', error, {
        customerName,
      });
      throw error;
    }
  }
}
