import { apiPost, apiGet, ApiError } from '../../shared/services/api';
import type {
  FeatureSearchResult,
  FeatureSearchResponse,
  FeatureSearchHistoryItem,
  FeatureSearchPopularItem,
  SearchGroup,
} from '../types';

export function normalizeKeywords(input: string): SearchGroup[] {
  const andGroups = input
    .split(/[\s,，；;]+/)
    .map((group) => group.trim())
    .filter((group) => group.length > 0);

  return andGroups
    .map((andGroup) => {
      const orKeywords = andGroup
        .split(/[?？|｜/／、]+/)
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0);
      return { or: orKeywords.length > 0 ? orKeywords : [andGroup] };
    })
    .filter((group) => group.or.length > 0);
}

export async function searchFeatures(
  rawKeywords: string,
): Promise<FeatureSearchResult[]> {
  const keywordGroups = normalizeKeywords(rawKeywords);

  if (keywordGroups.length === 0) {
    throw new ApiError(400, '请先输入查询关键字', '/api/feature-search');
  }

  const response = await apiPost<FeatureSearchResponse>(
    '/api/feature-search',
    { keywordGroups, rawKeywords },
  );

  if (!response?.success) {
    throw new ApiError(
      500,
      response?.message || '查询失败',
      '/api/feature-search',
    );
  }

  return response.data?.items ?? [];
}

export async function fetchUserHistory(limit = 10): Promise<FeatureSearchHistoryItem[]> {
  const response = await apiGet<{ success: boolean; data: FeatureSearchHistoryItem[] }>(
    `/api/feature-search/history?limit=${limit}`,
  );
  if (!response?.success) {
    throw new ApiError(500, '获取常用查询失败', '/api/feature-search/history');
  }
  return response.data ?? [];
}

export async function fetchPopularQueries(
  limit = 10,
  days = 30,
): Promise<FeatureSearchPopularItem[]> {
  const response = await apiGet<{ success: boolean; data: FeatureSearchPopularItem[] }>(
    `/api/feature-search/popular?limit=${limit}&days=${days}`,
  );
  if (!response?.success) {
    throw new ApiError(500, '获取热门查询失败', '/api/feature-search/popular');
  }
  return response.data ?? [];
}

export async function fetchLatestFeatures(
  days = 7,
  limit = 50,
): Promise<FeatureSearchResult[]> {
  const response = await apiGet<{
    success: boolean;
    data: { items: FeatureSearchResult[] };
  }>(`/api/feature-search/latest?days=${days}&limit=${limit}`);

  if (!response?.success) {
    throw new ApiError(500, '获取最新功能失败', '/api/feature-search/latest');
  }

  return response.data?.items ?? [];
}
