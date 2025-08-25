import { apiPost, apiGet } from '../../shared/services/api';
import type { 
  CreateSuggestionRequest, 
  Suggestion,
  SuggestionListResponse,
  SuggestionQuery 
} from "@types";

export const suggestionsApi = {
  /**
   * 创建建议
   */
  async createSuggestion(data: CreateSuggestionRequest): Promise<Suggestion> {
    return apiPost<Suggestion>('/api/suggestions', data);
  },

  /**
   * 获取建议列表
   */
  async getSuggestions(query: SuggestionQuery = { page: 1, pageSize: 10 }): Promise<SuggestionListResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    const path = queryString ? `/api/suggestions?${queryString}` : '/api/suggestions';
    
    return apiGet<SuggestionListResponse>(path);
  },

  /**
   * 获取建议详情
   */
  async getSuggestion(suggestionId: string): Promise<Suggestion> {
    return apiGet<Suggestion>(`/api/suggestions/${suggestionId}`);
  }
};