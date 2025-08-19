#!/usr/bin/env node

/**
 * 配置文件生成器
 * 用于快速生成不同环境的配置文件
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 提问函数
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// 配置模板
const configTemplates = {
  production: {
    API_BASE: 'http://your-backend-server:3000',
    DEFAULT_DIFY_API_URL: 'http://your-dify-server/v1/chat-messages',
    IMAGE_BASE_URL: '',
    DEBUG_MODE: false,
    VERSION: '1.0.0'
  },
  staging: {
    API_BASE: 'http://staging-backend:3000',
    DEFAULT_DIFY_API_URL: 'http://staging-dify/v1/chat-messages',
    IMAGE_BASE_URL: '',
    DEBUG_MODE: true,
    VERSION: '1.0.0-staging'
  },
  development: {
    API_BASE: 'http://localhost:3000',
    DEFAULT_DIFY_API_URL: 'http://localhost/v1/chat-messages',
    IMAGE_BASE_URL: '',
    DEBUG_MODE: true,
    VERSION: '1.0.0-dev'
  }
};

// 默认知识库配置
const defaultKnowledgeBases = [
  {
    id: 'kb_1',
    name: '仅聊天',
    apiKey: 'app-your-api-key-1',
    apiUrl: 'http://localhost/v1'
  },
  {
    id: 'kb_2',
    name: '集成知识库',
    apiKey: 'app-your-api-key-2',
    apiUrl: 'http://localhost/v1'
  }
];

// 生成配置文件内容
function generateConfigContent(config, knowledgeBases) {
  return `// 应用运行时配置
// 运维可以在部署后直接修改此文件，无需重新构建前端
window.APP_CONFIG = ${JSON.stringify({
    ...config,
    KNOWLEDGE_BASES: knowledgeBases
  }, null, 2)};

// 运维说明：
// 1. 修改配置后直接刷新浏览器即可生效，无需重启服务
// 2. API_BASE 应该指向后端服务地址
// 3. KNOWLEDGE_BASES 数组可以添加或删除知识库配置
// 4. 所有URL都应该使用完整的地址（包含协议和端口）
`;
}

// 交互式配置生成
async function interactiveConfig() {
  console.log('🔧 前端配置文件生成器\n');

  // 选择环境
  console.log('请选择环境类型:');
  console.log('1. 生产环境 (production)');
  console.log('2. 测试环境 (staging)');
  console.log('3. 开发环境 (development)');
  console.log('4. 自定义配置');

  const envChoice = await question('\n请输入选项 (1-4): ');
  
  let config;
  let envType;

  switch (envChoice) {
    case '1':
      config = { ...configTemplates.production };
      envType = 'production';
      break;
    case '2':
      config = { ...configTemplates.staging };
      envType = 'staging';
      break;
    case '3':
      config = { ...configTemplates.development };
      envType = 'development';
      break;
    case '4':
      config = { ...configTemplates.production };
      envType = 'custom';
      break;
    default:
      console.log('无效选项，使用生产环境配置');
      config = { ...configTemplates.production };
      envType = 'production';
  }

  // 配置API地址
  console.log('\n📡 API 配置');
  const apiBase = await question(`后端API地址 [${config.API_BASE}]: `);
  if (apiBase.trim()) {
    config.API_BASE = apiBase.trim();
  }

  const difyUrl = await question(`Dify API地址 [${config.DEFAULT_DIFY_API_URL}]: `);
  if (difyUrl.trim()) {
    config.DEFAULT_DIFY_API_URL = difyUrl.trim();
  }

  const imageBase = await question(`图片服务地址 [${config.IMAGE_BASE_URL || '自动检测'}]: `);
  if (imageBase.trim()) {
    config.IMAGE_BASE_URL = imageBase.trim();
  }

  // 配置知识库
  console.log('\n📚 知识库配置');
  const knowledgeBases = [];
  let addMore = true;
  let kbIndex = 1;

  while (addMore) {
    console.log(`\n配置知识库 #${kbIndex}:`);
    
    const kbName = await question('知识库名称: ');
    if (!kbName.trim()) {
      break;
    }

    const kbApiKey = await question('API Key: ');
    const kbApiUrl = await question(`API URL [${config.API_BASE}/v1]: `);

    knowledgeBases.push({
      id: `kb_${kbIndex}`,
      name: kbName.trim(),
      apiKey: kbApiKey.trim(),
      apiUrl: kbApiUrl.trim() || `${config.API_BASE}/v1`
    });

    const continueAdd = await question('是否添加更多知识库? (y/N): ');
    addMore = continueAdd.toLowerCase() === 'y' || continueAdd.toLowerCase() === 'yes';
    kbIndex++;
  }

  // 如果没有配置知识库，使用默认配置
  if (knowledgeBases.length === 0) {
    console.log('使用默认知识库配置');
    knowledgeBases.push(...defaultKnowledgeBases);
  }

  // 其他配置
  console.log('\n⚙️  其他配置');
  const debugMode = await question(`启用调试模式? (y/N) [${config.DEBUG_MODE ? 'y' : 'N'}]: `);
  if (debugMode.toLowerCase() === 'y' || debugMode.toLowerCase() === 'yes') {
    config.DEBUG_MODE = true;
  } else if (debugMode.toLowerCase() === 'n' || debugMode.toLowerCase() === 'no') {
    config.DEBUG_MODE = false;
  }

  const version = await question(`应用版本 [${config.VERSION}]: `);
  if (version.trim()) {
    config.VERSION = version.trim();
  }

  // 选择输出文件
  console.log('\n💾 输出配置');
  const outputPath = await question('输出文件路径 [./public/config.js]: ');
  const finalPath = outputPath.trim() || './public/config.js';

  // 生成配置文件
  const configContent = generateConfigContent(config, knowledgeBases);
  
  try {
    // 确保目录存在
    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 写入文件
    fs.writeFileSync(finalPath, configContent, 'utf8');
    
    console.log(`\n✅ 配置文件已生成: ${finalPath}`);
    console.log('\n📋 配置摘要:');
    console.log(`   环境类型: ${envType}`);
    console.log(`   API地址: ${config.API_BASE}`);
    console.log(`   知识库数量: ${knowledgeBases.length}`);
    console.log(`   调试模式: ${config.DEBUG_MODE ? '启用' : '禁用'}`);
    console.log(`   版本号: ${config.VERSION}`);

    console.log('\n📚 后续步骤:');
    console.log('1. 检查配置文件内容');
    console.log('2. 根据实际情况调整API密钥');
    console.log('3. 部署前端应用');
    console.log('4. 测试各项功能');

  } catch (error) {
    console.error('\n❌ 生成配置文件失败:', error.message);
    process.exit(1);
  }
}

// 命令行配置生成
function generateFromArgs() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('使用方法:');
    console.log('  node generate-config.js [环境类型] [输出路径]');
    console.log('');
    console.log('环境类型: production, staging, development');
    console.log('输出路径: 配置文件保存路径 (默认: ./public/config.js)');
    console.log('');
    console.log('示例:');
    console.log('  node generate-config.js production');
    console.log('  node generate-config.js staging ./dist/config.js');
    console.log('');
    console.log('或直接运行进入交互模式:');
    console.log('  node generate-config.js');
    return;
  }

  const envType = args[0];
  const outputPath = args[1] || './public/config.js';

  if (!configTemplates[envType]) {
    console.error(`❌ 未知环境类型: ${envType}`);
    console.error('支持的环境类型: production, staging, development');
    process.exit(1);
  }

  const config = configTemplates[envType];
  const configContent = generateConfigContent(config, defaultKnowledgeBases);

  try {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, configContent, 'utf8');
    console.log(`✅ ${envType} 环境配置文件已生成: ${outputPath}`);
    console.log('⚠️  请根据实际情况修改API地址和密钥');
  } catch (error) {
    console.error('❌ 生成配置文件失败:', error.message);
    process.exit(1);
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    await interactiveConfig();
  } else {
    generateFromArgs();
  }
  
  rl.close();
}

// 执行主函数
main().catch(error => {
  console.error('❌ 程序执行失败:', error.message);
  process.exit(1);
});