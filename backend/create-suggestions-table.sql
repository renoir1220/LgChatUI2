-- 创建建议表 T_AI_SUGGESTIONS
-- 数据库: LgChatUI数据库 (请根据实际环境调整数据库名)

-- USE your_lgchatui_database;

-- 如果表存在则删除
IF OBJECT_ID('T_AI_SUGGESTIONS', 'U') IS NOT NULL
    DROP TABLE T_AI_SUGGESTIONS;

-- 创建建议表
CREATE TABLE T_AI_SUGGESTIONS (
    SUGGESTION_ID uniqueidentifier PRIMARY KEY DEFAULT NEWID(),    -- 建议ID (主键)
    SUBMITTER_NAME nvarchar(100) NOT NULL,                        -- 提交人姓名
    TITLE nvarchar(200) NOT NULL,                                 -- 标题
    CONTENT nvarchar(2000) NOT NULL,                             -- 建议内容
    DEVELOPER_REPLY nvarchar(2000) NULL,                         -- 开发回复
    STATUS int NOT NULL DEFAULT 0,                               -- 解决状态 (0-新提交, 1-已解决, 9-不做)
    CREATED_AT datetime2(7) NOT NULL DEFAULT GETUTCDATE(),       -- 创建时间
    UPDATED_AT datetime2(7) NOT NULL DEFAULT GETUTCDATE(),       -- 最后更新日期
);

-- 创建索引
CREATE INDEX IX_T_AI_SUGGESTIONS_STATUS ON T_AI_SUGGESTIONS(STATUS);
CREATE INDEX IX_T_AI_SUGGESTIONS_SUBMITTER_NAME ON T_AI_SUGGESTIONS(SUBMITTER_NAME);
CREATE INDEX IX_T_AI_SUGGESTIONS_CREATED_AT ON T_AI_SUGGESTIONS(CREATED_AT DESC);

-- 插入测试数据
INSERT INTO T_AI_SUGGESTIONS (SUBMITTER_NAME, TITLE, CONTENT, STATUS) VALUES
('刘冬阳', '添加深色主题支持', '希望能够添加深色主题，在夜间使用时更加舒适', 0),
('张三', '优化聊天响应速度', '聊天回复有时候比较慢，希望能优化一下响应速度', 1),
('李四', '增加文件上传功能', '希望能支持上传文档进行分析讨论', 0);

-- 验证表结构
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'T_AI_SUGGESTIONS'
ORDER BY ORDINAL_POSITION;

-- 查看测试数据
SELECT 
    CONVERT(varchar(36), SUGGESTION_ID) AS id,
    SUBMITTER_NAME AS submitterName,
    TITLE AS title,
    CONTENT AS content,
    DEVELOPER_REPLY AS developerReply,
    STATUS AS status,
    CONVERT(varchar(33), CREATED_AT, 126) AS createdAt,
    CONVERT(varchar(33), UPDATED_AT, 126) AS updatedAt
FROM T_AI_SUGGESTIONS
ORDER BY CREATED_AT DESC;