import { Injectable } from '@nestjs/common';
import { LgChatUIDatabaseService } from '../../shared/database/database.service';
import { AppLoggerService } from '../../shared/services/logger.service';
import type {
  Bug,
  CreateBugRequest,
  UpdateBugRequest,
  BugQuery,
  BugStatus,
  BugPriority,
} from '../../types';

@Injectable()
export class BugsRepository {
  constructor(
    private readonly db: LgChatUIDatabaseService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * 创建BUG
   */
  async create(
    submitterName: string,
    data: CreateBugRequest,
  ): Promise<Bug> {
    const sql = `
      DECLARE @id uniqueidentifier = NEWID();
      INSERT INTO T_AI_BUGS (
        BUG_ID, TITLE, CONTENT, SUBMITTER_NAME, PRIORITY, 
        STATUS, IMAGES, CREATED_AT, UPDATED_AT
      )
      VALUES (
        @id, @p0, @p1, @p2, @p3,
        0, @p4, GETUTCDATE(), GETUTCDATE()
      );
      
      SELECT 
        CONVERT(varchar(36), @id) AS id,
        @p0 AS title,
        @p1 AS content,
        @p2 AS submitterName,
        NULL AS assigneeId,
        NULL AS assigneeName,
        @p3 AS priority,
        0 AS status,
        @p4 AS images,
        NULL AS developerReply,
        CONVERT(varchar(33), GETUTCDATE(), 126) AS createdAt,
        CONVERT(varchar(33), GETUTCDATE(), 126) AS updatedAt;
    `;

    try {
      this.logger.log('创建BUG', {
        submitterName,
        title: data.title,
        contentLength: data.content.length,
        priority: data.priority,
        imageCount: data.images.length,
      });

      const imagesJson = JSON.stringify(data.images);
      const result = await this.db.queryWithErrorHandling<any>(
        sql,
        [data.title, data.content, submitterName, data.priority, imagesJson],
        '创建BUG',
      );

      const bug = result[0];
      // 将JSON字符串转换为数组
      bug.images = JSON.parse(bug.images || '[]');

      this.logger.log('BUG创建成功', {
        bugId: bug.id,
        submitterName,
        title: data.title,
      });

      return bug as Bug;
    } catch (error) {
      this.logger.error('创建BUG失败', error, {
        submitterName,
        title: data.title,
      });
      throw error;
    }
  }

  /**
   * 查询BUG列表
   */
  async findMany(query: BugQuery): Promise<{
    bugs: Bug[];
    total: number;
  }> {
    const { page, pageSize, status, priority, submitterName, assigneeId, title } = query;
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

    if (priority !== undefined) {
      whereConditions.push(`PRIORITY = @p${paramIndex}`);
      params.push(priority);
      paramIndex++;
    }

    if (submitterName) {
      whereConditions.push(`SUBMITTER_NAME LIKE @p${paramIndex}`);
      params.push(`%${submitterName}%`);
      paramIndex++;
    }

    if (assigneeId) {
      whereConditions.push(`ASSIGNEE_ID = @p${paramIndex}`);
      params.push(assigneeId);
      paramIndex++;
    }

    if (title) {
      whereConditions.push(`TITLE LIKE @p${paramIndex}`);
      params.push(`%${title}%`);
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total
      FROM T_AI_BUGS
      ${whereClause}
    `;

    // 查询数据
    const dataSql = `
      SELECT 
        CONVERT(varchar(36), BUG_ID) AS id,
        TITLE AS title,
        CONTENT AS content,
        SUBMITTER_NAME AS submitterName,
        ASSIGNEE_ID AS assigneeId,
        ASSIGNEE_NAME AS assigneeName,
        PRIORITY AS priority,
        STATUS AS status,
        IMAGES AS images,
        DEVELOPER_REPLY AS developerReply,
        CONVERT(varchar(33), CREATED_AT, 126) AS createdAt,
        CONVERT(varchar(33), UPDATED_AT, 126) AS updatedAt
      FROM T_AI_BUGS
      ${whereClause}
      ORDER BY CREATED_AT DESC
      OFFSET @p${paramIndex} ROWS
      FETCH NEXT @p${paramIndex + 1} ROWS ONLY
    `;

    try {
      this.logger.log('查询BUG列表', {
        page,
        pageSize,
        status,
        priority,
        submitterName,
        assigneeId,
        title,
      });

      const [countResult, dataResult] = await Promise.all([
        this.db.queryWithErrorHandling<{ total: number }>(
          countSql,
          params,
          '查询BUG总数',
        ),
        this.db.queryWithErrorHandling<any>(
          dataSql,
          [...params, offset, pageSize],
          '查询BUG列表',
        ),
      ]);

      const total = countResult[0]?.total || 0;
      const bugs = dataResult.map((bug: any) => ({
        ...bug,
        images: JSON.parse(bug.images || '[]'),
      })) as Bug[];

      this.logger.log('BUG列表查询成功', {
        total,
        count: bugs.length,
        page,
      });

      return { bugs, total };
    } catch (error) {
      this.logger.error('查询BUG列表失败', error, query);
      throw error;
    }
  }

  /**
   * 根据ID查询BUG
   */
  async findById(bugId: string): Promise<Bug | null> {
    const sql = `
      SELECT 
        CONVERT(varchar(36), BUG_ID) AS id,
        TITLE AS title,
        CONTENT AS content,
        SUBMITTER_NAME AS submitterName,
        ASSIGNEE_ID AS assigneeId,
        ASSIGNEE_NAME AS assigneeName,
        PRIORITY AS priority,
        STATUS AS status,
        IMAGES AS images,
        DEVELOPER_REPLY AS developerReply,
        CONVERT(varchar(33), CREATED_AT, 126) AS createdAt,
        CONVERT(varchar(33), UPDATED_AT, 126) AS updatedAt
      FROM T_AI_BUGS
      WHERE BUG_ID = @p0
    `;

    try {
      const result = await this.db.queryWithErrorHandling<any>(
        sql,
        [bugId],
        '查询BUG详情',
      );

      if (result.length === 0) {
        return null;
      }

      const bug = result[0];
      bug.images = JSON.parse(bug.images || '[]');

      return bug as Bug;
    } catch (error) {
      this.logger.error('查询BUG详情失败', error, { bugId });
      throw error;
    }
  }

  /**
   * 更新BUG
   */
  async update(
    bugId: string,
    data: UpdateBugRequest,
  ): Promise<void> {
    const setParts: string[] = [];
    const params: any[] = [];
    let paramIndex = 0;

    if (data.title !== undefined) {
      setParts.push(`TITLE = @p${paramIndex}`);
      params.push(data.title);
      paramIndex++;
    }

    if (data.content !== undefined) {
      setParts.push(`CONTENT = @p${paramIndex}`);
      params.push(data.content);
      paramIndex++;
    }

    if (data.assigneeId !== undefined) {
      setParts.push(`ASSIGNEE_ID = @p${paramIndex}`);
      params.push(data.assigneeId);
      paramIndex++;
    }

    if (data.assigneeName !== undefined) {
      setParts.push(`ASSIGNEE_NAME = @p${paramIndex}`);
      params.push(data.assigneeName);
      paramIndex++;
    }

    if (data.priority !== undefined) {
      setParts.push(`PRIORITY = @p${paramIndex}`);
      params.push(data.priority);
      paramIndex++;
    }

    if (data.status !== undefined) {
      setParts.push(`STATUS = @p${paramIndex}`);
      params.push(data.status);
      paramIndex++;
    }

    if (data.developerReply !== undefined) {
      setParts.push(`DEVELOPER_REPLY = @p${paramIndex}`);
      params.push(data.developerReply);
      paramIndex++;
    }

    if (setParts.length === 0) {
      return;
    }

    setParts.push(`UPDATED_AT = GETUTCDATE()`);
    params.push(bugId);

    const sql = `
      UPDATE T_AI_BUGS 
      SET ${setParts.join(', ')}
      WHERE BUG_ID = @p${paramIndex}
    `;

    try {
      this.logger.log('更新BUG', {
        bugId,
        updates: Object.keys(data),
      });

      await this.db.queryWithErrorHandling(sql, params, '更新BUG');

      this.logger.log('BUG更新成功', { bugId });
    } catch (error) {
      this.logger.error('更新BUG失败', error, {
        bugId,
        data,
      });
      throw error;
    }
  }

  /**
   * 删除BUG
   */
  async delete(bugId: string): Promise<void> {
    const sql = `DELETE FROM T_AI_BUGS WHERE BUG_ID = @p0`;

    try {
      this.logger.log('删除BUG', { bugId });

      await this.db.queryWithErrorHandling(sql, [bugId], '删除BUG');

      this.logger.log('BUG删除成功', { bugId });
    } catch (error) {
      this.logger.error('删除BUG失败', error, { bugId });
      throw error;
    }
  }
}