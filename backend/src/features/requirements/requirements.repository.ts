import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../shared/database/database.service';
import { AppLoggerService } from '../../shared/services/logger.service';
import type { RequirementItem } from '@lg/shared';

@Injectable()
export class RequirementsRepository {
  constructor(
    private readonly databaseService: DatabaseService,
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
      FROM [LogeneCrm].[dbo].[BUS_XQ]
      WHERE CUSTOMER_NAME = @p0
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

      const result = await this.databaseService.query(query, 
        customerName,
        offset,
        pageSize,
      );

      this.logger.log('客户需求列表查询成功', {
        customerName,
        resultCount: result.length,
      });

      return result;
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
   * 根据客户名称查询需求总数
   * @param customerName 客户名称
   * @returns 总数
   */
  async countByCustomerName(customerName: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as total
      FROM [LogeneCrm].[dbo].[BUS_XQ]
      WHERE CUSTOMER_NAME = @p0
    `;

    try {
      this.logger.log('查询客户需求总数', { customerName });

      const result = await this.databaseService.query(query, 
        customerName,
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