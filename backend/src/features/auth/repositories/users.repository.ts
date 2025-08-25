import { Injectable } from '@nestjs/common';
import { CrmDatabaseService } from '../../../shared/database/database.service';
import { User } from '../../../types';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: CrmDatabaseService) {}

  async findOrCreate(username: string): Promise<User> {
    // 只查找用户，如果不存在则返回null（不创建新用户）
    const user = await this.findByUsername(username);

    if (!user) {
      // 抛出错误而不是创建新用户
      throw new Error('用户不存在');
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    const rows = await this.db.queryWithErrorHandling<any>(
      `SELECT TOP 1 员工姓名 as username
       FROM VIEW_EMPLOYEE 
       WHERE 员工姓名 = @p0`,
      [username],
      '查询用户信息',
    );

    if (rows.length === 0) {
      return null;
    }

    const r = rows[0];
    return {
      id: `user_${r.username}`, // 使用用户名生成ID
      username: r.username,
      displayName: r.username,
      createdAt: new Date().toISOString(),
    };
  }

  async create(userData: {
    username: string;
    displayName?: string;
  }): Promise<User> {
    // 对于这个场景，我们不允许创建新用户，只能使用现有员工
    throw new Error('不允许创建新用户，请使用现有员工姓名');
  }
}
