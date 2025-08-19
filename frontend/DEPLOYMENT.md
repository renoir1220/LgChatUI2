# 前端部署指南

本文档为运维人员提供前端应用的部署和配置指导。

## 构建和部署流程

### 1. 构建前端应用

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 构建生产版本
npm run build
```

构建完成后，`dist/` 目录包含所有静态文件，可以直接部署到Web服务器。

### 2. 部署静态文件

将 `dist/` 目录中的所有文件复制到Web服务器根目录：

```bash
# 示例：复制到nginx根目录
cp -r dist/* /var/www/html/

# 或者使用rsync
rsync -av dist/ /var/www/html/
```

## 运行时配置

### 配置文件位置

前端应用使用运行时配置文件，位于：
- **开发环境**: `public/config.js`
- **生产环境**: `<web-root>/config.js`

### 配置文件格式

```javascript
// config.js
window.APP_CONFIG = {
  // 后端API地址（必填）
  API_BASE: 'http://your-backend-server:3000',
  
  // 默认Dify知识库API地址
  DEFAULT_DIFY_API_URL: 'http://your-dify-server/v1/chat-messages',
  
  // 图片服务基础URL（可选，留空使用自动检测）
  IMAGE_BASE_URL: '',
  
  // 知识库配置列表
  KNOWLEDGE_BASES: [
    {
      id: 'kb_1',
      name: '仅聊天',
      apiKey: 'app-your-api-key-1',
      apiUrl: 'http://your-dify-server/v1'
    },
    {
      id: 'kb_2', 
      name: '集成知识库',
      apiKey: 'app-your-api-key-2',
      apiUrl: 'http://your-dify-server/v1'
    }
  ],
  
  // 调试模式（生产环境建议设为false）
  DEBUG_MODE: false,
  
  // 应用版本号
  VERSION: '1.0.0'
};
```

## 配置说明

### 必填配置项

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `API_BASE` | 后端API服务地址 | `http://10.0.0.100:3000` |
| `KNOWLEDGE_BASES` | 知识库配置数组 | 见上方示例 |

### 可选配置项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `DEFAULT_DIFY_API_URL` | 默认Dify API地址 | 使用API_BASE推导 |
| `IMAGE_BASE_URL` | 图片服务地址 | 自动检测 |
| `DEBUG_MODE` | 调试模式开关 | `false` |
| `VERSION` | 应用版本号 | `'1.0.0'` |

## 部署后配置步骤

### 1. 修改配置文件

```bash
# 编辑配置文件
vi /var/www/html/config.js

# 主要修改这些配置项：
# - API_BASE: 改为实际的后端服务地址
# - KNOWLEDGE_BASES: 配置实际的知识库信息
```

### 2. 验证配置

在浏览器中访问前端应用，打开开发者工具：

1. **检查配置加载**: 在Console中输入 `window.APP_CONFIG` 查看配置是否正确加载
2. **测试API连接**: 尝试登录功能，检查网络请求是否成功
3. **验证知识库**: 切换不同知识库，确认配置生效

### 3. 配置Web服务器

#### Nginx配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    # 前端路由支持（SPA）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 配置文件缓存控制
    location /config.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API代理（可选，如果前后端不在同一服务器）
    location /api/ {
        proxy_pass http://your-backend-server:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Apache配置示例

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/html

    # 前端路由支持
    <Directory "/var/www/html">
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # 配置文件缓存控制
    <Files "config.js">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
        Header set Pragma "no-cache"
        Header set Expires "0"
    </Files>
</VirtualHost>
```

## 故障排查

### 常见问题

1. **配置不生效**
   - 检查 `config.js` 文件是否存在且语法正确
   - 清除浏览器缓存后重试
   - 检查Web服务器是否正确提供 `config.js` 文件

2. **API请求失败**
   - 检查 `API_BASE` 配置是否正确
   - 验证后端服务是否正常运行
   - 检查网络连接和防火墙设置

3. **知识库功能异常**
   - 验证 `KNOWLEDGE_BASES` 配置中的 `apiKey` 和 `apiUrl`
   - 检查Dify服务是否正常运行
   - 查看浏览器开发者工具的网络请求错误

### 调试方法

1. **启用调试模式**
   ```javascript
   // 在config.js中设置
   DEBUG_MODE: true
   ```

2. **检查配置加载**
   ```javascript
   // 在浏览器Console中执行
   console.log(window.APP_CONFIG);
   ```

3. **监控网络请求**
   - 打开开发者工具 → Network标签
   - 观察API请求状态和响应

## 配置热更新

修改 `config.js` 后：
1. **无需重启服务器**
2. **刷新浏览器页面即可生效**
3. **如果有缓存问题，强制刷新（Ctrl+F5）**

## 安全建议

1. **敏感信息保护**
   - API密钥不要在前端配置中暴露
   - 使用HTTPS协议传输
   - 定期更换API密钥

2. **访问控制**
   - 配置适当的CORS策略
   - 使用防火墙限制访问来源
   - 定期检查访问日志

3. **配置文件权限**
   ```bash
   # 设置适当的文件权限
   chmod 644 /var/www/html/config.js
   chown www-data:www-data /var/www/html/config.js
   ```

## 版本升级

当有新版本时：

1. **备份当前配置**
   ```bash
   cp /var/www/html/config.js /var/www/html/config.js.backup
   ```

2. **部署新版本**
   ```bash
   # 备份当前部署
   mv /var/www/html /var/www/html.old
   
   # 部署新版本
   cp -r new-dist/ /var/www/html/
   
   # 恢复配置文件
   cp /var/www/html.old/config.js /var/www/html/
   ```

3. **验证功能**
   - 测试登录功能
   - 验证聊天功能
   - 检查知识库切换

---

**联系信息**：如遇问题请联系开发团队
**文档版本**：1.0.0
**最后更新**：2025-01-17