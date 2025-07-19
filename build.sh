#!/bin/bash

# 简化版编译脚本 - 优化内存使用，防止服务器挂掉
set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# 检查可用内存
check_memory() {
    local mem_available=$(free -m | awk 'NR==2{print $7}')
    local mem_total=$(free -m | awk 'NR==2{print $2}')
    print_info "可用内存: ${mem_available}MB / 总内存: ${mem_total}MB"

    # 更保守的内存检测策略
    if [ "$mem_available" -lt 800 ]; then
        print_warning "可用内存不足800MB，使用超低内存模式"
        return 1
    elif [ "$mem_available" -lt 1200 ]; then
        print_warning "可用内存不足1.2GB，使用低内存模式"
        return 2
    elif [ "$mem_available" -lt 1800 ]; then
        print_warning "可用内存不足1.8GB，使用中等内存模式"
        return 3
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

# 临时释放系统资源
free_system_resources() {
    print_info "临时释放系统资源..."

    # 清理系统缓存
    sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true

    # 检查并建议关闭高内存进程
    local high_mem_processes=$(ps aux --sort=-%mem | awk 'NR>1 && $4>5.0 {print $2}' | wc -l)
    if [ "$high_mem_processes" -gt 5 ]; then
        print_warning "检测到${high_mem_processes}个高内存进程，建议关闭不必要的编辑器窗口"
    fi

    # 检查VSCode进程数量
    local vscode_processes=$(ps aux | grep -c "[v]scode")
    if [ "$vscode_processes" -gt 10 ]; then
        print_warning "检测到${vscode_processes}个VSCode进程，建议重启VSCode以释放内存"
        print_info "可以运行: pkill -f vscode-server 来清理VSCode进程"
    fi

    # 显示当前内存使用最高的进程
    print_info "当前内存使用最高的5个进程："
    ps aux --sort=-%mem | head -6 | tail -5 | awk '{printf "  PID: %s, 内存: %s%%, 命令: %s\n", $2, $4, $11}'
}

# 执行编译
build_project() {
    local mode=$1
    local build_result=0

    print_info "开始编译项目..."

    case $mode in
        0)
            print_info "使用标准模式编译 (内存限制: 2GB)..."
            export NODE_OPTIONS='--max-old-space-size=2048'
            pnpm docs:build
            build_result=$?
            ;;
        1)
            print_info "使用超低内存模式编译 (内存限制: 512MB)..."
            export NODE_OPTIONS='--max-old-space-size=512'
            pnpm docs:build-low-mem
            build_result=$?
            ;;
        2)
            print_info "使用低内存模式编译 (内存限制: 1GB)..."
            export NODE_OPTIONS='--max-old-space-size=1024'
            pnpm docs:build-low-mem
            build_result=$?
            ;;
        3)
            print_info "使用中等内存模式编译 (内存限制: 1.5GB)..."
            export NODE_OPTIONS='--max-old-space-size=1536'
            pnpm docs:build
            build_result=$?
            ;;
        *)
            print_error "未知的编译模式: $mode"
            return 1
            ;;
    esac

    if [ $build_result -eq 0 ]; then
        print_info "编译命令执行成功"
        return 0
    else
        print_error "编译命令执行失败，退出码: $build_result"
        return 1
    fi
}

# 拷贝图片资源
copy_assets() {
    print_info "拷贝图片资源..."
    
    local source_dirs=(
        "src/assets/img/go语言安装"
        "src/assets/img/go语言系列"
        "src/assets/img/go语言前景"
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
    print_header "开始优化编译"

    # 显示系统信息
    print_info "系统信息:"
    print_info "  当前目录: $(pwd)"
    print_info "  Node版本: $(node --version 2>/dev/null || echo '未安装')"

    # 检查当前目录
    if [ ! -f "package.json" ]; then
        print_error "未找到package.json文件，请确保在项目根目录运行此脚本"
        exit 1
    fi

    # 检查pnpm
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm 未安装"
        exit 1
    fi

    print_info "  pnpm版本: $(pnpm --version)"

    # 释放系统资源
    print_info "释放系统资源..."
    free_system_resources

    # 清理缓存
    print_info "清理缓存..."
    clean_cache

    # 检查内存并选择编译模式
    print_info "检查内存..."
    check_memory
    local memory_mode=$?

    print_info "选择的编译模式: $memory_mode"

    # 设置进程优先级为低优先级，减少系统负载
    print_info "设置进程优先级..."
    renice 10 $$ 2>/dev/null || true

    # 执行编译
    print_header "开始编译"
    if build_project $memory_mode; then
        print_info "✅ 编译成功！"
    else
        print_error "❌ 编译失败"
        exit 1
    fi

    # 拷贝资源
    copy_assets

    # 修复权限
    print_info "修复文件权限..."
    chown -R root:www src/.vuepress/dist/ 2>/dev/null || true
    chmod -R 644 src/.vuepress/dist/ 2>/dev/null || true
    chmod -R +X src/.vuepress/dist/ 2>/dev/null || true

    # 确保nginx可以访问目录路径
    chmod o+x /root/ 2>/dev/null || true
    chmod o+x /root/projects/ 2>/dev/null || true
    chmod o+x /root/projects/xiucai-stack/ 2>/dev/null || true
    chmod o+x /root/projects/xiucai-stack/src/ 2>/dev/null || true
    chmod o+x /root/projects/xiucai-stack/src/.vuepress/ 2>/dev/null || true

    print_info "权限修复完成"

    print_info "构建完成！输出目录: src/.vuepress/dist/"
}

# 执行主函数
main "$@"
