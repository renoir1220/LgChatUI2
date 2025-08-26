import { Injectable } from '@nestjs/common';
import { LgChatUIDatabaseService } from '../../shared/database/database.service';

export interface KnowledgeBaseEntity {
  id: string;
  kbKey: string;
  name: string;
  description?: string;
  apiKey: string;
  apiUrl: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class KnowledgeBaseRepository {
  constructor(private readonly db: LgChatUIDatabaseService) {}

  /**
   * 获取所有启用的知识库列表，按排序字段排序
   */
  async findAllEnabled(): Promise<KnowledgeBaseEntity[]> {
    const rows = await this.db.queryWithErrorHandling<{
      ID: string;
      KB_KEY: string;
      NAME: string;
      DESCRIPTION: string;
      API_KEY: string;
      API_URL: string;
      ENABLED: boolean;
      SORT_ORDER: number;
      CREATED_AT: Date;
      UPDATED_AT: Date;
    }>(
      `SELECT ID, KB_KEY, NAME, DESCRIPTION, API_KEY, API_URL, ENABLED, SORT_ORDER, CREATED_AT, UPDATED_AT
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
      enabled: row.ENABLED,
      sortOrder: row.SORT_ORDER,
      createdAt: row.CREATED_AT.toISOString(),
      updatedAt: row.UPDATED_AT.toISOString(),
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
      ENABLED: boolean;
      SORT_ORDER: number;
      CREATED_AT: Date;
      UPDATED_AT: Date;
    }>(
      `SELECT ID, KB_KEY, NAME, DESCRIPTION, API_KEY, API_URL, ENABLED, SORT_ORDER, CREATED_AT, UPDATED_AT
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
      enabled: row.ENABLED,
      sortOrder: row.SORT_ORDER,
      createdAt: row.CREATED_AT.toISOString(),
      updatedAt: row.UPDATED_AT.toISOString(),
    };
  }
}