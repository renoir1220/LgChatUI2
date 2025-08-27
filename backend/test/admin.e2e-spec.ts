import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';
import { UsersRepository } from '../src/features/auth/repositories/users.repository';
import { CrmDatabaseService } from '../src/shared/database/database.service';

describe('AdminModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Prepare admins config file and env
    const cfgDir = path.resolve(process.cwd(), 'config');
    if (!fs.existsSync(cfgDir)) fs.mkdirSync(cfgDir, { recursive: true });
    const cfgPath = path.join(cfgDir, 'admins_e2e.txt');
    fs.writeFileSync(cfgPath, '刘冬阳', 'utf-8');
    process.env.ADMIN_CONFIG_PATH = cfgPath;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Avoid real DB calls
      .overrideProvider(CrmDatabaseService)
      .useValue({ query: jest.fn() })
      // Mock UsersRepository to return a simple user object
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
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow admin to access menus and ping', async () => {
    const server = app.getHttpAdapter().getInstance();

    // login as admin
    const loginRes = await request(server)
      .post('/api/auth/login')
      .send({ username: '刘冬阳' })
      .expect(200);
    const token = loginRes.body?.access_token;
    expect(typeof token).toBe('string');

    // isAdmin
    const meRes = await request(server)
      .get('/api/admin/permissions/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(meRes.body).toEqual({ isAdmin: true });

    // menus
    const menusRes = await request(server)
      .get('/api/admin/menus')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(menusRes.body)).toBe(true);
    expect(menusRes.body[0]).toEqual({ key: 'news', label: '新闻管理' });

    // ping
    const pingRes = await request(server)
      .get('/api/admin/ping')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(pingRes.body.ok).toBe(true);
  });
});

