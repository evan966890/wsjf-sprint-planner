# OCR工具故障排除指南

## 问题1: 复制bat文件到其他目录后无法运行

### 症状
```
python: can't open file 'C:\...\batch-convert.py': [Errno 2] No such file or directory
```

### 原因
原有的`quick-convert.bat`和`run-batch-convert.bat`使用相对路径`%~dp0`，只能在脚本所在目录运行。

### 解决方案

使用新的**便携版**批处理文件：

#### 方法1: 快速转换（推荐）

**文件**: `portable-convert.bat`

**使用**:
1. 复制`portable-convert.bat`到任意包含PDF的文件夹
2. 双击运行
3. 自动转换当前目录所有文件

**特点**:
- ✅ 可复制到任何地方使用
- ✅ 使用绝对路径
- ✅ 自动使用推荐设置

#### 方法2: 可选设置

**文件**: `portable-convert-interactive.bat`

**使用**:
1. 复制到目标文件夹
2. 双击运行
3. 选择质量模式(1/2/3)

**特点**:
- ✅ 可复制到任何地方
- ✅ 可选择质量设置
- ✅ 更灵活

### 配置

两个便携版文件都包含绝对路径配置：

```batch
set "SCRIPT_DIR=D:\code\WSJF\scripts\ocr-tools"
set "PYTHON_SCRIPT=%SCRIPT_DIR%\batch-convert.py"
```

**如果您的项目在其他位置**，请编辑这两行，修改`SCRIPT_DIR`为您的实际路径。

---

## 问题2: 提取的内容是总结，不是原文

### 症状
转换后的文本是经过理解和提炼的，不是逐字逐句的原文。

### 原因
DeepSeek-OCR的默认prompt是"Convert to markdown"，会进行内容理解和格式化。

### 解决方案

使用**原文提取模式**：

#### 原文提取脚本

**文件**: `batch-convert-raw.py`

**特点**:
- ✅ 逐字逐句提取
- ✅ 不进行任何总结
- ✅ 保留原始格式
- ✅ 提取所有内容

**使用方法**:

```bash
# 基本用法
python batch-convert-raw.py ./PDF文件夹

# 高质量提取
python batch-convert-raw.py ./扫描文档 --resolution large --dpi 300
```

**输出位置**: `输入目录/raw_text_output/`

**输出格式**: `.txt`文件（纯文本，非Markdown）

#### 对比

| 特性 | batch-convert.py | batch-convert-raw.py |
|------|------------------|---------------------|
| 用途 | Markdown格式化 | 原文提取 |
| 内容处理 | 理解、整理、格式化 | 逐字提取 |
| 输出格式 | Markdown (.md) | 纯文本 (.txt) |
| 适用场景 | 文档归档、阅读 | 数据提取、分析 |

#### Prompt差异

**标准模式** (`batch-convert.py`):
```
Convert the document to markdown.
```
→ 会进行理解和整理

**原文模式** (`batch-convert-raw.py`):
```
Extract ALL text EXACTLY as it appears.
Do NOT summarize or rephrase.
Extract EVERY word, number, and symbol.
```
→ 逐字提取

---

## 问题3: 提取的内容不完整

### 可能原因

1. **分辨率设置太低**
2. **DPI设置太低**
3. **扫描质量差**
4. **复杂布局**

### 解决方案

#### 1. 使用更高质量设置

```bash
# 高质量 + 高DPI
python batch-convert-raw.py ./文档 --resolution large --dpi 300

# 如果GPU内存不足
python batch-convert-raw.py ./文档 --resolution base --dpi 300
```

#### 2. 质量设置对照表

| 设置 | 分辨率 | 适合场景 | GPU内存 |
|------|--------|----------|---------|
| tiny | 512 | 测试用 | ~2GB |
| small | 640 | 简单文档 | ~3GB |
| **base** | **1024** | **推荐** | **~6GB** |
| large | 1280 | 复杂文档 | ~10GB |

