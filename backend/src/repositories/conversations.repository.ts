import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Conversation } from '@lg/shared';

@Injectable()
export class ConversationsRepository {
  constructor(private readonly db: DatabaseService) {}

  async list(page = 1, pageSize = 20): Promise<Conversation[]> {
    const offset = (page - 1) * pageSize + 1;
    const end = page * pageSize;
    const rows = await this.db.query<Conversation>(
      `WITH C AS (
        SELECT CONVERSATION_ID, TITLE, CREATED_AT,
               ROW_NUMBER() OVER (ORDER BY CREATED_AT DESC) AS rn
        FROM AI_CONVERSATIONS
      )
      SELECT CONVERT(varchar(36), CONVERSATION_ID) AS id,
             TITLE as title,
             CONVERT(varchar(33), CREATED_AT, 126) AS createdAt
      FROM C WHERE rn BETWEEN @p0 AND @p1`,
      offset,
      end,
    );
    return rows;
  }

  async create(title: string): Promise<Conversation> {
    const rows = await this.db.query<Conversation>(
      `DECLARE @id uniqueidentifier = NEWID();
       INSERT INTO AI_CONVERSATIONS (CONVERSATION_ID, TITLE, CREATED_AT)
       VALUES (@id, @p0, GETUTCDATE());
       SELECT CONVERT(varchar(36), @id) AS id, @p0 AS title,
              CONVERT(varchar(33), GETUTCDATE(), 126) AS createdAt;`,
      title,
    );
    return rows[0];
  }

  // 列出与指定用户相关的会话（根据 USER_ID 字段关联）
  async listByUser(
    userId: string,
    page = 1,
    pageSize = 20,
  ): Promise<Conversation[]> {
    const offset = (page - 1) * pageSize + 1;
    const end = page * pageSize;
    const rows = await this.db.query<any>(
      `WITH C AS (
        SELECT CONVERSATION_ID, TITLE, KNOWLEDGE_BASE_ID, CREATED_AT,
               ROW_NUMBER() OVER (ORDER BY CREATED_AT DESC) AS rn
        FROM AI_CONVERSATIONS
        WHERE USER_ID = @p0
      )
      SELECT CONVERT(varchar(36), CONVERSATION_ID) AS id,
             TITLE as title,
             KNOWLEDGE_BASE_ID as knowledgeBaseId,
             CONVERT(varchar(33), CREATED_AT, 126) AS createdAt
      FROM C WHERE rn BETWEEN @p1 AND @p2`,
      userId,
      offset,
      end,
    );
    return rows as Conversation[];
  }

  // 创建新会话（关联用户）
  async createConversation(
    userId: string,
    title: string,
    knowledgeBaseId?: string,
  ): Promise<Conversation> {
    const rows = await this.db.query<any>(
      `DECLARE @id uniqueidentifier = NEWID();
       INSERT INTO AI_CONVERSATIONS (CONVERSATION_ID, USER_ID, TITLE, KNOWLEDGE_BASE_ID, CREATED_AT)
       VALUES (@id, @p0, @p1, @p2, GETUTCDATE());
       SELECT CONVERT(varchar(36), @id) AS id, 
              @p1 AS title,
              @p0 AS userId,
              @p2 AS knowledgeBaseId,
              CONVERT(varchar(33), GETUTCDATE(), 126) AS createdAt;`,
      userId,
      title,
      knowledgeBaseId,
    );
    return rows[0] as Conversation;
  }

  // 更新会话信息
  async updateConversation(
    conversationId: string,
    updates: { title?: string; knowledgeBaseId?: string }
  ): Promise<void> {
    const setParts = [];
    const params = [];
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

    if (setParts.length === 0) {
      return;
    }

    params.push(conversationId);
    const query = `UPDATE AI_CONVERSATIONS SET ${setParts.join(', ')} WHERE CONVERSATION_ID = @p${paramIndex}`;
    
    await this.db.query(query, ...params);
  }

  // 删除会话及其所有消息
  async deleteConversation(conversationId: string): Promise<void> {
    await this.db.query(
      `BEGIN TRANSACTION;
       DELETE FROM AI_MESSAGES WHERE CONVERSATION_ID = @p0;
       DELETE FROM AI_CONVERSATIONS WHERE CONVERSATION_ID = @p0;
       COMMIT;`,
      conversationId,
    );
  }
}
