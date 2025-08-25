import { apiPost, apiGet, apiPut, apiDelete } from '../../shared/services/api';
import type {
  Bug,
  CreateBugRequest,
  UpdateBugRequest,
  BugQuery,
  BugListResponse,
  FileUploadResponse,
} from "@types";

/**
 * BUG管理API服务
 */
export const bugService = {
  /**
   * 创建BUG
   */
  async createBug(data: CreateBugRequest): Promise<Bug> {
    return apiPost<Bug>('/api/bugs', data);
  },

  /**
   * 查询BUG列表
   */
  async getBugs(query: BugQuery): Promise<BugListResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    const path = queryString ? `/api/bugs?${queryString}` : '/api/bugs';
    
    return apiGet<BugListResponse>(path);
  },

  /**
   * 获取BUG详情
   */
  async getBugById(bugId: string): Promise<Bug> {
    return apiGet<Bug>(`/api/bugs/${bugId}`);
  },

  /**
   * 更新BUG
   */
  async updateBug(bugId: string, data: UpdateBugRequest): Promise<void> {
    return apiPut<void>(`/api/bugs/${bugId}`, data);
  },

  /**
   * 删除BUG
   */
  async deleteBug(bugId: string): Promise<void> {
    return apiDelete<void>(`/api/bugs/${bugId}`);
  },

  /**
   * 分配BUG给开发者
   */
  async assignBug(bugId: string, assigneeId: string, assigneeName: string): Promise<void> {
    return apiPut<void>(`/api/bugs/${bugId}/assign`, { assigneeId, assigneeName });
  },

  /**
   * 上传BUG相关图片
   */
  async uploadImages(files: File[]): Promise<FileUploadResponse[]> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await fetch('/api/bugs/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '上传图片失败' }));
      throw new Error(error.message || '上传图片失败');
    }

    return response.json();
  },
};