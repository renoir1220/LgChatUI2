const sql = require('mssql');
const fs = require('fs');
const path = require('path');

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

async function executeMigration() {
  try {
    // 连接数据库
    console.log('连接到数据库...');
    const pool = await sql.connect(config);
    
    // 读取SQL文件
    const sqlFile = path.join(__dirname, 'sql', 'add_knowledge_base_id.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // 分割SQL语句
    const statements = sqlContent
      .split(/(?:^|\s)GO(?:\s|$)/im)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // 执行每个SQL语句
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('执行SQL语句...');
        const result = await pool.request().query(statement);
        console.log('SQL执行结果:', result);
      }
    }
    
    console.log('✅ 数据库迁移完成');
    
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
  } finally {
    sql.close();
  }
}

executeMigration();