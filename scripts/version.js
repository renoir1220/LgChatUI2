#!/usr/bin/env node

/**
 * 版本管理脚本 - 自动化语义版本控制
 * 
 * 功能：
 * - 自动检测变更类型（major/minor/patch）
 * - 更新所有workspace的版本号
 * - 生成变更日志
 * - 创建git标签
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VersionManager {
  constructor() {
    this.rootDir = process.cwd();
    this.rootPackage = require(path.join(this.rootDir, 'package.json'));
    this.workspaces = ['backend', 'frontend', 'packages/shared'];
  }

  /**
   * 执行命令并返回输出
   */
  exec(command, options = {}) {
    try {
      return execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        ...options 
      }).trim();
    } catch (error) {
      console.error(`命令执行失败: ${command}`);
      console.error(error.message);
      process.exit(1);
    }
  }

  /**
   * 获取当前版本号
   */
  getCurrentVersion() {
    try {
      return this.exec('git describe --tags --abbrev=0').replace('v', '');
    } catch {
      return '0.0.0'; // 首次发布
    }
  }

  /**
   * 解析语义版本
   */
  parseVersion(version) {
    const [major, minor, patch] = version.split('.').map(Number);
    return { major, minor, patch };
  }

  /**
   * 生成新版本号
   */
  generateNewVersion(type = 'patch') {
    const currentVersion = this.getCurrentVersion();
    const { major, minor, patch } = this.parseVersion(currentVersion);

    switch (type) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
      default:
        return `${major}.${minor}.${patch + 1}`;
    }
  }

  /**
   * 自动检测版本变更类型
   */
  detectVersionType() {
    try {
      // 获取自上次tag以来的提交信息
      const commits = this.exec('git log --oneline --since="$(git describe --tags --abbrev=0)"');
      
      if (commits.includes('BREAKING CHANGE') || commits.includes('feat!')) {
        return 'major';
      } else if (commits.includes('feat(')) {
        return 'minor';
      } else {
        return 'patch';
      }
    } catch {
      return 'patch'; // 默认patch版本
    }
  }

  /**
   * 更新package.json版本
   */
  updatePackageVersion(packagePath, version) {
    const fullPath = path.join(this.rootDir, packagePath, 'package.json');
    const packageJson = require(fullPath);
    packageJson.version = version;
    
    fs.writeFileSync(fullPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✓ 更新 ${packagePath}/package.json 版本至 ${version}`);
  }

  /**
   * 生成变更日志
   */
  generateChangelog(version) {
    const currentVersion = this.getCurrentVersion();
    let commits;
    
    try {
      if (currentVersion === '0.0.0') {
        commits = this.exec('git log --oneline');
      } else {
        commits = this.exec(`git log --oneline v${currentVersion}..HEAD`);
      }
    } catch {
      commits = this.exec('git log --oneline -10'); // 最近10次提交
    }

    const changelog = `# Release v${version}\n\n**发布时间**: ${new Date().toISOString().split('T')[0]}\n\n## 变更内容\n\n${commits.split('\n').map(line => `- ${line}`).join('\n')}\n\n`;

    // 追加到CHANGELOG.md
    const changelogPath = path.join(this.rootDir, 'CHANGELOG.md');
    if (fs.existsSync(changelogPath)) {
      const existingContent = fs.readFileSync(changelogPath, 'utf8');
      fs.writeFileSync(changelogPath, changelog + existingContent);
    } else {
      fs.writeFileSync(changelogPath, changelog);
    }

    console.log(`✓ 更新 CHANGELOG.md`);
  }

  /**
   * 创建发布版本
   */
  async createRelease(type) {
    console.log('🚀 开始创建新版本...\n');

    // 检查工作区是否干净
    try {
      this.exec('git diff --exit-code');
      this.exec('git diff --cached --exit-code');
    } catch {
      console.error('❌ Git工作区不干净，请先提交或暂存变更');
      process.exit(1);
    }

    // 确定版本类型
    const versionType = type || this.detectVersionType();
    const newVersion = this.generateNewVersion(versionType);

    console.log(`📊 版本类型: ${versionType}`);
    console.log(`📦 新版本号: ${newVersion}\n`);

    // 更新所有package.json版本
    console.log('📝 更新版本号...');
    this.updatePackageVersion('.', newVersion);
    this.workspaces.forEach(workspace => {
      this.updatePackageVersion(workspace, newVersion);
    });

    // 生成变更日志
    console.log('\n📋 生成变更日志...');
    this.generateChangelog(newVersion);

    // 提交版本变更
    console.log('\n💾 提交版本变更...');
    this.exec('git add .');
    this.exec(`git commit -m "chore: 发布版本 v${newVersion}

🎉 版本类型: ${versionType}
📦 版本号: v${newVersion}
📅 发布时间: ${new Date().toISOString()}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"`);

    // 创建git标签
    console.log('\n🏷️  创建Git标签...');
    this.exec(`git tag -a v${newVersion} -m "Release v${newVersion}"`);

    console.log(`\n✅ 版本 v${newVersion} 创建成功！`);
    console.log(`\n📋 后续步骤:`);
    console.log(`   1. 执行构建: npm run release:build`);
    console.log(`   2. 执行部署: npm run release:deploy`);
    console.log(`   3. 推送到远程: git push origin main --tags`);
  }
}

// 命令行接口
const command = process.argv[2];
const versionType = process.argv[3];

const manager = new VersionManager();

switch (command) {
  case 'release':
    manager.createRelease(versionType);
    break;
  case 'current':
    console.log(manager.getCurrentVersion());
    break;
  default:
    console.log(`
版本管理工具使用说明:

  npm run version release [type]   创建新版本 (type: major/minor/patch)
  npm run version current          查看当前版本

示例:
  npm run version release patch    创建补丁版本
  npm run version release minor    创建功能版本
  npm run version release major    创建主要版本
`);
}