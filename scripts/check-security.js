#!/usr/bin/env node

/**
 * 安全配置检查脚本
 * 用于检查配置文件中的敏感信息
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 敏感信息模式
const SENSITIVE_PATTERNS = [
    {
        pattern: /192\.168\.[0-9]+\.[0-9]+/g,
        name: '内网IP地址',
        severity: 'high'
    },
    {
        pattern: /your-actual-password-pattern/g,
        name: '真实密码',
        severity: 'critical'
    },
    {
        pattern: /your-actual-username-pattern/g,
        name: '真实用户名',
        severity: 'high'
    },
    {
        pattern: /your-actual-database-pattern/g,
        name: '真实数据库名',
        severity: 'medium'
    },
    {
        pattern: /[A-Za-z0-9]{32,}/g,
        name: '可能的密钥',
        severity: 'medium'
    }
];

// 需要检查的文件类型
const FILE_EXTENSIONS = ['.md', '.js', '.ts', '.json', '.env'];

// 排除的目录
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git'];

/**
 * 递归扫描目录
 */
function scanDirectory(dir, results = []) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            if (!EXCLUDE_DIRS.includes(file)) {
                scanDirectory(filePath, results);
            }
        } else {
            const ext = path.extname(file);
            if (FILE_EXTENSIONS.includes(ext) && !file.includes('.local.')) {
                results.push(filePath);
            }
        }
    }
    
    return results;
}

/**
 * 检查文件内容
 */
function checkFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const issues = [];
        
        for (const { pattern, name, severity } of SENSITIVE_PATTERNS) {
            const matches = content.match(pattern);
            if (matches) {
                issues.push({
                    file: filePath,
                    pattern: name,
                    severity,
                    matches: [...new Set(matches)] // 去重
                });
            }
        }
        
        return issues;
    } catch (error) {
        console.warn(`无法读取文件: ${filePath}`, error.message);
        return [];
    }
}

/**
 * 主函数
 */
function main() {
    console.log('🔍 开始安全配置检查...\n');
    
    const projectRoot = path.resolve(__dirname, '..');
    const files = scanDirectory(projectRoot);
    
    let totalIssues = 0;
    const criticalIssues = [];
    
    for (const file of files) {
        const issues = checkFile(file);
        totalIssues += issues.length;
        
        for (const issue of issues) {
            const relativePath = path.relative(projectRoot, issue.file);
            const severityIcon = {
                critical: '🚨',
                high: '⚠️',
                medium: '💡'
            }[issue.severity] || 'ℹ️';
            
            console.log(`${severityIcon} ${issue.severity.toUpperCase()}: ${relativePath}`);
            console.log(`   模式: ${issue.pattern}`);
            console.log(`   匹配: ${issue.matches.join(', ')}`);
            console.log('');
            
            if (issue.severity === 'critical') {
                criticalIssues.push(issue);
            }
        }
    }
    
    // 总结
    console.log('📊 检查总结:');
    console.log(`   扫描文件: ${files.length}`);
    console.log(`   发现问题: ${totalIssues}`);
    console.log(`   严重问题: ${criticalIssues.length}`);
    
    if (criticalIssues.length > 0) {
        console.log('\n🚫 发现严重安全问题！请立即处理：');
        for (const issue of criticalIssues) {
            console.log(`   - ${path.relative(projectRoot, issue.file)}: ${issue.pattern}`);
        }
        console.log('\n建议操作：');
        console.log('   1. 将敏感信息移动到 *.local.* 文件');
        console.log('   2. 更新 .gitignore 忽略敏感文件');
        console.log('   3. 使用环境变量替代硬编码值');
        
        process.exit(1);
    } else if (totalIssues > 0) {
        console.log('\n⚠️ 发现潜在安全问题，请检查并处理');
        process.exit(1);
    } else {
        console.log('\n✅ 未发现安全问题！');
        process.exit(0);
    }
}

// 运行检查
if (require.main === module) {
    main();
}

module.exports = { scanDirectory, checkFile, SENSITIVE_PATTERNS };