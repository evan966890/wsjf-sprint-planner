# WSL2 + DeepSeek-OCR 安装指南

您已经有WSL2了，太好！现在只需要在WSL2中安装DeepSeek-OCR即可。

## 📋 安装步骤

### 第1步: 检查WSL2状态

打开PowerShell或CMD，运行：

```powershell
# 检查WSL版本
wsl --list --verbose

# 应该看到类似输出：
#   NAME            STATE           VERSION
# * Ubuntu          Running         2
```

如果VERSION是2，说明WSL2正常。

### 第2步: 进入WSL2

```powershell
wsl
```

现在您在Linux环境中了！

### 第3步: 安装DeepSeek-OCR

在WSL2的Linux终端中运行：

```bash
# 1. 更新系统包
sudo apt-get update
sudo apt-get upgrade -y

# 2. 安装Python和必要工具
sudo apt-get install -y python3.12 python3-pip python3-venv git

# 3. 安装CUDA工具（如果有NVIDIA GPU）
# 检查GPU
nvidia-smi

# 如果看到GPU信息，继续安装CUDA
# 如果没有，说明GPU驱动未正确配置（见下方故障排除）

# 4. 创建Python虚拟环境
cd ~
python3 -m venv deepseek-env
source deepseek-env/bin/activate

# 5. 安装PyTorch
pip install torch==2.6.0 torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# 6. 安装vLLM
pip install vllm==0.8.5

# 7. 安装其他依赖
pip install pillow pdf2image transformers accelerate

# 8. 安装poppler（PDF支持）
sudo apt-get install -y poppler-utils

# 9. 测试安装
python3 << 'EOF'
import torch
print(f"PyTorch: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")

import vllm
print(f"vLLM: {vllm.__version__}")

print("\n✓ 安装成功！")
EOF
```

### 第4步: 下载DeepSeek-OCR模型

```bash
# 在WSL2中，激活虚拟环境
source ~/deepseek-env/bin/activate

# 下载模型（首次运行约3-6GB）
python3 << 'EOF'
from vllm import LLM

print("下载DeepSeek-OCR模型...")
llm = LLM(
    model="deepseek-ai/DeepSeek-OCR",
    trust_remote_code=True
)
print("✓ 模型下载完成！")
EOF
```

### 第5步: 测试转换

```bash
# 测试转换一个文件
# Windows路径在WSL2中映射为 /mnt/c/...

# 例如：C:\Users\Evan Tian\Downloads\test.pdf
# 在WSL2中是：/mnt/c/Users/Evan\ Tian/Downloads/test.pdf

python3 ~/.claude/skills/deepseek-ocr-to-md/scripts/convert_to_md.py \
  --input "/mnt/c/Users/Evan Tian/Downloads/DSTE/deepseek.pdf" \
  --output "/mnt/c/Users/Evan Tian/Downloads/DSTE/test-output.md"
```

---

## 🚀 创建便捷的转换脚本

### WSL2中的批量转换脚本

创建文件 `~/ocr-batch.sh`：

```bash
#!/bin/bash
# WSL2批量转换脚本

# 激活环境
source ~/deepseek-env/bin/activate

# 运行转换
python3 ~/.claude/skills/deepseek-ocr-to-md/scripts/convert_to_md.py "$@"
```

```bash
# 设置执行权限
chmod +x ~/ocr-batch.sh

# 使用方法
~/ocr-batch.sh --input /mnt/c/path/to/file.pdf --output /mnt/c/path/to/output.md
```

---

## 🔗 Windows调用WSL2工具

### 创建Windows批处理桥接

在Windows端创建 `wsl-convert.bat`：

```batch
@echo off
REM Windows to WSL2 bridge for OCR conversion

set "INPUT_PATH=%~1"
set "OUTPUT_PATH=%~2"

REM Convert Windows path to WSL path
REM C:\Users\... -> /mnt/c/Users/...

wsl bash -c "source ~/deepseek-env/bin/activate && python3 ~/.claude/skills/deepseek-ocr-to-md/scripts/convert_to_md.py --input '%INPUT_PATH%' --output '%OUTPUT_PATH%'"
```

**使用方法**:
```cmd
wsl-convert.bat "C:\path\to\file.pdf" "C:\path\to\output.md"
```

---

## 📂 路径转换说明

### Windows → WSL2路径映射

| Windows路径 | WSL2路径 |
|------------|----------|
| `C:\Users\Evan Tian\Downloads` | `/mnt/c/Users/Evan Tian/Downloads` |
| `D:\code\WSJF` | `/mnt/d/code/WSJF` |

