/**
 * 后端数据库操作模式示例
 * 展示数据库连接、仓储模式和数据操作的最佳实践
 */

// ✅ 数据库服务配置示例
export class DatabaseService {
  private pool: ConnectionPool;
  private readonly logger = new AppLoggerService();

  constructor() {
    this.logger.setContext('DatabaseService');
    this.initializePool();
  }

  private async initializePool() {
    const config = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      },
      options: {
        trustServerCertificate: true,
        enableArithAbort: true
      }
    };

    try {
      this.pool = new ConnectionPool(config);
      await this.pool.connect();
      this.logger.log('数据库连接池初始化成功');
    } catch (error) {
      this.logger.error('数据库连接失败', error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    try {
      const request = this.pool.request();
      
      // 参数化查询防止SQL注入
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });

      const result = await request.query(sql);
      return result.recordset;
    } catch (error) {
      this.logger.error('数据库查询失败', error instanceof Error ? error.stack : undefined, {
        sql: sql.substring(0, 100), // 记录部分SQL用于调试
        paramCount: params.length
      });
      throw error;
    }
  }
}

// ✅ 仓储模式示例 - 会话管理
export class ConversationsRepository {
  constructor(private db: DatabaseService) {}

  async createConversation(
    userId: string,
    title: string,
    knowledgeBaseId?: string
  ): Promise<Conversation> {
    const sql = `
      INSERT INTO T_AI_CONVERSATION (id, user_id, title, knowledge_base_id, created_at, updated_at)
      OUTPUT INSERTED.*
      VALUES (@param0, @param1, @param2, @param3, GETDATE(), GETDATE())
    `;
    
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const params = [conversationId, userId, title, knowledgeBaseId];
    
    const result = await this.db.query(sql, params);
    return this.mapToConversation(result[0]);
  }

  async listByUser(userId: string, page: number, pageSize: number): Promise<Conversation[]> {
    const offset = (page - 1) * pageSize;
    
    const sql = `
      SELECT * FROM T_AI_CONVERSATION 
      WHERE user_id = @param0 
      ORDER BY updated_at DESC
      OFFSET @param1 ROWS 
      FETCH NEXT @param2 ROWS ONLY
    `;
    
    const params = [userId, offset, pageSize];
    const result = await this.db.query(sql, params);
    
    return result.map(row => this.mapToConversation(row));
  }

  async updateTitle(conversationId: string, title: string): Promise<Conversation> {
    const sql = `
      UPDATE T_AI_CONVERSATION 
      SET title = @param1, updated_at = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @param0
    `;
    
    const result = await this.db.query(sql, [conversationId, title]);
    if (result.length === 0) {
      throw new NotFoundException('Conversation not found');
    }
    
    return this.mapToConversation(result[0]);
  }

  async delete(conversationId: string): Promise<void> {
    const sql = `DELETE FROM T_AI_CONVERSATION WHERE id = @param0`;
    await this.db.query(sql, [conversationId]);
  }

  private mapToConversation(row: any): Conversation {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      knowledgeBaseId: row.knowledge_base_id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  }
}

// ✅ 仓储模式示例 - 消息管理
export class MessagesRepository {
  constructor(private db: DatabaseService) {}

  async append(
    conversationId: string,
    role: ChatRole,
    content: string,
    userId?: string
  ): Promise<ChatMessage> {
    const sql = `
      INSERT INTO T_AI_MESSAGE (id, conversation_id, role, content, user_id, created_at)
      OUTPUT INSERTED.*
      VALUES (@param0, @param1, @param2, @param3, @param4, GETDATE())
    `;
    
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const params = [messageId, conversationId, role, content, userId];
    
    const result = await this.db.query(sql, params);
    return this.mapToMessage(result[0]);
  }

