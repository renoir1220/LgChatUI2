#!/usr/bin/env node

/**
 * 统一构建脚本 - 自动化生产环境构建
 * 
 * 功能：
 * - 清理旧的构建产物
 * - 并行构建前后端
 * - 验证构建结果
 * - 生成构建报告
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class BuildManager {
  constructor() {
    this.rootDir = process.cwd();
    this.buildDir = path.join(this.rootDir, 'dist');
    this.startTime = Date.now();
  }

  /**
   * 执行命令并实时输出
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
      process.exit(1);
    }
  }

  /**
   * 并行执行命令
   */
  async execParallel(commands) {
    const processes = commands.map(({ name, command, cwd }) => {
      return new Promise((resolve, reject) => {
        console.log(`🚀 启动 ${name}: ${command}`);
        const child = spawn('npm', command.split(' ').slice(1), {
          cwd: cwd || this.rootDir,
          stdio: ['inherit', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
          stdout += data;
          process.stdout.write(`[${name}] ${data}`);
        });

        child.stderr.on('data', (data) => {
          stderr += data;
          process.stderr.write(`[${name}] ${data}`);
        });

        child.on('close', (code) => {
          if (code === 0) {
            console.log(`✅ ${name} 构建成功`);
            resolve({ name, code, stdout, stderr });
          } else {
            console.error(`❌ ${name} 构建失败 (退出码: ${code})`);
            reject(new Error(`${name} 构建失败`));
          }
        });
      });
    });

    return Promise.all(processes);
  }

  /**
   * 清理构建产物
   */
  clean() {
    console.log('🧹 清理旧的构建产物...');
    
    const dirsToClean = [
      'backend/dist',
      'frontend/dist', 
      'packages/shared/dist',
      'dist'
    ];

    dirsToClean.forEach(dir => {
      const fullPath = path.join(this.rootDir, dir);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`  ✓ 清理 ${dir}/`);
      }
    });
  }

  /**
   * 预构建检查
   */
  preflightCheck() {
    console.log('🔍 执行预构建检查...');

    // 检查依赖是否安装
    if (!fs.existsSync(path.join(this.rootDir, 'node_modules'))) {
      console.log('📦 安装依赖...');
      this.exec('npm install');
    }

    // 类型检查
    console.log('🔎 执行类型检查...');
    try {
      this.exec('npm run typecheck', { stdio: 'pipe' });
      console.log('  ✓ 类型检查通过');
    } catch (error) {
      console.error('❌ 类型检查失败，请修复后再构建');
      process.exit(1);
    }

    // 代码检查（非阻塞）
    console.log('🔍 执行代码检查...');
    try {
      execSync('npm run lint', { 
        encoding: 'utf8', 
        stdio: 'pipe'
      });
      console.log('  ✓ 代码检查通过');
    } catch (error) {
      console.warn('⚠️ 代码检查发现问题，但继续构建（建议稍后修复）');
      console.warn('   可使用 npm run lint:fix 自动修复部分问题');
    }
  }

  /**
   * 执行构建
   */
  async build() {
    console.log('🏗️ 开始构建...\n');

    // 1. 首先构建共享包
    console.log('📦 构建共享包...');
    this.exec('npm run build:shared');

    // 2. 并行构建前后端
    console.log('\n🔄 并行构建前后端...');
    await this.execParallel([
      {
        name: 'Backend',
        command: 'npm run build',
        cwd: path.join(this.rootDir, 'backend')
      },
      {
        name: 'Frontend', 
        command: 'npm run build',
        cwd: path.join(this.rootDir, 'frontend')
      }
    ]);
  }

  /**
   * 验证构建结果
   */
  validateBuild() {
    console.log('\n🔍 验证构建结果...');

    const requiredFiles = [
      'backend/dist/main.js',
      'frontend/dist/index.html',
      'packages/shared/dist/cjs/index.js'
    ];

    let isValid = true;
    requiredFiles.forEach(file => {
      const fullPath = path.join(this.rootDir, file);
      if (fs.existsSync(fullPath)) {
        const size = fs.statSync(fullPath).size;
        console.log(`  ✓ ${file} (${this.formatSize(size)})`);
      } else {
        console.error(`  ❌ 缺失: ${file}`);
        isValid = false;
      }
    });

    if (!isValid) {
      console.error('\n❌ 构建验证失败');
      process.exit(1);
    }
  }

  /**
   * 验证构建完整性
   */
  verifyBuildIntegrity() {
    console.log('\n📦 验证构建完整性...');

    const checks = [
      {
        name: '后端构建产物',
        path: 'backend/dist/main.js',
        required: true
      },
      {
        name: '前端构建产物',
        path: 'frontend/dist/index.html',
        required: true
      },
      {
        name: '共享包CJS构建',
        path: 'packages/shared/dist/cjs/index.js',
        required: true
      },
      {
        name: '共享包ESM构建',
        path: 'packages/shared/dist/esm/index.js',
        required: true
      }
    ];

    let allValid = true;
    checks.forEach(check => {
      const fullPath = path.join(this.rootDir, check.path);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        console.log(`  ✅ ${check.name} (${this.formatSize(stats.size)})`);
      } else if (check.required) {
        console.log(`  ❌ ${check.name} - 缺失`);
        allValid = false;
      } else {
        console.log(`  ⚠️ ${check.name} - 可选文件缺失`);
      }
    });

    if (!allValid) {
      throw new Error('构建完整性验证失败');
    }
  }

  /**
   * 生成构建报告
   */
  generateBuildReport() {
    const buildTime = Date.now() - this.startTime;
    const version = require(path.join(this.rootDir, 'package.json')).version;

    const report = {
      version,
      buildTime: Math.round(buildTime / 1000),
      timestamp: new Date().toISOString(),
      status: 'success',
      environment: process.env.NODE_ENV || 'development'
    };

    console.log('\n📊 构建报告:');
    console.log(`  版本: v${report.version}`);
    console.log(`  耗时: ${report.buildTime}s`);
    console.log(`  环境: ${report.environment}`);
    console.log(`  状态: ✅ 构建成功`);
  }

  /**
   * 获取构建产物信息
   */
  getArtifactInfo() {
    const artifacts = {};

    const scanDir = (dir, prefix = '') => {
      if (!fs.existsSync(dir)) return;

      fs.readdirSync(dir, { withFileTypes: true }).forEach(dirent => {
        const fullPath = path.join(dir, dirent.name);
        const relativePath = prefix + dirent.name;

        if (dirent.isDirectory()) {
          scanDir(fullPath, relativePath + '/');
        } else {
          const stats = fs.statSync(fullPath);
          artifacts[relativePath] = {
            size: stats.size,
            modified: stats.mtime.toISOString()
          };
        }
      });
    };

    scanDir(this.buildDir);
    return artifacts;
  }

  /**
   * 格式化文件大小
   */
  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * 主构建流程
   */
  async run() {
    console.log('🚀 开始生产环境构建...\n');

    try {
      this.clean();
      this.preflightCheck();
      await this.build();
      this.verifyBuildIntegrity();
      this.generateBuildReport();

      console.log('\n✅ 构建完成！');
      console.log(`📦 发布包位置: ${this.buildDir}`);
      
    } catch (error) {
      console.error('\n❌ 构建失败:', error.message);
      process.exit(1);
    }
  }
}

// 执行构建
if (require.main === module) {
  const manager = new BuildManager();
  manager.run();
}

module.exports = BuildManager;