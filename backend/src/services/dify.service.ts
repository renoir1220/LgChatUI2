import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';

interface DifyChatRequest {
  inputs: Record<string, any>;
  query: string;
  response_mode: 'streaming' | 'blocking';
  conversation_id?: string;
  user: string;
}

interface DifyChatResponse {
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  created_at: number;
}

interface DifyStreamResponse {
  event:
    | 'message'
    | 'agent_message'
    | 'message_end'
    | 'agent_thought'
    | 'message_file'
    | 'message_replace'
    | 'error';
  message_id?: string;
  conversation_id?: string;
  answer?: string;
  created_at?: number;
}

@Injectable()
export class DifyService {
  constructor(private configService: ConfigService) {}

  /**
   * 调用Dify聊天API，支持流式响应
   */
  async chatWithStreaming(
    message: string,
    user: string,
    knowledgeBaseId?: string,
    conversationId?: string,
  ): Promise<ReadableStream<Uint8Array> | null> {
    const apiKey = this.getKnowledgeBaseApiKey(knowledgeBaseId);
    const apiUrl = this.getKnowledgeBaseApiUrl(knowledgeBaseId);

    if (!apiKey || !apiUrl) {
      throw new Error('Knowledge base configuration not found');
    }

    const requestData: DifyChatRequest = {
      inputs: {},
      query: message,
      response_mode: 'streaming',
      user: user,
      ...(conversationId && { conversation_id: conversationId }),
    };

    try {
      const response = await axios.post(
        `${apiUrl}/chat-messages`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        },
      );

      return response.data as ReadableStream<Uint8Array>;
    } catch (error) {
      console.error('Dify API error:', error);
      throw new Error('Failed to call Dify API');
    }
  }

  /**
   * 阻塞式聊天API调用（非流式）
   */
  async chat(
    message: string,
    user: string,
    knowledgeBaseId?: string,
    conversationId?: string,
  ): Promise<DifyChatResponse> {
    const apiKey = this.getKnowledgeBaseApiKey(knowledgeBaseId);
    const apiUrl = this.getKnowledgeBaseApiUrl(knowledgeBaseId);

    if (!apiKey || !apiUrl) {
      throw new Error('Knowledge base configuration not found');
    }

    const requestData: DifyChatRequest = {
      inputs: {},
      query: message,
      response_mode: 'blocking',
      user: user,
      ...(conversationId && { conversation_id: conversationId }),
    };

    try {
      const response: AxiosResponse<DifyChatResponse> = await axios.post(
        `${apiUrl}/chat-messages`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Dify API error:', error);
      throw new Error('Failed to call Dify API');
    }
  }

  /**
   * 根据知识库ID获取API Key
   */
  private getKnowledgeBaseApiKey(knowledgeBaseId?: string): string | undefined {
    if (!knowledgeBaseId) {
      return this.configService.get('KB_1_API_KEY'); // 默认使用第一个知识库
    }

    // 根据知识库ID解析配置项
    const kbNumber = this.extractKnowledgeBaseNumber(knowledgeBaseId);
    return this.configService.get(`KB_${kbNumber}_API_KEY`);
  }

  /**
   * 根据知识库ID获取API URL
   */
  private getKnowledgeBaseApiUrl(knowledgeBaseId?: string): string | undefined {
    if (!knowledgeBaseId) {
      return this.configService.get('KB_1_URL'); // 默认使用第一个知识库
    }

    // 根据知识库ID解析配置项
    const kbNumber = this.extractKnowledgeBaseNumber(knowledgeBaseId);
    return this.configService.get(`KB_${kbNumber}_URL`);
  }

  /**
   * 从知识库ID中提取编号
   */
  private extractKnowledgeBaseNumber(knowledgeBaseId: string): number {
    const match = knowledgeBaseId.match(/kb-(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  /**
   * 解析Dify流式响应数据
   */
  parseDifyStreamLine(line: string): DifyStreamResponse | null {
    try {
      if (line.startsWith('data: ')) {
        const jsonStr = line.substring(6);
        if (jsonStr.trim() === '[DONE]') {
          return null;
        }
        return JSON.parse(jsonStr) as DifyStreamResponse;
      }
      return null;
    } catch (error) {
      console.error('Error parsing Dify stream line:', error);
      return null;
    }
  }
}