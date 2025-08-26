import { z } from 'zod';

/**
 * 客户字典项
 */
export interface CustomerDictItem {
  /** 客户ID */
  customerId: string;
  /** 客户名称 */
  customerName: string;
  /** 拼音码，用于前端过滤 */
  pyCode: string;
}

/**
 * 客户字典响应
 */
export interface CustomerDictResponse {
  /** 客户字典列表 */
  customers: CustomerDictItem[];
  /** 总数 */
  total: number;
}

/**
 * 客户字典项的Zod Schema
 */
export const CustomerDictItemSchema = z.object({
  customerId: z.string().min(1, '客户ID不能为空'),
  customerName: z.string().min(1, '客户名称不能为空'),
  pyCode: z.string().min(1, '拼音码不能为空'),
});

/**
 * 客户字典响应的Zod Schema
 */
export const CustomerDictResponseSchema = z.object({
  customers: z.array(CustomerDictItemSchema),
  total: z.number().min(0),
});

/**
 * 客户字典查询参数
 */
export interface CustomerDictQuery {
  /** 搜索关键词（可选），支持客户名称或拼音码模糊搜索 */
  keyword?: string;
  /** 页码，默认1 */
  page?: number;
  /** 每页数量，默认50 */
  pageSize?: number;
}

/**
 * 客户字典查询参数的Zod Schema
 * 支持URL查询参数的字符串到数字自动转换
 */
export const CustomerDictQuerySchema = z.object({
  keyword: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val >= 1 && Number.isInteger(val)), {
      message: '页码必须是大于等于1的整数',
    }),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine(
      (val) =>
        val === undefined || (val >= 1 && val <= 200 && Number.isInteger(val)),
      {
        message: '每页数量必须是1-200之间的整数',
      },
    ),
});
