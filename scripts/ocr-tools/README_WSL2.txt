===============================================
     WSL2 + DeepSeek-OCR 使用说明
===============================================

您已经有WSL2，太棒了！

-----------------------------------------------
  快速安装（3条命令）
-----------------------------------------------

在PowerShell中运行:

1. wsl

2. cd /mnt/d/code/WSJF/scripts/ocr-tools

3. bash wsl-quick-install.sh

等待10-20分钟完成安装。

-----------------------------------------------
  安装后测试
-----------------------------------------------

在WSL2中:

  source ~/deepseek-env/bin/activate

  python3 ~/.claude/skills/deepseek-ocr-to-md/scripts/convert_to_md.py \
    --input "/mnt/c/Users/Evan Tian/Downloads/DSTE/test.pdf" \
    --output "/mnt/c/Users/Evan Tian/Downloads/DSTE/output.md"

-----------------------------------------------
  批量转换（2种方法）
-----------------------------------------------

方法1: 在WSL2中运行
  wsl
  bash /mnt/d/code/WSJF/scripts/ocr-tools/wsl2-batch-convert.sh \
    "C:\Users\Evan Tian\Downloads\DSTE"

方法2: 从Windows直接调用（更简单）
  双击: wsl-convert.bat
  或
  wsl-convert.bat "C:\Your\PDF\Folder"

-----------------------------------------------
  路径转换
-----------------------------------------------

Windows路径 → WSL2路径

  C:\Users\Evan Tian\Downloads
  →
  /mnt/c/Users/Evan Tian/Downloads

  D:\code\WSJF
  →
  /mnt/d/code/WSJF

规则:
  1. C: → /mnt/c
  2. \ → /
  3. 空格加引号

-----------------------------------------------
  文件清单
-----------------------------------------------

wsl-quick-install.sh
  → 一键安装所有依赖

wsl2-batch-convert.sh
  → WSL2批量转换脚本

wsl-convert.bat
  → Windows调用WSL2的桥接工具

WSL2_SETUP_GUIDE.md
  → 详细安装指南

WSL2_QUICK_START.md
  → 快速开始（本文档的MD版本）

-----------------------------------------------
  常用命令
-----------------------------------------------

激活环境:
  source ~/deepseek-env/bin/activate

转换文件:
  ocr-convert --input /mnt/c/path/file.pdf --output out.md

批量转换:
  bash wsl2-batch-convert.sh "C:\PDF\Folder"

检查GPU:
  nvidia-smi

-----------------------------------------------
  故障排除
-----------------------------------------------

问题: nvidia-smi找不到
解决:
  1. 确保Windows安装了最新NVIDIA驱动
  2. 重启WSL2: wsl --shutdown (在PowerShell)

问题: CUDA不可用
解决:
  在WSL2中安装CUDA toolkit
  详见: WSL2_SETUP_GUIDE.md

问题: vLLM安装失败
解决:
  sudo apt-get install build-essential
  pip install vllm==0.8.5

-----------------------------------------------
  下一步
-----------------------------------------------

1. 运行快速安装脚本
   wsl
   cd /mnt/d/code/WSJF/scripts/ocr-tools
   bash wsl-quick-install.sh

2. 等待安装完成

3. 测试转换

4. 批量处理您的PDF文件

-----------------------------------------------
  获取帮助
-----------------------------------------------

详细文档: WSL2_SETUP_GUIDE.md
快速入门: WSL2_QUICK_START.md
故障排除: TROUBLESHOOTING.md

===============================================

开始安装：wsl → cd /mnt/d/code/WSJF/scripts/ocr-tools → bash wsl-quick-install.sh
