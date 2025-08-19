#!/bin/bash

# ------------------- 配置 -------------------
# 设置后端和前端的主机与端口
# 使用 0.0.0.0 可以绑定到所有可用的网络接口
BACKEND_HOST="0.0.0.0"
BACKEND_PORT="3000"

FRONTEND_HOST="0.0.0.0"
FRONTEND_PORT="80"
# -----------------------------------------------------

# 如果任何命令以非零状态退出，则立即退出脚本。
set -e

# 如果日志和进程ID目录不存在，则创建它们
LOG_DIR="logs"
PID_DIR=".pids"
mkdir -p $LOG_DIR
mkdir -p $PID_DIR

# --- 启动后端 ---
echo "正在启动后端服务..."
cd backend
# 使用环境变量为NestJS设置主机和端口
export HOST=${BACKEND_HOST}
export PORT=${BACKEND_PORT}
nohup npm run start:prod > ../$LOG_DIR/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../$PID_DIR/backend.pid
echo "后端服务已启动，PID: $BACKEND_PID. 监听于 http://${BACKEND_HOST}:${BACKEND_PORT}"
cd ..

# --- 启动前端 ---
echo "正在启动前端服务..."
cd frontend
# 检查构建目录是否存在
if [ ! -d "dist" ]; then
  echo "前端构建目录 'dist' 未找到。请先运行 'npm run build'。"
  # 可选：在退出前杀死后端进程
  kill $BACKEND_PID
  exit 1
fi
# 使用 npx 运行 serve 包，监听指定的主机和端口
nohup npx serve -s dist -l tcp://${FRONTEND_HOST}:${FRONTEND_PORT} > ../$LOG_DIR/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../$PID_DIR/frontend.pid
echo "前端服务已启动，PID: $FRONTEND_PID. 监听于 http://${FRONTEND_HOST}:${FRONTEND_PORT}"
cd ..

echo "-----------------------------------------------------"
echo "所有服务已成功启动！"
echo "后端日志: $(pwd)/$LOG_DIR/backend.log"
echo "前端日志: $(pwd)/$LOG_DIR/frontend.log"
echo "要停止服务, 可以运行: kill $(cat .pids/backend.pid) $(cat .pids/frontend.pid)"
echo "-----------------------------------------------------"