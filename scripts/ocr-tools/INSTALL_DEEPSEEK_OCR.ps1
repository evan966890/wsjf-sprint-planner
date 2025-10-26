# DeepSeek-OCR自动化安装脚本（PowerShell）
# 完全自动化，无需交互

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DeepSeek-OCR 自动化安装" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host

# 检查WSL2
Write-Host "[检查] WSL2状态..." -ForegroundColor Yellow
$wslStatus = wsl --list --verbose
if ($wslStatus -match "Ubuntu.*Running") {
    Write-Host "✓ Ubuntu WSL2 运行中" -ForegroundColor Green
} else {
    Write-Host "✗ Ubuntu WSL2 未运行" -ForegroundColor Red
    Write-Host "启动 Ubuntu..." -ForegroundColor Yellow
    wsl -d Ubuntu echo "Starting..."
}

Write-Host
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  开始安装（预计10-20分钟）" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host

# 创建自动化安装脚本
$installScript = @'
#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive

echo "[1/9] 更新系统..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

echo "[2/9] 安装Python 3.12..."
sudo apt-get install -y software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt-get update -qq
sudo apt-get install -y python3.12 python3.12-venv python3.12-dev

echo "[3/9] 安装工具..."
sudo apt-get install -y build-essential git wget poppler-utils

echo "[4/9] 创建虚拟环境..."
rm -rf ~/deepseek-env
python3.12 -m venv ~/deepseek-env

echo "[5/9] 激活环境..."
source ~/deepseek-env/bin/activate

echo "[6/9] 升级pip..."
pip install --upgrade pip

echo "[7/9] 安装PyTorch..."
pip install torch==2.6.0 torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

echo "[8/9] 安装vLLM..."
pip install vllm==0.8.5 pillow pdf2image transformers accelerate

echo "[9/9] 测试安装..."
python3 << 'PYEOF'
import torch, vllm
print(f"✓ PyTorch {torch.__version__}")
print(f"✓ CUDA: {torch.cuda.is_available()}")
print(f"✓ vLLM {vllm.__version__}")
print("\n✓✓✓ 安装成功！")
PYEOF

echo "创建快捷命令..."
cat > ~/.ocr_aliases << 'ALIASEOF'
alias ocr-activate='source ~/deepseek-env/bin/activate'
ALIASEOF

if ! grep -q ".ocr_aliases" ~/.bashrc 2>/dev/null; then
    echo "source ~/.ocr_aliases" >> ~/.bashrc
fi

echo "✓ 完成！"
'@

# 保存脚本到WSL
$installScript | wsl -d Ubuntu bash -c "cat > /tmp/auto-install.sh && chmod +x /tmp/auto-install.sh"

# 运行安装
Write-Host "正在安装依赖..." -ForegroundColor Yellow
Write-Host "这需要10-20分钟，请耐心等待..." -ForegroundColor Yellow
Write-Host

wsl -d Ubuntu bash /tmp/auto-install.sh

Write-Host
Write-Host "========================================" -ForegroundColor Green
Write-Host "  安装完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host

Write-Host "测试命令:" -ForegroundColor Cyan
Write-Host "  wsl -d Ubuntu bash -c 'source ~/deepseek-env/bin/activate && python3 --version'" -ForegroundColor White
Write-Host

Write-Host "下一步: 测试转换功能" -ForegroundColor Yellow
