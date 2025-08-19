# LgChatUI2 生产部署指南

## 📦 项目概览
- **前端**: React + Vite 静态文件
- **后端**: NestJS Node.js 应用
- **数据库**: MSSQL Server 2008
- **端口**: 前端任意端口，后端 3000

## 🏗️ 构建产物

### 前端构建产物
- **位置**: `frontend/dist/`
- **类型**: 静态HTML/CSS/JS文件
- **部署**: 任何Web服务器（Nginx、Apache、IIS）

### 后端构建产物
- **位置**: `backend/dist/`
- **类型**: 编译后的JavaScript文件
- **运行**: `node dist/main.js`

## 🔧 生产环境变量配置

### 必需的环境变量

```bash
# === 基础配置 ===
NODE_ENV=production
PORT=3000

# === 数据库配置 ===
MSSQL_SERVER=your-database-server
MSSQL_PORT=1433
MSSQL_DATABASE=your-database-name
MSSQL_USER=your-database-user
MSSQL_PASSWORD=your-database-password
MSSQL_ENCRYPT=false

# === JWT认证配置 ===
JWT_SECRET=your-secure-random-jwt-secret-min-32-chars

# === AI服务配置 ===
DIFY_API_URL=https://your-dify-api-endpoint
DIFY_API_KEY=your-dify-api-key

# === TTS语音合成配置 ===
TTS_APP_ID=your-volcengine-app-id
TTS_ACCESS_KEY=your-volcengine-access-key
TTS_SECRET_KEY=your-volcengine-secret-key
```

### 可选的环境变量

```bash
# === 日志配置 ===
LOG_LEVEL=info                    # 日志级别: error, warn, info, debug
LOG_FORMAT=json                   # 日志格式: json 或 simple

# === 跨域配置 ===
CORS_ORIGIN=https://your-frontend-domain.com
CORS_CREDENTIALS=true

# === 性能配置 ===
MAX_CONNECTIONS=100              # 数据库最大连接数
REQUEST_TIMEOUT=30000            # 请求超时时间(ms)
```

## 📁 部署目录结构建议

```
/opt/lgchatui2/
├── backend/
│   ├── dist/              # 后端构建产物
│   ├── node_modules/      # 依赖包
│   ├── package.json       # 依赖声明
│   └── .env.production    # 生产环境变量
├── frontend/
│   └── dist/              # 前端静态文件
└── logs/                  # 日志文件
```

## 🚀 后端部署步骤

### 1. 安装 Node.js 依赖
```bash
cd /opt/lgchatui2/backend
npm install --only=production
```

### 2. 配置环境变量
```bash
# 创建生产环境配置文件
vi .env.production

# 或通过系统环境变量设置
export NODE_ENV=production
export PORT=3000
# ... 其他变量
```

### 3. 启动应用
```bash
# 直接启动
node dist/main.js

# 或使用 PM2（推荐）
pm2 start dist/main.js --name "lgchatui2-backend"
```

## 🌐 前端部署（Nginx配置示例）

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /opt/lgchatui2/frontend/dist;
    index index.html;

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理到后端
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 安全配置建议

### 1. JWT密钥安全
- JWT_SECRET 至少32位随机字符
- 定期轮换密钥
- 不要在代码中硬编码

### 2. 数据库安全
- 使用专用数据库用户
- 最小权限原则
- 启用SSL连接（如支持）

### 3. API安全
- 配置正确的CORS域名
- 启用请求限流
- 记录安全事件日志

## 📊 监控和日志

### 应用监控
```bash
# PM2 监控
pm2 monit

# 查看日志
pm2 logs lgchatui2-backend
```

### 健康检查端点
- GET `/health/db` - 数据库连接检查
- GET `/` - 基础健康检查

### 关键监控指标
- CPU和内存使用率
- 数据库连接池状态
- API响应时间
- 错误率统计

## 🔧 故障排查

### 常见问题
1. **数据库连接失败**: 检查网络、凭据、防火墙
2. **JWT验证失败**: 确认密钥配置正确
3. **API跨域错误**: 检查CORS配置
4. **静态文件404**: 确认前端路径配置

### 调试命令
```bash
# 查看应用日志
tail -f /opt/lgchatui2/logs/app.log

# 测试数据库连接
telnet your-db-server 1433

# 测试API健康
curl http://localhost:3000/health/db
```

## 📞 运维支持信息

- **项目负责人**: [联系方式]
- **技术支持**: [联系方式]
- **数据库管理员**: [联系方式]
- **紧急联系**: [联系方式]

---

**重要提醒**: 请确保所有敏感信息（密码、密钥）通过安全方式传递，不要在版本控制系统中提交。