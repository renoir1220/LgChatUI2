// CRM客户站点信息相关的类型定义

/**
 * CRM客户站点信息接口
 */
export interface CrmSite {
  /** 装机ID */
  installId: string;
  /** 装机单号 */
  installCode: string;
  /** 单据状态 */
  documentStatus: string;
  /** 项目简称 */
  projectSummary: string | null;
  /** 产品大类 */
  productCategory: string;
  /** 产品小类 */
  productSubcategory: string;
  /** 站点名称 */
  siteName: string;
  /** 完成时间 */
  completeDate: Date | null;
  /** 验收时间 */
  acceptanceDate: Date | null;
  /** 申请日期（b.create_time） */
  createTime: Date | null;
  /** 商务类型 */
  businessType: string | null;
  /** 数量 */
  quantity: number;
}

/**
 * 根据客户ID查询CRM站点列表的请求参数
 */
export interface GetCrmSitesByCustomerIdRequest {
  /** 客户ID */
  customerId: string;
}

/**
 * CRM站点列表响应
 */
export interface GetCrmSitesResponse {
  /** CRM站点列表 */
  sites: CrmSite[];
  /** 总数量 */
  total: number;
}