  async listByConversation(
    conversationId: string,
    page: number,
    pageSize: number
  ): Promise<ChatMessage[]> {
    const offset = (page - 1) * pageSize;
    
    const sql = `
      SELECT * FROM T_AI_MESSAGE 
      WHERE conversation_id = @param0 
      ORDER BY created_at ASC
      OFFSET @param1 ROWS 
      FETCH NEXT @param2 ROWS ONLY
    `;
    
    const params = [conversationId, offset, pageSize];
    const result = await this.db.query(sql, params);
    
    return result.map(row => this.mapToMessage(row));
  }

  async isConversationOwnedByUser(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as count 
      FROM T_AI_CONVERSATION 
      WHERE id = @param0 AND user_id = @param1
    `;
    
    const result = await this.db.query(sql, [conversationId, userId]);
    return result[0]?.count > 0;
  }

  private mapToMessage(row: any): ChatMessage {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role as ChatRole,
      content: row.content,
      createdAt: row.created_at.toISOString(),
    };
  }
}

// ✅ 用户仓储示例
export class UsersRepository {
  constructor(private db: DatabaseService) {}

  async findByUsername(username: string): Promise<User | null> {
    const sql = `SELECT * FROM T_AI_USER WHERE username = @param0`;
    const result = await this.db.query(sql, [username]);
    
    if (result.length === 0) {
      return null;
    }
    
    return this.mapToUser(result[0]);
  }

  async createOrUpdate(userData: Partial<User>): Promise<User> {
    const sql = `
      MERGE T_AI_USER AS target
      USING (VALUES (@param0, @param1, @param2)) AS source (username, display_name, roles)
      ON target.username = source.username
      WHEN MATCHED THEN
        UPDATE SET display_name = source.display_name, roles = source.roles, updated_at = GETDATE()
      WHEN NOT MATCHED THEN
        INSERT (id, username, display_name, roles, created_at, updated_at)
        VALUES (@param3, source.username, source.display_name, source.roles, GETDATE(), GETDATE())
      OUTPUT INSERTED.*;
    `;
    
    const userId = `user_${userData.username}`;
    const params = [
      userData.username,
      userData.displayName || userData.username,
      JSON.stringify(userData.roles || []),
      userId
    ];
    
    const result = await this.db.query(sql, params);
    return this.mapToUser(result[0]);
  }

  private mapToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      roles: row.roles ? JSON.parse(row.roles) : [],
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  }
}

// ✅ 事务处理示例
export class TransactionService {
  constructor(private db: DatabaseService) {}

  async createConversationWithMessage(
    userId: string,
    title: string,
    initialMessage: string
  ): Promise<{ conversation: Conversation; message: ChatMessage }> {
    const transaction = this.db.pool.transaction();
    
    try {
      await transaction.begin();
      
      // 1. 创建会话
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createConvSql = `
        INSERT INTO T_AI_CONVERSATION (id, user_id, title, created_at, updated_at)
        OUTPUT INSERTED.*
        VALUES (@param0, @param1, @param2, GETDATE(), GETDATE())
      `;
      
      const convResult = await transaction.request()
        .input('param0', conversationId)
        .input('param1', userId)
        .input('param2', title)
        .query(createConvSql);
      
      // 2. 创建初始消息
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createMsgSql = `
        INSERT INTO T_AI_MESSAGE (id, conversation_id, role, content, user_id, created_at)
        OUTPUT INSERTED.*
        VALUES (@param0, @param1, @param2, @param3, @param4, GETDATE())
      `;
      
      const msgResult = await transaction.request()
        .input('param0', messageId)
        .input('param1', conversationId)
        .input('param2', 'user')
        .input('param3', initialMessage)
        .input('param4', userId)
        .query(createMsgSql);
      
      await transaction.commit();
      
      return {
        conversation: this.mapToConversation(convResult.recordset[0]),
        message: this.mapToMessage(msgResult.recordset[0])
      };
      
    } catch (error) {
      await transaction.rollback();
      this.logger.error('事务执行失败', error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}