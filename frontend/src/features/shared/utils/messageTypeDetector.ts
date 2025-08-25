import type { RequirementListResponse } from "@types";

/**
 * 消息类型枚举
 */
export enum MessageType {
  TEXT = 'text',
  REQUIREMENTS = 'requirements',
  IMAGE = 'image',
  FILE = 'file',
}

/**
 * 解析后的消息数据
 */
export interface ParsedMessageData {
  type: MessageType;
  originalContent: string;
  data?: {
    requirements?: RequirementListResponse;
    customerName?: string;
    queryParams?: Record<string, any>;
  };
}

/**
 * 检测消息类型并解析数据
 * @param content 消息内容
 * @returns 解析后的消息数据
 */
export function detectMessageType(content: string): ParsedMessageData {
  const trimmedContent = content.trim();
  
  // 尝试解析JSON
  try {
    const parsed = JSON.parse(trimmedContent);
    
    // 检测需求列表格式
    if (
      parsed && 
      typeof parsed === 'object' &&
      Array.isArray(parsed.requirements) &&
      typeof parsed.total === 'number'
    ) {
      // 验证需求对象的关键字段
      const hasValidRequirement = parsed.requirements.length === 0 || (
        parsed.requirements[0] &&
        typeof parsed.requirements[0].requirementCode === 'string' &&
        typeof parsed.requirements[0].requirementName === 'string'
      );
      
      if (hasValidRequirement) {
        return {
          type: MessageType.REQUIREMENTS,
          originalContent: content,
          data: {
            requirements: parsed as RequirementListResponse,
          },
        };
      }
    }
  } catch {
    // JSON解析失败，继续其他检测
  }
  
  // 检测图片格式（简单检测）
  if (
    trimmedContent.includes('[图片]') ||
    trimmedContent.includes('data:image/') ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(trimmedContent)
  ) {
    return {
      type: MessageType.IMAGE,
      originalContent: content,
    };
  }
  
  // 检测文件格式（简单检测）
  if (
    trimmedContent.includes('[文件]') ||
    trimmedContent.includes('文件：') ||
    /\.(pdf|doc|docx|txt|xlsx?)$/i.test(trimmedContent)
  ) {
    return {
      type: MessageType.FILE,
      originalContent: content,
    };
  }
  
  // 默认为文本消息
  return {
    type: MessageType.TEXT,
    originalContent: content,
  };
}

/**
 * 从消息内容中提取客户名称（如果有的话）
 * @param content 消息内容
 * @returns 客户名称或undefined
 */
export function extractCustomerName(content: string): string | undefined {
  // 尝试从需求数据中提取
  try {
    const parsed = JSON.parse(content);
    if (parsed.requirements && parsed.requirements.length > 0) {
      return parsed.requirements[0].customerName;
    }
  } catch {
    // 忽略解析错误
  }
  
  // 其他提取逻辑（如果需要）
  return undefined;
}