**注意**:
- 盘符小写: `C:` → `/mnt/c`
- 反斜杠改正斜杠: `\` → `/`
- 空格需要转义或加引号

---

## 🧪 验证安装

### 检查清单

在WSL2中运行这些命令：

```bash
# 1. 检查Python
python3 --version
# 应该显示: Python 3.12.x

# 2. 检查虚拟环境
source ~/deepseek-env/bin/activate
which python3
# 应该显示: /home/yourname/deepseek-env/bin/python3

# 3. 检查CUDA
python3 -c "import torch; print(f'CUDA: {torch.cuda.is_available()}')"
# 应该显示: CUDA: True

# 4. 检查vLLM
python3 -c "import vllm; print(f'vLLM: {vllm.__version__}')"
# 应该显示: vLLM: 0.8.5

# 5. 检查poppler
pdfinfo -v
# 应该显示版本信息
```

全部通过说明安装成功！

---

## 🎯 常用操作

### 批量转换（在WSL2中）

```bash
# 进入WSL2
wsl

# 激活环境
source ~/deepseek-env/bin/activate

# 转换单个文件
python3 ~/.claude/skills/deepseek-ocr-to-md/scripts/convert_to_md.py \
  --input "/mnt/c/Users/Evan Tian/Downloads/DSTE/scan.pdf" \
  --output "/mnt/c/Users/Evan Tian/Downloads/DSTE/output.md"

# 批量转换目录
# 需要先cd到包含Python脚本的目录
cd /mnt/d/code/WSJF/scripts/ocr-tools

# 然后运行（使用WSL2环境中的Python）
python3 batch-convert-wsl.py "/mnt/c/Users/Evan Tian/Downloads/DSTE"
```

---

## 🔧 故障排除

### 问题1: nvidia-smi找不到

**症状**:
```bash
nvidia-smi
# command not found
```

**解决**:

1. 确保Windows上安装了最新NVIDIA驱动
2. 安装WSL2的CUDA支持：

```bash
# 在WSL2中
wget https://developer.download.nvidia.com/compute/cuda/repos/wsl-ubuntu/x86_64/cuda-keyring_1.0-1_all.deb
sudo dpkg -i cuda-keyring_1.0-1_all.deb
sudo apt-get update
sudo apt-get -y install cuda-toolkit-11-8
```

### 问题2: vLLM安装失败

**症状**:
```
ERROR: Failed building wheel for vllm
```

**解决**:
```bash
# 安装编译依赖
sudo apt-get install -y build-essential

# 重试安装
pip install vllm==0.8.5
```

### 问题3: 路径中有空格

**症状**: 文件找不到

**解决**:
```bash
# 使用引号
python3 convert.py --input "/mnt/c/Users/Evan Tian/file.pdf" --output "output.md"

# 或转义空格
python3 convert.py --input /mnt/c/Users/Evan\ Tian/file.pdf --output output.md
```

---

## 💡 使用技巧

### 技巧1: 创建快捷命令

在 `~/.bashrc` 添加：

```bash
alias ocr-convert='source ~/deepseek-env/bin/activate && python3 ~/.claude/skills/deepseek-ocr-to-md/scripts/convert_to_md.py'
```

然后：
```bash
source ~/.bashrc

# 使用
ocr-convert --input /mnt/c/path/to/file.pdf --output output.md
```

### 技巧2: 批量处理脚本

创建 `~/batch-ocr.sh`：

```bash
#!/bin/bash
source ~/deepseek-env/bin/activate

INPUT_DIR="$1"
OUTPUT_DIR="${INPUT_DIR}/markdown_output"

mkdir -p "$OUTPUT_DIR"

for file in "$INPUT_DIR"/*.pdf "$INPUT_DIR"/*.png "$INPUT_DIR"/*.jpg; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        output_name="${filename%.*}.md"

        echo "Converting: $filename"
        python3 ~/.claude/skills/deepseek-ocr-to-md/scripts/convert_to_md.py \
            --input "$file" \
            --output "$OUTPUT_DIR/$output_name"
    fi
done

echo "Done! Check: $OUTPUT_DIR"
```

使用：
```bash
chmod +x ~/batch-ocr.sh
~/batch-ocr.sh "/mnt/c/Users/Evan Tian/Downloads/DSTE"
```

---

## 📚 下一步

1. **按步骤安装**（约15-30分钟）
2. **测试单个文件转换**
3. **创建批量脚本**
4. **从Windows调用WSL2工具**

---

**准备好了吗？**

我会在下一个回复中为您创建：
1. WSL2批量转换脚本
2. Windows-WSL桥接批处理文件
3. 完整的使用示例

请先在WSL2中执行"第3步: 安装DeepSeek-OCR"，完成后告诉我，我再继续创建配套工具！
