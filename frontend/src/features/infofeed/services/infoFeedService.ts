/**
 * 信息流服务
 * 
 * 处理信息流相关的API调用
 */

import type { 
  InfoFeed, 
  InfoFeedDetailResponse,
  InfoFeedComment,
  InfoFeedListQuery,
  InfoFeedLikeResponse,
  CreateInfoFeedRequest,
  CreateCommentRequest,
  PaginatedResponse
} from '@/types/infofeed';
import type { ApiResponse } from '@/types/api';
import { apiGet, apiPost } from '@/features/shared/services/api';

/**
 * 信息流API服务类
 */
class InfoFeedService {
  private readonly baseUrl = '/api/infofeed';

  /**
   * 获取信息流列表
   */
  async getInfoFeedList(query: InfoFeedListQuery = {}): Promise<PaginatedResponse<InfoFeed>> {
    const params = new URLSearchParams();
    
    // 构建查询参数
    if (query.category) params.append('category', query.category);
    if (query.user_id) params.append('user_id', query.user_id.toString());
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.order_by) params.append('order_by', query.order_by);
    if (query.order_direction) params.append('order_direction', query.order_direction);

    const url = `${this.baseUrl}${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await apiGet<ApiResponse<PaginatedResponse<InfoFeed>>>(url);
    
    if (!response?.success) {
      throw new Error(response?.error || '获取信息流列表失败');
    }
    
    return response.data!;
  }

  /**
   * 获取信息流详情
   */
  async getInfoFeedDetail(id: number): Promise<InfoFeedDetailResponse> {
    const response = await apiGet<ApiResponse<InfoFeedDetailResponse>>(
      `${this.baseUrl}/${id}`
    );
    
    if (!response?.success) {
      throw new Error(response?.error || '获取信息流详情失败');
    }
    
    return response.data!;
  }

  /**
   * 创建信息流
   */
  async createInfoFeed(data: CreateInfoFeedRequest): Promise<InfoFeed> {
    const response = await apiPost<ApiResponse<InfoFeed>>(
      this.baseUrl, 
      data
    );
    
    if (!response?.success) {
      throw new Error(response?.error || '创建信息流失败');
    }
    
    return response.data!;
  }

  /**
   * 信息流点赞/取消点赞
   */
  async toggleInfoFeedLike(id: number): Promise<InfoFeedLikeResponse> {
    const response = await apiPost<ApiResponse<InfoFeedLikeResponse>>(
      `${this.baseUrl}/${id}/like`
    );
    
    if (!response?.success) {
      throw new Error(response?.error || '点赞操作失败');
    }
    
    return response.data!;
  }

  /**
   * 获取信息流评论列表
   */
  async getCommentList(
    feedId: number, 
    page: number = 1, 
    limit: number = 20
  ): Promise<PaginatedResponse<InfoFeedComment>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await apiGet<ApiResponse<PaginatedResponse<InfoFeedComment>>>(
      `${this.baseUrl}/${feedId}/comments?${params}`
    );
    
    if (!response?.success) {
      throw new Error(response?.error || '获取评论列表失败');
    }
    
    return response.data!;
  }

  /**
   * 添加评论
   */
  async createComment(
    feedId: number, 
    data: CreateCommentRequest
  ): Promise<InfoFeedComment> {
    const response = await apiPost<ApiResponse<InfoFeedComment>>(
      `${this.baseUrl}/${feedId}/comments`,
      data
    );
    
    if (!response?.success) {
      throw new Error(response?.error || '添加评论失败');
    }
    
    return response.data!;
  }

  /**
   * 评论点赞/取消点赞
   */
  async toggleCommentLike(commentId: number): Promise<InfoFeedLikeResponse> {
    const response = await apiPost<ApiResponse<InfoFeedLikeResponse>>(
      `${this.baseUrl}/comments/${commentId}/like`
    );
    
    if (!response?.success) {
      throw new Error(response?.error || '评论点赞操作失败');
    }
    
    return response.data!;
  }

  /**
   * 回复评论
   */
  async replyComment(
    commentId: number, 
    content: string
  ): Promise<InfoFeedComment> {
    const response = await apiPost<ApiResponse<InfoFeedComment>>(
      `${this.baseUrl}/comments/${commentId}/reply`,
      { content }
    );
    
    if (!response?.success) {
      throw new Error(response?.error || '回复评论失败');
    }
    
    return response.data!;
  }

  /**
   * 从内容中提取缩略图URL
   */
  extractThumbnailFromContent(content: string): string | null {
    // 匹配Markdown图片语法: ![alt](url)
    const imageRegex = /!\[.*?\]\((.*?)\)/;
    const match = content.match(imageRegex);
    return match ? match[1] : null;
  }

  /**
   * 格式化发布时间
   */
  formatPublishTime(publishTime: string): string {
    const now = new Date();
    const publishDate = new Date(publishTime);
    const diffInSeconds = Math.floor((now.getTime() - publishDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return '刚刚';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}分钟前`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}小时前`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}天前`;
    } else {
      // 超过30天显示具体日期
      return publishDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }

  /**
   * 生成占位符缩略图URL（根据分类）
   */
  getPlaceholderThumbnail(category: string): string {
    const placeholders = {
      'features': 'https://picsum.photos/400/250?random=features',
      'news': 'https://picsum.photos/400/250?random=news',
      'knowledge': 'https://picsum.photos/400/250?random=knowledge',
      'related': 'https://picsum.photos/400/250?random=related',
      'all': 'https://picsum.photos/400/250?random=all'
    };
    
    return placeholders[category as keyof typeof placeholders] || placeholders.all;
  }

  /**
   * 验证URL格式
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// 导出单例实例
export const infoFeedService = new InfoFeedService();