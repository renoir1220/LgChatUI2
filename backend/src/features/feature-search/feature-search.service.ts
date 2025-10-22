import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { CrmDatabaseService, LgChatUIDatabaseService } from '../../shared/database/database.service';
import { AppLoggerService } from '../../shared/services/logger.service';
import {
  FeatureSearchResult,
} from './dto/feature-search.dto';

interface SearchGroup {
  or: string[];
}

interface FeatureSearchHistoryOptions {
  userId?: string;
  rawKeywords?: string;
}

export interface FeatureSearchHistoryItem {
  rawKeywords: string;
  normalizedKeywords: SearchGroup[] | null;
  lastUsedAt: string;
  resultCount: number | null;
}

export interface FeatureSearchPopularItem extends FeatureSearchHistoryItem {
  usageCount: number;
}

@Injectable()
export class FeatureSearchService {
  private readonly MAX_RECORDS = 200;

  constructor(
    private readonly databaseService: CrmDatabaseService,
    private readonly lgChatDatabase: LgChatUIDatabaseService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(FeatureSearchService.name);
  }

  async searchFeatures(
    keywordGroups: SearchGroup[],
    options: FeatureSearchHistoryOptions = {},
  ): Promise<FeatureSearchResult[]> {
    const params: string[] = [];

    const buildConditions = (field: string) =>
      keywordGroups
        .map((group) => {
          if (group.or.length === 0) {
            return null; // Should not happen if frontend sends valid groups
          }
          if (group.or.length === 1) {
            params.push(`%${group.or[0]}%`);
            return `${field} LIKE @p${params.length - 1}`;
          }
          return `(${group.or
            .map((keyword) => {
              params.push(`%${keyword}%`);
              return `${field} LIKE @p${params.length - 1}`;
            })
            .join(' OR ')})`;
        })
        .filter(Boolean)
        .join(' AND ');

    const switchConditions = buildConditions(`ISNULL(src.switch, '')`);
    const releaseNoteConditions = buildConditions(`ISNULL(src.release_note, '')`);

    const keywordCondition =
      keywordGroups.length === 0 || (switchConditions === '' && releaseNoteConditions === '')
        ? ''
        : `
      WHERE (
        (${switchConditions})
        OR
        (${releaseNoteConditions})
      )
    `;

    const sql = `
      WITH readme_unified AS (
        SELECT
          r.customer_name,
          r.module_name,
          r.function1 AS feature_name,
          r.site_type,
          r.ver,
          r.switch,
          r.product_type,
          r.ver_date,
          COALESCE(r.function1, '') +
            CASE
              WHEN r.switch IS NOT NULL AND LTRIM(RTRIM(r.switch)) <> ''
                THEN N'；参数开关：' + r.switch
              ELSE ''
            END AS release_note
        FROM BUS_README_LIST r
      ),
      xq_unified AS (
        SELECT
          x.customer_name,
          NULL AS module_name,
          x.xq_name AS feature_name,
          NULL AS site_type,
          NULL AS ver,
          NULL AS switch,
          COALESCE(x.cpyz_cp_readme, '') AS release_note,
          x.xq_code,
          x.product_type,
          x.content AS requirement_content,
          x.xqpg_yhgs AS requirement_review,
          x.xqsj_sjnr AS requirement_design,
          x.create_user_name,
          x.create_time,
          x.dhthj_name
        FROM BUS_XQ x
      )
      SELECT TOP (${this.MAX_RECORDS})
        src.source_label AS sourceTable,
        src.customer_name AS customerName,
        src.module_name AS moduleName,
        src.feature_name AS featureName,
        src.product_type AS productType,
        src.release_note AS releaseNote,
        src.switch AS parameterSwitch,
        src.ver AS version,
        src.site_type AS siteType,
        src.xq_code AS requirementCode,
        src.requirement_content AS requirementContent,
        src.requirement_review AS requirementReview,
        src.requirement_design AS requirementDesign,
        src.create_user_name AS createdBy,
        src.create_time AS createdAt,
        src.dhthj_name AS status,
        src.publish_time AS publishTime
      FROM (
        SELECT
          N'BUS_XQ' AS source_table,
          N'需求(新)' AS source_label,
          customer_name,
          module_name,
          feature_name,
          product_type,
          release_note,
          switch,
          ver,
          site_type,
          xq_code,
          requirement_content,
          requirement_review,
          requirement_design,
          create_user_name,
          create_time,
          dhthj_name,
          create_time AS publish_time
        FROM xq_unified
        UNION ALL
        SELECT
          N'BUS_README_LIST' AS source_table,
          N'Readme' AS source_label,
          customer_name,
          module_name,
          feature_name,
          product_type,
          release_note,
          switch,
          ver,
          site_type,
          NULL AS xq_code,
          NULL AS requirement_content,
          NULL AS requirement_review,
          NULL AS requirement_design,
          NULL AS create_user_name,
          NULL AS create_time,
          NULL AS dhthj_name,
          ver_date AS publish_time
        FROM readme_unified
      ) src
      ${keywordCondition}
      ORDER BY src.customer_name, src.module_name, src.feature_name;
    `;

    try {
      const rows = await this.databaseService.queryWithErrorHandling<any>(
        sql,
        params,
        '功能点统一查询',
      );

      const items: FeatureSearchResult[] = (rows || []).map((row) => ({
        sourceTable: row.sourceTable,
        customerName: row.customerName ?? null,
        moduleName: row.moduleName ?? null,
        featureName: row.featureName ?? null,
        productType: row.productType ?? null,
        releaseNote: row.releaseNote ?? null,
        parameterSwitch: row.parameterSwitch ?? null,
        version: row.version ? String(row.version) : null,
        siteType: row.siteType ?? null,
        requirementCode: row.requirementCode ?? null,
        requirementContent: row.requirementContent ?? null,
        requirementReview: row.requirementReview ?? null,
        requirementDesign: row.requirementDesign ?? null,
        createdBy: row.createdBy ?? null,
        createdAt: row.createdAt
          ? this.formatDate(row.createdAt)
          : null,
        status: row.status ?? null,
        publishedAt: row.publishTime
          ? this.formatDate(row.publishTime)
          : null,
      }));

      this.logger.log('功能查询成功', {
        keywordGroups: keywordGroups,
        recordCount: items.length,
      });

      await this.recordSearchHistory({
        keywordGroups,
        options,
        resultCount: items.length,
      });

      return items;
    } catch (error) {
      this.logger.error('功能查询数据库错误', error, {
        keywordGroups,
      });
      throw error;
    }
  }

