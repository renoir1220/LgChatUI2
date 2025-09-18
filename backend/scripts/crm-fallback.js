#!/usr/bin/env node

/**
 * 登录验证降级模式管理脚本
 * 用于在开发环境中控制登录API的降级行为（仅影响登录验证，不影响其他CRM功能）
 *
 * 使用方法：
 * node scripts/crm-fallback.js [command]
 *
 * 命令：
 * - enable: 启用登录绕过模式（仅登录验证使用开发环境配置）
 * - disable: 禁用登录降级模式（使用真实CRM登录验证）
 * - auto: 启用自动降级模式（登录API失败时自动降级）
 * - status: 查看当前状态
 * - test: 测试CRM登录API连接状态
 */

const fs = require('fs');
const path = require('path');

// 环境变量文件路径
const envPath = path.join(__dirname, '..', '.env');

// 读取当前环境变量
function readEnvFile() {
  if (!fs.existsSync(envPath)) {
    console.log('📝 .env文件不存在，将创建新文件');
    return {};
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};

  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key] = valueParts.join('=');
      }
    }
  });

  return env;
}

// 写入环境变量文件
function writeEnvFile(env) {
  const lines = [];

  // 保持现有内容的顺序，只更新特定的CRM配置
  const existingContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const existingLines = existingContent.split('\n');

  const crmKeys = ['CRM_BYPASS_ENABLED', 'CRM_AUTO_FALLBACK', 'NODE_ENV'];
  const processedKeys = new Set();

  // 保持原有行的顺序，替换CRM相关配置
  existingLines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key] = trimmed.split('=');
      if (crmKeys.includes(key)) {
        if (env[key] !== undefined) {
          lines.push(`${key}=${env[key]}`);
          processedKeys.add(key);
        }
      } else {
        lines.push(line);
      }
    } else {
      lines.push(line);
    }
  });

  // 添加新的CRM配置
  crmKeys.forEach(key => {
    if (!processedKeys.has(key) && env[key] !== undefined) {
      lines.push(`${key}=${env[key]}`);
    }
  });

  fs.writeFileSync(envPath, lines.join('\n'));
}

// 测试CRM连接
async function testCrmConnection() {
  console.log('🔍 测试CRM API连接状态...\n');

  try {
    // 动态导入需要的模块
    const axios = require('axios');

    const crmUrl = process.env.CRM_API_URL || '192.168.200.114:8777';
    const testUrl = `http://${crmUrl}/api/User/AICheckLogin`;

    console.log(`📡 测试地址: ${testUrl}`);

    const start = Date.now();
    const response = await axios.head(testUrl, {
      timeout: 5000,
      validateStatus: () => true // 允许所有状态码
    });
    const duration = Date.now() - start;

    console.log(`✅ CRM API 可访问`);
    console.log(`   状态码: ${response.status}`);
    console.log(`   响应时间: ${duration}ms`);
    console.log(`   建议: 可以禁用降级模式，使用真实CRM验证\n`);

    return true;
  } catch (error) {
    console.log(`❌ CRM API 连接失败:`);
    console.log(`   错误: ${error.message}`);
    console.log(`   建议: 启用降级模式继续开发\n`);

    return false;
  }
}

// 显示当前状态
function showStatus() {
  const env = readEnvFile();

  console.log('📊 登录验证降级模式状态\n');
  console.log(`🌍 环境: ${env.NODE_ENV || 'development'}`);
  console.log(`🚦 登录绕过模式: ${env.CRM_BYPASS_ENABLED === 'true' ? '✅ 启用' : '❌ 禁用'}`);
  console.log(`🔄 登录自动降级: ${env.CRM_AUTO_FALLBACK === 'true' ? '✅ 启用' : '❌ 禁用'}`);
  console.log(`🔗 CRM登录API: ${env.CRM_API_URL || '192.168.200.114:8777'}\n`);

  if (env.CRM_BYPASS_ENABLED === 'true') {
    console.log('🟡 当前处于登录绕过模式：登录验证使用开发环境配置');
    console.log('💡 其他CRM功能仍使用真实CRM连接');
  } else if (env.CRM_AUTO_FALLBACK === 'true') {
    console.log('🟠 当前处于登录自动降级模式：登录API失败时自动降级');
    console.log('💡 其他CRM功能不受影响');
  } else {
    console.log('🟢 当前处于正常模式：所有功能使用真实CRM');
  }

  console.log('\n📋 可用的开发登录用户:');
  console.log('   - ldy (密码: sys123)');
  console.log('   - dev (密码: dev123)');
  console.log('   - admin (密码: admin123)');
}

// 启用绕过模式
function enableBypass() {
  const env = readEnvFile();
  env.NODE_ENV = 'development';
  env.CRM_BYPASS_ENABLED = 'true';
  env.CRM_AUTO_FALLBACK = 'false';

  writeEnvFile(env);
  console.log('✅ 登录绕过模式已启用');
  console.log('💡 登录验证将使用开发环境配置，其他CRM功能正常');
  console.log('🔄 请重启后端服务以使配置生效');
}

// 禁用降级模式
function disable() {
  const env = readEnvFile();
  env.CRM_BYPASS_ENABLED = 'false';
  env.CRM_AUTO_FALLBACK = 'false';

  writeEnvFile(env);
  console.log('✅ 登录降级模式已禁用');
  console.log('💡 所有功能都将使用真实CRM');
  console.log('🔄 请重启后端服务以使配置生效');
}

// 启用自动降级模式
function enableAuto() {
  const env = readEnvFile();
  env.NODE_ENV = 'development';
  env.CRM_BYPASS_ENABLED = 'false';
  env.CRM_AUTO_FALLBACK = 'true';

  writeEnvFile(env);
  console.log('✅ 登录自动降级模式已启用');
  console.log('💡 系统会先尝试真实CRM登录，失败时自动降级');
  console.log('🔄 请重启后端服务以使配置生效');
}

// 主函数
async function main() {
  const command = process.argv[2];

  console.log('🛠️  CRM降级模式管理工具\n');

  switch (command) {
    case 'enable':
      enableBypass();
      break;

    case 'disable':
      disable();
      break;

    case 'auto':
      enableAuto();
      break;

    case 'status':
      showStatus();
      break;

    case 'test':
      await testCrmConnection();
      break;

    default:
      console.log('📖 使用方法:');
      console.log('   node scripts/crm-fallback.js [command]\n');
      console.log('📋 可用命令:');
      console.log('   enable  - 启用CRM绕过模式（完全跳过CRM）');
      console.log('   auto    - 启用自动降级模式（CRM失败时降级）');
      console.log('   disable - 禁用所有降级模式（仅使用CRM）');
      console.log('   status  - 查看当前配置状态');
      console.log('   test    - 测试CRM连接状态\n');
      console.log('💡 建议的使用流程:');
      console.log('   1. 运行 test 检查CRM状态');
      console.log('   2. 如果CRM不可用，运行 enable 或 auto');
      console.log('   3. 开发完成后，运行 disable 恢复正常模式');
      break;
  }
}

// 运行
main().catch(console.error);