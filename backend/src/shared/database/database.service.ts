import { Injectable, Logger } from '@nestjs/common';
import { DatabaseErrorHandler } from './database-error.handler';
import type { DatabaseConfig } from './database-config.interface';
// 兼容占位：避免未安装 mssql 类型时报错（TS2304）
// 后续如已安装 mssql，可删除此别名或改为 type-only import
type ConnectionPool = any;

/**
 * 基础数据库服务类
 * 提供通用的数据库连接和查询功能
 */
@Injectable()
export abstract class BaseDatabaseService {
  protected pool: any | null = null;
  protected connecting = false;

  constructor(
    protected readonly logger: Logger,
    protected readonly dbConfig: DatabaseConfig,
    protected readonly dbName: string,
  ) {}

  async getPool(): Promise<any> {
    if (this.pool && this.pool.connected) return this.pool;
    if (this.connecting) {
      // small wait-loop to avoid parallel connects
      await new Promise((r) => setTimeout(r, 50));
      if (this.pool && this.pool.connected) return this.pool;
    }
    this.connecting = true;
    try {
      // lazy import to avoid requiring mssql when not needed (e.g., tests)
      const sql = require('mssql');
      const pool = new sql.ConnectionPool(this.dbConfig);
      await pool.connect();
      this.pool = pool;
      this.logger.log(`${this.dbName} MSSQL连接成功`);
      return pool;
    } catch (err) {
      this.logger.error(`${this.dbName} MSSQL连接失败`, err);
      throw err;
    } finally {
      this.connecting = false;
    }
  }

  async query<T = any>(
    strings: TemplateStringsArray | string,
    ...params: any[]
  ): Promise<T[]> {
    const pool = await this.getPool();
    const request = pool.request();
    // Simple parameter binding: we expect a string with @p0, @p1 ...
    let sqlText: string;
    if (Array.isArray(strings)) {
      sqlText = strings[0] as string;
    } else {
      sqlText = strings as string;
    }
    params.forEach((val, i) => {
      // 为MSSQL参数推断合适的类型
      const sql = require('mssql');
      let paramType;

      if (typeof val === 'number') {
        if (Number.isInteger(val)) {
          paramType = sql.Int;
        } else {
          paramType = sql.Float;
        }
      } else if (typeof val === 'string') {
        paramType = sql.NVarChar(sql.MAX); // 指定最大长度避免截断
      } else if (typeof val === 'boolean') {
        paramType = sql.Bit;
      } else if (val instanceof Date) {
        paramType = sql.DateTime;
      } else {
        paramType = sql.NVarChar(sql.MAX); // 默认为字符串
      }

      request.input(`p${i}`, paramType, val);
    });
    const start = Date.now();
    try {
      const result: any = await request.query(sqlText);
      return (result?.recordset ?? []) as T[];
    } finally {
      const ms = Date.now() - start;
      const slowMs = Number(process.env.DB_SLOW_MS || 300);
      const logAll =
        (process.env.DB_LOG_QUERIES || '').toLowerCase() === 'true';
      if (logAll || ms >= slowMs) {
        const snippet = sqlText.replace(/\s+/g, ' ').trim().slice(0, 200);
        this.logger.log(
          `[${this.dbName}] SQL ${ms}ms: ${snippet} params=${JSON.stringify(params)}`,
        );
      }
    }
  }

  /**
   * 带错误处理的查询方法
   * 统一处理数据库错误，转换为合适的HTTP异常
   */
  async queryWithErrorHandling<T = any>(
    strings: TemplateStringsArray | string,
    params: any[] = [],
    context: string = '数据库查询',
  ): Promise<T[]> {
    try {
      return await this.query<T>(strings, ...params);
    } catch (error) {
      this.logger.error(`${this.dbName} ${context}失败`, error);
      DatabaseErrorHandler.handleError(error, context);
    }
  }

  async withTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    const pool = await this.getPool();
    const { Transaction } = require('mssql');
    const tx = new Transaction(pool);
    await tx.begin();
    try {
      const res = await fn(tx);
      await tx.commit();
      return res;
    } catch (e) {
      try {
        await tx.rollback();
      } catch {}
      throw e;
    }
  }
}

/**
 * CRM数据库服务
 * 连接到现有的CRM数据库，处理用户认证、客户信息等业务数据
 */
