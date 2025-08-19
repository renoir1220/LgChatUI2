#!/bin/bash

# 前端部署脚本
# 使用方法: ./deploy.sh [目标目录] [配置模板]

set -e  # 遇到错误立即退出

# 脚本配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="LgChatUI2-Frontend"
BUILD_DIR="$SCRIPT_DIR/dist"
DEFAULT_TARGET="/var/www/html"
DEFAULT_CONFIG_TEMPLATE="production"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示使用帮助
show_help() {
    cat << EOF
${PROJECT_NAME} 部署脚本

使用方法:
    $0 [选项] [目标目录]

选项:
    -h, --help              显示此帮助信息
    -t, --target DIR        指定部署目标目录 (默认: $DEFAULT_TARGET)
    -c, --config TEMPLATE   指定配置模板 (默认: $DEFAULT_CONFIG_TEMPLATE)
    -b, --build             是否重新构建 (默认: true)
    -s, --skip-build        跳过构建步骤
    --dry-run              预览模式，不实际部署

配置模板:
    production    生产环境配置
    staging       测试环境配置
    development   开发环境配置

示例:
    $0                                          # 使用默认配置部署到 $DEFAULT_TARGET
    $0 -t /usr/share/nginx/html                # 部署到指定目录
    $0 -c staging -t /var/www/staging          # 使用测试环境配置
    $0 --skip-build                            # 跳过构建，直接部署现有文件
    $0 --dry-run                               # 预览模式

EOF
}

# 解析命令行参数
parse_args() {
    TARGET_DIR="$DEFAULT_TARGET"
    CONFIG_TEMPLATE="$DEFAULT_CONFIG_TEMPLATE"
    DO_BUILD=true
    DRY_RUN=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -t|--target)
                TARGET_DIR="$2"
                shift 2
                ;;
            -c|--config)
                CONFIG_TEMPLATE="$2"
                shift 2
                ;;
            -b|--build)
                DO_BUILD=true
                shift
                ;;
            -s|--skip-build)
                DO_BUILD=false
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -*)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
            *)
                TARGET_DIR="$1"
                shift
                ;;
        esac
    done
}

# 检查环境
check_environment() {
    log_info "检查部署环境..."

    # 检查Node.js和npm
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi

    # 检查package.json
    if [[ ! -f "$SCRIPT_DIR/package.json" ]]; then
        log_error "package.json 文件不存在"
        exit 1
    fi

    log_success "环境检查通过"
}

# 构建项目
build_project() {
    if [[ "$DO_BUILD" == false ]]; then
        log_info "跳过构建步骤"
        return 0
    fi

    log_info "开始构建项目..."
    
    cd "$SCRIPT_DIR"
    
    # 检查node_modules
    if [[ ! -d "node_modules" ]]; then
        log_info "安装依赖..."
        npm ci
    fi

    # 构建项目
    log_info "执行构建..."
    npm run build

    # 检查构建结果
    if [[ ! -d "$BUILD_DIR" ]]; then
        log_error "构建失败，dist目录不存在"
        exit 1
    fi

    if [[ ! -f "$BUILD_DIR/index.html" ]]; then
        log_error "构建失败，index.html不存在"
        exit 1
    fi

    log_success "项目构建完成"
}

# 生成配置文件
generate_config() {
    local config_file="$BUILD_DIR/config.js"
    
    log_info "生成配置文件: $CONFIG_TEMPLATE"

    case "$CONFIG_TEMPLATE" in
        production)
            cat > "$config_file" << 'EOF'
// 生产环境配置
window.APP_CONFIG = {
  // 后端API地址 - 请根据实际情况修改
  API_BASE: 'http://localhost:3000',
  
  // 默认 Dify 知识库配置
  DEFAULT_DIFY_API_URL: 'http://localhost/v1/chat-messages',
  
  // 图片服务配置（留空使用自动检测）
  IMAGE_BASE_URL: '',
  
  // 知识库配置列表 - 请根据实际情况修改
  KNOWLEDGE_BASES: [
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
  ],
  
  // 生产环境配置
  DEBUG_MODE: false,
  VERSION: '1.0.0'
};
EOF
            ;;
        staging)
            cat > "$config_file" << 'EOF'
