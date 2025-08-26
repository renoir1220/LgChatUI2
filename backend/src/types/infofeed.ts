/**
 * 信息流相关类型定义
 *
 * 此文件定义了信息流功能中使用的所有数据类型和接口
 */

/**
 * 信息流分类枚举
 */
export enum InfoFeedCategory {
  ALL = 'all',
  RELATED = 'related',
  NEWS = 'news',
  FEATURES = 'features',
  KNOWLEDGE = 'knowledge',
}

/**
 * 信息流来源枚举
 */
export enum InfoFeedSource {
  MANUAL = 'manual', // 人工添加
  AUTO = 'auto', // 自动采集
}

/**
 * 信息流状态枚举
 */
export enum InfoFeedStatus {
  DRAFT = 'draft', // 草稿
  PUBLISHED = 'published', // 已发布
  ARCHIVED = 'archived', // 已归档
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
  author_id?: string | number; // 兼容 AI_CONVERSATIONS 的 user_用户名 格式
  view_count: number;
  like_count: number;
  comment_count: number;
  is_pinned: boolean;
  status: InfoFeedStatus;
  publish_time: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * 信息流评论接口
 */
export interface InfoFeedComment {
  id: number;
  feed_id: number;
  user_id: string; // 统一使用 user_用户名 形式
  parent_id?: number;
  content: string;
  like_count: number;
  created_at: Date;
  updated_at: Date;
  // 关联数据
  user?: {
    id: number;
    username: string;
    avatar?: string;
  };
  // 子评论（用于回复功能）
  replies?: InfoFeedComment[];
}

/**
 * 信息流点赞接口
 */
export interface InfoFeedLike {
  id: number;
  feed_id?: number;
  comment_id?: number;
  user_id: string; // 统一使用 user_用户名 形式
  created_at: Date;
}

/**
 * 信息流列表查询参数
 */
export interface InfoFeedListQuery {
  category?: InfoFeedCategory;
  user_id?: number; // 用于"与我有关"分类
  page?: number;
  limit?: number;
  order_by?: 'publish_time' | 'view_count' | 'like_count';
  order_direction?: 'ASC' | 'DESC';
}

/**
 * 信息流详情响应（包含是否点赞状态）
 */
export interface InfoFeedDetailResponse extends InfoFeed {
  is_liked: boolean; // 当前用户是否已点赞
  comments?: InfoFeedComment[];
}

/**
 * 评论详情响应（包含是否点赞状态）
 */
export interface InfoFeedCommentResponse extends InfoFeedComment {
  is_liked: boolean; // 当前用户是否已点赞此评论
}

/**
 * 点赞操作响应
 */
export interface InfoFeedLikeResponse {
  success: boolean;
  is_liked: boolean; // 操作后的点赞状态
  like_count: number; // 操作后的点赞数量
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
  publish_time?: Date;
}

/**
 * 更新信息流的请求数据
 */
export interface UpdateInfoFeedRequest extends Partial<CreateInfoFeedRequest> {
  id: number;
}

/**
 * 创建评论的请求数据
 */
export interface CreateCommentRequest {
  feed_id: number;
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
 * 信息流列表响应
 */
export interface InfoFeedListResponse extends PaginatedResponse<InfoFeed> {}

/**
 * 评论列表响应
 */
export interface InfoFeedCommentListResponse
  extends PaginatedResponse<InfoFeedCommentResponse> {}

/**
 * 信息流API响应基础接口
 */
export interface InfoFeedApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * 信息流统计数据
 */
export interface InfoFeedStats {
  total_feeds: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  category_stats: {
    [key in InfoFeedCategory]: number;
  };
}

/**
 * 缩略图提取结果
 */
export interface ThumbnailExtractionResult {
  url?: string;
  alt_text?: string;
  from_content: boolean; // 是否从内容中提取
}
