#!/usr/bin/env node

/**
 * 一键部署脚本 - 自动化部署到生产环境
 * 
 * 功能：
 * - 部署前健康检查
 * - 智能部署策略选择
 * - 自动回滚机制
 * - 部署状态监控
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeployManager {
  constructor() {
    this.rootDir = process.cwd();
    this.buildDir = path.join(this.rootDir, 'dist');
    this.deployConfig = this.loadDeployConfig();
  }

  /**
   * 加载部署配置
   */
  loadDeployConfig() {
    const configPath = path.join(this.rootDir, 'deploy.config.js');
    if (fs.existsSync(configPath)) {
      return require(configPath);
    }
    
    // 返回默认配置
    return {
      environments: {
        production: {
          name: '生产环境',
          deployMethod: 'docker',
          docker: {
            composeFile: 'docker-compose.prod.yml',
            serviceName: 'lgchatui2',
            buildArgs: {
              NODE_ENV: 'production'
            },
            environment: {
              NODE_ENV: 'production',
              PORT: 3000,
              DB_HOST: 'host.docker.internal', // 外部数据库
              DB_PORT: 7433
            }
          },
          healthCheck: {
            url: 'http://localhost:3000/health',
            timeout: 10000,
            retries: 5,
            interval: 5000
          },
          backup: {
            enabled: true,
            retentionDays: 7
          }
        },
        staging: {
          name: '测试环境',
          deployMethod: 'pm2',
          backendPath: '/opt/lgchatui2-staging/backend',
          frontendPath: '/var/www/lgchatui2-staging',
          pm2Config: {
            name: 'lgchatui2-staging',
            script: 'dist/main.js',
            instances: 1,
            env: {
              NODE_ENV: 'staging',
              PORT: 3001
            }
          }
        }
      }
    };
  }

  /**
   * 执行命令
   */
  exec(command, options = {}) {
    console.log(`🔧 执行: ${command}`);
    try {
      return execSync(command, { 
        encoding: 'utf8', 
        stdio: 'inherit',
        ...options 
      });
    } catch (error) {
      console.error(`❌ 命令执行失败: ${command}`);
      throw error;
    }
  }

  /**
   * 部署前检查
   */
  async preDeployCheck(env) {
    console.log('🔍 执行部署前检查...');

    // 检查构建产物是否存在
    if (!fs.existsSync(this.buildDir)) {
      console.error('❌ 构建产物不存在，请先执行 npm run release:build');
      process.exit(1);
    }

    // 检查构建报告
    const reportPath = path.join(this.buildDir, 'build-report.json');
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      console.log(`  ✓ 构建版本: v${report.version}`);
      console.log(`  ✓ 构建时间: ${new Date(report.timestamp).toLocaleString()}`);
    }

    // 检查部署目标环境
    const config = this.deployConfig.environments[env];
    if (!config) {
      console.error(`❌ 未找到环境配置: ${env}`);
      process.exit(1);
    }

    console.log(`  ✓ 目标环境: ${config.name}`);
    console.log(`  ✓ 部署方式: ${config.deployMethod}`);

    return config;
  }

  /**
   * Docker部署方式
   */
  async deployWithDocker(config) {
    console.log('🐳 使用Docker部署...');

    const { docker } = config;
    const composeFile = path.join(this.rootDir, docker.composeFile);

    // 检查Docker Compose文件
    if (!fs.existsSync(composeFile)) {
      console.error(`❌ Docker Compose文件不存在: ${docker.composeFile}`);
      process.exit(1);
    }

    // 备份当前运行的容器
    await this.createDockerBackup(config);

    try {
      // 构建新镜像
      console.log('🔨 构建Docker镜像...');
      this.exec(`docker-compose -f ${docker.composeFile} build --no-cache`);

      // 停止旧容器
      console.log('🛑 停止旧容器...');
      this.exec(`docker-compose -f ${docker.composeFile} down`, { stdio: 'pipe' });

      // 启动新容器
      console.log('🚀 启动新容器...');
      this.exec(`docker-compose -f ${docker.composeFile} up -d`);

      // 等待容器启动
      console.log('⏳ 等待服务启动...');
      await new Promise(resolve => setTimeout(resolve, 10000));

    } catch (error) {
      console.error('❌ Docker部署失败，开始回滚...');
      await this.rollbackDocker(config);
      throw error;
    }
  }

  /**
   * PM2部署方式
   */
  async deployWithPM2(config) {
    console.log('🚀 使用PM2部署...');

    // 确保目标目录存在
    this.exec(`mkdir -p ${path.dirname(config.backendPath)}`);
    this.exec(`mkdir -p ${path.dirname(config.frontendPath)}`);

    // 备份当前版本
    await this.createBackup(config);

    try {
      // 部署后端
      console.log('📦 部署后端服务...');
      this.exec(`rsync -av --delete ${this.buildDir}/backend/ ${config.backendPath}/`);
      this.exec(`cp ${this.buildDir}/package.json ${config.backendPath}/`);
      
      // 安装生产依赖
      this.exec(`cd ${config.backendPath} && npm ci --omit=dev`);

      // 重启PM2服务
      console.log('🔄 重启后端服务...');
      try {
        this.exec(`pm2 reload ${config.pm2Config.name}`, { stdio: 'pipe' });
      } catch {
        // 如果reload失败，尝试start
        this.exec(`pm2 start ${config.pm2Config.script} --name ${config.pm2Config.name} --cwd ${config.backendPath}`);
      }

      // 部署前端
      console.log('🌐 部署前端资源...');
      this.exec(`rsync -av --delete ${this.buildDir}/frontend/ ${config.frontendPath}/`);

      // 重载Nginx配置
      if (config.nginx && config.nginx.enabled) {
        console.log('🔄 重载Nginx配置...');
        this.exec('nginx -t && nginx -s reload');
      }

    } catch (error) {
      console.error('❌ 部署失败，开始回滚...');
      await this.rollback(config);
      throw error;
    }
  }

  /**
   * 创建Docker备份
   */
  async createDockerBackup(config) {
    console.log('💾 创建Docker备份...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupTag = `lgchatui2:backup-${timestamp}`;

    try {
      // 备份当前运行的镜像
      this.exec(`docker tag lgchatui2:latest ${backupTag}`, { stdio: 'pipe' });
      this.dockerBackupTag = backupTag;
      console.log(`  ✓ 创建镜像备份: ${backupTag}`);
    } catch (error) {
      console.log('  ⚠️ 没有现有镜像需要备份');
    }
  }

  /**
   * Docker回滚
   */
  async rollbackDocker(config) {
    if (!this.dockerBackupTag) {
      console.error('❌ 没有Docker备份，无法回滚');
      return;
    }

    console.log('🔄 执行Docker回滚...');

    try {
      const { docker } = config;
      
      // 停止当前容器
      this.exec(`docker-compose -f ${docker.composeFile} down`, { stdio: 'pipe' });
      
      // 恢复备份镜像
      this.exec(`docker tag ${this.dockerBackupTag} lgchatui2:latest`);
      
      // 重新启动容器
      this.exec(`docker-compose -f ${docker.composeFile} up -d`);
      
      console.log('✅ Docker回滚成功');
      
    } catch (error) {
      console.error('❌ Docker回滚失败:', error.message);
    }
  }

  /**
   * 创建备份
   */
  async createBackup(config) {
    console.log('💾 创建备份...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `/tmp/lgchatui2-backup-${timestamp}`;

    this.exec(`mkdir -p ${backupDir}`);

    // 备份后端
    if (fs.existsSync(config.backendPath)) {
      this.exec(`cp -r ${config.backendPath} ${backupDir}/backend`);
      console.log('  ✓ 备份后端服务');
    }

    // 备份前端
    if (fs.existsSync(config.frontendPath)) {
      this.exec(`cp -r ${config.frontendPath} ${backupDir}/frontend`);
      console.log('  ✓ 备份前端资源');
    }

    // 保存备份路径
    this.backupPath = backupDir;
    console.log(`  📁 备份路径: ${backupDir}`);
  }

  /**
   * 健康检查
   */
  async healthCheck(config) {
    console.log('🔍 执行健康检查...');

    if (!config.healthCheck) {
      console.log('  ⚠️ 未配置健康检查，跳过');
      return true;
    }

    const { url, timeout, retries } = config.healthCheck;
    
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`  🔍 检查 ${url} (${i + 1}/${retries})`);
        
        const response = this.exec(`curl -f -m ${timeout / 1000} ${url}`, { stdio: 'pipe' });
        
        if (response.includes('"status":"ok"') || response.includes('healthy')) {
          console.log('  ✅ 健康检查通过');
          return true;
        }
        
      } catch (error) {
        console.log(`  ⚠️ 检查失败，等待重试...`);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    console.error('  ❌ 健康检查失败');
    return false;
  }

  /**
   * 回滚操作
   */
  async rollback(config) {
    if (!this.backupPath) {
      console.error('❌ 没有备份，无法回滚');
      return;
    }

    console.log('🔄 执行回滚操作...');

    try {
      // 回滚后端
      if (fs.existsSync(`${this.backupPath}/backend`)) {
        this.exec(`rsync -av --delete ${this.backupPath}/backend/ ${config.backendPath}/`);
        this.exec(`pm2 reload ${config.pm2Config.name}`);
        console.log('  ✓ 后端服务已回滚');
      }

      // 回滚前端
      if (fs.existsSync(`${this.backupPath}/frontend`)) {
        this.exec(`rsync -av --delete ${this.backupPath}/frontend/ ${config.frontendPath}/`);
        console.log('  ✓ 前端资源已回滚');
      }

      // 验证回滚
      const isHealthy = await this.healthCheck(config);
      if (isHealthy) {
        console.log('✅ 回滚成功');
      } else {
        console.error('❌ 回滚后服务仍然异常');
      }

    } catch (error) {
      console.error('❌ 回滚失败:', error.message);
    }
  }

  /**
   * 主部署流程
   */
  async deploy(environment = 'production') {
    console.log(`🚀 开始部署到 ${environment} 环境...\n`);

    try {
      // 部署前检查
      const config = await this.preDeployCheck(environment);

      // 执行部署
      switch (config.deployMethod) {
        case 'docker':
          await this.deployWithDocker(config);
          break;
        case 'pm2':
          await this.deployWithPM2(config);
          break;
        default:
          throw new Error(`不支持的部署方式: ${config.deployMethod}`);
      }

      // 健康检查
      const isHealthy = await this.healthCheck(config);
      if (!isHealthy) {
        await this.rollback(config);
        process.exit(1);
      }

      console.log('\n✅ 部署成功！');
      console.log(`🌐 服务地址: ${config.healthCheck?.url || '请查看配置'}`);

    } catch (error) {
      console.error('\n❌ 部署失败:', error.message);
      process.exit(1);
    }
  }
}

// 命令行接口
const environment = process.argv[2] || 'production';

if (require.main === module) {
  const manager = new DeployManager();
  manager.deploy(environment);
}

module.exports = DeployManager;