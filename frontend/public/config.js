// 运行时配置文件
// 运维可以在部署后直接修改此文件，无需重新构建前端
window.APP_CONFIG = {
  // API 基础配置 - 使用代理避免Mixed Content问题
  API_BASE: '',  // 空字符串表示使用相对路径，通过Vite代理转发
  
  // 默认 Dify 知识库配置
  DEFAULT_DIFY_API_URL: 'http://localhost/v1/chat-messages',
  
  // 图片服务配置
  IMAGE_BASE_URL: '',  // 留空使用默认逻辑
  
  // 其他配置
  DEBUG_MODE: false,
  VERSION: '1.0.0',
  
  // 运维说明：
  // 1. 修改配置后直接刷新浏览器即可生效，无需重启服务
  // 2. API_BASE 应该指向后端服务地址
  // 3. KNOWLEDGE_BASES 数组可以添加或删除知识库配置
  // 4. 所有URL都应该使用完整的地址（包含协议和端口）
}