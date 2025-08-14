const sql = require('mssql');

const config = {
  server: '192.168.200.246',
  user: 'pathnet',
  password: '4s3c2a1p',
  database: 'ai_test',
  options: {
    encrypt: false,
    enableArithAbort: true,
  },
};

async function verifyMigration() {
  try {
    console.log('连接到数据库...');
    const pool = await sql.connect(config);
    
    // 查询表结构
    console.log('检查T_AI_CONVERSATIONS表结构...');
    const result = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        CHARACTER_MAXIMUM_LENGTH,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'T_AI_CONVERSATIONS'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('T_AI_CONVERSATIONS表字段：');
    result.recordset.forEach(column => {
      console.log(`- ${column.COLUMN_NAME} (${column.DATA_TYPE}${column.CHARACTER_MAXIMUM_LENGTH ? `(${column.CHARACTER_MAXIMUM_LENGTH})` : ''}) ${column.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // 检查索引
    console.log('\n检查索引...');
    const indexResult = await pool.request().query(`
      SELECT 
        i.name AS index_name,
        i.type_desc AS index_type,
        c.name AS column_name
      FROM sys.indexes i
      JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE i.object_id = OBJECT_ID('T_AI_CONVERSATIONS')
      AND i.name LIKE '%KNOWLEDGE_BASE_ID%'
    `);
    
    if (indexResult.recordset.length > 0) {
      console.log('KNOWLEDGE_BASE_ID索引：');
      indexResult.recordset.forEach(index => {
        console.log(`- ${index.index_name} (${index.index_type}) on ${index.column_name}`);
      });
    } else {
      console.log('未找到KNOWLEDGE_BASE_ID索引');
    }
    
  } catch (error) {
    console.error('验证失败:', error);
  } finally {
    sql.close();
  }
}

verifyMigration();