# Release脚本使用指南

本目录包含了 LgChatUI2 项目的完整发布和部署脚本，支持小团队快速迭代和一键部署。

## 📁 脚本概览

| 脚本文件 | 功能描述 | 主要用途 |
|---------|---------|---------|
| `version.js` | 智能版本管理 | 自动检测版本类型、更新版本号、生成变更日志 |
| `build.js` | 自动化构建 | 清理、检查、构建、打包生产环境代码 |
| `deploy.js` | Docker部署 | 一键部署到生产环境，支持备份回滚 |
| `health-check.js` | 健康监控 | 服务状态检查、系统监控、自动重启 |

## 🚀 快速开始

### 完整发布流程（推荐）

```bash
# 一键完成版本、构建、部署全流程
npm run release:full
```

这个命令会依次执行：
1. 自动检测版本类型并创建新版本
2. 构建生产环境代码
3. 部署到Docker容器

### 分步执行流程

如果需要更细粒度的控制，可以分步执行：

```bash
# 1. 创建新版本
npm run version release [type]

# 2. 构建生产代码
npm run release:build

# 3. 部署到生产环境
npm run release:deploy [environment]

# 4. 健康检查
npm run health:check
```

## 📋 详细使用说明

### 1. 版本管理 (`version.js`)

**基础用法：**
```bash
# 自动检测版本类型（根据git提交信息）
npm run version release

# 手动指定版本类型
npm run version release patch    # 补丁版本 (1.0.0 -> 1.0.1)
npm run version release minor    # 功能版本 (1.0.0 -> 1.1.0)
npm run version release major    # 主要版本 (1.0.0 -> 2.0.0)

# 查看当前版本
npm run version current
```

**自动版本检测规则：**
- 包含 `BREAKING CHANGE` 或 `feat!` → major版本
- 包含 `feat(` → minor版本
- 其他情况 → patch版本

**执行内容：**
- ✅ 更新所有workspace的package.json版本号
- ✅ 生成/更新 CHANGELOG.md
- ✅ 创建git提交和标签
- ✅ 准备发布说明

### 2. 构建系统 (`build.js`)

**基础用法：**
```bash
npm run release:build
```

**执行流程：**
1. 🧹 清理旧的构建产物
2. 🔍 预构建检查（依赖、类型检查、代码检查）
3. 📦 构建共享包 (@lg/shared)
4. 🔄 并行构建前后端
5. ✅ 验证构建结果
6. 📦 创建统一发布包 (`dist/` 目录)
7. 📊 生成构建报告

**构建产物：**
```
dist/
├── backend/           # 后端构建产物
├── frontend/          # 前端构建产物
├── package.json       # 根配置文件
├── backend/package.json # 后端配置文件
└── build-report.json  # 构建报告
```

### 3. Docker部署 (`deploy.js`)

**基础用法：**
```bash
# 部署到生产环境
npm run release:deploy

# 部署到指定环境
npm run release:deploy production
npm run release:deploy staging
```

**部署流程：**
1. 🔍 部署前检查（构建产物、环境配置）
2. 💾 创建Docker镜像备份
3. 🔨 构建新的Docker镜像
4. 🛑 停止旧容器
5. 🚀 启动新容器
6. ⏳ 等待服务启动
7. 🔍 健康检查验证
8. 🔄 失败自动回滚

**Docker服务：**
- `lgchatui2-app`: 主应用容器（Node.js后端 + 前端资源）
- `lgchatui2-nginx`: Nginx反向代理容器

**端口映射：**
- `80`: Nginx HTTP入口
- `3000`: 应用服务端口（容器内部）

### 4. 健康监控 (`health-check.js`)

**基础用法：**
```bash
# 单次健康检查
npm run health:check

# 持续监控（每30秒检查一次）
npm run health:monitor
```

**检查项目：**
- 🐳 Docker容器状态
- 🌐 HTTP服务响应
- 💻 系统资源使用率（内存、磁盘、CPU）
- 📋 错误日志统计

