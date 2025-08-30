import { Injectable } from '@nestjs/common';
import { LgChatUIDatabaseService } from '../../shared/database/database.service';
import { AppLoggerService } from '../../shared/services/logger.service';
import type {
  Suggestion,
  CreateSuggestionRequest,
  UpdateSuggestionRequest,
  SuggestionQuery,
} from '../../types';

@Injectable()
export class SuggestionsRepository {
  constructor(
    private readonly db: LgChatUIDatabaseService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * 创建建议
   */
  async create(
    submitterName: string,
    data: CreateSuggestionRequest,
  ): Promise<Suggestion> {
    const sql = `
      DECLARE @id uniqueidentifier = NEWID();
      INSERT INTO AI_SUGGESTIONS (
        SUGGESTION_ID, SUBMITTER_NAME, TITLE, CONTENT, 
        STATUS, CREATED_AT, UPDATED_AT
      )
      VALUES (
        @id, @p0, @p1, @p2,
        0, GETDATE(), GETDATE()
      );
      
      SELECT 
        CONVERT(varchar(36), @id) AS id,
        @p0 AS submitterName,
        @p1 AS title,
        @p2 AS content,
        NULL AS developerReply,
        0 AS status,
        CONVERT(varchar(33), GETDATE(), 126) AS createdAt,
        CONVERT(varchar(33), GETDATE(), 126) AS updatedAt;
    `;

    try {
      this.logger.log('创建建议', {
        submitterName,
        title: data.title,
        contentLength: data.content.length,
      });

      const result = await this.db.queryWithErrorHandling<{ id: string }>(
        sql,
        [submitterName, data.title, data.content],
        '创建建议',
      );

      this.logger.log('建议创建成功', {
        suggestionId: result[0].id,
        submitterName,
      });

      return result[0] as Suggestion;
    } catch (error) {
      this.logger.error('创建建议失败', error, {
        submitterName,
        title: data.title,
      });
      throw error;
    }
  }

  /**
   * 查询建议列表
   */
  async findMany(query: SuggestionQuery): Promise<{
    suggestions: Suggestion[];
    total: number;
  }> {
    const { page, pageSize, status, submitterName } = query;
    const offset = (page - 1) * pageSize;

    // 构建WHERE条件
    const whereConditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 0;

    if (status !== undefined) {
      whereConditions.push(`STATUS = @p${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (submitterName) {
      whereConditions.push(`SUBMITTER_NAME LIKE @p${paramIndex}`);
      params.push(`%${submitterName}%`);
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total
      FROM AI_SUGGESTIONS
      ${whereClause}
    `;

    // 查询数据
    const dataSql = `
      SELECT 
        CONVERT(varchar(36), SUGGESTION_ID) AS id,
        SUBMITTER_NAME AS submitterName,
        TITLE AS title,
        CONTENT AS content,
        DEVELOPER_REPLY AS developerReply,
        STATUS AS status,
        CONVERT(varchar(33), CREATED_AT, 126) AS createdAt,
        CONVERT(varchar(33), UPDATED_AT, 126) AS updatedAt
      FROM AI_SUGGESTIONS
      ${whereClause}
      ORDER BY CREATED_AT DESC
      OFFSET @p${paramIndex} ROWS
      FETCH NEXT @p${paramIndex + 1} ROWS ONLY
    `;

    try {
      this.logger.log('查询建议列表', {
        page,
        pageSize,
        status,
        submitterName,
      });

      const [countResult, dataResult] = await Promise.all([
        this.db.queryWithErrorHandling<{ total: number }>(
          countSql,
          params,
          '查询建议总数',
        ),
        this.db.queryWithErrorHandling<Suggestion>(
          dataSql,
          [...params, offset, pageSize],
          '查询建议列表',
        ),
      ]);

      const total = countResult[0]?.total || 0;
      const suggestions = dataResult;

      this.logger.log('建议列表查询成功', {
        total,
        count: suggestions.length,
        page,
      });

      return { suggestions, total };
    } catch (error) {
      this.logger.error('查询建议列表失败', error, query);
      throw error;
    }
  }

  /**
   * 根据ID查询建议
   */
  async findById(suggestionId: string): Promise<Suggestion | null> {
    const sql = `
      SELECT 
        CONVERT(varchar(36), SUGGESTION_ID) AS id,
        SUBMITTER_NAME AS submitterName,
        TITLE AS title,
        CONTENT AS content,
        DEVELOPER_REPLY AS developerReply,
        STATUS AS status,
        CONVERT(varchar(33), CREATED_AT, 126) AS createdAt,
        CONVERT(varchar(33), UPDATED_AT, 126) AS updatedAt
      FROM AI_SUGGESTIONS
      WHERE SUGGESTION_ID = @p0
    `;

    try {
      const result = await this.db.queryWithErrorHandling<any>(
        sql,
        [suggestionId],
        '查询建议详情',
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logger.error('查询建议详情失败', error, { suggestionId });
      throw error;
    }
  }

  /**
   * 更新建议（管理员用）
   */
  async update(
    suggestionId: string,
    data: UpdateSuggestionRequest,
  ): Promise<void> {
    const setParts: string[] = [];
    const params: any[] = [];
    let paramIndex = 0;

    if (data.developerReply !== undefined) {
      setParts.push(`DEVELOPER_REPLY = @p${paramIndex}`);
      params.push(data.developerReply);
      paramIndex++;
    }

    if (data.status !== undefined) {
      setParts.push(`STATUS = @p${paramIndex}`);
      params.push(data.status);
      paramIndex++;
    }

    if (setParts.length === 0) {
      return;
    }

    setParts.push(`UPDATED_AT = GETDATE()`);
    params.push(suggestionId);

    const sql = `
      UPDATE AI_SUGGESTIONS 
      SET ${setParts.join(', ')}
      WHERE SUGGESTION_ID = @p${paramIndex}
    `;

    try {
      this.logger.log('更新建议', {
        suggestionId,
        updates: Object.keys(data),
      });

      await this.db.queryWithErrorHandling(sql, params, '更新建议');

      this.logger.log('建议更新成功', { suggestionId });
    } catch (error) {
      this.logger.error('更新建议失败', error, {
        suggestionId,
        updates: Object.keys(data || {}),
      });
      throw error;
    }
  }

  /**
   * 删除建议
   */
  async delete(suggestionId: string): Promise<void> {
    const sql = `DELETE FROM AI_SUGGESTIONS WHERE SUGGESTION_ID = @p0`;

    try {
      this.logger.log('删除建议', { suggestionId });

      await this.db.queryWithErrorHandling<void>(
        sql,
        [suggestionId],
        '删除建议',
      );

      this.logger.log('建议删除成功', { suggestionId });
    } catch (error) {
      this.logger.error('删除建议失败', String(error), { suggestionId });
      throw error;
    }
  }
}
