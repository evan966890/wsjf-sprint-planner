#!/bin/bash
#
# WSL2批量PDF/图片转换脚本
# 使用DeepSeek-OCR在WSL2环境中进行批量转换
#
# 使用方法:
#   bash wsl2-batch-convert.sh <Windows路径>
#
# 示例:
#   bash wsl2-batch-convert.sh "C:\Users\Evan Tian\Downloads\DSTE"
#

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo
}

# 转换Windows路径到WSL路径
# C:\Users\... -> /mnt/c/Users/...
windows_to_wsl_path() {
    local win_path="$1"

    # 移除引号
    win_path="${win_path//\"/}"

    # 转换盘符: C:\ -> /mnt/c/
    # 匹配 X:\ 格式
    if [[ $win_path =~ ^([A-Za-z]):[\\/](.*)$ ]]; then
        local drive="${BASH_REMATCH[1],,}"  # 转小写
        local path="${BASH_REMATCH[2]}"

        # 反斜杠转正斜杠
        path="${path//\\//}"

        echo "/mnt/$drive/$path"
    else
        # 如果已经是WSL路径，直接返回
        echo "$win_path"
    fi
}

print_header "WSL2 DeepSeek-OCR 批量转换工具"

# 检查参数
if [ -z "$1" ]; then
    print_error "请指定输入目录"
    echo
    echo "使用方法:"
    echo "  bash $0 <目录路径>"
    echo
    echo "示例:"
    echo "  bash $0 \"C:\Users\Evan Tian\Downloads\DSTE\""
    echo "  bash $0 /mnt/c/Users/Evan\ Tian/Downloads/DSTE"
    exit 1
fi

INPUT_PATH="$1"

# 转换路径
print_info "转换路径格式..."
WSL_INPUT_PATH=$(windows_to_wsl_path "$INPUT_PATH")
print_info "输入目录: $WSL_INPUT_PATH"

# 检查目录是否存在
if [ ! -d "$WSL_INPUT_PATH" ]; then
    print_error "目录不存在: $WSL_INPUT_PATH"
    exit 1
fi

# 检查Python虚拟环境
print_info "检查Python环境..."
if [ ! -d "$HOME/deepseek-env" ]; then
    print_warn "未找到deepseek-env虚拟环境"
    print_info "请先运行安装脚本创建环境"
    exit 1
fi

# 激活虚拟环境
print_info "激活Python环境..."
source "$HOME/deepseek-env/bin/activate"

# 检查vLLM
if ! python3 -c "import vllm" 2>/dev/null; then
    print_error "vLLM未安装"
    print_info "请运行: pip install vllm==0.8.5"
    exit 1
fi

print_info "✓ 环境检查通过"

# 输出目录
OUTPUT_DIR="$WSL_INPUT_PATH/markdown_output"
mkdir -p "$OUTPUT_DIR"

print_info "输出目录: $OUTPUT_DIR"

# 选择转换模式
echo
echo "选择转换模式:"
echo "  1) 快速 (base分辨率, 200 DPI) - 推荐"
echo "  2) 高质量 (large分辨率, 300 DPI)"
echo "  3) 极速 (small分辨率, 150 DPI)"
echo "  4) 原文提取模式（不总结）"
echo
read -p "请选择 (1-4): " CHOICE

case $CHOICE in
    2)
        RESOLUTION="large"
        DPI=300
        MODE="高质量转换"
        ;;
    3)
        RESOLUTION="small"
        DPI=150
        MODE="极速转换"
        ;;
    4)
        RESOLUTION="base"
        DPI=200
        MODE="原文提取"
        RAW_MODE=true
        ;;
    *)
        RESOLUTION="base"
        DPI=200
        MODE="快速转换"
        ;;
esac

print_info "模式: $MODE (分辨率: $RESOLUTION, DPI: $DPI)"

# 查找文件
print_info "查找支持的文件..."

FILES=()
while IFS= read -r -d '' file; do
    FILES+=("$file")
done < <(find "$WSL_INPUT_PATH" -maxdepth 1 -type f \( -iname "*.pdf" -o -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) -print0)

TOTAL_FILES=${#FILES[@]}

if [ $TOTAL_FILES -eq 0 ]; then
    print_warn "没有找到PDF或图片文件"
    exit 0
fi

print_info "找到 $TOTAL_FILES 个文件"

# 开始转换
print_header "开始转换"

SUCCESS=0
FAILED=0
START_TIME=$(date +%s)

for i in "${!FILES[@]}"; do
    FILE="${FILES[$i]}"
    FILENAME=$(basename "$FILE")
    OUTPUT_FILE="$OUTPUT_DIR/${FILENAME%.*}.md"

    NUM=$((i + 1))

    echo
    print_info "[$NUM/$TOTAL_FILES] $FILENAME"

    # 检查是否已存在
    if [ -f "$OUTPUT_FILE" ]; then
        print_warn "  ⊘ 跳过（已存在）"
        continue
    fi

    # 运行转换
    if [ "$RAW_MODE" = true ]; then
        # 原文提取模式 - 使用特殊prompt
        # 注意：需要修改convert_to_md.py支持custom_prompt参数
        # 这里先使用标准模式
        print_warn "  原文模式需要自定义脚本，使用标准模式"
    fi

    if python3 ~/.claude/skills/deepseek-ocr-to-md/scripts/convert_to_md.py \
        --input "$FILE" \
        --output "$OUTPUT_FILE" \
        --resolution "$RESOLUTION" \
        --dpi "$DPI" 2>&1 | grep -v "^$"; then

        # 获取文件大小
        SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
        print_info "  ✓ 成功 ($SIZE)"
        ((SUCCESS++))
    else
        print_error "  ✗ 失败"
        ((FAILED++))
    fi
done

# 统计结果
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

print_header "转换完成"

echo "总文件数: $TOTAL_FILES"
echo "✓ 成功: $SUCCESS"
echo "✗ 失败: $FAILED"
echo "⏱ 耗时: ${DURATION}秒"

if [ $SUCCESS -gt 0 ]; then
    AVG=$((DURATION / SUCCESS))
    echo "⌀ 平均: ${AVG}秒/文件"
fi

echo
print_info "输出目录: $OUTPUT_DIR"

# 在Windows中打开输出目录（可选）
echo
read -p "是否在Windows中打开输出目录? (y/N): " OPEN

if [[ $OPEN =~ ^[Yy]$ ]]; then
    # 转换回Windows路径
    WIN_OUTPUT_DIR=$(echo "$OUTPUT_DIR" | sed 's|/mnt/\([a-z]\)/|\U\1:/|' | sed 's|/|\\|g')
    explorer.exe "$WIN_OUTPUT_DIR" 2>/dev/null || print_warn "无法打开资源管理器"
fi

print_info "完成！"
