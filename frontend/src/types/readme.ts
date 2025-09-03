/**
 * README配置信息相关类型定义
 */

/**
 * README配置信息实体
 */
export interface ReadmeEntity {
  /**
   * README记录ID
   */
  id: string;

  /**
   * 功能标题/说明
   */
  title: string;

  /**
   * 站点类型
   */
  siteType?: string;

  /**
   * 模块名称
   */
  moduleName?: string;

  /**
   * 开关/参数配置
   */
  switch?: string;

  /**
   * 版本号
   */
  version?: number;

  /**
   * 版本日期
   */
  versionDate?: Date;

  /**
   * 客户名称
   */
  customerName?: string;

  /**
   * SQL语句
   */
  sql?: string;

  /**
   * 创建时间
   */
  createTime?: Date;

  /**
   * 序列号
   */
  seqNo?: number;
}

/**
 * README API响应
 */
export interface ReadmeApiResponse {
  success: boolean;
  data: ReadmeEntity;
  message: string;
}