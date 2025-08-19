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
 * 搜索建议响应DTO
 */
export class SearchSuggestionsResponseDto {
  /**
   * 操作是否成功
   */
  success: boolean;

  /**
   * 建议关键词列表
   */
  data: string[];

  /**
   * 响应消息
   */
  message: string;
}
