import { z } from 'zod';

/**
 * BUG状态枚举
 */
export enum BugStatus {
  NEW = 0,        // 新提交
  IN_PROGRESS = 1, // 处理中
  RESOLVED = 2,   // 已解决
  REJECTED = 9,   // 不做
}

/**
 * BUG优先级枚举
 */
export enum BugPriority {
  LOW = 1,      // 低
  MEDIUM = 2,   // 中
  HIGH = 3,     // 高
  CRITICAL = 4, // 紧急
}

/**
 * BUG状态标签映射
 */
export const BugStatusLabels = {
  [BugStatus.NEW]: '新提交',
  [BugStatus.IN_PROGRESS]: '处理中',
  [BugStatus.RESOLVED]: '已解决',
  [BugStatus.REJECTED]: '不做',
} as const;

/**
 * BUG优先级标签映射
 */
export const BugPriorityLabels = {
  [BugPriority.LOW]: '低',
  [BugPriority.MEDIUM]: '中',
  [BugPriority.HIGH]: '高',
  [BugPriority.CRITICAL]: '紧急',
} as const;

/**
 * BUG数据接口
 */
export interface Bug {
  id: string;                // BUG编号 (主键)
  title: string;             // 标题
  content: string;           // BUG描述内容
  submitterName: string;     // 提交人姓名
  assigneeId?: string;       // 指派人ID (可选)
  assigneeName?: string;     // 指派人姓名 (可选)
  priority: BugPriority;     // 优先级
  status: BugStatus;         // 状态
  images: string[];          // 图片URL列表 (最多5张)
  developerReply?: string;   // 开发回复
  createdAt: string;         // 创建时间
  updatedAt: string;         // 最后更新时间
}

/**
 * 创建BUG请求 Schema
 */
export const CreateBugRequestSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  content: z.string().min(1, 'BUG描述不能为空').max(2000, 'BUG描述不能超过2000字符'),
  priority: z.nativeEnum(BugPriority).default(BugPriority.MEDIUM),
  images: z.array(z.string()).max(5, '最多只能上传5张图片').default([]),
});

/**
 * 创建BUG请求类型
 */
export type CreateBugRequest = z.infer<typeof CreateBugRequestSchema>;

/**
 * 更新BUG请求 Schema (管理员/开发者用)
 */
export const UpdateBugRequestSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符').optional(),
  content: z.string().min(1, 'BUG描述不能为空').max(2000, 'BUG描述不能超过2000字符').optional(),
  assigneeId: z.string().optional(),
  assigneeName: z.string().optional(),
  priority: z.nativeEnum(BugPriority).optional(),
  status: z.nativeEnum(BugStatus).optional(),
  developerReply: z.string().max(2000, '回复内容不能超过2000字符').optional(),
});

/**
 * 更新BUG请求类型
 */
export type UpdateBugRequest = z.infer<typeof UpdateBugRequestSchema>;

/**
 * BUG列表查询参数 Schema
 */
export const BugQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  status: z.nativeEnum(BugStatus).optional(),
  priority: z.nativeEnum(BugPriority).optional(),
  submitterName: z.string().optional(),
  assigneeId: z.string().optional(),
  title: z.string().optional(), // 标题模糊搜索
});

/**
 * BUG列表查询参数类型
 */
export type BugQuery = z.infer<typeof BugQuerySchema>;

/**
 * BUG列表响应接口
 */
export interface BugListResponse {
  bugs: Bug[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 文件上传响应接口
 */
export interface FileUploadResponse {
  success: boolean;
  url?: string;
  message?: string;
}