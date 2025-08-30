import { Injectable } from '@nestjs/common';
import { LgChatUIDatabaseService } from '../../shared/database/database.service';
import { formatLocalDateTime } from '../../shared/utils/date.util';

export interface AIModelEntity {
  id: string;
  provider: string;
  modelName: string;
  displayName: string;
  isDefault: boolean;
  availableUsers?: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ModelsRepository {
  constructor(private readonly db: LgChatUIDatabaseService) {}

  async findEnabledByUser(username?: string): Promise<AIModelEntity[]> {
    const rows = await this.db.queryWithErrorHandling<{
      ID: string;
      PROVIDER: string;
      MODEL_NAME: string;
      DISPLAY_NAME: string | null;
      IS_DEFAULT: boolean;
      AVAILABLE_USERS: string | null;
      ENABLED: boolean;
      SORT_ORDER: number;
      CREATED_AT: Date;
      UPDATED_AT: Date;
    }>(
      `SELECT ID, PROVIDER, MODEL_NAME, DISPLAY_NAME, IS_DEFAULT, AVAILABLE_USERS, ENABLED, SORT_ORDER, CREATED_AT, UPDATED_AT
       FROM AI_MODEL
       WHERE ENABLED = 1
       ORDER BY SORT_ORDER ASC, PROVIDER ASC, MODEL_NAME ASC`,
      [],
      '获取启用模型列表',
    );

    return rows
      .filter((row) => {
        const au = row.AVAILABLE_USERS;
        if (!au || au.trim() === '') return true; // 全员可见
        if (!username) return false;
        const list = au.split(',').map((x) => x.trim());
        return list.includes(username);
      })
      .map((row) => ({
        id: row.ID,
        provider: row.PROVIDER,
        modelName: row.MODEL_NAME,
        displayName: row.DISPLAY_NAME || row.MODEL_NAME,
        isDefault: !!row.IS_DEFAULT,
        availableUsers: row.AVAILABLE_USERS || undefined,
        enabled: !!row.ENABLED,
        sortOrder: row.SORT_ORDER,
        createdAt: formatLocalDateTime(row.CREATED_AT),
        updatedAt: formatLocalDateTime(row.UPDATED_AT),
      }));
  }

  async findDefaultByUser(username?: string): Promise<AIModelEntity | null> {
    const list = await this.findEnabledByUser(username);
    const found = list.find((m) => m.isDefault);
    return found || null;
  }

  async findById(id: string): Promise<AIModelEntity | null> {
    const rows = await this.db.queryWithErrorHandling<{
      ID: string;
      PROVIDER: string;
      MODEL_NAME: string;
      DISPLAY_NAME: string | null;
      IS_DEFAULT: boolean;
      AVAILABLE_USERS: string | null;
      ENABLED: boolean;
      SORT_ORDER: number;
      CREATED_AT: Date;
      UPDATED_AT: Date;
    }>(
      `SELECT ID, PROVIDER, MODEL_NAME, DISPLAY_NAME, IS_DEFAULT, AVAILABLE_USERS, ENABLED, SORT_ORDER, CREATED_AT, UPDATED_AT
       FROM AI_MODEL WHERE ID = @p0`,
      [id],
      '按ID获取模型',
    );
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.ID,
      provider: row.PROVIDER,
      modelName: row.MODEL_NAME,
      displayName: row.DISPLAY_NAME || row.MODEL_NAME,
      isDefault: !!row.IS_DEFAULT,
      availableUsers: row.AVAILABLE_USERS || undefined,
      enabled: !!row.ENABLED,
      sortOrder: row.SORT_ORDER,
      createdAt: formatLocalDateTime(row.CREATED_AT),
      updatedAt: formatLocalDateTime(row.UPDATED_AT),
    };
  }
}
