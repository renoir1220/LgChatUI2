/**
 * 信息流相关类型定义（前端）
 * 
 * 与后端类型保持一致，但针对前端使用做了适配
 */

/**
 * 信息流分类枚举
 */
export enum InfoFeedCategory {
  ALL = 'all',
  RELATED = 'related',
  NEWS = 'news',
  FEATURES = 'features',
  KNOWLEDGE = 'knowledge'
}

/**
 * 信息流来源枚举
 */
export enum InfoFeedSource {
  MANUAL = 'manual',    // 人工添加
  AUTO = 'auto'        // 自动采集
}

/**
 * 信息流状态枚举
 */
export enum InfoFeedStatus {
  DRAFT = 'draft',        // 草稿
  PUBLISHED = 'published', // 已发布
  ARCHIVED = 'archived'   // 已归档
}

/**
 * 信息流基础接口
 */
export interface InfoFeed {
  id: number;
  title: string;
  content: string;
  summary?: string;
  category: InfoFeedCategory;
  thumbnail_url?: string;
  source: InfoFeedSource;
  author_id?: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_pinned: boolean;
  status: InfoFeedStatus;
  publish_time: string; // 前端使用字符串格式
  created_at: string;
  updated_at: string;
}

/**
 * 信息流详情响应（包含是否点赞状态）
 */
export interface InfoFeedDetailResponse extends InfoFeed {
  is_liked: boolean;   // 当前用户是否已点赞
}

/**
 * 信息流评论接口
 */
export interface InfoFeedComment {
  id: number;
  feed_id: number;
  user_id: number;
  parent_id?: number;
  content: string;
  like_count: number;
  created_at: string;
  updated_at: string;
  // 关联数据
  user?: {
    id: number;
    username: string;
    avatar?: string;
  };
  // 子评论（用于回复功能）
  replies?: InfoFeedComment[];
  // 前端扩展字段
  is_liked?: boolean;   // 当前用户是否已点赞此评论
}

/**
 * 信息流列表查询参数
 */
export interface InfoFeedListQuery {
  category?: InfoFeedCategory;
  user_id?: number;
  page?: number;
  limit?: number;
  order_by?: 'publish_time' | 'view_count' | 'like_count';
  order_direction?: 'ASC' | 'DESC';
}

/**
 * 点赞操作响应
 */
export interface InfoFeedLikeResponse {
  success: boolean;
  is_liked: boolean;   // 操作后的点赞状态
  like_count: number;  // 操作后的点赞数量
}

/**
 * 创建信息流的请求数据
 */
export interface CreateInfoFeedRequest {
  title: string;
  content: string;
  summary?: string;
  category: InfoFeedCategory;
  thumbnail_url?: string;
  source?: InfoFeedSource;
  is_pinned?: boolean;
  status?: InfoFeedStatus;
  publish_time?: string;
}

/**
 * 创建评论的请求数据
 */
export interface CreateCommentRequest {
  content: string;
  parent_id?: number;
}

/**
 * 分页响应基础接口
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}


/**
 * 信息流分类配置
 */
export interface InfoFeedCategoryConfig {
  key: InfoFeedCategory;
  label: string;
  icon: string;
  color: string;
}

/**
 * 信息流UI状态
 */
export interface InfoFeedUIState {
  selectedCategory: InfoFeedCategory;
  isModalOpen: boolean;
  selectedFeed: InfoFeed | null;
  // 详情导航上下文
  feedList?: InfoFeed[];
  selectedIndex?: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
}

/**
 * 评论UI状态
 */
export interface CommentUIState {
  isLoading: boolean;
  isSubmitting: boolean;
  replyToCommentId: number | null;
  newComment: string;
  error: string | null;
}
