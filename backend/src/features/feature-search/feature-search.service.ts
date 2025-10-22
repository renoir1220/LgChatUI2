import { Injectable } from '@nestjs/common';
import { CrmDatabaseService } from '../../shared/database/database.service';
import { AppLoggerService } from '../../shared/services/logger.service';
import {
  FeatureSearchResult,
} from './dto/feature-search.dto';

interface SearchGroup {
  or: string[];
}

@Injectable()
export class FeatureSearchService {
  private readonly MAX_RECORDS = 200;

  constructor(
    private readonly databaseService: CrmDatabaseService,
    private readonly logger: AppLoggerService,
  ) {}

  async searchFeatures(keywordGroups: SearchGroup[]): Promise<FeatureSearchResult[]> {
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
        src.source_table AS sourceTable,
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
        src.dhthj_name AS status
      FROM (
        SELECT
          N'BUS_XQ' AS source_table,
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
          dhthj_name
        FROM xq_unified
        UNION ALL
        SELECT
          N'BUS_README_LIST' AS source_table,
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
          NULL AS dhthj_name
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
      }));

      this.logger.log('功能查询成功', {
        keywordGroups: keywordGroups,
        recordCount: items.length,
      });

      return items;
    } catch (error) {
      this.logger.error('功能查询数据库错误', error, {
        keywordGroups,
      });
      throw error;
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
