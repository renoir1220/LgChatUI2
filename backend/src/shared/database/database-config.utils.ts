import { DatabaseConfig, DatabaseEnvConfig } from './database-config.interface';

/**
 * 通用数据库配置加载器
 * @param envConfig 环境变量配置映射
 * @param dbName 数据库名称（用于错误提示）
 * @returns 数据库配置对象
 */
export function loadDatabaseConfig(
  envConfig: DatabaseEnvConfig,
  dbName: string,
): DatabaseConfig {
  const server =
    process.env[envConfig.serverKey] || process.env[envConfig.hostKey];
  const database = process.env[envConfig.databaseKey];
  const user = process.env[envConfig.userKey];
  const password = process.env[envConfig.passwordKey];
  const port = process.env[envConfig.portKey]
    ? Number(process.env[envConfig.portKey])
    : undefined;
  const encrypt =
    (process.env[envConfig.encryptKey] || '').toLowerCase() === 'true';
  const trustServerCertificate =
    (process.env[envConfig.trustCertKey] || 'true').toLowerCase() === 'true';

  if (!server || !database || !user || !password) {
    throw new Error(
      `${dbName}数据库环境变量未完全配置: ${envConfig.serverKey}/${envConfig.hostKey}, ${envConfig.databaseKey}, ${envConfig.userKey}, ${envConfig.passwordKey}`,
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
      max: process.env[envConfig.poolMaxKey]
        ? Number(process.env[envConfig.poolMaxKey])
        : 10,
      min: process.env[envConfig.poolMinKey]
        ? Number(process.env[envConfig.poolMinKey])
        : 0,
      idleTimeoutMillis: process.env[envConfig.poolIdleKey]
        ? Number(process.env[envConfig.poolIdleKey])
        : 30000,
    },
  };
}
