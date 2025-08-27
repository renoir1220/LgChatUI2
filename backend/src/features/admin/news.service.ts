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

    const category = q.category || InfoFeedCategory.NEWS;
    if (category) {
      where.push(`category = @p${pi}`);
      vals.push(category);
      pi += 1;
    }

    if (q.status) {
      where.push(`status = @p${pi}`);
      vals.push(q.status);
      pi += 1;
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
      `SELECT id, title, summary, category, thumbnail_url, source,
              author_id, view_count, like_count, comment_count,
              is_pinned, status, publish_time, created_at, updated_at
         FROM AI_InfoFeed
         ${whereClause}
         ${orderClause}
         OFFSET @p${pi} ROWS FETCH NEXT @p${pi + 1} ROWS ONLY`,
      [...vals, offset, pageSize],
      '查询新闻列表',
    );

    const totalRows = await this.db.queryWithErrorHandling<{ total: number }>(
      `SELECT COUNT(*) AS total FROM AI_InfoFeed ${whereClause}`,
      vals,
      '统计新闻总数',
    );
    const total = totalRows[0]?.total ?? 0;
    return {
      data: rows,
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
        dto.thumbnail_url ?? null,
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
    await this.db.queryWithErrorHandling(`DELETE FROM AI_InfoFeed WHERE id = @p0`, [id], '删除新闻');
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
}

