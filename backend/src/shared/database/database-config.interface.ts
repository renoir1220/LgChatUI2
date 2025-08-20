/**
 * 数据库连接配置接口
 */
export interface DatabaseConfig {
  server: string;
  database: string;
  user: string;
  password: string;
  port?: number;
  options: {
    enableArithAbort: boolean;
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
  pool: {
    max: number;
    min: number;
    idleTimeoutMillis: number;
  };
}

/**
 * 环境变量前缀配置
 */
export interface DatabaseEnvConfig {
  serverKey: string;
  hostKey: string;
  databaseKey: string;
  userKey: string;
  passwordKey: string;
  portKey: string;
  encryptKey: string;
  trustCertKey: string;
  poolMaxKey: string;
  poolMinKey: string;
  poolIdleKey: string;
}

/**
 * CRM数据库环境变量配置
 */
export const CRM_DATABASE_ENV: DatabaseEnvConfig = {
  serverKey: 'MSSQL_SERVER',
  hostKey: 'MSSQL_HOST',
  databaseKey: 'MSSQL_DATABASE',
  userKey: 'MSSQL_USER',
  passwordKey: 'MSSQL_PASSWORD',
  portKey: 'MSSQL_PORT',
  encryptKey: 'MSSQL_ENCRYPT',
  trustCertKey: 'MSSQL_TRUST_CERT',
  poolMaxKey: 'MSSQL_POOL_MAX',
  poolMinKey: 'MSSQL_POOL_MIN',
  poolIdleKey: 'MSSQL_POOL_IDLE',
};

/**
 * LgChatUI数据库环境变量配置
 */
export const LGCHATUI_DATABASE_ENV: DatabaseEnvConfig = {
  serverKey: 'LGCHATUI_MSSQL_SERVER',
  hostKey: 'LGCHATUI_MSSQL_HOST',
  databaseKey: 'LGCHATUI_MSSQL_DATABASE',
  userKey: 'LGCHATUI_MSSQL_USER',
  passwordKey: 'LGCHATUI_MSSQL_PASSWORD',
  portKey: 'LGCHATUI_MSSQL_PORT',
  encryptKey: 'LGCHATUI_MSSQL_ENCRYPT',
  trustCertKey: 'LGCHATUI_MSSQL_TRUST_CERT',
  poolMaxKey: 'LGCHATUI_MSSQL_POOL_MAX',
  poolMinKey: 'LGCHATUI_MSSQL_POOL_MIN',
  poolIdleKey: 'LGCHATUI_MSSQL_POOL_IDLE',
};
