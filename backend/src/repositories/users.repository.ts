import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { User } from '@lg/shared';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

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
    try {
      const rows = await this.db.query<any>(
        `SELECT TOP 1 员工姓名 as username
         FROM VIEW_EMPLOYEE 
         WHERE 员工姓名 = @p0`,
        username,
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
    } catch (error) {
      console.error('查询用户时出错:', error);
      return null;
    }
  }

  async create(userData: {
    username: string;
    displayName?: string;
  }): Promise<User> {
    // 对于这个场景，我们不允许创建新用户，只能使用现有员工
    throw new Error('不允许创建新用户，请使用现有员工姓名');
  }
}
