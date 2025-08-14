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
  ): Promise<NodeJS.ReadableStream | null> {
    console.log('DifyService: 开始处理流式聊天请求');
    console.log('参数: message:', message?.substring(0, 50) + '...');
    console.log('参数: user:', user);
    console.log('参数: knowledgeBaseId:', knowledgeBaseId);
    console.log('参数: conversationId:', conversationId);

    const apiKey = this.getKnowledgeBaseApiKey(knowledgeBaseId);
    const apiUrl = this.getKnowledgeBaseApiUrl(knowledgeBaseId);

    console.log(
      '解析到的配置: apiKey:',
      apiKey ? `...${apiKey.slice(-4)}` : '未获取',
    );
    console.log('解析到的配置: apiUrl:', apiUrl);

    if (!apiKey || !apiUrl) {
      const errorMsg = `Knowledge base configuration not found for knowledgeBaseId: ${knowledgeBaseId}`;
      console.error('DifyService错误:', errorMsg);
      throw new Error(errorMsg);
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

      return response.data as NodeJS.ReadableStream;
    } catch (error) {
      console.error('Dify API error:', error);
      // 打印详细的错误信息
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; headers: unknown; data: unknown } };
        console.error('Dify API response status:', axiosError.response.status);
        console.error('Dify API response headers:', axiosError.response.headers);
        console.error('Dify API response data:', axiosError.response.data);
      }
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
    console.log('DifyService: 开始处理阻塞式聊天请求');
    console.log('参数: knowledgeBaseId:', knowledgeBaseId);

    const apiKey = this.getKnowledgeBaseApiKey(knowledgeBaseId);
    const apiUrl = this.getKnowledgeBaseApiUrl(knowledgeBaseId);

    console.log(
      '解析到的配置: apiKey:',
      apiKey ? `...${apiKey.slice(-4)}` : '未获取',
    );
    console.log('解析到的配置: apiUrl:', apiUrl);

    if (!apiKey || !apiUrl) {
      const errorMsg = `Knowledge base configuration not found for knowledgeBaseId: ${knowledgeBaseId}`;
      console.error('DifyService错误:', errorMsg);
      throw new Error(errorMsg);
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
      // 打印详细的错误信息
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; headers: unknown; data: unknown } };
        console.error('Dify API response status:', axiosError.response.status);
        console.error('Dify API response headers:', axiosError.response.headers);
        console.error('Dify API response data:', axiosError.response.data);
      }
      throw new Error('Failed to call Dify API');
    }
  }

  /**
   * 根据知识库ID获取API Key
   */
  private getKnowledgeBaseApiKey(knowledgeBaseId?: string): string | undefined {
    console.log('getKnowledgeBaseApiKey: knowledgeBaseId =', knowledgeBaseId);

    if (!knowledgeBaseId) {
      const defaultKey = this.configService.get<string>('KB_1_API_KEY');
      console.log(
        '使用默认知识库 KB_1，API Key:',
        defaultKey ? `...${defaultKey.slice(-4)}` : '未获取',
      );
      return defaultKey;
    }

    // 根据知识库ID解析配置项
    const kbNumber = this.extractKnowledgeBaseNumber(knowledgeBaseId);
    const configKey = `KB_${kbNumber}_API_KEY`;
    const apiKey = this.configService.get<string>(configKey);
    console.log(
      `知识库 ${knowledgeBaseId} 解析为编号 ${kbNumber}，配置项 ${configKey}:`,
      apiKey ? `...${apiKey.slice(-4)}` : '未获取',
    );

    return apiKey;
  }

  /**
   * 根据知识库ID获取API URL
   */
  private getKnowledgeBaseApiUrl(knowledgeBaseId?: string): string | undefined {
    console.log('getKnowledgeBaseApiUrl: knowledgeBaseId =', knowledgeBaseId);

    if (!knowledgeBaseId) {
      const defaultUrl = this.configService.get<string>('KB_1_URL');
      console.log('使用默认知识库 KB_1，URL:', defaultUrl);
      return defaultUrl;
    }

    // 根据知识库ID解析配置项
    const kbNumber = this.extractKnowledgeBaseNumber(knowledgeBaseId);
    const configKey = `KB_${kbNumber}_URL`;
    const apiUrl = this.configService.get<string>(configKey);
    console.log(
      `知识库 ${knowledgeBaseId} 解析为编号 ${kbNumber}，配置项 ${configKey}:`,
      apiUrl,
    );

    return apiUrl;
  }

  /**
   * 从知识库ID中提取编号
   */
  private extractKnowledgeBaseNumber(knowledgeBaseId: string): number {
    console.log('extractKnowledgeBaseNumber: 输入 =', knowledgeBaseId);

    const match = knowledgeBaseId.match(/kb-(\d+)/);
    const number = match ? parseInt(match[1], 10) : 1;

    console.log('extractKnowledgeBaseNumber: 提取到编号 =', number);
    return number;
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
