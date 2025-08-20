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

    // 代码检查
    console.log('🔍 执行代码检查...');
    try {
      this.exec('npm run lint', { stdio: 'pipe' });
      console.log('  ✓ 代码检查通过');
    } catch (error) {
      console.warn('⚠️ 代码检查有警告，但继续构建');
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
      'packages/shared/dist/index.js'
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
   * 创建发布包
   */
  createReleasePackage() {
    console.log('\n📦 创建发布包...');

    // 创建发布目录
    if (fs.existsSync(this.buildDir)) {
      fs.rmSync(this.buildDir, { recursive: true });
    }
    fs.mkdirSync(this.buildDir, { recursive: true });

    // 复制后端构建产物
    const backendDist = path.join(this.rootDir, 'backend/dist');
    const backendTarget = path.join(this.buildDir, 'backend');
    if (fs.existsSync(backendDist)) {
      fs.cpSync(backendDist, backendTarget, { recursive: true });
      console.log('  ✓ 复制后端构建产物');
    }

    // 复制前端构建产物
    const frontendDist = path.join(this.rootDir, 'frontend/dist');
    const frontendTarget = path.join(this.buildDir, 'frontend');
    if (fs.existsSync(frontendDist)) {
      fs.cpSync(frontendDist, frontendTarget, { recursive: true });
      console.log('  ✓ 复制前端构建产物');
    }

    // 复制必要的配置文件
    const configFiles = [
      'package.json',
      'backend/package.json'
    ];

    configFiles.forEach(file => {
      const source = path.join(this.rootDir, file);
      const target = path.join(this.buildDir, file);
      
      if (fs.existsSync(source)) {
        // 确保目标目录存在
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(source, target);
        console.log(`  ✓ 复制 ${file}`);
      }
    });
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
      artifacts: this.getArtifactInfo()
    };

    // 保存构建报告
    const reportPath = path.join(this.buildDir, 'build-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 构建报告:');
    console.log(`  版本: v${report.version}`);
    console.log(`  耗时: ${report.buildTime}s`);
    console.log(`  产物: ${Object.keys(report.artifacts).length} 个文件`);
    console.log(`  报告: ${reportPath}`);
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
      this.validateBuild();
      this.createReleasePackage();
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