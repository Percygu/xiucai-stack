#!/bin/bash

# 简化版编译脚本 - 优化内存使用，防止服务器挂掉
set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查可用内存
check_memory() {
    local mem_available=$(free -m | awk 'NR==2{print $7}')
    print_info "可用内存: ${mem_available}MB"
    
    if [ "$mem_available" -lt 1000 ]; then
        print_warning "可用内存不足1GB，使用超低内存模式"
        return 1
    elif [ "$mem_available" -lt 1500 ]; then
        print_warning "可用内存不足1.5GB，使用低内存模式"
        return 2
    else
        print_info "内存充足，使用标准模式"
        return 0
    fi
}

# 清理缓存
clean_cache() {
    print_info "清理构建缓存..."
    
    [ -d "src/.vuepress/.cache" ] && rm -rf "src/.vuepress/.cache"
    [ -d "src/.vuepress/.temp" ] && rm -rf "src/.vuepress/.temp"
    [ -d "src/.vuepress/dist" ] && rm -rf "src/.vuepress/dist"
    
    print_info "缓存清理完成"
}

# 执行编译
build_project() {
    local mode=$1
    
    case $mode in
        0)
            print_info "使用标准模式编译..."
            pnpm docs:build
            ;;
        1)
            print_info "使用超低内存模式编译..."
            NODE_OPTIONS='--max-old-space-size=512' pnpm run docs:clean-dev
            ;;
        2)
            print_info "使用低内存模式编译..."
            pnpm docs:build-low-mem
            ;;
    esac
}

# 拷贝图片资源
copy_assets() {
    print_info "拷贝图片资源..."
    
    local source_dirs=(
        "src/assets/img/go语言安装"
        "src/assets/img/go语言系列"
    )
    
    local target_base="src/.vuepress/dist/assets/img"
    mkdir -p "$target_base"
    
    for source_dir in "${source_dirs[@]}"; do
        if [ -d "$source_dir" ]; then
            local dir_name=$(basename "$source_dir")
            local target_dir="$target_base/$dir_name"
            mkdir -p "$target_dir"
            
            if command -v rsync &> /dev/null; then
                rsync -a --exclude='.*' "$source_dir/" "$target_dir/"
            else
                cp -r "$source_dir"/* "$target_dir/" 2>/dev/null || true
            fi
            
            print_info "已拷贝: $source_dir"
        fi
    done
}

# 主函数
main() {
    print_info "开始优化编译..."
    
    # 检查pnpm
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm 未安装"
        exit 1
    fi
    
    # 清理缓存
    clean_cache
    
    # 检查内存并选择编译模式
    check_memory
    local memory_mode=$?
    
    # 执行编译
    if build_project $memory_mode; then
        print_info "编译成功！"
    else
        print_error "编译失败"
        exit 1
    fi
    
    # 拷贝资源
    copy_assets
    
    print_info "构建完成！输出目录: src/.vuepress/dist/"
}

# 执行主函数
main "$@"
