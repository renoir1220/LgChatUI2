// AI消息反馈相关类型定义
import { z } from 'zod';

// 反馈类型枚举
export enum MessageFeedbackType {
  Helpful = 'helpful',
  NotHelpful = 'not_helpful',
  PartiallyHelpful = 'partially_helpful',
}

// 反馈标签枚举（问题类型标签）
export enum FeedbackProblemTag {
  FactualError = '事实错误',
  Incomplete = '信息不完整',
  Irrelevant = '无关回答',
  KnowledgeSourceIssue = '知识源问题',
  Misunderstanding = '理解错误',
  ResponseSpeed = '响应速度',
  FormatIssue = '格式问题',
}

// 反馈标签枚举（优点标签）
export enum FeedbackPositiveTag {
  AccurateDetailed = '准确详细',
  OnPoint = '切中要害',
  RichResources = '资料丰富',
  ExtraInfo = '举一反三',
  ClearLogic = '逻辑清晰',
}

// 基础反馈接口
export interface MessageFeedback {
  id: string;
  messageId: string;
  userId: string;
  conversationId: string;
  feedbackType: MessageFeedbackType;
  rating?: number; // 1-5星评分，可选
  feedbackText?: string; // 详细反馈文本
  feedbackTags?: string[]; // 反馈标签数组
  createdAt: string;
  updatedAt: string;
}

// 创建反馈请求
export interface CreateFeedbackRequest {
  feedbackType: MessageFeedbackType;
  rating?: number;
  feedbackText?: string;
  feedbackTags?: string[];
}

// 更新反馈请求
export interface UpdateFeedbackRequest {
  feedbackType?: MessageFeedbackType;
  rating?: number;
  feedbackText?: string;
  feedbackTags?: string[];
}

// 反馈统计信息
export interface FeedbackStats {
  messageId: string;
  totalFeedbacks: number;
  helpfulCount: number;
  notHelpfulCount: number;
  partiallyHelpfulCount: number;
  averageRating?: number;
  commonTags: string[];
}

// 管理员反馈统计
export interface AdminFeedbackStats {
  totalFeedbacks: number;
  feedbacksByType: Record<MessageFeedbackType, number>;
  averageRating: number;
  commonProblemTags: Array<{ tag: string; count: number }>;
  commonPositiveTags: Array<{ tag: string; count: number }>;
  feedbackTrend: Array<{ date: string; count: number }>;
}

// Zod验证模式
export const MessageFeedbackTypeSchema = z.nativeEnum(MessageFeedbackType);

export const CreateFeedbackRequestSchema = z.object({
  feedbackType: MessageFeedbackTypeSchema,
  rating: z.number().int().min(1).max(5).optional(),
  feedbackText: z.string().max(1000).optional(),
  feedbackTags: z.array(z.string()).max(10).optional(),
});

export const UpdateFeedbackRequestSchema = z.object({
  feedbackType: MessageFeedbackTypeSchema.optional(),
  rating: z.number().int().min(1).max(5).optional(),
  feedbackText: z.string().max(1000).optional(),
  feedbackTags: z.array(z.string()).max(10).optional(),
});

export const MessageFeedbackSchema = z.object({
  id: z.string(),
  messageId: z.string(),
  userId: z.string(),
  conversationId: z.string(),
  feedbackType: MessageFeedbackTypeSchema,
  rating: z.number().int().min(1).max(5).optional(),
  feedbackText: z.string().optional(),
  feedbackTags: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 导出类型
export type CreateFeedbackDto = z.infer<typeof CreateFeedbackRequestSchema>;
export type UpdateFeedbackDto = z.infer<typeof UpdateFeedbackRequestSchema>;

// 预定义标签列表
export const FEEDBACK_PROBLEM_TAGS = Object.values(FeedbackProblemTag);
export const FEEDBACK_POSITIVE_TAGS = Object.values(FeedbackPositiveTag);
export const ALL_FEEDBACK_TAGS = [...FEEDBACK_PROBLEM_TAGS, ...FEEDBACK_POSITIVE_TAGS];