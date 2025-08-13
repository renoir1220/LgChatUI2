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
        FROM Conversations
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
       INSERT INTO Conversations (id, title, created_at, updated_at)
       VALUES (@id, @p0, GETUTCDATE(), GETUTCDATE());
       SELECT CONVERT(varchar(36), @id) AS id, @p0 AS title,
              CONVERT(varchar(33), GETUTCDATE(), 126) AS createdAt,
              CONVERT(varchar(33), GETUTCDATE(), 126) AS updatedAt;`,
      title,
    );
    return rows[0];
  }
}