**自动处理：**
- 连续3次失败 → 自动重启服务
- 重启失败 → 记录告警日志
- 资源超限 → 发出警告

## 🔧 配置说明

### 环境配置

部署配置位于 `deploy.js` 中的 `deployConfig`，主要配置项：

```javascript
{
  environments: {
    production: {
      deployMethod: 'docker',
      docker: {
        composeFile: 'docker-compose.prod.yml',
        serviceName: 'lgchatui2'
      },
      healthCheck: {
        url: 'http://localhost:3000/health',
        retries: 5
      }
    }
  }
}
```

### Docker配置文件

- `Dockerfile`: 多阶段构建，优化镜像大小
- `docker-compose.prod.yml`: 生产环境容器编排
- `nginx/`: Nginx配置文件

## 🚨 故障排查

### 常见问题及解决方案

**1. 版本发布失败**
```bash
# 检查git状态
git status

# 确保工作区干净
git add . && git commit -m "fix: 修复问题"

# 重新执行版本发布
npm run version release
```

**2. 构建失败**
```bash
# 检查类型错误
npm run typecheck

# 检查代码风格
npm run lint

# 清理后重新构建
npm run clean && npm run release:build
```

**3. 部署失败**
```bash
# 检查Docker状态
docker ps

# 查看容器日志
docker logs lgchatui2-app

# 手动重启服务
docker-compose -f docker-compose.prod.yml restart
```

**4. 服务异常**
```bash
# 健康检查
npm run health:check

# 查看服务日志
docker logs lgchatui2-app -f

# 回滚到上一版本（如果有备份）
docker tag lgchatui2:backup-[timestamp] lgchatui2:latest
docker-compose -f docker-compose.prod.yml up -d
```

### 日志文件位置

- 应用日志: `./logs/`
- Nginx日志: `./logs/nginx/`
- 告警日志: `./logs/alerts.log`
- 构建报告: `./dist/build-report.json`

## 📈 最佳实践

### 发布流程建议

1. **开发完成后**：
   ```bash
   # 确保代码质量
   npm run lint && npm run typecheck
   
   # 测试功能
   npm run test
   ```

2. **准备发布**：
   ```bash
   # 提交所有变更
   git add . && git commit -m "feat: 新功能实现"
   
   # 一键发布
   npm run release:full
   ```

3. **发布后验证**：
   ```bash
   # 健康检查
   npm run health:check
   
   # 功能验证
   curl http://localhost/api/health
   ```

### 版本命名规范

遵循语义化版本 (Semantic Versioning)：

- **MAJOR**: 不兼容的API变更
- **MINOR**: 向后兼容的功能性新增
- **PATCH**: 向后兼容的问题修正

### Git提交规范

建议使用 Conventional Commits 规范：

```bash
# 新功能
git commit -m "feat(chat): 添加语音消息功能"

# 问题修复
git commit -m "fix(auth): 修复登录token过期问题"

# 破坏性变更
git commit -m "feat!: 重构API接口结构"
```

## 🆘 紧急处理

### 快速回滚

如果部署后发现严重问题，可以快速回滚：

```bash
# 1. 停止当前服务
docker-compose -f docker-compose.prod.yml down

# 2. 查看可用的备份镜像
docker images | grep backup

# 3. 回滚到指定备份
docker tag lgchatui2:backup-[timestamp] lgchatui2:latest

# 4. 重新启动服务
docker-compose -f docker-compose.prod.yml up -d

# 5. 验证回滚结果
npm run health:check
```

### 数据备份

重要提醒：脚本会自动备份Docker镜像，但数据库数据需要单独备份：

```bash
# 数据库备份（根据实际情况调整）
# 因为使用外部MSSQL，建议配置定期备份策略
```

---

## 📞 技术支持

如果遇到脚本相关问题：

1. 查看脚本输出的详细日志
2. 检查 `./logs/` 目录下的日志文件
3. 参考本文档的故障排查部分
4. 查看项目的 CLAUDE.md 文档

**记住：小团队的优势在于快速迭代，这套脚本旨在让发布过程变得简单可靠！** 🚀