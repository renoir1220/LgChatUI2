import { Injectable, Logger } from '@nestjs/common';
import { CrmDatabaseService } from '../../../shared/database/database.service';
import { User } from '../../../types';
import { getCurrentLocalDateTime } from '../../../shared/utils/date.util';

@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

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
    // 开发环境降级处理：检查是否为开发用户
    if (this.isDevelopmentUser(crmUserId)) {
      return this.createDevelopmentUser(crmUserId);
    }

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
    // 开发环境降级：检查是否为开发用户
    if (this.isDevelopmentMode() && this.isKnownDevelopmentUser(username)) {
      return this.createDevelopmentUserByUsername(username);
    }

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

  /**
   * 检查是否为开发环境用户
   * @param crmUserId CRM用户ID
   * @returns 是否为开发用户
   */
  private isDevelopmentUser(crmUserId: string): boolean {
    return crmUserId.startsWith('DEV_USER_');
  }

  /**
   * 创建开发环境用户对象
   * @param crmUserId 开发环境CRM用户ID
   * @returns 开发用户对象
   */
  private createDevelopmentUser(crmUserId: string): User {
    this.logger.log('创建开发环境用户', { crmUserId });

    // 从CRM_USER_ID中提取登录用户名
    const loginUsername = this.extractUsernameFromDevCrmId(crmUserId);

    // 开发用户映射：登录用户名 -> 真实用户名（用于权限验证）
    const usernameMapping: Record<string, string> = {
      'ldy': '刘冬阳',     // ldy 对应真实用户 刘冬阳
      'dev': 'dev',       // dev 保持原样（测试用户）
      'admin': 'admin',   // admin 保持原样（测试管理员）
    };

    const realUsername = usernameMapping[loginUsername.toLowerCase()] || loginUsername;

    return {
      id: crmUserId,
      username: realUsername,  // 使用真实用户名进行权限验证
      displayName: this.getDevUserDisplayName(crmUserId),
      crmUserId,
      createdAt: getCurrentLocalDateTime(),
      roles: ['开发用户'],
    };
  }

  /**
   * 从开发环境CRM_USER_ID中提取用户名
   * @param crmUserId 开发环境CRM用户ID (格式: DEV_USER_XXX_001)
   * @returns 用户名
   */
  private extractUsernameFromDevCrmId(crmUserId: string): string {
    // DEV_USER_LDY_001 -> ldy
    const parts = crmUserId.split('_');
    if (parts.length >= 3) {
      return parts[2].toLowerCase();
    }
    return 'dev_user';
  }

  /**
   * 获取开发用户的显示名称
   * @param crmUserId 开发环境CRM用户ID
   * @returns 显示名称
   */
  private getDevUserDisplayName(crmUserId: string): string {
    const displayNames: Record<string, string> = {
      'DEV_USER_LDY_001': '开发用户-刘德宇',
      'DEV_USER_DEV_001': '开发用户-测试',
      'DEV_USER_ADMIN_001': '开发用户-管理员',
    };

    return displayNames[crmUserId] || `开发用户-${this.extractUsernameFromDevCrmId(crmUserId)}`;
  }

  /**
   * 检查是否为开发模式
   * @returns 是否为开发模式
   */
  private isDevelopmentMode(): boolean {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const bypassEnabled = process.env.CRM_BYPASS_ENABLED === 'true';
    const autoFallback = process.env.CRM_AUTO_FALLBACK === 'true';

    return isDevelopment && (bypassEnabled || autoFallback);
  }

  /**
   * 检查是否为已知的开发用户
   * @param username 用户名
   * @returns 是否为开发用户
   */
  private isKnownDevelopmentUser(username: string): boolean {
    const devUsers = ['ldy', 'dev', 'admin'];
    return devUsers.includes(username.toLowerCase());
  }

  /**
   * 根据用户名创建开发环境用户
   * @param username 用户名
   * @returns 开发用户对象
   */
  private createDevelopmentUserByUsername(username: string): User {
    this.logger.log('JWT验证阶段创建开发环境用户', { username });

    // 开发用户映射：登录用户名 -> 真实用户名（用于权限验证）
    const usernameMapping: Record<string, string> = {
      'ldy': '刘冬阳',     // ldy 对应真实用户 刘冬阳
      'dev': 'dev',       // dev 保持原样（测试用户）
      'admin': 'admin',   // admin 保持原样（测试管理员）
    };

    const userMapping: Record<string, string> = {
      'ldy': 'DEV_USER_LDY_001',
      'dev': 'DEV_USER_DEV_001',
      'admin': 'DEV_USER_ADMIN_001',
    };

    const crmUserId = userMapping[username.toLowerCase()] || `DEV_USER_${username.toUpperCase()}_001`;
    const realUsername = usernameMapping[username.toLowerCase()] || username;

    return {
      id: crmUserId,
      username: realUsername,  // 使用真实用户名进行权限验证
      displayName: this.getDevUserDisplayName(crmUserId),
      crmUserId,
      createdAt: getCurrentLocalDateTime(),
      roles: ['开发用户'],
    };
  }
}
