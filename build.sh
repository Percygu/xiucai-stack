#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查pnpm是否安装
check_pnpm() {
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm 未安装，请先安装 pnpm"
        exit 1
    fi
}

# 执行项目编译
build_project() {
    print_info "开始执行项目编译: pnpm docs:build"
    
    pnpm docs:build
    
    if [ $? -eq 0 ]; then
        print_info "项目编译成功！"
    else
        print_error "项目编译失败！"
        exit 1
    fi
}

# 检查源目录是否存在
check_source_dirs() {
    local source_dirs=(
        "src/assets/img/go语言安装"
        "src/assets/img/go语言系列"
    )
    
    for dir in "${source_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            print_warning "源目录不存在: $dir"
            return 1
        fi
    done
    return 0
}

# 创建目标目录
create_target_dir() {
    local target_dir="src/.vuepress/dist/assets/img"
    
    if [ ! -d "$target_dir" ]; then
        print_info "创建目标目录: $target_dir"
        mkdir -p "$target_dir"
    fi
}

# 拷贝目录内容，保持img目录结构
copy_directory() {
    local source_dir="$1"
    local target_base="$2"
    
    if [ ! -d "$source_dir" ]; then
        print_warning "源目录不存在，跳过: $source_dir"
        return
    fi
    
    # 获取源目录的名称（最后一级目录名）
    local dir_name=$(basename "$source_dir")
    local target_dir="$target_base/$dir_name"
    
    print_info "开始拷贝目录: $source_dir -> $target_dir"
    
    # 创建目标子目录
    mkdir -p "$target_dir"
    
    # 使用rsync拷贝，保持目录结构
    if command -v rsync &> /dev/null; then
        rsync -av --exclude='.*' "$source_dir/" "$target_dir/"
        if [ $? -eq 0 ]; then
            print_info "成功拷贝: $source_dir -> $target_dir"
        else
            print_error "拷贝失败: $source_dir"
            return 1
        fi
    else
        # 如果没有rsync，使用cp命令
        cp -r "$source_dir"/* "$target_dir/" 2>/dev/null
        if [ $? -eq 0 ]; then
            print_info "成功拷贝: $source_dir -> $target_dir"
        else
            print_error "拷贝失败: $source_dir"
            return 1
        fi
    fi
}

# 主函数
main() {
    print_info "开始执行构建脚本..."
    
    # 检查pnpm是否安装
    check_pnpm
    
    # 执行项目编译
    build_project
    
    # 检查源目录
    if ! check_source_dirs; then
        print_warning "部分源目录不存在，将跳过不存在的目录"
    fi
    
    # 创建目标目录
    create_target_dir
    
    # 定义源目录和目标目录
    local source_dirs=(
        "src/assets/img/go语言安装"
        "src/assets/img/go语言系列"
    )
    
    local target_base="src/.vuepress/dist/assets/img"
    
    # 拷贝每个源目录
    for source_dir in "${source_dirs[@]}"; do
        if [ -d "$source_dir" ]; then
            copy_directory "$source_dir" "$target_base"
        fi
    done
    
    print_info "构建完成！"
    print_info "目标目录: $target_base"
    
    # 显示拷贝后的目录结构
    if [ -d "$target_base" ]; then
        print_info "拷贝后的目录结构:"
        find "$target_base" -type d | head -20
        echo "..."
    fi
}

# 执行主函数
main "$@" 