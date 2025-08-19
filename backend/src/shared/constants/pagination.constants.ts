/**
 * 分页相关常量配置
 * 集中管理所有分页参数，避免硬编码分散
 */

export const PAGINATION_CONSTANTS = {
  /** 默认页面大小 */
  DEFAULT_PAGE_SIZE: 20,

  /** 最大页面大小限制 */
  MAX_PAGE_SIZE: 100,

  /** 消息历史记录页面大小 */
  MESSAGES_PAGE_SIZE: 50,

  /** 会话列表页面大小 */
  CONVERSATIONS_PAGE_SIZE: 20,

  /** 知识库搜索结果页面大小 */
  SEARCH_RESULTS_PAGE_SIZE: 10,
} as const;

/**
 * 流式响应相关常量
 */
export const STREAMING_CONSTANTS = {
  /** SSE连接超时时间（毫秒）*/
  SSE_TIMEOUT_MS: 300000, // 5分钟

  /** 流式缓冲区大小 */
  STREAM_BUFFER_SIZE: 1024,

  /** 错误重试次数 */
  MAX_RETRY_COUNT: 3,
} as const;

/**
 * 缓存相关常量
 */
export const CACHE_CONSTANTS = {
  /** 缓存过期时间（天）*/
  EXPIRE_DAYS: 7,

  /** 数据库连接池大小 */
  DB_POOL_SIZE: 10,

  /** 查询缓存TTL（秒）*/
  QUERY_CACHE_TTL: 300, // 5分钟
} as const;