  async getUserHistory(userId: string, limit: number): Promise<FeatureSearchHistoryItem[]> {
    const sql = `
      WITH ranked AS (
        SELECT
          raw_keywords,
          normalized_keywords,
          result_count,
          created_at,
          ROW_NUMBER() OVER (
            PARTITION BY COALESCE(
              NULLIF(query_signature, ''),
              CONVERT(varchar(128), HASHBYTES('SHA2_256', ISNULL(normalized_keywords, raw_keywords)), 2)
            )
            ORDER BY created_at DESC
          ) AS rn
        FROM dbo.user_feature_search_history
        WHERE user_id = @p0
      )
      SELECT TOP (@p1)
        raw_keywords AS rawKeywords,
        normalized_keywords AS normalizedKeywords,
        result_count AS resultCount,
        created_at AS createdAt
      FROM ranked
      WHERE rn = 1
      ORDER BY created_at DESC;
    `;

    const rows = await this.lgChatDatabase.query(sql, userId, limit);
    return (rows || []).map((row: any) => ({
      rawKeywords: row.rawKeywords ?? '',
      normalizedKeywords: this.parseNormalizedKeywords(row.normalizedKeywords),
      resultCount: row.resultCount ?? null,
      lastUsedAt: this.formatDate(row.createdAt),
    }));
  }

