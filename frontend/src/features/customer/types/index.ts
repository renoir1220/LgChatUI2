// 客户站点信息相关类型定义

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
  completeDate: string | null;
  /** 验收时间 */
  acceptanceDate: string | null;
  /** 申请日期（后端 b.create_time） */
  createTime?: string | null;
  /** 商务类型 */
  businessType: string | null;
  /** 数量 */
  quantity: number;
}

export interface CrmSitesResponse {
  sites: CrmSite[];
  total: number;
}

// 汇总数据接口
export interface SiteSummary {
  /** 产品小类 */
  productSubcategory: string;
  /** 站点名称 */
  siteName: string;
  /** 总数量 */
  totalQuantity: number;
}

// 装机单分组数据接口
export interface InstallGroup {
  /** 装机单号 */
  installCode: string;
  /** 项目简称 */
  projectSummary: string | null;
  /** 单据状态 */
  documentStatus: string;
  /** 申请日期（来自 BUS_INSTALL_MAIN.create_time） */
  createTime?: string | null;
  /** 完成时间 */
  completeDate: string | null;
  /** 验收时间 */
  acceptanceDate: string | null;
  /** 站点列表 */
  sites: CrmSite[];
}
