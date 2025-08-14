import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ChatMessage, ChatRole } from '@lg/shared';

@Injectable()
export class MessagesRepository {
  constructor(private readonly db: DatabaseService) {}

  async listByConversation(
    conversationId: string,
    page = 1,
    pageSize = 50,
  ): Promise<ChatMessage[]> {
    const offset = (page - 1) * pageSize + 1;
    const end = page * pageSize;
    const rows = await this.db.query<any>(
      `WITH M AS (
        SELECT MESSAGE_ID, CONVERSATION_ID, ROLE, CONTENT, CREATED_AT,
               ROW_NUMBER() OVER (ORDER BY CREATED_AT ASC) AS rn
        FROM T_AI_MESSAGES WHERE CONVERSATION_ID = @p0
      )
      SELECT CONVERT(varchar(36), MESSAGE_ID) AS id,
             CONVERT(varchar(36), CONVERSATION_ID) AS conversationId,
             ROLE AS role,
             CONTENT AS content,
             CONVERT(varchar(33), CREATED_AT, 126) AS createdAt
      FROM M WHERE rn BETWEEN @p1 AND @p2`,
      conversationId,
      offset,
      end,
    );
    return rows.map((r) => ({
      id: r.id,
      conversationId: r.conversationId,
      role: r.role === 'USER' ? ChatRole.User : ChatRole.Assistant,
      content: r.content,
      createdAt: r.createdAt,
    }));
  }

  async append(
    conversationId: string,
    role: ChatRole,
    content: string,
    userId?: string,
  ): Promise<ChatMessage> {
    const dbRole = role === ChatRole.User ? 'USER' : 'BOT';
    const rows = await this.db.query<any>(
      `DECLARE @id uniqueidentifier = NEWID();
       INSERT INTO T_AI_MESSAGES (MESSAGE_ID, CONVERSATION_ID, ROLE, CONTENT, CREATED_AT)
       VALUES (@id, @p0, @p1, @p2, GETUTCDATE());
       SELECT CONVERT(varchar(36), @id) AS id,
              CONVERT(varchar(36), @p0) AS conversationId,
              @p1 AS role,
              @p2 AS content,
              CONVERT(varchar(33), GETUTCDATE(), 126) AS createdAt;`,
      conversationId,
      dbRole,
      content,
    );
    const r = rows[0];
    return {
      id: r.id,
      conversationId: r.conversationId,
      role: role,
      content: r.content,
      createdAt: r.createdAt,
    };
  }

  // 检查某会话是否属于指定用户（依据 T_AI_CONVERSATIONS.USER_ID）
  async isConversationOwnedByUser(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const rows = await this.db.query<any>(
      `SELECT TOP 1 1 AS ok FROM T_AI_CONVERSATIONS WHERE CONVERSATION_ID = @p0 AND USER_ID = @p1`,
      conversationId,
      userId,
    );
    return rows.length > 0;
  }
}
