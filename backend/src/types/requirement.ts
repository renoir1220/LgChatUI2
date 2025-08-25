import { z } from 'zod';

/**
 * 需求单基本信息
 * 对应数据库表: [LogeneCrm].[dbo].[BUS_XQ]
 */
export interface RequirementItem {
  /** 需求编号 (XQ_CODE) */
  requirementCode: string;
  /** 站点名称 (SITE_TYPE) */
  siteName: string;
  /** 产品 (PRODUCT_TYPE) */
  product: string;
  /** 需求名称 (xq_name) */
  requirementName: string;
  /** 当前环节 (dhthj_name) */
  currentStage: string;
  /** 需求描述 (CONTENT) */
  content: string;
  /** 需求评估 (XQPG_YHGS) */
  requirementEvaluation: string;
  /** 设计内容 (XQSJ_SJNR) */
  designContent: string;
  /** 产品说明 (CPYZ_cp_README) */
  productDescription: string;
  /** 研发说明 (CPYZ_yf_README) */
  developmentDescription: string;
  /** 创建人 (CREATE_USER_NAME) */
  creator: string;
  /** 相关客户 (CUSTOMER_NAME) */
  customerName: string;
  /** 版本号 (YFFP_VERSION_NAME) */
  versionName: string;
  /** 提交日期 (create_time) */
  createDate: string;
  /** 最后更新日期 (LAST_UPDATE_TIME) */
  lastUpdateDate: string;
}

/**
 * 需求单列表响应
 */
export interface RequirementListResponse {
  /** 需求单列表 */
  requirements: RequirementItem[];
  /** 总数 */
  total: number;
}

/**
 * 需求单查询参数
 */
export interface RequirementQuery {
  /** 需求编号（精确匹配） */
  requirementCode?: string;
  /** 站点名称（模糊搜索） */
  siteName?: string;
  /** 产品（模糊搜索） */
  product?: string;
  /** 需求名称（模糊搜索） */
  requirementName?: string;
  /** 当前环节（模糊搜索） */
  currentStage?: string;
  /** 创建人（模糊搜索） */
  creator?: string;
  /** 相关客户（模糊搜索） */
  customerName?: string;
  /** 版本号（模糊搜索） */
  versionName?: string;
  /** 提交日期范围 - 开始日期 (YYYY-MM-DD) */
  createDateStart?: string;
  /** 提交日期范围 - 结束日期 (YYYY-MM-DD) */
  createDateEnd?: string;
  /** 最后更新日期范围 - 开始日期 (YYYY-MM-DD) */
  lastUpdateDateStart?: string;
  /** 最后更新日期范围 - 结束日期 (YYYY-MM-DD) */
  lastUpdateDateEnd?: string;
  /** 页码，默认1 */
  page?: number;
  /** 每页数量，默认20 */
  pageSize?: number;
}

/**
 * 需求单详情
 * 包含完整的需求单信息，可能包含额外的计算字段
 */
export interface RequirementDetail extends RequirementItem {
  /** 需求状态（基于当前环节计算） */
  status?: 'planning' | 'designing' | 'developing' | 'testing' | 'released' | 'closed';
  /** 优先级（可能基于产品类型和客户重要性计算） */
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  /** 进度百分比（基于当前环节计算） */
  progress?: number;
}

/**
 * 需求单简化版本（用于选择器组件）
 */
export interface RequirementOption {
  /** 需求编号 */
  requirementCode: string;
  /** 需求名称 */
  requirementName: string;
  /** 产品 */
  product: string;
  /** 当前环节 */
  currentStage: string;
}

/**
 * 需求单统计信息
 */
export interface RequirementStats {
  /** 总需求数 */
  total: number;
  /** 各环节统计 */
  stageStats: {
    stageName: string;
    count: number;
    percentage: number;
  }[];
  /** 各产品统计 */
  productStats: {
    productName: string;
    count: number;
    percentage: number;
  }[];
  /** 本月新增需求数 */
  monthlyNew: number;
  /** 本月完成需求数 */
  monthlyCompleted: number;
}

// ===== Zod 校验模式 =====

/**
 * 需求单基本信息的 Zod Schema
 */
export const RequirementItemSchema = z.object({
  requirementCode: z.string().min(1, '需求编号不能为空'),
  siteName: z.string().default(''),
  product: z.string().default(''),
  requirementName: z.string().default(''),
  currentStage: z.string().default(''),
  content: z.string().default(''),
  requirementEvaluation: z.string().default(''),
  designContent: z.string().default(''),
  productDescription: z.string().default(''),
  developmentDescription: z.string().default(''),
  creator: z.string().default(''),
  customerName: z.string().default(''),
  versionName: z.string().default(''),
  createDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为 YYYY-MM-DD'),
  lastUpdateDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为 YYYY-MM-DD'),
});

/**
 * 需求单列表响应的 Zod Schema
 */
export const RequirementListResponseSchema = z.object({
  requirements: z.array(RequirementItemSchema),
  total: z.number().min(0),
});

/**
 * 需求单查询参数的 Zod Schema
 * 支持URL查询参数的字符串到数字自动转换
 */
export const RequirementQuerySchema = z.object({
  requirementCode: z.string().optional(),
  siteName: z.string().optional(),
  product: z.string().optional(),
  requirementName: z.string().optional(),
  currentStage: z.string().optional(),
  creator: z.string().optional(),
  customerName: z.string().optional(),
  versionName: z.string().optional(),
  createDateStart: z
    .string()
    .optional()
    .refine(
      val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
      { message: '开始日期格式必须为 YYYY-MM-DD' }
    ),
  createDateEnd: z
    .string()
    .optional()
    .refine(
      val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
      { message: '结束日期格式必须为 YYYY-MM-DD' }
    ),
  lastUpdateDateStart: z
    .string()
    .optional()
    .refine(
      val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
      { message: '最后更新开始日期格式必须为 YYYY-MM-DD' }
    ),
  lastUpdateDateEnd: z
    .string()
    .optional()
    .refine(
      val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
      { message: '最后更新结束日期格式必须为 YYYY-MM-DD' }
    ),
  page: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : undefined)
    .refine(val => val === undefined || (val >= 1 && Number.isInteger(val)), {
      message: '页码必须是大于等于1的整数',
    }),
  pageSize: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : undefined)
    .refine(val => val === undefined || (val >= 1 && val <= 200 && Number.isInteger(val)), {
      message: '每页数量必须是1-200之间的整数',
    }),
});

/**
 * 需求单详情的 Zod Schema
 */
export const RequirementDetailSchema = RequirementItemSchema.extend({
  status: z.enum(['planning', 'designing', 'developing', 'testing', 'released', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  progress: z.number().min(0).max(100).optional(),
});

/**
 * 需求单选项的 Zod Schema
 */
export const RequirementOptionSchema = z.object({
  requirementCode: z.string().min(1, '需求编号不能为空'),
  requirementName: z.string().min(1, '需求名称不能为空'),
  product: z.string().min(1, '产品不能为空'),
  currentStage: z.string().min(1, '当前环节不能为空'),
});

/**
 * 需求单统计信息的 Zod Schema
 */
export const RequirementStatsSchema = z.object({
  total: z.number().min(0),
  stageStats: z.array(z.object({
    stageName: z.string().min(1),
    count: z.number().min(0),
    percentage: z.number().min(0).max(100),
  })),
  productStats: z.array(z.object({
    productName: z.string().min(1),
    count: z.number().min(0),
    percentage: z.number().min(0).max(100),
  })),
  monthlyNew: z.number().min(0),
  monthlyCompleted: z.number().min(0),
});