# Windows OCR解决方案指南

## ⚠️ 重要说明

**DeepSeek-OCR (vLLM) 在Windows上支持有限！**

从您的测试结果看：
- ✅ 有文字层的PDF正常工作（deepseek.pdf, gemini.pdf等）
- ❌ 图片和扫描PDF失败（需要vLLM，但未安装）

## 问题分析

### 当前状态

```
✓ 成功: 3 个文件（有文字层的PDF）
✗ 失败: 29 个文件（图片和扫描PDF - 需要vLLM）
```

**失败原因**:
```
Error: Missing required package: No module named 'vllm'
```

### vLLM的Windows问题

vLLM主要为Linux设计，Windows支持：
- ⚠️ 安装复杂
- ⚠️ 可能无法正常运行
- ⚠️ 需要WSL2或Docker

---

## 🎯 推荐解决方案

### 方案1: 使用Tesseract OCR（免费，简单）⭐

**优点**:
- ✅ Windows原生支持
- ✅ 安装简单
- ✅ 免费开源
- ✅ 支持中文

**缺点**:
- ⚠️ 识别质量不如DeepSeek-OCR
- ⚠️ 对复杂布局支持较弱

#### 快速安装

1. **下载Tesseract**:
   ```
   https://github.com/UB-Mannheim/tesseract/wiki
   下载 tesseract-ocr-w64-setup-5.x.x.exe
   ```

2. **安装时勾选中文语言包**:
   - 默认安装英文
   - 勾选 "Additional language data (download)"
   - 选择 "Chinese - Simplified" 和 "Chinese - Traditional"

3. **添加到PATH**:
   - 安装路径: `C:\Program Files\Tesseract-OCR`
   - 添加到系统环境变量PATH

4. **安装Python包**:
   ```bash
   pip install pytesseract pdf2image pillow
   ```

#### 使用工具

我会为您创建一个基于Tesseract的批量转换工具（见下方）。

---

### 方案2: 使用在线OCR API（最佳质量）💰

**推荐服务**:

#### A. Azure Computer Vision OCR
- 质量: ⭐⭐⭐⭐⭐
- 价格: 前1000次/月免费
- 支持: 中英文、表格、手写

**申请**:
```
1. 访问 https://azure.microsoft.com/
2. 创建Computer Vision资源
3. 获取API密钥
```

#### B. 百度OCR API
- 质量: ⭐⭐⭐⭐
- 价格: 每天免费500次
- 支持: 中文优化

**申请**:
```
1. 访问 https://ai.baidu.com/tech/ocr
2. 注册并创建应用
3. 获取API Key和Secret Key
```

#### C. 腾讯OCR API
- 质量: ⭐⭐⭐⭐
- 价格: 每月免费1000次
- 支持: 中文

---

### 方案3: WSL2 + DeepSeek-OCR（技术方案）

**适合**: 技术用户，需要最佳质量

#### 安装步骤

```bash
# 1. 安装WSL2（在PowerShell管理员模式）
wsl --install

# 2. 重启电脑

# 3. 进入WSL2（Ubuntu）
wsl

# 4. 在WSL2中安装DeepSeek-OCR
cd ~/.claude/skills/deepseek-ocr-to-md
bash scripts/install.sh

# 5. 使用（在WSL2中）
python scripts/convert_to_md.py /mnt/c/Users/YourName/Downloads/file.pdf
```

**优点**:
- ✅ 使用完整的DeepSeek-OCR
- ✅ 最高质量OCR
- ✅ 完整功能支持

**缺点**:
- ⚠️ 设置复杂
- ⚠️ 需要学习WSL2
- ⚠️ 需要GPU驱动支持

---

### 方案4: 云端服务器（生产环境）

**适合**: 大量文件处理

租用GPU云服务器：
- 阿里云GPU实例
- 腾讯云GPU实例
- AWS/Azure GPU VM

部署DeepSeek-OCR，通过API调用。

---

## 🚀 快速实施：Tesseract方案

我为您创建了基于Tesseract的工具：

### 文件

```
scripts/ocr-tools/
├── tesseract-convert.py         ← 新：Tesseract批量转换
├── tesseract-convert.bat        ← 新：Windows一键运行
└── install-tesseract.md         ← 新：安装指南
```

### 使用方法

```bash
# 安装Tesseract后
python tesseract-convert.py ./PDF文件夹

# 或双击
tesseract-convert.bat
```

---

## 📊 方案对比

| 方案 | 质量 | 速度 | 成本 | Windows支持 | 安装难度 |
|------|------|------|------|-------------|---------|
| **Tesseract** | ⭐⭐⭐ | 快 | 免费 | ✅ 优秀 | ⭐ 简单 |
| Azure OCR | ⭐⭐⭐⭐⭐ | 快 | 💰 付费 | ✅ API | ⭐ 简单 |
| 百度OCR | ⭐⭐⭐⭐ | 快 | 💰 部分免费 | ✅ API | ⭐ 简单 |
| DeepSeek-OCR (WSL2) | ⭐⭐⭐⭐⭐ | 中 | 免费 | ⚠️ WSL2 | ⭐⭐⭐⭐ 复杂 |
| 云端GPU | ⭐⭐⭐⭐⭐ | 快 | 💰💰 付费 | ✅ API | ⭐⭐⭐ 中等 |

---

## 💡 我的建议

### 短期（立即可用）

**使用Tesseract**：
1. 安装Tesseract（5分钟）
2. 使用我创建的`tesseract-convert.py`
3. 质量足够应对大多数文档

**适合**:
- 日常使用
- 中等质量需求
- 简单文档

---

### 中期（质量优先）

**使用在线OCR API**：
1. 申请百度OCR API（免费额度）
2. 配置API密钥
3. 使用API转换工具

**适合**:
- 重要文档
- 需要高质量
- 文件量不大（在免费额度内）

---

### 长期（生产环境）

**部署云端服务**：
1. 租用GPU服务器
2. 部署DeepSeek-OCR
3. 通过API调用

**适合**:
- 大量文件
- 团队使用
- 需要稳定服务

---

## 🎯 立即行动

### 选择1: 安装Tesseract（推荐）

我已经为您准备好了Tesseract工具，只需：

```bash
# 1. 安装Tesseract
下载: https://github.com/UB-Mannheim/tesseract/wiki
安装时勾选中文语言包

# 2. 安装Python依赖
pip install pytesseract pdf2image pillow

# 3. 运行转换（我会创建这个工具）
python tesseract-convert.py ./PDF文件夹
```

---

### 选择2: 仅使用现有功能

**当前已工作的功能**:

✅ **有文字层的PDF** → 可以直接提取文本
- deepseek.pdf ✓
- gemini.pdf ✓
- 国际化产品规划完整版.pdf ✓

**工作流程**:
1. 上传PDF到WSJF项目
2. 如果有文字层 → 自动提取
3. 如果是扫描件 → 提示用户

**适合**: 大部分文件已有文字层

---

## ❓ 您想怎么做？

请告诉我您的选择：

**A. 安装Tesseract**（我会创建配套工具）
   - 5分钟安装
   - 免费
   - 质量中等

**B. 使用在线API**（我会创建API集成工具）
   - 需要申请API
   - 质量最好
   - 有免费额度

**C. 暂时不处理图片/扫描PDF**
   - 仅使用现有的文字层PDF提取功能
   - 扫描件手动处理

**D. 尝试WSL2安装vLLM**（技术挑战）
   - 需要时间学习
   - 质量最好
   - 完全免费

---

请告诉我您的选择，我会立即为您配置相应的解决方案！