// 测试环境配置
window.APP_CONFIG = {
  API_BASE: 'http://staging-backend:3000',
  DEFAULT_DIFY_API_URL: 'http://staging-dify/v1/chat-messages',
  IMAGE_BASE_URL: '',
  KNOWLEDGE_BASES: [
    {
      id: 'kb_test',
      name: '测试知识库',
      apiKey: 'app-test-key',
      apiUrl: 'http://staging-dify/v1'
    }
  ],
  DEBUG_MODE: true,
  VERSION: '1.0.0-staging'
};
EOF
            ;;
        development)
            cat > "$config_file" << 'EOF'
// 开发环境配置
window.APP_CONFIG = {
  API_BASE: 'http://localhost:3000',
  DEFAULT_DIFY_API_URL: 'http://localhost/v1/chat-messages',
  IMAGE_BASE_URL: '',
  KNOWLEDGE_BASES: [
    {
      id: 'kb_dev',
      name: '开发知识库',
      apiKey: 'app-dev-key',
      apiUrl: 'http://localhost/v1'
    }
  ],
  DEBUG_MODE: true,
  VERSION: '1.0.0-dev'
};
EOF
            ;;
        *)
            log_error "未知的配置模板: $CONFIG_TEMPLATE"
            exit 1
            ;;
    esac

    log_success "配置文件生成完成"
}

# 部署文件
deploy_files() {
    log_info "部署到目标目录: $TARGET_DIR"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "预览模式 - 将要执行的操作:"
        echo "  1. 创建目录: $TARGET_DIR"
        echo "  2. 备份现有文件到: ${TARGET_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
        echo "  3. 复制文件从: $BUILD_DIR"
        echo "  4. 设置文件权限"
        return 0
    fi

    # 创建目标目录
    if [[ ! -d "$TARGET_DIR" ]]; then
        log_info "创建目标目录..."
        sudo mkdir -p "$TARGET_DIR"
    fi

    # 备份现有文件
    if [[ -d "$TARGET_DIR" ]] && [[ "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]]; then
        local backup_dir="${TARGET_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
        log_info "备份现有文件到: $backup_dir"
        sudo cp -r "$TARGET_DIR" "$backup_dir"
    fi

    # 复制新文件
    log_info "复制文件..."
    sudo cp -r "$BUILD_DIR"/* "$TARGET_DIR/"

    # 设置权限
    log_info "设置文件权限..."
    sudo chown -R www-data:www-data "$TARGET_DIR" 2>/dev/null || \
    sudo chown -R nginx:nginx "$TARGET_DIR" 2>/dev/null || \
    log_warning "无法设置文件所有者，请手动设置"
    
    sudo chmod -R 644 "$TARGET_DIR"
    sudo find "$TARGET_DIR" -type d -exec chmod 755 {} \;

    log_success "文件部署完成"
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."

    # 检查关键文件
    local files=("index.html" "config.js")
    for file in "${files[@]}"; do
        if [[ ! -f "$TARGET_DIR/$file" ]]; then
            log_error "关键文件缺失: $file"
            return 1
        fi
    done

    # 检查配置文件语法
    if ! node -c "$TARGET_DIR/config.js" 2>/dev/null; then
        log_error "配置文件语法错误"
        return 1
    fi

    log_success "部署验证通过"
}

# 显示部署后说明
show_post_deploy_info() {
    cat << EOF

${GREEN}部署完成！${NC}

📋 部署信息:
   目标目录: $TARGET_DIR
   配置模板: $CONFIG_TEMPLATE
   构建时间: $(date)

🔧 后续步骤:
   1. 编辑配置文件: $TARGET_DIR/config.js
   2. 根据实际环境修改 API_BASE 和知识库配置
   3. 配置Web服务器（Nginx/Apache）
   4. 访问应用验证功能

📚 相关文档:
   部署文档: $SCRIPT_DIR/DEPLOYMENT.md
   
⚠️  重要提醒:
   - 请务必修改 config.js 中的 API_BASE 为实际后端地址
   - 请替换知识库配置中的 apiKey 为真实密钥
   - 生产环境建议设置 DEBUG_MODE: false

EOF
}

# 主函数
main() {
    log_info "开始部署 $PROJECT_NAME"
    
    parse_args "$@"
    check_environment
    build_project
    generate_config
    deploy_files
    verify_deployment
    show_post_deploy_info
    
    log_success "部署流程完成！"
}

# 执行主函数
main "$@"