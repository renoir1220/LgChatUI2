import type { Citation } from '@lg/shared';

/**
 * Citations标签解析结果
 */
export interface CitationParseResult {
  /** 清理后的内容（移除Citations标签） */
  cleanContent: string;
  /** 提取的citation数据 */
  extractedCitations: Citation[];
  /** 是否包含不完整的标签（用于跨chunk处理） */
  hasIncompleteTag: boolean;
}

/**
 * 流式解析citation标签的状态管理器
 */
export class StreamingCitationParser {
  private buffer = '';
  private extractedCitations: Citation[] = [];

  /**
   * 处理新的数据块，解析citation标签
   * @param chunk 新的数据块
   * @returns 解析结果
   */
  processChunk(chunk: string): CitationParseResult {
    // 将新数据添加到缓冲区
    this.buffer += chunk;

    // 使用正则表达式匹配Citations标签（不区分大小写）
    const citationRegex = /<Citations[^>]*>(.*?)<\/Citations>/gs;
    const matches = Array.from(this.buffer.matchAll(citationRegex));
    
    // 添加调试日志
    if (this.buffer.includes('<Citations>')) {
      console.log('🔍 检测到Citations标签:', {
        bufferLength: this.buffer.length,
        matchCount: matches.length,
        bufferPreview: this.buffer.substring(0, 200) + '...'
      });
    }
    
    let cleanContent = this.buffer;
    const newCitations: Citation[] = [];

    // 处理每个匹配的citation标签
    for (const match of matches) {
      const fullMatch = match[0];
      const citationContent = match[1];
      
      try {
        // 尝试解析citation内容为JSON
        const citationData = this.parseCitationContent(citationContent);
        if (citationData) {
          newCitations.push(citationData);
        }
      } catch (error) {
        console.warn('无法解析citation内容:', citationContent, error);
      }

      // 从内容中移除citation标签
      cleanContent = cleanContent.replace(fullMatch, '');
    }

    // 检查是否有不完整的开始标签
    const incompleteStartMatch = cleanContent.match(/<Citations[^>]*>(?![^<]*<\/Citations>)/);
    const hasIncompleteTag = !!incompleteStartMatch;

    if (hasIncompleteTag) {
      // 如果有不完整的标签，只返回完整部分
      const incompleteIndex = incompleteStartMatch!.index!;
      const completeContent = cleanContent.substring(0, incompleteIndex);
      this.buffer = cleanContent.substring(incompleteIndex); // 保留不完整部分到下次处理
      
      // 添加新解析的citations
      this.extractedCitations.push(...newCitations);
      
      return {
        cleanContent: completeContent,
        extractedCitations: [...this.extractedCitations],
        hasIncompleteTag: true,
      };
    } else {
      // 没有不完整标签，清空缓冲区
      this.buffer = '';
      this.extractedCitations.push(...newCitations);
      
      return {
        cleanContent,
        extractedCitations: [...this.extractedCitations],
        hasIncompleteTag: false,
      };
    }
  }

  /**
   * 获取到目前为止所有提取的citations
   */
  getAllCitations(): Citation[] {
    return [...this.extractedCitations];
  }

  /**
   * 重置解析器状态
   */
  reset(): void {
    this.buffer = '';
    this.extractedCitations = [];
  }

  /**
   * 解析citation标签内容
   * @param content citation标签内的内容
   * @returns Citation对象或null
   */
  private parseCitationContent(content: string): Citation | null {
    try {
      // 尝试直接解析为JSON
      const parsed = JSON.parse(content);
      
      // 添加调试日志
      console.log('📝 解析Citations JSON:', {
        success: parsed.success,
        hasData: !!parsed.data,
        dataLength: parsed.data?.length || 0
      });
      
      // 如果是包装格式 {"success": true, "data": "...", "message": "..."}
      if (parsed.success && parsed.data) {
        return {
          source: '知识库检索',
          content: parsed.data,
          document_name: parsed.message || '知识库文档',
          score: 1.0,
          dataset_id: undefined,
          document_id: undefined,
          segment_id: undefined,
          position: 0,
        };
      }
      
      // 如果是直接的citation格式
      return {
        source: parsed.source || parsed.document_name || '未知来源',
        content: parsed.content || parsed.data || '',
        document_name: parsed.document_name,
        score: parsed.score,
        dataset_id: parsed.dataset_id,
        document_id: parsed.document_id,
        segment_id: parsed.segment_id,
        position: parsed.position,
      };
    } catch (error) {
      console.warn('解析Citations JSON失败:', error);
      // 如果不是JSON格式，尝试解析为简单文本格式
      return this.parseSimpleCitationFormat(content);
    }
  }

  /**
   * 解析简单格式的citation内容
   * @param content 简单格式的citation内容
   * @returns Citation对象或null
   */
  private parseSimpleCitationFormat(content: string): Citation | null {
    // 支持简单格式如: "文档名称:内容"
    const simpleMatch = content.match(/^([^:]+):(.+)$/);
    if (simpleMatch) {
      const [, documentName, citationContent] = simpleMatch;
      return {
        source: documentName.trim(),
        content: citationContent.trim(),
        document_name: documentName.trim(),
        score: 0,
        dataset_id: undefined,
        document_id: undefined,
        segment_id: undefined,
        position: 0,
      };
    }

    // 如果都无法解析，返回null
    return null;
  }
}

/**
 * 静态工具函数：解析单个文本中的citation标签
 * @param text 包含citation标签的文本
 * @returns 解析结果
 */
export function parseCitationTags(text: string): CitationParseResult {
  const parser = new StreamingCitationParser();
  return parser.processChunk(text);
}