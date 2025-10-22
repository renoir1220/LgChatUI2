
# 使用说明
1. 用crm数据库服务查询
2. 需要模糊匹配的关键字有:参数开关,产品发布说明，如果用户输入多个关键词，生成的sql应该是  （参数开关 like '%a%' and '%b%' and '%c%') or (产品发布说明 like '%a%' and '%b%' and '%c%')

# 功能点统一查询（需求 + 发布说明）
-- 将 BUS_XQ 与 BUS_README_LIST 的关键信息统一为“功能点”视图。
-- 说明 + 参数开关 组合成产品发布说明，便于 Agent 统一检索。
WITH readme_unified AS (
    SELECT
        r.customer_name,
        r.module_name,
        r.function1 AS feature_name,
        r.site_type,
        r.ver,
        r.switch,
        LEFT(
            r.function1 + CASE
                WHEN r.switch IS NOT NULL AND LTRIM(RTRIM(r.switch)) <> ''
                    THEN '；参数开关：' + r.switch
                ELSE ''
            END,
            4000
        ) AS release_note
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
        LEFT(COALESCE(x.cpyz_cp_readme, ''), 4000) AS release_note,
        x.xq_code,
        x.product_type,
        LEFT(x.content, 4000) AS requirement_content,
        LEFT(x.xqpg_yhgs, 4000) AS requirement_review,
        LEFT(x.xqsj_sjnr, 4000) AS requirement_design,
        x.create_user_name,
        x.create_time,
        x.dhthj_name
    FROM BUS_XQ x
)
SELECT TOP (200)
    src.source_table 数据来源,
    src.customer_name 客户名称,
    src.module_name 模块名称,
    src.feature_name 功能名称,
    src.product_type 产品类型,
    src.release_note 产品发布说明,
    src.switch 参数开关,
    src.ver 版本号,
    src.site_type 站点类型,
    src.xq_code 需求编码,
    src.requirement_content 需求正文,
    src.requirement_review 需求评估,
    src.requirement_design 需求设计,
    src.create_user_name 创建人,
    src.create_time 创建时间,
    src.dhthj_name 当前状态
FROM (
    SELECT
        'BUS_XQ' AS source_table,
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
        'BUS_README_LIST' AS source_table,
        customer_name,
        module_name,
        feature_name,
        NULL AS product_type,
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
ORDER BY src.customer_name, src.module_name, src.feature_name;
