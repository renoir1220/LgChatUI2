import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { LgChatUIDatabaseService } from '../../shared/database/database.service';
import { formatLocalDateTime } from '../../shared/utils/date.util';
import { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from './dto/knowledge-base.dto';
import { DatabaseException } from '../../shared/database/database-error.handler';

interface KnowledgeBaseRow {
  ID: string;
  KB_KEY: string;
  NAME: string;
  DESCRIPTION: string | null;
  API_KEY: string;
  API_URL: string;
  AVAILABLE_USERS: string | null;
  CAN_SELECT_MODEL: boolean;
  ENABLED: boolean;
  SORT_ORDER: number;
  CREATED_AT: Date;
  UPDATED_AT: Date;
}

export interface KnowledgeBaseAdminEntity {
  id: string;
  kbKey: string;
  name: string;
  description?: string;
  apiKey: string;
  apiUrl: string;
  availableUsers?: string;
  canSelectModel: boolean;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class KnowledgeBaseAdminService {
  constructor(private readonly db: LgChatUIDatabaseService) {}

  async list(): Promise<KnowledgeBaseAdminEntity[]> {
    const rows = await this.db.queryWithErrorHandling<KnowledgeBaseRow>(
      `SELECT ID, KB_KEY, NAME, DESCRIPTION, API_KEY, API_URL, AVAILABLE_USERS, CAN_SELECT_MODEL, ENABLED, SORT_ORDER, CREATED_AT, UPDATED_AT
       FROM AI_KNOWLEDGE_BASES
       ORDER BY SORT_ORDER ASC, NAME ASC`,
      [],
      '查询知识库列表',
    );

    return rows.map((row) => this.mapRow(row));
  }

  async detail(id: string): Promise<KnowledgeBaseAdminEntity> {
    const rows = await this.db.queryWithErrorHandling<KnowledgeBaseRow>(
      `SELECT ID, KB_KEY, NAME, DESCRIPTION, API_KEY, API_URL, AVAILABLE_USERS, CAN_SELECT_MODEL, ENABLED, SORT_ORDER, CREATED_AT, UPDATED_AT
       FROM AI_KNOWLEDGE_BASES
       WHERE ID = @p0`,
      [id],
      '查询知识库详情',
    );

    const row = rows[0];
    if (!row) {
      throw new NotFoundException('知识库不存在');
    }

    return this.mapRow(row);
  }

  async create(dto: CreateKnowledgeBaseDto): Promise<KnowledgeBaseAdminEntity> {
    const normalizedAvailableUsers = this.normalizeAvailableUsers(dto.availableUsers);
    try {
      await this.db.queryWithErrorHandling(
        `INSERT INTO AI_KNOWLEDGE_BASES (KB_KEY, NAME, DESCRIPTION, API_KEY, API_URL, AVAILABLE_USERS, CAN_SELECT_MODEL, ENABLED, SORT_ORDER)
         VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8)`,
        [
          dto.kbKey.trim(),
          dto.name.trim(),
          this.toNullable(dto.description),
          dto.apiKey.trim(),
          dto.apiUrl.trim(),
          normalizedAvailableUsers,
          dto.canSelectModel,
          dto.enabled,
          dto.sortOrder ?? 100,
        ],
        '创建知识库',
      );

      const created = await this.detailByKbKey(dto.kbKey.trim());
      if (!created) {
        throw new Error('创建知识库存储失败');
      }
      return created;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new BadRequestException('知识库标识已存在，请更换 KB Key');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateKnowledgeBaseDto): Promise<KnowledgeBaseAdminEntity> {
    await this.detail(id); // 确认记录存在

    const sets: string[] = [];
    const values: any[] = [];
    let index = 0;

    if (dto.kbKey !== undefined) {
      sets.push(`KB_KEY = @p${index}`);
      values.push(dto.kbKey.trim());
      index += 1;
    }
    if (dto.name !== undefined) {
      sets.push(`NAME = @p${index}`);
      values.push(dto.name.trim());
      index += 1;
    }
    if (dto.description !== undefined) {
      sets.push(`DESCRIPTION = @p${index}`);
      values.push(this.toNullable(dto.description));
      index += 1;
    }
    if (dto.apiKey !== undefined) {
      sets.push(`API_KEY = @p${index}`);
      values.push(dto.apiKey.trim());
      index += 1;
    }
    if (dto.apiUrl !== undefined) {
      sets.push(`API_URL = @p${index}`);
      values.push(dto.apiUrl.trim());
      index += 1;
    }
    if (dto.availableUsers !== undefined) {
      sets.push(`AVAILABLE_USERS = @p${index}`);
      values.push(this.normalizeAvailableUsers(dto.availableUsers));
      index += 1;
    }
    if (dto.canSelectModel !== undefined) {
      sets.push(`CAN_SELECT_MODEL = @p${index}`);
      values.push(dto.canSelectModel);
      index += 1;
    }
    if (dto.enabled !== undefined) {
      sets.push(`ENABLED = @p${index}`);
      values.push(dto.enabled);
      index += 1;
    }
    if (dto.sortOrder !== undefined) {
      sets.push(`SORT_ORDER = @p${index}`);
      values.push(dto.sortOrder);
      index += 1;
    }

    if (sets.length === 0) {
      return this.detail(id);
    }

    sets.push('UPDATED_AT = GETDATE()');
    values.push(id);

    try {
      await this.db.queryWithErrorHandling(
        `UPDATE AI_KNOWLEDGE_BASES
         SET ${sets.join(', ')}
         WHERE ID = @p${index}`,
        values,
        '更新知识库',
      );
      return this.detail(id);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new BadRequestException('知识库标识已存在，请更换 KB Key');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    await this.detail(id); // 若不存在会抛出 404
    await this.db.queryWithErrorHandling(
      `DELETE FROM AI_KNOWLEDGE_BASES WHERE ID = @p0`,
      [id],
      '删除知识库',
    );
    return { deleted: true };
  }

  private async detailByKbKey(kbKey: string): Promise<KnowledgeBaseAdminEntity | null> {
    const rows = await this.db.queryWithErrorHandling<KnowledgeBaseRow>(
      `SELECT ID, KB_KEY, NAME, DESCRIPTION, API_KEY, API_URL, AVAILABLE_USERS, CAN_SELECT_MODEL, ENABLED, SORT_ORDER, CREATED_AT, UPDATED_AT
       FROM AI_KNOWLEDGE_BASES
       WHERE KB_KEY = @p0`,
      [kbKey],
      '根据KB_KEY查询知识库',
    );
    const row = rows[0];
    return row ? this.mapRow(row) : null;
  }

  private mapRow(row: KnowledgeBaseRow): KnowledgeBaseAdminEntity {
    return {
      id: row.ID,
      kbKey: row.KB_KEY,
      name: row.NAME,
      description: row.DESCRIPTION || undefined,
      apiKey: row.API_KEY,
      apiUrl: row.API_URL,
      availableUsers: row.AVAILABLE_USERS || undefined,
      canSelectModel: !!row.CAN_SELECT_MODEL,
      enabled: !!row.ENABLED,
      sortOrder: row.SORT_ORDER,
      createdAt: formatLocalDateTime(row.CREATED_AT),
      updatedAt: formatLocalDateTime(row.UPDATED_AT),
    };
  }

  private toNullable(value?: string): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private normalizeAvailableUsers(value?: string): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const list = value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    if (list.length === 0) {
      return null;
    }
    return list.join(',');
  }

  private isUniqueViolation(error: unknown): boolean {
    if (error instanceof DatabaseException) {
      const origin = error.originalError;
      const number = typeof origin?.number === 'number' ? origin.number : undefined;
      if (number === 2627 || number === 2601) {
        return true;
      }
      const message = typeof origin?.message === 'string' ? origin.message.toLowerCase() : '';
      return message.includes('duplicate') || message.includes('violation');
    }
    return false;
  }
}
