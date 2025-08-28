import { Injectable } from '@nestjs/common';
import { LgChatUIDatabaseService } from '../../../shared/database/database.service';
import { PAGINATION_CONSTANTS } from '../../../shared/constants/pagination.constants';
import { Conversation } from '../../../types';

@Injectable()
export class ConversationsRepository {
  constructor(private readonly db: LgChatUIDatabaseService) {}

  async list(page = 1, pageSize = 20): Promise<Conversation[]> {
    const offset = (page - 1) * pageSize + 1;
    const end = page * pageSize;
    const rows = await this.db.queryWithErrorHandling<Conversation>(
      `WITH C AS (
        SELECT CONVERSATION_ID, TITLE, CREATED_AT,
               ROW_NUMBER() OVER (ORDER BY CREATED_AT DESC) AS rn
        FROM AI_CONVERSATIONS
      )
      SELECT CONVERT(varchar(36), CONVERSATION_ID) AS id,
             TITLE as title,
             CONVERT(varchar(33), CREATED_AT, 126) AS createdAt
      FROM C WHERE rn BETWEEN @p0 AND @p1`,
      [offset, end],
      '获取会话列表',
    );
    return rows;
  }

  async create(title: string): Promise<Conversation> {
    const rows = await this.db.queryWithErrorHandling<Conversation>(
      `DECLARE @id uniqueidentifier = NEWID();
       INSERT INTO AI_CONVERSATIONS (CONVERSATION_ID, TITLE, CREATED_AT)
       VALUES (@id, @p0, GETUTCDATE());
       SELECT CONVERT(varchar(36), @id) AS id, @p0 AS title,
              CONVERT(varchar(33), GETUTCDATE(), 126) AS createdAt;`,
      [title],
      '创建新会话',
    );
    return rows[0];
  }

  // 列出与指定用户相关的会话（根据 USER_ID 字段关联）
  async listByUser(
    userId: string,
    page: number = 1,
    pageSize: number = PAGINATION_CONSTANTS.CONVERSATIONS_PAGE_SIZE,
  ): Promise<Conversation[]> {
    // 使用OFFSET/FETCH语法替代窗口函数，性能更好
    const offset = (page - 1) * pageSize;
    const rows = await this.db.queryWithErrorHandling<any>(
      `SELECT CONVERT(varchar(36), CONVERSATION_ID) AS id,
             TITLE as title,
             KNOWLEDGE_BASE_ID as knowledgeBaseId,
             CONVERT(varchar(36), MODEL_ID) as modelId,
             DIFY_CONVERSATION_ID as difyConversationId,
             CONVERT(varchar(33), CREATED_AT, 126) AS createdAt
      FROM AI_CONVERSATIONS
      WHERE USER_ID = @p0
      ORDER BY CREATED_AT DESC
      OFFSET @p1 ROWS
      FETCH NEXT @p2 ROWS ONLY`,
      [userId, offset, pageSize],
      '获取用户会话列表',
    );
    return rows as Conversation[];
  }

  // 创建新会话（关联用户）
  async createConversation(
    userId: string,
    title: string,
    knowledgeBaseId?: string,
  ): Promise<Conversation> {
    const rows = await this.db.queryWithErrorHandling<any>(
      `DECLARE @id uniqueidentifier = NEWID();
       INSERT INTO AI_CONVERSATIONS (CONVERSATION_ID, USER_ID, TITLE, KNOWLEDGE_BASE_ID, CREATED_AT)
       VALUES (@id, @p0, @p1, @p2, GETUTCDATE());
       SELECT CONVERT(varchar(36), @id) AS id, 
              @p1 AS title,
              @p0 AS userId,
              @p2 AS knowledgeBaseId,
              CONVERT(varchar(33), GETUTCDATE(), 126) AS createdAt;`,
      [userId, title, knowledgeBaseId],
      '创建用户会话',
    );
    return rows[0] as Conversation;
  }

  // 更新会话信息
  async updateConversation(
    conversationId: string,
    updates: {
      title?: string;
      knowledgeBaseId?: string;
      modelId?: string;
      difyConversationId?: string;
    },
  ): Promise<void> {
    const setParts: string[] = [];
    const params: any[] = [];
    let paramIndex = 0;

    if (updates.title !== undefined) {
      setParts.push(`TITLE = @p${paramIndex}`);
      params.push(updates.title);
      paramIndex++;
    }

    if (updates.knowledgeBaseId !== undefined) {
      setParts.push(`KNOWLEDGE_BASE_ID = @p${paramIndex}`);
      params.push(updates.knowledgeBaseId);
      paramIndex++;
    }

    if (updates.modelId !== undefined) {
      setParts.push(`MODEL_ID = ${updates.modelId ? `CONVERT(uniqueidentifier, @p${paramIndex})` : 'NULL'}`);
      if (updates.modelId) {
        params.push(updates.modelId);
        paramIndex++;
      }
    }

    if (updates.difyConversationId !== undefined) {
      setParts.push(`DIFY_CONVERSATION_ID = @p${paramIndex}`);
      params.push(updates.difyConversationId);
      paramIndex++;
    }

    if (setParts.length === 0) {
      return;
    }

    params.push(conversationId);
    const query = `UPDATE AI_CONVERSATIONS SET ${setParts.join(', ')} WHERE CONVERSATION_ID = @p${paramIndex}`;

    await this.db.queryWithErrorHandling(query, params, '更新会话信息');
  }

  // 获取会话的Dify对话ID
  async getDifyConversationId(conversationId: string): Promise<string | null> {
    const rows = await this.db.queryWithErrorHandling<{
      difyConversationId: string | null;
    }>(
      `SELECT DIFY_CONVERSATION_ID as difyConversationId
       FROM AI_CONVERSATIONS
       WHERE CONVERSATION_ID = @p0`,
      [conversationId],
      '获取会话的Dify对话ID',
    );
    return rows.length > 0 ? rows[0].difyConversationId : null;
  }

  // 更新会话的Dify对话ID
  async updateDifyConversationId(
    conversationId: string,
    difyConversationId: string,
  ): Promise<void> {
    await this.db.queryWithErrorHandling(
      `UPDATE AI_CONVERSATIONS 
       SET DIFY_CONVERSATION_ID = @p1
       WHERE CONVERSATION_ID = @p0`,
      [conversationId, difyConversationId],
      '更新会话的Dify对话ID',
    );
  }

  // 删除会话及其所有消息
  async deleteConversation(conversationId: string): Promise<void> {
    await this.db.queryWithErrorHandling(
      `BEGIN TRANSACTION;
       DELETE FROM AI_MESSAGES WHERE CONVERSATION_ID = @p0;
       DELETE FROM AI_CONVERSATIONS WHERE CONVERSATION_ID = @p0;
       COMMIT;`,
      [conversationId],
      '删除会话及相关消息',
    );
  }
}
