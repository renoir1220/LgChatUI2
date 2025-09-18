import { Injectable } from '@nestjs/common';
import { CrmDatabaseService } from '../../../shared/database/database.service';
import { User } from '../../../types';
import { getCurrentLocalDateTime } from '../../../shared/utils/date.util';

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

  /**
   * 根据CRM用户ID查询用户信息
   * @param crmUserId CRM用户ID
   * @returns 用户信息或null
   */
  async findByCrmUserId(crmUserId: string): Promise<User | null> {
    const rows = await this.db.queryWithErrorHandling<{
      crmUserId: string;
      username: string;
      department?: string;
      empLevel?: string;
      empLevelName?: string;
      companyName?: string;
      groupName?: string;
      managerName?: string;
    }>(
      `SELECT TOP 1
         CRM用户ID as crmUserId,
         员工姓名 as username,
         部门名称 as department,
         EMP_LEVEL as empLevel,
         员工级别 as empLevelName,
         公司名称 as companyName,
         小组名称 as groupName,
         直接上级姓名 as managerName
       FROM VIEW_EMPLOYEE
       WHERE CRM用户ID = @p0 AND IS_ENABLE = 1`,
      [crmUserId],
      '根据CRM用户ID查询用户信息',
    );

    if (rows.length === 0) {
      return null;
    }

    const r = rows[0];
    return {
      id: r.crmUserId, // 使用CRM用户ID作为主键
      username: r.username,
      displayName: r.username,
      crmUserId: r.crmUserId,
      createdAt: getCurrentLocalDateTime(),
      // 基于员工级别设置角色
      roles: r.empLevelName ? [r.empLevelName] : [],
    };
  }

  /**
   * 根据用户名查询用户信息（保持向后兼容）
   * @param username 用户名
   * @returns 用户信息或null
   */
  async findByUsername(username: string): Promise<User | null> {
    const rows = await this.db.queryWithErrorHandling<{
      crmUserId: string;
      username: string;
      department?: string;
      empLevelName?: string;
    }>(
      `SELECT TOP 1
         CRM用户ID as crmUserId,
         员工姓名 as username,
         部门名称 as department,
         员工级别 as empLevelName
       FROM VIEW_EMPLOYEE
       WHERE 员工姓名 = @p0 AND IS_ENABLE = 1`,
      [username],
      '根据用户名查询用户信息',
    );

    if (rows.length === 0) {
      return null;
    }

    const r = rows[0];
    return {
      id: r.crmUserId || `user_${r.username}`, // 优先使用CRM用户ID
      username: r.username,
      displayName: r.username,
      crmUserId: r.crmUserId,
      createdAt: getCurrentLocalDateTime(),
      roles: r.empLevelName ? [r.empLevelName] : [],
    };
  }

  create(_userData: { username: string; displayName?: string }): never {
    // 对于这个场景，我们不允许创建新用户，只能使用现有员工
    throw new Error('不允许创建新用户，请使用现有员工姓名');
  }
}
