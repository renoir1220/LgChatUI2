/**
 * README搜索请求DTO
 * 定义搜索API的输入参数
 */
export class ReadmeSearchDto {
  /**
   * 搜索关键词，支持多个关键词用逗号分隔
   * 例如：keywords=切片,列表,状态
   */
  keywords?: string | string[];

  /**
   * 获取处理后的关键词数组
   */
  getKeywords(): string[] {
    if (!this.keywords) return [];

    // 处理单个字符串转数组的情况
    if (typeof this.keywords === 'string') {
      return this.keywords
        .split(',')
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0);
    }

    // 处理数组情况
    if (Array.isArray(this.keywords)) {
      return this.keywords
        .map((keyword) =>
          typeof keyword === 'string' ? keyword.trim() : String(keyword).trim(),
        )
        .filter((keyword) => keyword.length > 0);
    }

    return [];
  }
}

/**
 * README搜索响应DTO
 * 定义API返回数据的结构
 */
export class ReadmeSearchResponseDto {
  /**
   * 操作是否成功
   */
  success: boolean;

  /**
   * 搜索结果数据
   * 格式化后的README配置信息字符串
   */
  data: string;

  /**
   * 响应消息
   * 包含搜索结果统计或错误信息
   */
  message: string;
}

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
 * README根据ID查询响应DTO
 */
export class ReadmeByIdResponseDto {
  /**
   * 操作是否成功
   */
  success: boolean;

  /**
   * README配置信息对象
   */
  data: ReadmeEntity;

  /**
   * 响应消息
   */
  message: string;
}

