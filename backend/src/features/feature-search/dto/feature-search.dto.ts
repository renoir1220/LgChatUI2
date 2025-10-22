/**
 * 功能查询请求DTO
 * 负责将查询参数转换为关键字数组
 */
export class FeatureSearchDto {
  /**
   * 查询关键字，支持以逗号、空格或换行分隔多个词
   */
  keywords?: string | string[];

  /**
   * 将原始输入转换为去重后的关键字数组
   */
  getKeywords(): string[] {
    if (!this.keywords) return [];

    const normalize = (value: string) =>
      value
        .split(/[\s,，；;]+/g)
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0);

    if (typeof this.keywords === 'string') {
      return normalize(this.keywords);
    }

    if (Array.isArray(this.keywords)) {
      const all = this.keywords
        .map((item) => (typeof item === 'string' ? item : String(item)))
        .flatMap((item) => normalize(item));

      return Array.from(new Set(all));
    }

    return [];
  }
}

/**
 * 功能查询结果项
 */
export interface FeatureSearchResult {
  sourceTable: string;
  customerName: string | null;
  moduleName: string | null;
  featureName: string | null;
  productType: string | null;
  releaseNote: string | null;
  parameterSwitch: string | null;
  version: string | null;
  siteType: string | null;
  requirementCode: string | null;
  requirementContent: string | null;
  requirementReview: string | null;
  requirementDesign: string | null;
  createdBy: string | null;
  createdAt: string | null;
  status: string | null;
  publishedAt: string | null;
}

/**
 * 功能查询响应DTO
 */
export interface FeatureSearchResponseDto {
  success: boolean;
  data: {
    items: FeatureSearchResult[];
    total: number;
  };
  message: string;
}
