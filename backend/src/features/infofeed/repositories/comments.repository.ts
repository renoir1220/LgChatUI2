import { Injectable } from '@nestjs/common';
import { LgChatUIDatabaseService } from '../../../shared/database/database.service';
import { InfoFeedComment } from '../../../types/infofeed';

@Injectable()
export class InfoFeedCommentsRepository {
  constructor(private readonly db: LgChatUIDatabaseService) {}

  async listTopLevelByFeed(feedId: number, page: number, limit: number): Promise<InfoFeedComment[]> {
    const offset = (page - 1) * limit;
    return this.db.queryWithErrorHandling<InfoFeedComment>(
      `SELECT id, feed_id, user_id, parent_id, content, like_count, created_at, updated_at
       FROM AI_InfoFeedComment
       WHERE feed_id = @p0 AND parent_id IS NULL
       ORDER BY created_at DESC
       OFFSET @p1 ROWS
       FETCH NEXT @p2 ROWS ONLY`,
      [feedId, offset, limit],
      '查询顶级评论',
    );
  }

  async countTopLevelByFeed(feedId: number): Promise<number> {
    const rows = await this.db.queryWithErrorHandling<{ total: number }>(
      `SELECT COUNT(*) as total FROM AI_InfoFeedComment WHERE feed_id = @p0 AND parent_id IS NULL`,
      [feedId],
      '统计顶级评论数量',
    );
    return rows[0]?.total ?? 0;
  }

  async listReplies(commentId: number, limit = 5): Promise<InfoFeedComment[]> {
    return this.db.queryWithErrorHandling<InfoFeedComment>(
      `SELECT TOP (${limit}) id, feed_id, user_id, parent_id, content, like_count, created_at, updated_at
       FROM AI_InfoFeedComment
       WHERE parent_id = @p0
       ORDER BY created_at ASC`,
      [commentId],
      '查询评论回复',
    );
  }

  async create(
    feedId: number,
    userId: string,
    content: string,
    parentId?: number | null,
  ): Promise<InfoFeedComment> {
    // 使用 OUTPUT ... INTO 以兼容存在触发器的表
    const rows = await this.db.queryWithErrorHandling<InfoFeedComment>(
      `DECLARE @out TABLE (
          id INT,
          feed_id INT,
          user_id NVARCHAR(128),
          parent_id INT NULL,
          content NVARCHAR(MAX),
          like_count INT,
          created_at DATETIME,
          updated_at DATETIME
       );
       INSERT INTO AI_InfoFeedComment (feed_id, user_id, parent_id, content)
       OUTPUT INSERTED.id, INSERTED.feed_id, INSERTED.user_id, INSERTED.parent_id,
              INSERTED.content, INSERTED.like_count, INSERTED.created_at, INSERTED.updated_at
       INTO @out
       VALUES (@p0, @p1, @p2, @p3);
       SELECT id, feed_id, user_id, parent_id, content, like_count, created_at, updated_at FROM @out;`,
      [feedId, userId, parentId ?? null, content],
      '创建评论',
    );
    return rows[0];
  }

  async getById(id: number): Promise<InfoFeedComment | null> {
    const rows = await this.db.queryWithErrorHandling<InfoFeedComment>(
      `SELECT id, feed_id, user_id, parent_id, content, like_count, created_at, updated_at
       FROM AI_InfoFeedComment WHERE id = @p0`,
      [id],
      '根据ID查询评论',
    );
    return rows[0] || null;
  }
}
