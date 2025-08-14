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
        SELECT id, title, created_at, updated_at,
               ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn
        FROM T_AI_CONVERSATIONS
      )
      SELECT id, title,
             CONVERT(varchar(33), created_at, 126) AS createdAt,
             CONVERT(varchar(33), updated_at, 126) AS updatedAt
      FROM C WHERE rn BETWEEN @p0 AND @p1`,
      offset,
      end,
    );
    return rows;
  }

  async create(title: string): Promise<Conversation> {
    const rows = await this.db.query<Conversation>(
      `DECLARE @id uniqueidentifier = NEWID();
       INSERT INTO T_AI_CONVERSATIONS (id, title, created_at, updated_at)
       VALUES (@id, @p0, GETUTCDATE(), GETUTCDATE());
       SELECT CONVERT(varchar(36), @id) AS id, @p0 AS title,
              CONVERT(varchar(33), GETUTCDATE(), 126) AS createdAt,
              CONVERT(varchar(33), GETUTCDATE(), 126) AS updatedAt;`,
      title,
    );
    return rows[0];
  }

  // 列出与指定用户相关的会话（根据 Messages 表中的 user_id 关联）
  async listByUser(
    userId: string,
    page = 1,
    pageSize = 20,
  ): Promise<Conversation[]> {
    const offset = (page - 1) * pageSize + 1;
    const end = page * pageSize;
    const rows = await this.db.query<any>(
      `WITH C AS (
        SELECT c.id, c.title, c.created_at, c.updated_at,
               ROW_NUMBER() OVER (ORDER BY c.created_at DESC) AS rn
        FROM T_AI_CONVERSATIONS c
        WHERE EXISTS (SELECT 1 FROM T_AI_MESSAGES m WHERE m.conversation_id = c.id AND m.user_id = @p0)
      )
      SELECT CONVERT(varchar(36), id) AS id,
             title,
             CONVERT(varchar(33), created_at, 126) AS createdAt,
             CONVERT(varchar(33), updated_at, 126) AS updatedAt
      FROM C WHERE rn BETWEEN @p1 AND @p2`,
      userId,
      offset,
      end,
    );
    return rows as Conversation[];
  }

  // 创建新会话（关联用户）
  async createConversation(userId: string, title: string): Promise<Conversation> {
    const rows = await this.db.query<any>(
      `DECLARE @id uniqueidentifier = NEWID();
       INSERT INTO T_AI_CONVERSATIONS (id, title, created_at, updated_at)
       VALUES (@id, @p1, GETUTCDATE(), GETUTCDATE());
       SELECT CONVERT(varchar(36), @id) AS id, 
              @p1 AS title,
              @p0 AS userId,
              CONVERT(varchar(33), GETUTCDATE(), 126) AS createdAt,
              CONVERT(varchar(33), GETUTCDATE(), 126) AS updatedAt;`,
      userId,
      title,
    );
    return rows[0] as Conversation;
  }

  // 删除会话及其所有消息
  async deleteConversation(conversationId: string): Promise<void> {
    await this.db.query(
      `BEGIN TRANSACTION;
       DELETE FROM T_AI_MESSAGES WHERE conversation_id = @p0;
       DELETE FROM T_AI_CONVERSATIONS WHERE id = @p0;
       COMMIT;`,
      conversationId,
    );
  }
}
