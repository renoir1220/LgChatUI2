import { Injectable } from '@nestjs/common';
import { LgChatUIDatabaseService } from '../../../shared/database/database.service';
import { PAGINATION_CONSTANTS } from '../../../shared/constants/pagination.constants';
import { ChatMessage, ChatRole } from '../../../types';

@Injectable()
export class MessagesRepository {
  constructor(private readonly db: LgChatUIDatabaseService) {}

  async listByConversation(
    conversationId: string,
    page: number = 1,
    pageSize: number = PAGINATION_CONSTANTS.MESSAGES_PAGE_SIZE,
  ): Promise<ChatMessage[]> {
    // 使用OFFSET/FETCH并在SQL层直接处理类型转换，减少应用层开销
    const offset = (page - 1) * pageSize;
    const rows = await this.db.query<{
      id: string;
      conversationId: string;
      role: string;
      content: string;
      createdAt: string;
    }>(
      `SELECT CONVERT(varchar(36), MESSAGE_ID) AS id,
             CONVERT(varchar(36), CONVERSATION_ID) AS conversationId,
             CASE ROLE WHEN 'USER' THEN 'USER' ELSE 'ASSISTANT' END AS role,
             CONTENT AS content,
             CONVERT(varchar(33), CREATED_AT, 126) AS createdAt
      FROM AI_MESSAGES 
      WHERE CONVERSATION_ID = @p0
      ORDER BY CREATED_AT ASC
      OFFSET @p1 ROWS
      FETCH NEXT @p2 ROWS ONLY`,
      conversationId,
      offset,
      pageSize,
    );

    // 直接返回，无需额外类型转换
    return rows.map((r) => ({
      id: r.id,
      conversationId: r.conversationId,
      role: r.role as ChatRole, // SQL已经处理了枚举转换
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
    const rows = await this.db.query<{
      id: string;
      conversationId: string;
      role: string;
      content: string;
      createdAt: string;
    }>(
      `DECLARE @id uniqueidentifier = NEWID();
       INSERT INTO AI_MESSAGES (MESSAGE_ID, CONVERSATION_ID, ROLE, CONTENT, CREATED_AT)
       VALUES (@id, @p0, @p1, @p2, GETDATE());
       SELECT CONVERT(varchar(36), @id) AS id,
              CONVERT(varchar(36), @p0) AS conversationId,
              @p1 AS role,
              @p2 AS content,
              CONVERT(varchar(33), GETDATE(), 126) AS createdAt;`,
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

  // 检查某会话是否属于指定用户（依据 AI_CONVERSATIONS.USER_ID）
  async isConversationOwnedByUser(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const rows = await this.db.query<any>(
      `SELECT TOP 1 1 AS ok FROM AI_CONVERSATIONS WHERE CONVERSATION_ID = @p0 AND USER_ID = @p1`,
      conversationId,
      userId,
    );
    return rows.length > 0;
  }

}
