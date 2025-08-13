import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { User } from '@lg/shared';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findOrCreate(username: string): Promise<User> {
    const rows = await this.db.query<any>(
      `DECLARE @existing TABLE (id uniqueidentifier, username nvarchar(200), display_name nvarchar(200), avatar_url nvarchar(400), created_at datetime2);
       INSERT INTO @existing
       SELECT TOP 1 id, username, display_name, avatar_url, created_at FROM Users WHERE username = @p0;
       IF EXISTS (SELECT 1 FROM @existing)
       BEGIN
         SELECT CONVERT(varchar(36), id) AS id, username,
                display_name AS displayName, avatar_url AS avatarUrl,
                CONVERT(varchar(33), created_at, 126) AS createdAt
         FROM @existing;
       END
       ELSE
       BEGIN
         DECLARE @id uniqueidentifier = NEWID();
         INSERT INTO Users (id, username, created_at)
         VALUES (@id, @p0, GETUTCDATE());
         SELECT CONVERT(varchar(36), @id) AS id, @p0 AS username, NULL AS displayName, NULL AS avatarUrl,
                CONVERT(varchar(33), GETUTCDATE(), 126) AS createdAt;
       END`,
      username,
    );
    const r = rows[0];
    return {
      id: r.id,
      username: r.username,
      displayName: r.displayName ?? undefined,
      avatarUrl: r.avatarUrl ?? undefined,
      createdAt: r.createdAt,
    };
  }
}

