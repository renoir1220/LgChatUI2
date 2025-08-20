#!/usr/bin/env node

/**
 * 健康检查脚本 - 监控服务状态和性能
 * 
 * 功能：
 * - 检查服务健康状态
 * - 监控系统资源使用
 * - 数据库连接检查
 * - 自动重启异常服务
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class HealthChecker {
  constructor() {
    this.rootDir = process.cwd();
    this.checkInterval = 30000; // 30秒检查一次
    this.maxFailures = 3; // 最大失败次数
    this.failureCount = 0;
  }

  /**
   * 执行命令
   */
  exec(command, options = {}) {
    try {
      return execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        timeout: 10000,
        ...options 
      }).trim();
    } catch (error) {
      return null;
    }
  }

  /**
   * 检查HTTP服务
   */
  async checkHttpService(url, name) {
    try {
      const response = this.exec(`curl -f -s -m 5 ${url}`);
      if (response && (response.includes('"status":"ok"') || response.includes('healthy'))) {
        console.log(`✅ ${name} 健康`);
        return true;
      } else {
        console.log(`❌ ${name} 响应异常: ${response?.substring(0, 100) || '无响应'}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ ${name} 连接失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 检查Docker容器状态
   */
  checkDockerContainers() {
    console.log('🐳 检查Docker容器状态...');
    
    try {
      const containers = this.exec('docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"');
      if (containers) {
        console.log(containers);
        
        // 检查关键容器是否运行
        const lgchatuiRunning = containers.includes('lgchatui2-app') && containers.includes('Up');
        const nginxRunning = containers.includes('lgchatui2-nginx') && containers.includes('Up');
        
        if (lgchatuiRunning && nginxRunning) {
          console.log('✅ 所有容器正常运行');
          return true;
        } else {
          console.log('❌ 部分容器未运行');
          return false;
        }
      } else {
        console.log('❌ 没有运行的容器');
        return false;
      }
    } catch (error) {
      console.log('❌ Docker检查失败:', error.message);
      return false;
    }
  }

  /**
   * 检查系统资源
   */
  checkSystemResources() {
    console.log('💻 检查系统资源...');
    
    try {
      // 检查内存使用
      const memInfo = this.exec('free -m');
      if (memInfo) {
        const lines = memInfo.split('\n');
        const memLine = lines.find(line => line.startsWith('Mem:'));
        if (memLine) {
          const [, total, used] = memLine.split(/\s+/);
          const memUsage = (used / total * 100).toFixed(1);
          console.log(`  内存使用: ${memUsage}% (${used}MB/${total}MB)`);
          
          if (memUsage > 90) {
            console.log('⚠️ 内存使用率过高');
          }
        }
      }

      // 检查磁盘使用
      const diskInfo = this.exec('df -h /');
      if (diskInfo) {
        const lines = diskInfo.split('\n');
        const diskLine = lines[1];
        if (diskLine) {
          const parts = diskLine.split(/\s+/);
          const usage = parts[4];
          console.log(`  磁盘使用: ${usage}`);
          
          if (parseInt(usage) > 90) {
            console.log('⚠️ 磁盘使用率过高');
          }
        }
      }

      // 检查CPU负载
      const loadAvg = this.exec('uptime');
      if (loadAvg) {
        console.log(`  系统负载: ${loadAvg.split('load average:')[1]?.trim() || '未知'}`);
      }

    } catch (error) {
      console.log('⚠️ 系统资源检查失败:', error.message);
    }
  }

  /**
   * 检查日志文件
   */
  checkLogFiles() {
    console.log('📋 检查日志状态...');
    
    const logDirs = [
      './logs',
      './logs/nginx'
    ];

    logDirs.forEach(dir => {
      const fullPath = path.join(this.rootDir, dir);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        const errorLogs = files.filter(file => file.includes('error'));
        
        if (errorLogs.length > 0) {
          console.log(`  发现错误日志: ${errorLogs.join(', ')}`);
          
          // 检查最近的错误
          errorLogs.forEach(logFile => {
            const logPath = path.join(fullPath, logFile);
            const recentErrors = this.exec(`tail -20 ${logPath} | grep -i error`);
            if (recentErrors) {
              console.log(`    最近错误: ${recentErrors.split('\n').length} 条`);
            }
          });
        }
      }
    });
  }

  /**
   * 自动重启服务
   */
  async restartServices() {
    console.log('🔄 尝试重启服务...');
    
    try {
      // 重启Docker容器
      this.exec('docker-compose -f docker-compose.prod.yml restart');
      console.log('✅ Docker容器重启完成');
      
      // 等待服务启动
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // 验证重启结果
      const isHealthy = await this.checkHttpService('http://localhost:3000/health', '后端服务');
      if (isHealthy) {
        console.log('✅ 服务重启成功');
        this.failureCount = 0;
        return true;
      } else {
        console.log('❌ 服务重启后仍然异常');
        return false;
      }
      
    } catch (error) {
      console.log('❌ 服务重启失败:', error.message);
      return false;
    }
  }

  /**
   * 发送告警通知
   */
  sendAlert(message) {
    console.log(`🚨 告警: ${message}`);
    
    // 记录告警日志
    const alertLog = path.join(this.rootDir, 'logs/alerts.log');
    const logMessage = `${new Date().toISOString()} - ${message}\n`;
    
    try {
      fs.appendFileSync(alertLog, logMessage);
    } catch (error) {
      console.log('⚠️ 无法写入告警日志');
    }

    // TODO: 这里可以添加邮件、短信或webhook通知
    // 例如：发送到企业微信、钉钉、Slack等
  }

  /**
   * 执行完整健康检查
   */
  async performHealthCheck() {
    console.log('\n🔍 开始健康检查...');
    console.log(`时间: ${new Date().toLocaleString()}`);
    
    let allHealthy = true;

    // 1. 检查Docker容器
    const dockerOk = this.checkDockerContainers();
    if (!dockerOk) allHealthy = false;

    // 2. 检查HTTP服务
    const backendOk = await this.checkHttpService('http://localhost:3000/health', '后端服务');
    const frontendOk = await this.checkHttpService('http://localhost:80', '前端服务');
    
    if (!backendOk || !frontendOk) allHealthy = false;

    // 3. 检查系统资源
    this.checkSystemResources();

    // 4. 检查日志
    this.checkLogFiles();

    // 5. 处理健康状态
    if (allHealthy) {
      this.failureCount = 0;
      console.log('\n✅ 所有服务健康');
    } else {
      this.failureCount++;
      console.log(`\n❌ 服务异常 (${this.failureCount}/${this.maxFailures})`);

      if (this.failureCount >= this.maxFailures) {
        this.sendAlert('服务连续异常，尝试自动重启');
        const restartOk = await this.restartServices();
        
        if (!restartOk) {
          this.sendAlert('自动重启失败，需要人工介入');
        }
      }
    }

    return allHealthy;
  }

  /**
   * 启动持续监控
   */
  startMonitoring() {
    console.log('🚀 启动健康检查监控...');
    console.log(`检查间隔: ${this.checkInterval / 1000}秒`);
    
    // 立即执行一次检查
    this.performHealthCheck();

    // 设置定时检查
    setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);
  }

  /**
   * 单次检查
   */
  async checkOnce() {
    return await this.performHealthCheck();
  }
}

// 命令行接口
const command = process.argv[2] || 'once';

const checker = new HealthChecker();

switch (command) {
  case 'monitor':
    checker.startMonitoring();
    break;
  case 'once':
  default:
    checker.checkOnce().then(isHealthy => {
      process.exit(isHealthy ? 0 : 1);
    });
    break;
}

module.exports = HealthChecker;