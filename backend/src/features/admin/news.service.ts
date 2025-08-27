import { Injectable, NotFoundException } from '@nestjs/common';
import { LgChatUIDatabaseService } from '../../shared/database/database.service';
import { InfoFeed, InfoFeedCategory, InfoFeedStatus } from '../../types/infofeed';
import { CreateNewsDto, ListNewsQueryDto, UpdateNewsDto } from './dto/news.dto';

@Injectable()
export class NewsAdminService {
  constructor(private readonly db: LgChatUIDatabaseService) {}

  async list(q: ListNewsQueryDto) {
    const page = Math.max(1, Number(q.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize || 20)));
    const where: string[] = [];
    const vals: any[] = [];
    let pi = 0;

    if (q.category) {
      const cats = String(q.category)
        .split(',')
        .map((s) => s.trim())
        .filter((s) => !!s);
      if (cats.length === 1) {
        where.push(`category = @p${pi}`);
        vals.push(cats[0]);
        pi += 1;
      } else if (cats.length > 1) {
        const placeholders = cats.map((_, idx) => `@p${pi + idx}`).join(',');
        where.push(`category IN (${placeholders})`);
        vals.push(...cats);
        pi += cats.length;
      }
    }

    if (q.status) {
      const sts = String(q.status)
        .split(',')
        .map((s) => s.trim())
        .filter((s) => !!s);
      if (sts.length === 1) {
        where.push(`status = @p${pi}`);
        vals.push(sts[0]);
        pi += 1;
      } else if (sts.length > 1) {
        const placeholders = sts.map((_, idx) => `@p${pi + idx}`).join(',');
        where.push(`status IN (${placeholders})`);
        vals.push(...sts);
        pi += sts.length;
      }
    }

    if (q.keyword) {
      where.push(`title LIKE @p${pi}`);
      vals.push(`%${q.keyword}%`);
      pi += 1;
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderClause = 'ORDER BY is_pinned DESC, publish_time DESC';
    const offset = (page - 1) * pageSize;

    const rows = await this.db.queryWithErrorHandling<InfoFeed>(
      `SELECT id, title, content, summary, category, thumbnail_url, source,
              author_id, view_count, like_count, comment_count,
              is_pinned, status, publish_time, created_at, updated_at
         FROM AI_InfoFeed
         ${whereClause}
         ${orderClause}
         OFFSET @p${pi} ROWS FETCH NEXT @p${pi + 1} ROWS ONLY`,
      [...vals, offset, pageSize],
      '查询新闻列表',
    );

    // 用正文中的首图作为缩略图（若能提取到则覆盖显示）
    const data = rows.map((r) => {
      const first = this.extractFirstImageUrl(r.content || '');
      return { ...r, thumbnail_url: first || r.thumbnail_url } as InfoFeed;
    });

    const totalRows = await this.db.queryWithErrorHandling<{ total: number }>(
      `SELECT COUNT(*) AS total FROM AI_InfoFeed ${whereClause}`,
      vals,
      '统计新闻总数',
    );
    const total = totalRows[0]?.total ?? 0;
    return {
      data,
      pagination: {
        total,
        page,
        pageSize,
      },
    };
  }

  async detail(id: number) {
    const rows = await this.db.queryWithErrorHandling<InfoFeed>(
      `SELECT * FROM AI_InfoFeed WHERE id = @p0`,
      [id],
      '查询新闻详情',
    );
    const item = rows[0];
    if (!item) throw new NotFoundException('新闻不存在');
    return item;
  }

