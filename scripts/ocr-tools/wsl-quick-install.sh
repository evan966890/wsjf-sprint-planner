#!/bin/bash
#
# WSL2快速安装脚本
# 自动安装DeepSeek-OCR及所有依赖
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo
echo "========================================"
echo "  DeepSeek-OCR WSL2 快速安装"
echo "========================================"
echo

# 检查是否在WSL2中
if ! grep -qEi "(Microsoft|WSL)" /proc/version &> /dev/null; then
    print_error "此脚本必须在WSL2中运行"
    print_info "请在Windows PowerShell中运行: wsl"
    exit 1
fi

print_info "检测到WSL2环境 ✓"

# 更新系统
print_info "更新系统包..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# 安装Python 3.12
print_info "检查Python版本..."
if ! command -v python3.12 &> /dev/null; then
    print_info "安装Python 3.12..."
    sudo apt-get install -y software-properties-common
    sudo add-apt-repository ppa:deadsnakes/ppa -y
    sudo apt-get update
    sudo apt-get install -y python3.12 python3.12-venv python3.12-dev
fi

PYTHON_VERSION=$(python3.12 --version)
print_info "Python: $PYTHON_VERSION"

# 安装基础工具
print_info "安装基础工具..."
sudo apt-get install -y build-essential git wget curl poppler-utils

# 检查NVIDIA GPU
print_info "检查GPU..."
if command -v nvidia-smi &> /dev/null; then
    GPU_INFO=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader)
    print_info "检测到GPU: $GPU_INFO"
else
    print_warn "未检测到NVIDIA GPU"
    print_warn "DeepSeek-OCR需要GPU，CPU模式会非常慢"

    read -p "继续安装? (y/N): " CONTINUE
    if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# 创建虚拟环境
print_info "创建Python虚拟环境..."
if [ -d "$HOME/deepseek-env" ]; then
    print_warn "环境已存在，跳过创建"
else
    python3.12 -m venv "$HOME/deepseek-env"
fi

# 激活环境
source "$HOME/deepseek-env/bin/activate"
print_info "已激活虚拟环境"

# 升级pip
print_info "升级pip..."
pip install --upgrade pip -q

# 安装PyTorch
print_info "安装PyTorch（这可能需要几分钟）..."
pip install torch==2.6.0 torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118 -q

# 安装vLLM
print_info "安装vLLM..."
pip install vllm==0.8.5 -q

# 安装其他依赖
print_info "安装其他依赖..."
pip install pillow pdf2image transformers accelerate -q

# 测试安装
print_info "测试安装..."

python3 << 'EOF'
import sys

try:
    import torch
    print(f"✓ PyTorch {torch.__version__}")

    if torch.cuda.is_available():
        print(f"✓ CUDA available: {torch.version.cuda}")
        print(f"✓ GPU: {torch.cuda.get_device_name(0)}")
        gpu_mem_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        print(f"✓ GPU Memory: {gpu_mem_gb:.1f} GB")

        if gpu_mem_gb < 6:
            print(f"⚠ Warning: GPU memory < 6GB, use --resolution small")
    else:
        print("⚠ CUDA not available, will use CPU (very slow)")

    import vllm
    print(f"✓ vLLM {vllm.__version__}")

    from PIL import Image
    print(f"✓ Pillow")

    from pdf2image import convert_from_path
    print(f"✓ pdf2image")

    print("\n✓✓✓ 所有依赖安装成功！✓✓✓")

except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)
EOF

if [ $? -ne 0 ]; then
    print_error "依赖检查失败"
    exit 1
fi

# 下载模型
echo
read -p "是否现在下载DeepSeek-OCR模型? (~3-6GB) (Y/n): " DOWNLOAD

if [[ $DOWNLOAD =~ ^[Yy]$ ]] || [[ -z $DOWNLOAD ]]; then
    print_info "下载模型（这可能需要几分钟）..."

    python3 << 'EOF'
try:
    from vllm import LLM
    print("正在下载DeepSeek-OCR模型...")
    llm = LLM(
        model="deepseek-ai/DeepSeek-OCR",
        trust_remote_code=True
    )
    print("✓ 模型下载完成！")
except Exception as e:
    print(f"模型下载失败: {e}")
    print("可以稍后首次使用时自动下载")
EOF
else
    print_info "跳过模型下载，将在首次使用时自动下载"
fi

# 创建快捷命令
print_info "创建快捷命令..."

cat > "$HOME/.ocr_aliases" << 'EOF'
# DeepSeek-OCR快捷命令
alias ocr-activate='source ~/deepseek-env/bin/activate'
alias ocr-convert='source ~/deepseek-env/bin/activate && python3 ~/.claude/skills/deepseek-ocr-to-md/scripts/convert_to_md.py'
EOF

# 添加到bashrc
if ! grep -q ".ocr_aliases" "$HOME/.bashrc"; then
    echo "source ~/.ocr_aliases" >> "$HOME/.bashrc"
    print_info "已添加快捷命令到 .bashrc"
fi

# 完成
echo
echo "========================================"
echo "  安装完成！"
echo "========================================"
echo
echo "快捷命令（重新打开终端后生效）:"
echo "  ocr-activate     - 激活DeepSeek-OCR环境"
echo "  ocr-convert      - 快速转换命令"
echo
echo "或者手动使用:"
echo "  source ~/deepseek-env/bin/activate"
echo "  python3 ~/.claude/skills/deepseek-ocr-to-md/scripts/convert_to_md.py --input file.pdf --output output.md"
echo
echo "测试命令:"
echo "  ocr-convert --input /mnt/c/path/to/file.pdf --output output.md"
echo
print_info "Happy converting! 🚀"
