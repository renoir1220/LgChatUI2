import { Injectable } from '@nestjs/common';
import { LgChatUIDatabaseService } from '../../shared/database/database.service';
import { formatLocalDateTime } from '../../shared/utils/date.util';

export interface KnowledgeBaseEntity {
  id: string;
  kbKey: string;
  name: string;
  description?: string;
  apiKey: string;
  apiUrl: string;
  availableUsers?: string; // 可用用户列表，逗号分隔
  canSelectModel: boolean; // 是否允许选择模型
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class KnowledgeBaseRepository {
  constructor(private readonly db: LgChatUIDatabaseService) {}

  /**
   * 获取指定用户可访问的启用知识库列表
   */
  async findEnabledByUser(username?: string): Promise<KnowledgeBaseEntity[]> {
    const rows = await this.db.queryWithErrorHandling<{
      ID: string;
      KB_KEY: string;
      NAME: string;
      DESCRIPTION: string;
      API_KEY: string;
      API_URL: string;
      AVAILABLE_USERS: string;
      CAN_SELECT_MODEL: boolean;
      ENABLED: boolean;
      SORT_ORDER: number;
      CREATED_AT: Date;
      UPDATED_AT: Date;
    }>(
      `SELECT ID, KB_KEY, NAME, DESCRIPTION, API_KEY, API_URL, AVAILABLE_USERS, CAN_SELECT_MODEL, ENABLED, SORT_ORDER, CREATED_AT, UPDATED_AT
       FROM AI_KNOWLEDGE_BASES 
       WHERE ENABLED = 1 
       ORDER BY SORT_ORDER ASC, NAME ASC`,
      [],
      '获取启用的知识库列表',
    );

    return rows
      .filter((row) => {
        // 如果没有指定可用用户或用户字段为空，则所有用户可见
        if (!row.AVAILABLE_USERS) {
          return true;
        }

        // 如果没有提供用户名，则不可见
        if (!username) {
          return false;
        }

        // 检查用户是否在可用用户列表中
        const availableUsers = row.AVAILABLE_USERS.split(',').map((u) =>
          u.trim(),
        );
        return availableUsers.includes(username);
      })
      .map((row) => ({
        id: row.ID,
        kbKey: row.KB_KEY,
        name: row.NAME,
        description: row.DESCRIPTION || undefined,
        apiKey: row.API_KEY,
        apiUrl: row.API_URL,
        availableUsers: row.AVAILABLE_USERS || undefined,
        canSelectModel: !!row.CAN_SELECT_MODEL,
        enabled: row.ENABLED,
        sortOrder: row.SORT_ORDER,
        createdAt: formatLocalDateTime(row.CREATED_AT),
        updatedAt: formatLocalDateTime(row.UPDATED_AT),
      }));
  }

  /**
   * 获取所有启用的知识库列表，按排序字段排序（管理员用）
   */
  async findAllEnabled(): Promise<KnowledgeBaseEntity[]> {
    const rows = await this.db.queryWithErrorHandling<{
      ID: string;
      KB_KEY: string;
      NAME: string;
      DESCRIPTION: string;
      API_KEY: string;
      API_URL: string;
      AVAILABLE_USERS: string;
      CAN_SELECT_MODEL: boolean;
      ENABLED: boolean;
      SORT_ORDER: number;
      CREATED_AT: Date;
      UPDATED_AT: Date;
    }>(
      `SELECT ID, KB_KEY, NAME, DESCRIPTION, API_KEY, API_URL, AVAILABLE_USERS, CAN_SELECT_MODEL, ENABLED, SORT_ORDER, CREATED_AT, UPDATED_AT
       FROM AI_KNOWLEDGE_BASES 
       WHERE ENABLED = 1 
       ORDER BY SORT_ORDER ASC, NAME ASC`,
      [],
      '获取启用的知识库列表',
    );

    return rows.map((row) => ({
      id: row.ID,
      kbKey: row.KB_KEY,
      name: row.NAME,
      description: row.DESCRIPTION || undefined,
      apiKey: row.API_KEY,
      apiUrl: row.API_URL,
      availableUsers: row.AVAILABLE_USERS || undefined,
      canSelectModel: !!row.CAN_SELECT_MODEL,
      enabled: row.ENABLED,
      sortOrder: row.SORT_ORDER,
      createdAt: formatLocalDateTime(row.CREATED_AT),
      updatedAt: formatLocalDateTime(row.UPDATED_AT),
    }));
  }

  /**
   * 根据KB_KEY获取知识库信息
   */
  async findByKbKey(kbKey: string): Promise<KnowledgeBaseEntity | null> {
    const rows = await this.db.queryWithErrorHandling<{
      ID: string;
      KB_KEY: string;
      NAME: string;
      DESCRIPTION: string;
      API_KEY: string;
      API_URL: string;
      AVAILABLE_USERS: string;
      CAN_SELECT_MODEL: boolean;
      ENABLED: boolean;
      SORT_ORDER: number;
      CREATED_AT: Date;
      UPDATED_AT: Date;
    }>(
      `SELECT ID, KB_KEY, NAME, DESCRIPTION, API_KEY, API_URL, AVAILABLE_USERS, CAN_SELECT_MODEL, ENABLED, SORT_ORDER, CREATED_AT, UPDATED_AT
       FROM AI_KNOWLEDGE_BASES 
       WHERE KB_KEY = @p0`,
      [kbKey],
      '根据KB_KEY获取知识库信息',
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.ID,
      kbKey: row.KB_KEY,
      name: row.NAME,
      description: row.DESCRIPTION || undefined,
      apiKey: row.API_KEY,
      apiUrl: row.API_URL,
      availableUsers: row.AVAILABLE_USERS || undefined,
      canSelectModel: !!row.CAN_SELECT_MODEL,
      enabled: row.ENABLED,
      sortOrder: row.SORT_ORDER,
      createdAt: formatLocalDateTime(row.CREATED_AT),
      updatedAt: formatLocalDateTime(row.UPDATED_AT),
    };
  }
}
