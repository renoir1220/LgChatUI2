import { z } from 'zod';

/**
 * 建议解决状态枚举
 */
export enum SuggestionStatus {
  NEW = 0,        // 新提交
  RESOLVED = 1,   // 已解决
  REJECTED = 9,   // 不做
}

/**
 * 建议状态标签映射
 */
export const SuggestionStatusLabels = {
  [SuggestionStatus.NEW]: '新提交',
  [SuggestionStatus.RESOLVED]: '已解决',
  [SuggestionStatus.REJECTED]: '不做',
} as const;

/**
 * 建议数据接口
 */
export interface Suggestion {
  id: string;
  submitterName: string;     // 提交人姓名
  title: string;             // 标题
  content: string;           // 建议内容
  developerReply?: string;   // 开发回复
  status: SuggestionStatus;  // 解决状态
  createdAt: string;         // 创建时间
  updatedAt: string;         // 最后更新日期
}

/**
 * 创建建议请求 Schema
 */
export const CreateSuggestionRequestSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题不能超过100字符'),
  content: z.string().min(1, '建议内容不能为空').max(1000, '建议内容不能超过1000字符'),
});

/**
 * 创建建议请求类型
 */
export type CreateSuggestionRequest = z.infer<typeof CreateSuggestionRequestSchema>;

/**
 * 更新建议请求 Schema（管理员用）
 */
export const UpdateSuggestionRequestSchema = z.object({
  developerReply: z.string().optional(),
  status: z.nativeEnum(SuggestionStatus).optional(),
});

/**
 * 更新建议请求类型
 */
export type UpdateSuggestionRequest = z.infer<typeof UpdateSuggestionRequestSchema>;

/**
 * 建议列表查询参数 Schema
 */
export const SuggestionQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  status: z.nativeEnum(SuggestionStatus).optional(),
  submitterName: z.string().optional(),
});

/**
 * 建议列表查询参数类型
 */
export type SuggestionQuery = z.infer<typeof SuggestionQuerySchema>;

/**
 * 建议列表响应接口
 */
export interface SuggestionListResponse {
  suggestions: Suggestion[];
  total: number;
  page: number;
  pageSize: number;
}