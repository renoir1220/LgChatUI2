import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';
import { UsersRepository } from '../src/features/auth/repositories/users.repository';
import { CrmDatabaseService } from '../src/shared/database/database.service';
import { NewsAdminService } from '../src/features/admin/news.service';
import { InfoFeedCategory, InfoFeedStatus } from '../src/types/infofeed';

class FakeNewsAdminService {
  private rows: any[] = [];
  private id = 1;

  async list() {
    return {
      data: [...this.rows],
      pagination: { total: this.rows.length, page: 1, pageSize: 20 },
    };
  }

  async detail(id: number) {
    const row = this.rows.find((r) => r.id === id);
    if (!row) throw new NotFoundException('新闻不存在');
    return row;
  }

  async create(dto: any) {
    const row = {
      id: this.id++,
      title: dto.title,
      content: dto.content,
      summary: dto.summary ?? null,
      category: dto.category || InfoFeedCategory.NEWS,
      thumbnail_url: dto.thumbnail_url ?? null,
      source: dto.source || 'manual',
      author_id: dto.author_id ?? null,
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      is_pinned: Boolean(dto.is_pinned),
      status: dto.status || InfoFeedStatus.DRAFT,
      publish_time: dto.publish_time ? new Date(dto.publish_time) : new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.rows.push(row);
    return row;
  }

  async update(id: number, dto: any) {
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx < 0) throw new NotFoundException('新闻不存在');
    const next = { ...this.rows[idx], ...dto, updated_at: new Date() };
    this.rows[idx] = next;
    return next;
  }

  async remove(id: number) {
    const before = this.rows.length;
    this.rows = this.rows.filter((r) => r.id !== id);
    return { deleted: this.rows.length < before };
  }

  async updateStatus(id: number, status: InfoFeedStatus) {
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx < 0) throw new NotFoundException('新闻不存在');
    this.rows[idx] = { ...this.rows[idx], status, updated_at: new Date() };
    return this.rows[idx];
  }
}

describe('Admin News (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // 配置管理员文件并通过环境变量指定
    const cfgDir = path.resolve(process.cwd(), 'config');
    if (!fs.existsSync(cfgDir)) fs.mkdirSync(cfgDir, { recursive: true });
    const cfgPath = path.join(cfgDir, 'admins_e2e_news.txt');
    fs.writeFileSync(cfgPath, '刘冬阳', 'utf-8');
    process.env.ADMIN_CONFIG_PATH = cfgPath;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // 避免访问CRM数据库
      .overrideProvider(CrmDatabaseService)
      .useValue({ query: jest.fn() })
      // 用户仓库：任意用户名返回用户对象
      .overrideProvider(UsersRepository)
      .useValue({
        findByUsername: jest.fn(async (username: string) => {
          if (!username) return null;
          return {
            id: `user_${username}`,
            username,
            displayName: username,
            roles: [],
            createdAt: new Date().toISOString(),
          };
        }),
      })
      // 使用内存新闻服务，避免真实DB
      .overrideProvider(NewsAdminService)
      .useClass(FakeNewsAdminService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('应支持管理员新闻的增删改查与状态更新', async () => {
    const server = app.getHttpAdapter().getInstance();

    // 登录获取token
    const loginRes = await request(server)
      .post('/api/auth/login')
      .send({ username: '刘冬阳' })
      .expect(200);
    const token = loginRes.body?.access_token as string;

    // 初始列表应为空
    const list0 = await request(server)
      .get('/api/admin/news')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list0.body.data).toEqual([]);

    // 创建新闻
    const createRes = await request(server)
      .post('/api/admin/news')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '新闻1', content: '内容1' })
      .expect(201);
    const created = createRes.body;
    expect(created.id).toBeGreaterThan(0);
    expect(created.title).toBe('新闻1');
    expect(created.status).toBe(InfoFeedStatus.DRAFT);

    const id = created.id;

    // 列表应包含1条
    const list1 = await request(server)
      .get('/api/admin/news')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list1.body.pagination.total).toBe(1);

    // 查询详情
    const detail = await request(server)
      .get(`/api/admin/news/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(detail.body.title).toBe('新闻1');

    // 更新标题
    const updated = await request(server)
      .put(`/api/admin/news/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '新闻1-更新' })
      .expect(200);
    expect(updated.body.title).toBe('新闻1-更新');

    // 更新状态为已发布
    const statusUpd = await request(server)
      .put(`/api/admin/news/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: InfoFeedStatus.PUBLISHED })
      .expect(200);
    expect(statusUpd.body.status).toBe(InfoFeedStatus.PUBLISHED);

    // 删除
    const delRes = await request(server)
      .delete(`/api/admin/news/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(delRes.body.deleted).toBe(true);

    // 再查详情应404
    await request(server)
      .get(`/api/admin/news/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});

