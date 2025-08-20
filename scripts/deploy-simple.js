#!/usr/bin/env node

/**
 * 简化部署脚本 - 构建优先的部署流程
 * 
 * 流程：
 * 1. 确保构建产物存在
 * 2. 构建Docker镜像
 * 3. 部署容器
 * 4. 验证部署
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SimpleDeployment {
  constructor() {
    this.rootDir = process.cwd();
  }

  exec(command, options = {}) {
    console.log(`🔧 执行: ${command}`);
    try {
      return execSync(command, { 
        encoding: 'utf8', 
        stdio: 'inherit',
        ...options 
      });
    } catch (error) {
      console.error(`❌ 命令失败: ${command}`);
      throw error;
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  checkBuildArtifacts() {
    console.log('🔍 检查构建产物...');
    
    const requiredFiles = [
      'backend/dist/main.js',
      'frontend/dist/index.html'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(this.rootDir, file))) {
        console.log(`📦 构建产物不存在: ${file}`);
        return false;
      }
    }
    
    console.log('✅ 所有构建产物存在');
    return true;
  }

  async run() {
    console.log('🚀 开始简化部署流程...\n');

    try {
      // 1. 检查或创建构建产物
      if (!this.checkBuildArtifacts()) {
        console.log('📦 执行构建...');
        this.exec('node scripts/build.js');
      }

      // 2. 停止现有服务
      console.log('🛑 停止现有服务...');
      try {
        this.exec('docker-compose -f docker-compose.prod.yml down');
      } catch (error) {
        console.log('📝 没有运行中的服务');
      }

      // 3. 构建并启动
      console.log('🐳 构建并启动服务...');
      this.exec('docker-compose -f docker-compose.prod.yml up -d --build');

      // 4. 等待服务启动
      console.log('⏳ 等待服务启动...');
      await this.sleep(30000); // 等待30秒

      // 5. 验证部署
      console.log('🔍 验证部署...');
      try {
        this.exec('curl -f http://localhost:8080/health');
        console.log('✅ 健康检查通过');
      } catch (error) {
        console.log('⚠️ 健康检查失败，但服务可能仍在启动中');
      }

      console.log('\n🎉 部署完成！');
      console.log('📍 应用地址: http://localhost:8080');
      console.log('📊 查看日志: docker-compose -f docker-compose.prod.yml logs -f');

    } catch (error) {
      console.error('\n💥 部署失败:', error.message);
      console.log('🔍 查看错误详情: docker-compose -f docker-compose.prod.yml logs');
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const deployment = new SimpleDeployment();
  deployment.run();
}

module.exports = SimpleDeployment;