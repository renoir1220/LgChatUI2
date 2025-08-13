import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ChatMessage, ChatRole } from '@lg/shared';

@Injectable()
export class MessagesRepository {
  constructor(private readonly db: DatabaseService) {}

  async listByConversation(conversationId: string, page = 1, pageSize = 50): Promise<ChatMessage[]> {
    const offset = (page - 1) * pageSize + 1;
    const end = page * pageSize;
    const rows = await this.db.query<any>(
      `WITH M AS (
        SELECT id, conversation_id, user_id, role, content, created_at,
               ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
        FROM Messages WHERE conversation_id = @p0
      )
      SELECT CONVERT(varchar(36), id) AS id,
             CONVERT(varchar(36), conversation_id) AS conversationId,
             user_id AS userId,
             role AS role,
             content AS content,
             CONVERT(varchar(33), created_at, 126) AS createdAt
      FROM M WHERE rn BETWEEN @p1 AND @p2`,
      conversationId,
      offset,
      end,
    );
    return rows.map((r) => ({
      id: r.id,
      conversationId: r.conversationId,
      userId: r.userId,
      role: (r.role as string) as ChatRole,
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
    const rows = await this.db.query<any>(
      `DECLARE @id uniqueidentifier = NEWID();
       INSERT INTO Messages (id, conversation_id, user_id, role, content, created_at)
       VALUES (@id, @p0, @p1, @p2, @p3, GETUTCDATE());
       SELECT CONVERT(varchar(36), @id) AS id,
              CONVERT(varchar(36), @p0) AS conversationId,
              @p1 AS userId,
              @p2 AS role,
              @p3 AS content,
              CONVERT(varchar(33), GETUTCDATE(), 126) AS createdAt;`,
      conversationId,
      userId || null,
      role,
      content,
    );
    const r = rows[0];
    return {
      id: r.id,
      conversationId: r.conversationId,
      userId: r.userId ?? undefined,
      role: r.role as ChatRole,
      content: r.content,
      createdAt: r.createdAt,
    };
  }
}

