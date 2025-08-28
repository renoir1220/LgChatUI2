import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import { LgChatUIDatabaseService } from '../database/database.service';

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
  metadata?: {
    retriever_resources?: Array<{
      position: number;
      dataset_id: string;
      dataset_name: string;
      document_id: string;
      document_name: string;
      data_source_type: string;
      segment_id: string;
      retriever_from: string;
      score: number;
      hit_count: number;
      word_count: number;
      segment_position: number;
      index_node_hash: string;
      content: string;
      page?: number | null;
      doc_metadata?: any;
      title?: string | null;
    }>;
  };
}

@Injectable()
export class DifyService {
  constructor(
    private configService: ConfigService,
    private readonly db: LgChatUIDatabaseService,
  ) {}

  /**
   * 调用Dify聊天API，支持流式响应
   */
  async chatWithStreaming(
    message: string,
    user: string,
    knowledgeBaseId?: string,
    conversationId?: string,
    modelId?: string,
    username?: string,
  ): Promise<NodeJS.ReadableStream | null> {
    console.log('DifyService: 开始处理流式聊天请求');
    console.log('参数: message:', message?.substring(0, 50) + '...');
    console.log('参数: user:', user);
    console.log('参数: knowledgeBaseId:', knowledgeBaseId);
    console.log('参数: conversationId:', conversationId);

    const config = await this.getKnowledgeBaseConfig(knowledgeBaseId);

    if (!config) {
      const errorMsg = `Knowledge base configuration not found for knowledgeBaseId: ${knowledgeBaseId}`;
      console.error('DifyService错误:', errorMsg);
      throw new Error(errorMsg);
    }

    const { apiKey, apiUrl } = config as any;
    console.log(
      '解析到的配置: apiKey:',
      apiKey ? `...${apiKey.slice(-4)}` : '未获取',
    );
    console.log('解析到的配置: apiUrl:', apiUrl);

    const requestData: DifyChatRequest = {
      inputs: {},
      query: message,
      response_mode: 'streaming',
      user: user,
      ...(conversationId && { conversation_id: conversationId }),
    };

    // 若传入 modelId，则解析并写入 inputs.model_name；否则不设置
    if (modelId) {
      const override = await this.resolveModelOverride(modelId, username);
      if (override) {
        (requestData.inputs as any).model_name = override.modelName;
        console.log('[DifyService] 传入 modelId，设置 inputs.model_name', {
          model: override.modelName,
          username,
        });
      } else {
        console.log('[DifyService] 传入了 modelId 但未解析到可用模型，忽略', { username });
      }
    }

    // 打印入参（已脱敏）
    try {
      const debugPayload = {
        inputs: requestData.inputs,
        queryPreview: message?.slice(0, 60),
        response_mode: requestData.response_mode,
        conversation_id: conversationId,
        user,
      };
      console.log('[DifyService] 请求入参（脱敏）', JSON.stringify(debugPayload));
    } catch {}

    try {
      // 打印将要发送给 Dify 的“原始请求体 JSON”（不包含敏感 header）
      try {
        const rawBody = JSON.stringify(requestData);
        console.log('[DifyService] RAW POST /chat-messages body:', rawBody);
        console.log('[DifyService] POST URL:', `${apiUrl}/chat-messages`);
      } catch {}

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
        const axiosError = error as {
          response: { status: number; headers: unknown; data: unknown };
        };
        console.error('Dify API response status:', axiosError.response.status);
        console.error(
          'Dify API response headers:',
          axiosError.response.headers,
        );
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
    modelId?: string,
    username?: string,
  ): Promise<DifyChatResponse> {
    console.log('DifyService: 开始处理阻塞式聊天请求');
    console.log('参数: knowledgeBaseId:', knowledgeBaseId);

    const config = await this.getKnowledgeBaseConfig(knowledgeBaseId);

    if (!config) {
      const errorMsg = `Knowledge base configuration not found for knowledgeBaseId: ${knowledgeBaseId}`;
      console.error('DifyService错误:', errorMsg);
      throw new Error(errorMsg);
    }

    const { apiKey, apiUrl } = config;
    console.log(
      '解析到的配置: apiKey:',
      apiKey ? `...${apiKey.slice(-4)}` : '未获取',
    );
    console.log('解析到的配置: apiUrl:', apiUrl);

    const requestData: DifyChatRequest = {
      inputs: {},
      query: message,
      response_mode: 'blocking',
      user: user,
      ...(conversationId && { conversation_id: conversationId }),
    };

    if (modelId) {
      const override = await this.resolveModelOverride(modelId, username);
      if (override) {
        (requestData.inputs as any).model_name = override.modelName;
      }
    }

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
        const axiosError = error as {
          response: { status: number; headers: unknown; data: unknown };
        };
        console.error('Dify API response status:', axiosError.response.status);
        console.error(
          'Dify API response headers:',
          axiosError.response.headers,
        );
        console.error('Dify API response data:', axiosError.response.data);
      }
      throw new Error('Failed to call Dify API');
    }
  }

  /**
   * 根据知识库ID获取API配置
   * 直接从数据库获取配置信息
   */
  private async getKnowledgeBaseConfig(
    knowledgeBaseId?: string,
  ): Promise<{ apiKey: string; apiUrl: string; name: string; CAN_SELECT_MODEL?: boolean } | null> {
    console.log('getKnowledgeBaseConfig: knowledgeBaseId =', knowledgeBaseId);

    try {
      let rows;

      if (!knowledgeBaseId) {
        // 如果没有指定知识库，获取第一个启用的知识库
        rows = await this.db.queryWithErrorHandling<{
          API_KEY: string;
          API_URL: string;
          NAME: string;
          CAN_SELECT_MODEL: boolean;
        }>(
          `SELECT TOP 1 API_KEY, API_URL, NAME, CAN_SELECT_MODEL 
           FROM AI_KNOWLEDGE_BASES 
           WHERE ENABLED = 1 
           ORDER BY SORT_ORDER ASC`,
          [],
          '获取默认知识库配置',
        );
      } else {
        // 根据ID获取知识库配置
        rows = await this.db.queryWithErrorHandling<{
          API_KEY: string;
          API_URL: string;
          NAME: string;
          CAN_SELECT_MODEL: boolean;
        }>(
          `SELECT API_KEY, API_URL, NAME, CAN_SELECT_MODEL 
           FROM AI_KNOWLEDGE_BASES 
           WHERE KB_KEY = @p0 AND ENABLED = 1`,
          [knowledgeBaseId],
          '根据ID获取知识库配置',
        );
      }

      if (rows.length === 0) {
        console.error('未找到知识库配置:', knowledgeBaseId);
        return null;
      }

      const config = rows[0];
      console.log('获取到知识库配置:', config.NAME);

      return {
        apiKey: config.API_KEY,
        apiUrl: config.API_URL,
        name: config.NAME,
        CAN_SELECT_MODEL: (config as any).CAN_SELECT_MODEL,
      } as any;
    } catch (error) {
      console.error('获取知识库配置失败:', error.message);
      return null;
    }
  }

  // 解析模型覆盖：优先使用 modelId；否则使用用户可见的默认模型
  private async resolveModelOverride(
    modelId?: string,
    username?: string,
  ): Promise<{ provider: string; modelName: string } | null> {
    try {
      if (modelId) {
        const rows = await this.db.queryWithErrorHandling<{
          ID: string; PROVIDER: string; MODEL_NAME: string; AVAILABLE_USERS: string | null; ENABLED: boolean;
        }>(
          `SELECT ID, PROVIDER, MODEL_NAME, AVAILABLE_USERS, ENABLED FROM AI_MODEL WHERE ID = @p0`,
          [modelId],
          '根据ID获取模型(覆盖)'
        );
        const row = rows[0];
        if (row && row.ENABLED) {
          if (!row.AVAILABLE_USERS || !username) {
            return { provider: row.PROVIDER, modelName: row.MODEL_NAME };
          }
          const list = row.AVAILABLE_USERS.split(',').map((x) => x.trim());
          if (list.includes(username)) {
            return { provider: row.PROVIDER, modelName: row.MODEL_NAME };
          }
        }
      }

      // 无 modelId 或不可用时，回退用户可见默认模型
      const defaults = await this.db.queryWithErrorHandling<{
        PROVIDER: string; MODEL_NAME: string; AVAILABLE_USERS: string | null;
      }>(
        `SELECT TOP 1 PROVIDER, MODEL_NAME, AVAILABLE_USERS
         FROM AI_MODEL 
         WHERE ENABLED = 1 AND IS_DEFAULT = 1
         ORDER BY SORT_ORDER ASC, PROVIDER ASC, MODEL_NAME ASC`,
        [],
        '获取默认模型(覆盖)'
      );
      const def = defaults[0];
      if (!def) return null;
      if (!def.AVAILABLE_USERS || !username) {
        return { provider: def.PROVIDER, modelName: def.MODEL_NAME };
      }
      const list = def.AVAILABLE_USERS.split(',').map((x) => x.trim());
      return list.includes(username)
        ? { provider: def.PROVIDER, modelName: def.MODEL_NAME }
        : null;
    } catch (e) {
      console.error('解析模型覆盖失败:', (e as any)?.message || e);
      return null;
    }
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

  /**
   * 获取文件预览流（代理），避免前端使用易过期的签名URL
   */
  async fetchFilePreviewStream(
    fileId: string,
    knowledgeBaseId?: string,
  ): Promise<NodeJS.ReadableStream> {
    const config = await this.getKnowledgeBaseConfig(knowledgeBaseId);
    if (!config) {
      throw new Error('Knowledge base configuration missing');
    }

    const { apiKey, apiUrl } = config;

    const url = `${apiUrl}/files/${fileId}/file-preview`;
    const resp = await axios.get(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      responseType: 'stream',
      validateStatus: () => true,
    });
    if (resp.status >= 200 && resp.status < 300) {
      return resp.data as NodeJS.ReadableStream;
    }
    // 直接抛错由控制器处理
    const err = new Error(
      `Dify file preview failed: ${resp.status}`,
    ) as Error & {
      status?: number;
      data?: any;
    };
    (err as any).status = resp.status;
    (err as any).data = resp.data;
    throw err;
  }
}