  async create(dto: CreateNewsDto) {
    const publishTime = dto.publish_time ? new Date(dto.publish_time) : new Date();
    const thumb = dto.thumbnail_url || this.extractFirstImageUrl(dto.content || '');
    const rows = await this.db.queryWithErrorHandling<InfoFeed>(
      `INSERT INTO AI_InfoFeed (title, content, summary, category, thumbnail_url, source,
                                author_id, is_pinned, status, publish_time)
       OUTPUT INSERTED.*
       VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9)`,
      [
        dto.title,
        dto.content,
        dto.summary ?? null,
        dto.category || InfoFeedCategory.NEWS,
        thumb ?? null,
        dto.source ?? 'manual',
        dto.author_id ?? null,
        Boolean(dto.is_pinned),
        dto.status || InfoFeedStatus.DRAFT,
        publishTime,
      ],
      '创建新闻',
    );
    return rows[0];
  }

  async update(id: number, dto: UpdateNewsDto) {
    const sets: string[] = [];
    const vals: any[] = [];
    let pi = 0;
    const input: any = { ...dto };
    if (input.publish_time) input.publish_time = new Date(input.publish_time);
    // 若提交了内容变更且未显式提供缩略图，则尝试用正文首图
    if (typeof input.content === 'string' && input.thumbnail_url === undefined) {
      const first = this.extractFirstImageUrl(input.content);
      if (first) input.thumbnail_url = first;
    }
    for (const [k, v] of Object.entries(input)) {
      if (v !== undefined) {
        sets.push(`${k} = @p${pi}`);
        vals.push(v);
        pi += 1;
      }
    }
    sets.push('updated_at = GETDATE()');
    vals.push(id);
    const rows = await this.db.queryWithErrorHandling<InfoFeed>(
      `UPDATE AI_InfoFeed SET ${sets.join(', ')} OUTPUT INSERTED.* WHERE id = @p${pi}`,
      vals,
      '更新新闻',
    );
    const item = rows[0];
    if (!item) throw new NotFoundException('新闻不存在');
    return item;
  }

  async remove(id: number) {
    // Likes表对Feed和Comment均为 NO ACTION 外键，需手动清理依赖数据
    await this.db.withTransaction(async (tx) => {
      const sql = require('mssql');
      // 删除评论点赞（先按评论清理）
      const rq1 = new sql.Request(tx);
      rq1.input('p0', sql.Int, id);
      await rq1.query(
        `DELETE FROM AI_InfoFeedLike WHERE comment_id IN (SELECT id FROM AI_InfoFeedComment WHERE feed_id = @p0)`,
      );

      // 删除信息流点赞
      const rq2 = new sql.Request(tx);
      rq2.input('p0', sql.Int, id);
      await rq2.query(`DELETE FROM AI_InfoFeedLike WHERE feed_id = @p0`);

      // 删除评论（若外键已设置级联可省略，此处确保干净）
      const rq3 = new sql.Request(tx);
      rq3.input('p0', sql.Int, id);
      await rq3.query(`DELETE FROM AI_InfoFeedComment WHERE feed_id = @p0`);

      // 删除信息流主体
      const rq4 = new sql.Request(tx);
      rq4.input('p0', sql.Int, id);
      await rq4.query(`DELETE FROM AI_InfoFeed WHERE id = @p0`);
    });

    return { deleted: true };
  }

  async updateStatus(id: number, status: InfoFeedStatus) {
    const rows = await this.db.queryWithErrorHandling<InfoFeed>(
      `UPDATE AI_InfoFeed SET status = @p0, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = @p1`,
      [status, id],
      '更新新闻状态',
    );
    const item = rows[0];
    if (!item) throw new NotFoundException('新闻不存在');
    return item;
  }

  private extractFirstImageUrl(content: string): string | null {
    if (!content) return null;
    // 1) Markdown语法: ![alt](url)
    const md = content.match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/);
    if (md && md[1]) return md[1];
    // 2) HTML img 标签
    const html = content.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
    if (html && html[1]) return html[1];
    // 3) 裸露图片链接（按后缀识别）
    const bare = content.match(/(https?:[^\s)]+\.(?:png|jpe?g|gif|webp|svg))/i);
    if (bare && bare[1]) return bare[1];
    return null;
  }
}
