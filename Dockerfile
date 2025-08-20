# 多阶段构建 Dockerfile
# 适用于 LgChatUI2 monorepo 项目

# 第一阶段：构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json文件
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY packages/shared/package*.json ./packages/shared/

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 第二阶段：生产阶段
FROM node:18-alpine AS production

# 创建应用用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S lgchatui2 -u 1001

# 设置工作目录
WORKDIR /app

# 复制package.json文件
COPY package*.json ./
COPY backend/package*.json ./backend/

# 只安装生产依赖
RUN npm ci --omit=dev && npm cache clean --force

# 复制构建产物
COPY --from=builder --chown=lgchatui2:nodejs /app/backend/dist ./backend/dist
COPY --from=builder --chown=lgchatui2:nodejs /app/frontend/dist ./frontend/dist
COPY --from=builder --chown=lgchatui2:nodejs /app/packages/shared/dist ./packages/shared/dist

# 创建必要的目录
RUN mkdir -p /app/logs && chown lgchatui2:nodejs /app/logs

# 切换到应用用户
USER lgchatui2

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "backend/dist/main.js"]