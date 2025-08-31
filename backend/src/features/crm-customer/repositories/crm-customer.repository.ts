import { Injectable } from '@nestjs/common';
import { CrmDatabaseService } from '../../../shared/database/database.service';
import { CrmSite } from '../../../types';

@Injectable()
export class CrmCustomerRepository {
  constructor(private readonly db: CrmDatabaseService) {}

  /**
   * 根据客户ID查询CRM站点列表
   * @param customerId 客户ID
   * @returns CRM站点信息列表
   */
  async findSitesByCustomerId(customerId: string): Promise<CrmSite[]> {
    const query = `
      SELECT
          a.INSTALL_ID as installId,
          a.INSTALL_CODE as installCode,
          (select d.DICT_NAME from FWK_DICT d where convert(varchar,b.status)=d.DICT_CODE and d.DICTTYPE_ID =
              (select top 1 dt.DICTTYPE_ID from FWK_DICTTYPE dt where dt.DICTTYPE_CODE='InstallMainStatus')) as documentStatus,
          b.PROJECT_SUMMARY as projectSummary,
          a.CP_DL as productCategory,
          a.CP_XL as productSubcategory,
          a.CP_MK as siteName,
          b.CREATE_TIME as createTime,
          b.COMPLETE_DATE as completeDate,
          b.ACCEPTANCE_DATE as acceptanceDate,
          (select d.DICT_NAME from FWK_DICT d where convert(varchar,b.BUSINESS_TYPE)=d.DICT_CODE and d.DICTTYPE_ID =
              (select top 1 dt.DICTTYPE_ID from FWK_DICTTYPE dt where dt.DICTTYPE_CODE='InstallBusinessType')) as businessType,
          COUNT(1) AS quantity
      FROM VIEW_BUS_INSTALL_WDL a
          JOIN dbo.BUS_INSTALL_MAIN b ON b.INSTALL_ID = a.INSTALL_ID
          inner join base_customer c on c.CUSTOMER_ID=a.CUSTOMER_ID
      WHERE 
          a.CUSTOMER_ID = @p0
          AND
          ISNULL(a.ZFZT,'-1') = '-1' AND b.IS_ENABLE='1'
      GROUP BY a.INSTALL_ID,a.INSTALL_CODE,
          b.STATUS,b.PROJECT_SUMMARY,b.IS_ENABLE,
          a.CP_DL,a.CP_XL,a.CP_MK,
          b.CREATE_TIME,b.COMPLETE_DATE,b.ACCEPTANCE_DATE,b.BUSINESS_TYPE,b.BUSINESS_TYPE_INIT,a.CP_DL_SORT_NUMBER,a.CP_XL_SORT_NUMBER,a.CP_MK_SORT_NUMBER,a.TYPE
      ORDER BY a.INSTALL_CODE,a.CP_DL_SORT_NUMBER,a.CP_XL_SORT_NUMBER,a.CP_MK_SORT_NUMBER,a.TYPE,a.CP_DL,a.CP_XL,a.CP_MK
    `;

    const rows = await this.db.queryWithErrorHandling<{
      installId: string;
      installCode: string;
      documentStatus: string;
      projectSummary: string | null;
      productCategory: string;
      productSubcategory: string;
      siteName: string;
      createTime: Date | null;
      completeDate: Date | null;
      acceptanceDate: Date | null;
      businessType: string | null;
      quantity: number;
    }>(query, [customerId], '查询客户站点信息列表');

    // 将数据库查询结果转换为CrmSite类型
    return rows.map(row => ({
      installId: row.installId,
      installCode: row.installCode,
      documentStatus: row.documentStatus,
      projectSummary: row.projectSummary,
      productCategory: row.productCategory,
      productSubcategory: row.productSubcategory,
      siteName: row.siteName,
      createTime: row.createTime,
      completeDate: row.completeDate,
      acceptanceDate: row.acceptanceDate,
      businessType: row.businessType,
      quantity: row.quantity,
    }));
  }

  /**
   * 根据客户名称查找客户ID
   * @param customerName 客户名称
   * @returns 客户ID，如果未找到则返回null
   */
  async findCustomerIdByName(customerName: string): Promise<string | null> {
    const query = `
      SELECT TOP 1 c.CUSTOMER_ID as customerId
      FROM base_customer c
      WHERE c.NAME = @p0
    `;

    const rows = await this.db.queryWithErrorHandling<{
      customerId: string;
    }>(query, [customerName], '根据客户名称查找客户ID');

    if (rows.length === 0) {
      return null;
    }

    return rows[0].customerId;
  }

  /**
   * 根据客户名称查询CRM站点列表（先查ID再查站点）
   * @param customerName 客户名称
   * @returns CRM站点信息列表
   */
  async findSitesByCustomerName(customerName: string): Promise<CrmSite[]> {
    // 先根据客户名称查找客户ID
    const customerId = await this.findCustomerIdByName(customerName);
    
    if (!customerId) {
      return []; // 如果找不到客户，返回空数组
    }

    // 使用客户ID查询站点信息
    return this.findSitesByCustomerId(customerId);
  }

}
