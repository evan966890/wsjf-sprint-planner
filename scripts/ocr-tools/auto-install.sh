#!/bin/bash
#
# 完全自动化安装DeepSeek-OCR
# 无需任何交互输入
#

set -e

echo "========================================"
echo "  DeepSeek-OCR 自动化安装"
echo "========================================"
echo

# 1. 更新系统
echo "[1/9] 更新系统包..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# 2. 安装Python
echo "[2/9] 安装Python 3.12..."
sudo apt-get install -y python3.12 python3.12-venv python3.12-dev python3-pip

# 3. 安装基础工具
echo "[3/9] 安装基础工具..."
sudo apt-get install -y build-essential git wget poppler-utils

# 4. 创建虚拟环境
echo "[4/9] 创建Python虚拟环境..."
if [ -d "$HOME/deepseek-env" ]; then
    rm -rf "$HOME/deepseek-env"
fi
python3.12 -m venv "$HOME/deepseek-env"

# 5. 激活环境
echo "[5/9] 激活环境..."
source "$HOME/deepseek-env/bin/activate"

# 6. 升级pip
echo "[6/9] 升级pip..."
pip install --upgrade pip -q

# 7. 安装PyTorch
echo "[7/9] 安装PyTorch（这需要几分钟）..."
pip install torch==2.6.0 torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118 -q

# 8. 安装vLLM和其他依赖
echo "[8/9] 安装vLLM和依赖（这需要几分钟）..."
pip install vllm==0.8.5 pillow pdf2image transformers accelerate -q

# 9. 测试安装
echo "[9/9] 测试安装..."
python3 << 'EOF'
import torch
import vllm
from PIL import Image

print(f"✓ PyTorch {torch.__version__}")
print(f"✓ CUDA: {torch.cuda.is_available()}")
print(f"✓ vLLM {vllm.__version__}")
print(f"✓ Pillow")

print("\n✓✓✓ 安装成功！✓✓✓")
EOF

# 10. 创建快捷命令
echo
echo "创建快捷命令..."
cat > "$HOME/.ocr_aliases" << 'EOF'
alias ocr-activate='source ~/deepseek-env/bin/activate'
alias ocr-convert='source ~/deepseek-env/bin/activate && python3 ~/.claude/skills/deepseek-ocr-to-md/scripts/convert_to_md.py'
EOF

if ! grep -q ".ocr_aliases" "$HOME/.bashrc" 2>/dev/null; then
    echo "source ~/.ocr_aliases" >> "$HOME/.bashrc"
fi

echo
echo "========================================"
echo "  安装完成！"
echo "========================================"
echo
echo "激活环境:"
echo "  source ~/deepseek-env/bin/activate"
echo
echo "测试转换:"
echo "  python3 ~/.claude/skills/deepseek-ocr-to-md/scripts/convert_to_md.py --help"
echo