  async getPopularQueries(limit: number, days: number): Promise<FeatureSearchPopularItem[]> {
    const sql = `
      WITH history AS (
        SELECT
          raw_keywords,
          normalized_keywords,
          result_count,
          created_at,
          COALESCE(
            NULLIF(query_signature, ''),
            CONVERT(varchar(128), HASHBYTES('SHA2_256', ISNULL(normalized_keywords, raw_keywords)), 2)
          ) AS group_key
        FROM dbo.user_feature_search_history
        WHERE created_at >= DATEADD(DAY, -@p1, SYSUTCDATETIME())
      ),
      latest AS (
        SELECT
          group_key,
          raw_keywords,
          normalized_keywords,
          result_count,
          created_at,
          ROW_NUMBER() OVER (PARTITION BY group_key ORDER BY created_at DESC) AS rn
        FROM history
      ),
      aggregated AS (
        SELECT
          group_key,
          COUNT(*) AS usageCount,
          MAX(created_at) AS lastUsedAt
        FROM history
        GROUP BY group_key
      )
      SELECT TOP (@p0)
        a.group_key,
        l.raw_keywords AS rawKeywords,
        l.normalized_keywords AS normalizedKeywords,
        l.result_count AS resultCount,
        a.usageCount,
        a.lastUsedAt
      FROM aggregated a
      JOIN latest l
        ON l.group_key = a.group_key AND l.rn = 1
      ORDER BY a.usageCount DESC, a.lastUsedAt DESC;
    `;

    const rows = await this.lgChatDatabase.query(sql, limit, days);
    return (rows || []).map((row: any) => ({
      rawKeywords: row.rawKeywords ?? '',
      normalizedKeywords: this.parseNormalizedKeywords(row.normalizedKeywords),
      resultCount: row.resultCount ?? null,
      lastUsedAt: this.formatDate(row.lastUsedAt),
      usageCount: row.usageCount ?? 0,
    }));
  }

  async getLatestFeatures(days: number, limit: number): Promise<FeatureSearchResult[]> {
    const sql = `
      WITH readme_unified AS (
        SELECT
          r.customer_name,
          r.module_name,
          r.function1 AS feature_name,
          r.site_type,
          r.ver,
          r.switch,
          r.product_type,
          r.ver_date,
          COALESCE(r.function1, '') +
            CASE
              WHEN r.switch IS NOT NULL AND LTRIM(RTRIM(r.switch)) <> ''
                THEN N'；参数开关：' + r.switch
              ELSE ''
            END AS release_note
        FROM BUS_README_LIST r
      ),
      xq_unified AS (
        SELECT
          x.customer_name,
          NULL AS module_name,
          x.xq_name AS feature_name,
          NULL AS site_type,
          NULL AS ver,
          NULL AS switch,
          COALESCE(x.cpyz_cp_readme, '') AS release_note,
          x.xq_code,
          x.product_type,
          x.content AS requirement_content,
          x.xqpg_yhgs AS requirement_review,
          x.xqsj_sjnr AS requirement_design,
          x.create_user_name,
          x.create_time,
          x.dhthj_name
        FROM BUS_XQ x
      )
      SELECT TOP (@p1)
        src.source_label AS sourceTable,
        src.customer_name AS customerName,
        src.module_name AS moduleName,
        src.feature_name AS featureName,
        src.product_type AS productType,
        src.release_note AS releaseNote,
        src.switch AS parameterSwitch,
        src.ver AS version,
        src.site_type AS siteType,
        src.xq_code AS requirementCode,
        src.requirement_content AS requirementContent,
        src.requirement_review AS requirementReview,
        src.requirement_design AS requirementDesign,
        src.create_user_name AS createdBy,
        src.create_time AS createdAt,
        src.dhthj_name AS status,
        src.publish_time AS publishTime
      FROM (
        SELECT
          N'BUS_XQ' AS source_table,
          N'需求(新)' AS source_label,
          customer_name,
          module_name,
          feature_name,
          product_type,
          release_note,
          switch,
          ver,
          site_type,
          xq_code,
          requirement_content,
          requirement_review,
          requirement_design,
          create_user_name,
          create_time,
          dhthj_name,
          create_time AS publish_time
        FROM xq_unified
        UNION ALL
        SELECT
          N'BUS_README_LIST' AS source_table,
          N'Readme' AS source_label,
          customer_name,
          module_name,
          feature_name,
          product_type,
          release_note,
          switch,
          ver,
          site_type,
          NULL AS xq_code,
          NULL AS requirement_content,
          NULL AS requirement_review,
          NULL AS requirement_design,
          NULL AS create_user_name,
          NULL AS create_time,
          NULL AS dhthj_name,
          ver_date AS publish_time
        FROM readme_unified
      ) src
      WHERE src.publish_time IS NOT NULL
        AND src.publish_time >= DATEADD(DAY, -@p0, SYSUTCDATETIME())
      ORDER BY src.publish_time DESC, src.customer_name, src.feature_name;
    `;

    const rows = await this.databaseService.queryWithErrorHandling<any>(
      sql,
      [days, limit],
      '最新功能查询',
    );

    return (rows || []).map((row) => ({
      sourceTable: row.sourceTable,
      customerName: row.customerName ?? null,
      moduleName: row.moduleName ?? null,
      featureName: row.featureName ?? null,
      productType: row.productType ?? null,
      releaseNote: row.releaseNote ?? null,
      parameterSwitch: row.parameterSwitch ?? null,
      version: row.version ? String(row.version) : null,
      siteType: row.siteType ?? null,
      requirementCode: row.requirementCode ?? null,
      requirementContent: row.requirementContent ?? null,
      requirementReview: row.requirementReview ?? null,
      requirementDesign: row.requirementDesign ?? null,
      createdBy: row.createdBy ?? null,
      createdAt: row.createdAt
        ? this.formatDate(row.createdAt)
        : null,
      status: row.status ?? null,
      publishedAt: row.publishTime
        ? this.formatDate(row.publishTime)
        : null,
    }));
  }

