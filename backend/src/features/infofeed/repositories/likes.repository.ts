import { Injectable } from '@nestjs/common';
import { LgChatUIDatabaseService } from '../../../shared/database/database.service';

@Injectable()
export class InfoFeedLikesRepository {
  constructor(private readonly db: LgChatUIDatabaseService) {}

  // Feed likes
  async existsFeedLike(feedId: number, userId: string): Promise<boolean> {
    const rows = await this.db.queryWithErrorHandling<any>(
      `SELECT TOP 1 1 AS ok FROM AI_InfoFeedLike WHERE feed_id = @p0 AND user_id = @p1`,
      [feedId, userId],
      '检查信息流点赞状态',
    );
    return rows.length > 0;
  }

  async addFeedLike(feedId: number, userId: string): Promise<void> {
    await this.db.queryWithErrorHandling(
      `INSERT INTO AI_InfoFeedLike (feed_id, user_id) VALUES (@p0, @p1)`,
      [feedId, userId],
      '添加信息流点赞',
    );
  }

  async removeFeedLike(feedId: number, userId: string): Promise<void> {
    await this.db.queryWithErrorHandling(
      `DELETE FROM AI_InfoFeedLike WHERE feed_id = @p0 AND user_id = @p1`,
      [feedId, userId],
      '取消信息流点赞',
    );
  }

  async getFeedLikeCount(feedId: number): Promise<number> {
    const rows = await this.db.queryWithErrorHandling<{ like_count: number }>(
      `SELECT like_count FROM AI_InfoFeed WHERE id = @p0`,
      [feedId],
      '获取信息流点赞数量',
    );
    return rows[0]?.like_count ?? 0;
  }

  // Comment likes
  async existsCommentLike(commentId: number, userId: string): Promise<boolean> {
    const rows = await this.db.queryWithErrorHandling<any>(
      `SELECT TOP 1 1 AS ok FROM AI_InfoFeedLike WHERE comment_id = @p0 AND user_id = @p1`,
      [commentId, userId],
      '检查评论点赞状态',
    );
    return rows.length > 0;
  }

  async addCommentLike(commentId: number, userId: string): Promise<void> {
    await this.db.queryWithErrorHandling(
      `INSERT INTO AI_InfoFeedLike (comment_id, user_id) VALUES (@p0, @p1)`,
      [commentId, userId],
      '添加评论点赞',
    );
  }

  async removeCommentLike(commentId: number, userId: string): Promise<void> {
    await this.db.queryWithErrorHandling(
      `DELETE FROM AI_InfoFeedLike WHERE comment_id = @p0 AND user_id = @p1`,
      [commentId, userId],
      '取消评论点赞',
    );
  }

  async getCommentLikeCount(commentId: number): Promise<number> {
    const rows = await this.db.queryWithErrorHandling<{ like_count: number }>(
      `SELECT like_count FROM AI_InfoFeedComment WHERE id = @p0`,
      [commentId],
      '获取评论点赞数量',
    );
    return rows[0]?.like_count ?? 0;
  }
}
