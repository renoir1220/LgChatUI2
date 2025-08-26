import { Injectable } from '@nestjs/common';
import { LgChatUIDatabaseService } from '../../../shared/database/database.service';
import { InfoFeed, InfoFeedCategory } from '../../../types/infofeed';

export interface FeedListParams {
  category?: InfoFeedCategory;
  user_id?: number | string;
  page?: number;
  limit?: number;
  order_by?: 'publish_time' | 'view_count' | 'like_count';
  order_direction?: 'ASC' | 'DESC';
  currentUserId?: number | string;
}

@Injectable()
export class InfoFeedsRepository {
  constructor(private readonly db: LgChatUIDatabaseService) {}

  async list(params: FeedListParams): Promise<InfoFeed[]> {
    const {
      category,
      user_id,
      page = 1,
      limit = 20,
      order_by = 'publish_time',
      order_direction = 'DESC',
      currentUserId,
    } = params;

    const where: string[] = ["status = 'published'"];
    const values: any[] = [];
    let pi = 0;

    if (category && category !== InfoFeedCategory.ALL) {
      if (category === InfoFeedCategory.RELATED && currentUserId) {
        where.push(`(author_id = @p${pi} OR id IN (SELECT DISTINCT feed_id FROM AI_InfoFeedComment WHERE user_id = @p${pi + 1}))`);
        values.push(currentUserId, currentUserId);
        pi += 2;
      } else if (category !== InfoFeedCategory.RELATED) {
        where.push(`category = @p${pi}`);
        values.push(category);
        pi += 1;
      }
    }

    if (user_id) {
      where.push(`author_id = @p${pi}`);
      values.push(user_id);
      pi += 1;
    }

    const whereClause = `WHERE ${where.join(' AND ')}`;

    let orderClause = '';
    switch (order_by) {
      case 'view_count':
        orderClause = `ORDER BY view_count ${order_direction}, publish_time DESC`;
        break;
      case 'like_count':
        orderClause = `ORDER BY like_count ${order_direction}, publish_time DESC`;
        break;
      default:
        orderClause = `ORDER BY is_pinned DESC, publish_time ${order_direction}`;
    }

    const offset = (page - 1) * limit;
    const sql = `
      SELECT 
        id, title, summary, category, thumbnail_url, source,
        author_id, view_count, like_count, comment_count,
        is_pinned, status, publish_time, created_at, updated_at
      FROM AI_InfoFeed
      ${whereClause}
      ${orderClause}
      OFFSET @p${pi} ROWS
      FETCH NEXT @p${pi + 1} ROWS ONLY`;
    return this.db.queryWithErrorHandling<InfoFeed>(
      sql,
      [...values, offset, limit],
      '查询信息流列表',
    );
  }

  async count(params: Omit<FeedListParams, 'page' | 'limit' | 'order_by' | 'order_direction'>): Promise<number> {
    const { category, user_id, currentUserId } = params;
    const where: string[] = ["status = 'published'"];
    const values: any[] = [];
    let pi = 0;

    if (category && category !== InfoFeedCategory.ALL) {
      if (category === InfoFeedCategory.RELATED && currentUserId) {
        where.push(`(author_id = @p${pi} OR id IN (SELECT DISTINCT feed_id FROM AI_InfoFeedComment WHERE user_id = @p${pi + 1}))`);
        values.push(currentUserId, currentUserId);
        pi += 2;
      } else if (category !== InfoFeedCategory.RELATED) {
        where.push(`category = @p${pi}`);
        values.push(category);
        pi += 1;
      }
    }

    if (user_id) {
      where.push(`author_id = @p${pi}`);
      values.push(user_id);
      pi += 1;
    }

    const sql = `SELECT COUNT(*) as total FROM AI_InfoFeed ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`;
    const rows = await this.db.queryWithErrorHandling<{ total: number }>(
      sql,
      values,
      '查询信息流总数',
    );
    return rows[0]?.total ?? 0;
  }

  async getPublishedById(id: number): Promise<InfoFeed | null> {
    const rows = await this.db.queryWithErrorHandling<InfoFeed>(
      `SELECT id, title, content, summary, category, thumbnail_url, source,
              author_id, view_count, like_count, comment_count,
              is_pinned, status, publish_time, created_at, updated_at
         FROM AI_InfoFeed WHERE id = @p0 AND status = 'published'`,
      [id],
      '查询信息流详情',
    );
    return rows[0] || null;
  }

  async getById(id: number): Promise<InfoFeed | null> {
    const rows = await this.db.queryWithErrorHandling<InfoFeed>(
      `SELECT * FROM AI_InfoFeed WHERE id = @p0`,
      [id],
      '根据ID查询信息流',
    );
    return rows[0] || null;
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.db.queryWithErrorHandling(
      `UPDATE AI_InfoFeed SET view_count = view_count + 1, updated_at = GETDATE() WHERE id = @p0`,
      [id],
      '增加浏览次数',
    );
  }

  async create(feed: {
    title: string;
    content: string;
    summary?: string | null;
    category: InfoFeed['category'];
    thumbnail_url?: string | null;
    source?: InfoFeed['source'];
    author_id?: number | string | null;
    is_pinned?: boolean;
    status?: InfoFeed['status'];
    publish_time: Date;
  }): Promise<InfoFeed> {
    const rows = await this.db.queryWithErrorHandling<InfoFeed>(
      `INSERT INTO AI_InfoFeed (title, content, summary, category, thumbnail_url, source,
                                author_id, is_pinned, status, publish_time)
       OUTPUT INSERTED.*
       VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9)`,
      [
        feed.title,
        feed.content,
        feed.summary ?? null,
        feed.category,
        feed.thumbnail_url ?? null,
        feed.source ?? 'manual',
        feed.author_id ?? null,
        Boolean(feed.is_pinned),
        feed.status ?? 'published',
        feed.publish_time,
      ],
      '创建信息流',
    );
    return rows[0];
  }

  async update(id: number, updates: Partial<Omit<InfoFeed, 'id' | 'created_at'>>): Promise<InfoFeed> {
    const sets: string[] = [];
    const vals: any[] = [];
    let pi = 0;
    Object.entries(updates).forEach(([k, v]) => {
      if (v !== undefined) {
        sets.push(`${k} = @p${pi}`);
        vals.push(v);
        pi += 1;
      }
    });
    sets.push('updated_at = GETDATE()');
    vals.push(id);
    const rows = await this.db.queryWithErrorHandling<InfoFeed>(
      `UPDATE AI_InfoFeed SET ${sets.join(', ')} OUTPUT INSERTED.* WHERE id = @p${pi}`,
      vals,
      '更新信息流',
    );
    return rows[0];
  }

  async delete(id: number): Promise<void> {
    await this.db.queryWithErrorHandling(
      `DELETE FROM AI_InfoFeed WHERE id = @p0`,
      [id],
      '删除信息流',
    );
  }
}