@Injectable()
export class CrmDatabaseService extends BaseDatabaseService {
  constructor() {
    const config = loadCrmConfigFromEnv();
    super(new Logger(CrmDatabaseService.name), config, 'CRM');
  }
}

/**
 * LgChatUI数据库服务
 * 连接到LgChatUI专用数据库，处理聊天会话、消息记录等AI相关数据
 */
@Injectable()
export class LgChatUIDatabaseService extends BaseDatabaseService {
  constructor() {
    const config = loadLgChatUIConfigFromEnv();
    super(new Logger(LgChatUIDatabaseService.name), config, 'LgChatUI');
  }
}

/**
 * 从环境变量加载CRM数据库配置
 */
function loadCrmConfigFromEnv(): DatabaseConfig {
  const server = process.env.MSSQL_SERVER || process.env.MSSQL_HOST;
  const database = process.env.MSSQL_DATABASE;
  const user = process.env.MSSQL_USER;
  const password = process.env.MSSQL_PASSWORD;
  const port = process.env.MSSQL_PORT
    ? Number(process.env.MSSQL_PORT)
    : undefined;
  const encrypt = (process.env.MSSQL_ENCRYPT || '').toLowerCase() === 'true';
  const trustServerCertificate =
    (process.env.MSSQL_TRUST_CERT || 'true').toLowerCase() === 'true';

  if (!server || !database || !user || !password) {
    throw new Error(
      'CRM数据库环境变量未完全配置: MSSQL_SERVER/HOST, MSSQL_DATABASE, MSSQL_USER, MSSQL_PASSWORD',
    );
  }

  return {
    server,
    database,
    user,
    password,
    port,
    options: {
      enableArithAbort: true,
      encrypt,
      trustServerCertificate,
    },
    pool: {
      max: process.env.MSSQL_POOL_MAX ? Number(process.env.MSSQL_POOL_MAX) : 10,
      min: process.env.MSSQL_POOL_MIN ? Number(process.env.MSSQL_POOL_MIN) : 0,
      idleTimeoutMillis: process.env.MSSQL_POOL_IDLE
        ? Number(process.env.MSSQL_POOL_IDLE)
        : 30000,
    },
  };
}

/**
 * 从环境变量加载LgChatUI数据库配置
 */
function loadLgChatUIConfigFromEnv(): DatabaseConfig {
  const server =
    process.env.LGCHATUI_MSSQL_SERVER || process.env.LGCHATUI_MSSQL_HOST;
  const database = process.env.LGCHATUI_MSSQL_DATABASE;
  const user = process.env.LGCHATUI_MSSQL_USER;
  const password = process.env.LGCHATUI_MSSQL_PASSWORD;
  const port = process.env.LGCHATUI_MSSQL_PORT
    ? Number(process.env.LGCHATUI_MSSQL_PORT)
    : undefined;
  const encrypt =
    (process.env.LGCHATUI_MSSQL_ENCRYPT || 'false').toLowerCase() === 'true';
  const trustServerCertificate =
    (process.env.LGCHATUI_MSSQL_TRUST_CERT || 'true').toLowerCase() === 'true';

  if (!server || !database || !user || !password) {
    throw new Error(
      'LgChatUI数据库环境变量未完全配置: LGCHATUI_MSSQL_SERVER/HOST, LGCHATUI_MSSQL_DATABASE, LGCHATUI_MSSQL_USER, LGCHATUI_MSSQL_PASSWORD',
    );
  }

  return {
    server,
    database,
    user,
    password,
    port,
    options: {
      enableArithAbort: true,
      encrypt,
      trustServerCertificate,
    },
    pool: {
      max: process.env.LGCHATUI_MSSQL_POOL_MAX
        ? Number(process.env.LGCHATUI_MSSQL_POOL_MAX)
        : 10,
      min: process.env.LGCHATUI_MSSQL_POOL_MIN
        ? Number(process.env.LGCHATUI_MSSQL_POOL_MIN)
        : 0,
      idleTimeoutMillis: process.env.LGCHATUI_MSSQL_POOL_IDLE
        ? Number(process.env.LGCHATUI_MSSQL_POOL_IDLE)
        : 30000,
    },
  };
}
