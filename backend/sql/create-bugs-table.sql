-- 创建BUG表 T_AI_BUGS
-- 数据库: LgChatUI数据库 (注意：使用LgChatUI数据库，而非CRM数据库)

-- USE your_lgchatui_database;

-- 如果表存在则删除
IF OBJECT_ID('T_AI_BUGS', 'U') IS NOT NULL
    DROP TABLE T_AI_BUGS;

-- 创建BUG表
CREATE TABLE T_AI_BUGS (
    BUG_ID uniqueidentifier PRIMARY KEY DEFAULT NEWID(),         -- BUG编号 (主键)
    TITLE nvarchar(200) NOT NULL,                               -- 标题
    CONTENT nvarchar(2000) NOT NULL,                            -- BUG描述内容
    SUBMITTER_NAME nvarchar(100) NOT NULL,                      -- 提交人姓名
    ASSIGNEE_ID nvarchar(50) NULL,                              -- 指派人ID (可选)
    ASSIGNEE_NAME nvarchar(100) NULL,                           -- 指派人姓名 (可选)
    PRIORITY int NOT NULL DEFAULT 2,                            -- 优先级 (1-低, 2-中, 3-高, 4-紧急)
    STATUS int NOT NULL DEFAULT 0,                              -- 状态 (0-新提交, 1-处理中, 2-已解决, 9-不做)
    IMAGES nvarchar(max) NULL,                                  -- 图片URL列表 (JSON格式, 最多5张)
    DEVELOPER_REPLY nvarchar(2000) NULL,                        -- 开发回复
    CREATED_AT datetime2(7) NOT NULL DEFAULT GETUTCDATE(),      -- 创建时间
    UPDATED_AT datetime2(7) NOT NULL DEFAULT GETUTCDATE(),      -- 最后更新时间
);

-- 创建索引以提高查询性能
CREATE INDEX IX_T_AI_BUGS_STATUS ON T_AI_BUGS(STATUS);
CREATE INDEX IX_T_AI_BUGS_PRIORITY ON T_AI_BUGS(PRIORITY);
CREATE INDEX IX_T_AI_BUGS_SUBMITTER_NAME ON T_AI_BUGS(SUBMITTER_NAME);
CREATE INDEX IX_T_AI_BUGS_ASSIGNEE_ID ON T_AI_BUGS(ASSIGNEE_ID);
CREATE INDEX IX_T_AI_BUGS_CREATED_AT ON T_AI_BUGS(CREATED_AT DESC);

-- 添加表注释和字段注释
EXEC sp_addextendedproperty 
    'MS_Description', 'BUG管理表，用于存储系统BUG相关信息',
    'SCHEMA', 'dbo', 'TABLE', 'T_AI_BUGS';

EXEC sp_addextendedproperty 
    'MS_Description', 'BUG编号，主键',
    'SCHEMA', 'dbo', 'TABLE', 'T_AI_BUGS', 'COLUMN', 'BUG_ID';

EXEC sp_addextendedproperty 
    'MS_Description', '标题',
    'SCHEMA', 'dbo', 'TABLE', 'T_AI_BUGS', 'COLUMN', 'TITLE';

EXEC sp_addextendedproperty 
    'MS_Description', 'BUG描述内容',
    'SCHEMA', 'dbo', 'TABLE', 'T_AI_BUGS', 'COLUMN', 'CONTENT';

EXEC sp_addextendedproperty 
    'MS_Description', '提交人姓名',
    'SCHEMA', 'dbo', 'TABLE', 'T_AI_BUGS', 'COLUMN', 'SUBMITTER_NAME';

EXEC sp_addextendedproperty 
    'MS_Description', '指派人ID',
    'SCHEMA', 'dbo', 'TABLE', 'T_AI_BUGS', 'COLUMN', 'ASSIGNEE_ID';

EXEC sp_addextendedproperty 
    'MS_Description', '指派人姓名',
    'SCHEMA', 'dbo', 'TABLE', 'T_AI_BUGS', 'COLUMN', 'ASSIGNEE_NAME';

EXEC sp_addextendedproperty 
    'MS_Description', '优先级 (1-低, 2-中, 3-高, 4-紧急)',
    'SCHEMA', 'dbo', 'TABLE', 'T_AI_BUGS', 'COLUMN', 'PRIORITY';

EXEC sp_addextendedproperty 
    'MS_Description', '状态 (0-新提交, 1-处理中, 2-已解决, 9-不做)',
    'SCHEMA', 'dbo', 'TABLE', 'T_AI_BUGS', 'COLUMN', 'STATUS';

EXEC sp_addextendedproperty 
    'MS_Description', '图片URL列表，JSON格式，最多5张',
    'SCHEMA', 'dbo', 'TABLE', 'T_AI_BUGS', 'COLUMN', 'IMAGES';

EXEC sp_addextendedproperty 
    'MS_Description', '开发回复',
    'SCHEMA', 'dbo', 'TABLE', 'T_AI_BUGS', 'COLUMN', 'DEVELOPER_REPLY';

EXEC sp_addextendedproperty 
    'MS_Description', '创建时间',
    'SCHEMA', 'dbo', 'TABLE', 'T_AI_BUGS', 'COLUMN', 'CREATED_AT';

EXEC sp_addextendedproperty 
    'MS_Description', '最后更新时间',
    'SCHEMA', 'dbo', 'TABLE', 'T_AI_BUGS', 'COLUMN', 'UPDATED_AT';

-- 插入测试数据
INSERT INTO T_AI_BUGS (TITLE, CONTENT, SUBMITTER_NAME, PRIORITY, STATUS, IMAGES) VALUES
('登录页面无法正常跳转', '在Chrome浏览器中，点击登录按钮后页面没有响应，网络请求正常但页面不跳转。复现步骤：1.打开登录页 2.输入用户名密码 3.点击登录按钮', '刘冬阳', 3, 0, '["http://example.com/bug1.jpg", "http://example.com/bug2.jpg"]'),
('聊天记录偶尔丢失', '用户反馈聊天记录有时候会丢失，特别是在长时间对话后。需要排查数据库存储和缓存机制。', '张三', 2, 1, '[]'),
('语音合成功能在iOS设备异常', 'iOS设备上语音合成功能经常卡住不播放，但在Android设备正常。可能是WebKit相关问题。', '李四', 4, 0, '["http://example.com/ios_bug.png"]'),
('文件上传大小限制提示不明确', '当用户上传超过限制大小的文件时，错误提示信息不够明确，用户体验较差。', '王五', 1, 2, '[]');

-- 验证表结构
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'T_AI_BUGS'
ORDER BY ORDINAL_POSITION;

-- 查看测试数据
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
ORDER BY CREATED_AT DESC;

-- 查看所有索引
SELECT 
    i.name AS 索引名称,
    i.type_desc AS 索引类型,
    c.name AS 列名
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('T_AI_BUGS')
ORDER BY i.name, ic.key_ordinal;