| DPI | 效果 | 速度 |
|-----|------|------|
| 150 | 快速预览 | 快 |
| **200** | **推荐** | **中** |
| 300 | 高质量 | 慢 |
| 600 | 极高质量 | 很慢 |

#### 3. 预处理文档

- ✅ 确保扫描清晰
- ✅ 调整图片对比度
- ✅ 裁剪无用边缘

---

## 问题4: 批处理文件中文乱码

### 症状
批处理文件显示中文乱码

### 原因
Windows批处理文件编码问题

### 解决方案

使用**英文版**批处理文件：
- `portable-convert.bat`
- `portable-convert-interactive.bat`
- `quick-convert.bat`（已在scripts/ocr-tools目录）

这些文件都使用英文界面，避免编码问题。

---

## 问题5: 模型下载失败

### 症状
```
Failed to download model
```

### 解决方案

#### 方法1: 手动下载

```bash
# 设置HuggingFace镜像（可选）
export HF_ENDPOINT=https://hf-mirror.com

# 预先下载模型
python -c "from vllm import LLM; LLM('deepseek-ai/DeepSeek-OCR', trust_remote_code=True)"
```

#### 方法2: 使用代理

如果需要代理访问HuggingFace：

```bash
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port

python batch-convert.py ./文档
```

---

## 问题6: CUDA内存不足

### 症状
```
CUDA out of memory
```

### 解决方案

#### 1. 降低分辨率

```bash
python batch-convert.py ./文档 --resolution small
```

#### 2. 减少批量大小

一次处理较少文件

#### 3. 清理GPU缓存

```python
import torch
torch.cuda.empty_cache()
```

---

## 常用命令速查

### 标准Markdown转换

```bash
# 快速
python batch-convert.py ./文档 --resolution base --dpi 200

# 高质量
python batch-convert.py ./文档 --resolution large --dpi 300

# 快速预览
python batch-convert.py ./文档 --resolution small --dpi 150
```

### 原文提取

```bash
# 标准原文提取
python batch-convert-raw.py ./文档

# 高质量原文提取
python batch-convert-raw.py ./文档 --resolution large --dpi 300
```

### 便携批处理

```
双击: portable-convert.bat（快速）
双击: portable-convert-interactive.bat（可选设置）
```

---

## 文件功能对照表

| 文件 | 功能 | 输出 | 可复制使用 |
|------|------|------|-----------|
| `batch-convert.py` | Markdown转换 | .md文件 | ❌ 需在目录运行 |
| `batch-convert-raw.py` | 原文提取 | .txt文件 | ❌ 需在目录运行 |
| `quick-convert.bat` | 快速转换(相对路径) | .md文件 | ❌ 仅本目录 |
| `portable-convert.bat` | 快速转换(便携) | .md文件 | ✅ 可复制任意位置 |
| `portable-convert-interactive.bat` | 可选设置(便携) | .md文件 | ✅ 可复制任意位置 |
| `run-batch-convert.bat` | 可选设置(相对路径) | .md文件 | ❌ 仅本目录 |

---

## 推荐工作流程

### 场景1: 快速处理PDF

```
1. 复制 portable-convert.bat 到PDF文件夹
2. 双击运行
3. 查看 markdown_output 目录
```

### 场景2: 需要原文

```
1. 在命令行运行：
   python batch-convert-raw.py ./PDF文件夹
2. 查看 raw_text_output 目录
```

### 场景3: 高质量转换

```
1. 复制 portable-convert-interactive.bat
2. 双击，选择模式2（高质量）
3. 等待转换完成
```

---

## 获取帮助

### 查看完整选项

```bash
python batch-convert.py --help
python batch-convert-raw.py --help
```

### 相关文档

- [快速入门](../../docs/OCR_QUICK_START.md)
- [完整文档](../../docs/OCR_INTEGRATION.md)
- [导入指南](../../docs/PDF_IMAGE_IMPORT_GUIDE.md)

---

**提示**: 如果问题仍未解决，请检查：
1. Python版本 (需要3.10+)
2. GPU驱动和CUDA
3. 磁盘空间（模型约6GB）
4. 文件权限
