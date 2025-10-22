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

export interface FeatureSearchResponse {
  success: boolean;
  data: {
    items: FeatureSearchResult[];
    total: number;
  };
  message: string;
}

export interface FeatureSearchHistoryItem {
  rawKeywords: string;
  normalizedKeywords: SearchGroup[] | null;
  resultCount: number | null;
  lastUsedAt: string;
}

export interface FeatureSearchPopularItem extends FeatureSearchHistoryItem {
  usageCount: number;
}

export interface SearchGroup {
  or: string[];
}