  private async recordSearchHistory(payload: {
    keywordGroups: SearchGroup[];
    options: FeatureSearchHistoryOptions;
    resultCount: number;
  }): Promise<void> {
    const { keywordGroups, options, resultCount } = payload;
    const userId = options.userId;
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      this.logger.warn('功能查询历史未记录：缺少用户ID', {
        reason: 'missing_user_id',
        resultCount,
      });
      return;
    }

    const normalizedGroups = this.normalizeKeywordGroupsForHistory(keywordGroups);
    const normalizedJson = JSON.stringify(normalizedGroups);
    const signature = this.createKeywordSignature(normalizedGroups);

    const rawKeywordsInput = (options.rawKeywords || '').trim();
    const fallbackRaw = normalizedGroups
      .map((group) => group.or.join(' OR '))
      .join(' AND ');
    const storedRawKeywords = rawKeywordsInput.length > 0 ? rawKeywordsInput : (fallbackRaw || '[empty]');

    const insertSql = `
      INSERT INTO dbo.user_feature_search_history
        (user_id, raw_keywords, normalized_keywords, query_signature, result_count)
      VALUES (@p0, @p1, @p2, @p3, @p4);
    `;

    try {
      await this.lgChatDatabase.query(
        insertSql,
        userId,
        storedRawKeywords,
        normalizedJson,
        signature ?? null,
        resultCount,
      );
    } catch (error) {
      this.logger.error('记录功能查询历史失败', (error as Error).stack, {
        userId,
        resultCount,
        rawKeywords: storedRawKeywords,
      });
    }
  }

  private normalizeKeywordGroupsForHistory(groups: SearchGroup[]): SearchGroup[] {
    const cleaned = groups
      .map((group) => {
        const uniqueKeywords = Array.from(
          new Set(
            (group.or || [])
              .map((keyword) => (typeof keyword === 'string' ? keyword.trim() : ''))
              .filter((keyword) => keyword.length > 0),
          ),
        ).sort((a, b) => a.localeCompare(b, 'zh-CN'));

        return {
          or: uniqueKeywords,
        };
      })
      .filter((group) => group.or.length > 0);

    cleaned.sort((a, b) => {
      const left = a.or.join('|');
      const right = b.or.join('|');
      return left.localeCompare(right, 'zh-CN');
    });

    return cleaned;
  }

  private createKeywordSignature(groups: SearchGroup[]): string | null {
    if (!groups || groups.length === 0) {
      return null;
    }
    const canonical = groups
      .map((group) => group.or.join('|'))
      .join('&&');

    if (!canonical) {
      return null;
    }

    return createHash('sha256').update(canonical).digest('hex');
  }

  private parseNormalizedKeywords(value: string | null | undefined): SearchGroup[] | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        return null;
      }
      const groups: SearchGroup[] = parsed
        .map((group: any) => {
          if (!group || !Array.isArray(group.or)) {
            return null;
          }
          const keywords = group.or
            .map((kw: any) => (typeof kw === 'string' ? kw : ''))
            .filter((kw: string) => kw.trim().length > 0);
          if (keywords.length === 0) {
            return null;
          }
          return { or: keywords };
        })
        .filter((g: SearchGroup | null): g is SearchGroup => g !== null);
      return groups.length > 0 ? groups : null;
    } catch (error) {
      this.logger.warn('解析归一化关键字失败', {
        error: (error as Error).message,
      });
      return null;
    }
  }

  private formatDate(value: Date | string): string {
    if (!value) return '';
    if (value instanceof Date) {
      return value.toISOString();
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toISOString();
  }
}
