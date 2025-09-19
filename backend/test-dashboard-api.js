/**
 * Dashboard API 测试脚本
 * 这个脚本可以帮助验证统计看板API的功能
 */

// 简单的测试，不需要认证的基本健康检查
async function testBasicHealth() {
  try {
    const response = await fetch('http://localhost:3000/health');
    const data = await response.json();
    console.log('✅ 基础健康检查:', data);
    return true;
  } catch (error) {
    console.error('❌ 基础健康检查失败:', error.message);
    return false;
  }
}

// 检查管理员菜单（需要JWT token）
async function testAdminMenus() {
  try {
    // 这里需要一个有效的JWT token
    const response = await fetch('http://localhost:3000/api/admin/menus');

    if (response.status === 401) {
      console.log('⚠️  管理员菜单API需要认证 (预期行为)');
      return true;
    }

    const data = await response.json();
    console.log('✅ 管理员菜单:', data);
    return true;
  } catch (error) {
    console.error('❌ 管理员菜单测试失败:', error.message);
    return false;
  }
}

// 检查服务是否正在监听3000端口
async function checkPort() {
  const net = require('net');

  return new Promise((resolve) => {
    const server = net.createServer();

    server.listen(3000, () => {
      console.log('❌ 端口3000未被占用');
      server.close();
      resolve(false);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log('✅ 端口3000正在被使用 (后端服务正在运行)');
        resolve(true);
      } else {
        console.log('❌ 端口检查错误:', err.message);
        resolve(false);
      }
    });
  });
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试Dashboard API...\n');

  // 检查端口
  const portOk = await checkPort();
  if (!portOk) {
    console.log('请确保后端服务正在运行 (npm run start:dev)');
    return;
  }

  // 基础健康检查
  await testBasicHealth();

  // 管理员API检查
  await testAdminMenus();

  console.log('\n🏁 测试完成');
}

// 运行测试
runTests().catch(console.error);