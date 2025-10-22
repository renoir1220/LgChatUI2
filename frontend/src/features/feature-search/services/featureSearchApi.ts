import { apiPost, ApiError } from '../../shared/services/api';
import type {
  FeatureSearchResult,
  FeatureSearchResponse,
} from '../types';

interface SearchGroup {
  or: string[];
}

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
    { keywordGroups },
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
