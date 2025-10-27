# OCR 功能快速开始 - WSJF 项目

## 两种 OCR 方案对比

| 方案 | 优点 | 缺点 | 推荐场景 |
|------|------|------|----------|
| **在线 OCR** (新)| ✅ 无需安装<br>✅ 无需 GPU<br>✅ 支持中英文<br>✅ 5分钟上手 | ⚠️ 需要网络<br>⚠️ 月限额 25,000次 | ✅ **个人使用**<br>✅ **快速测试**<br>✅ **中小规模** |
| DeepSeek-OCR | ✅ 最高质量<br>✅ 离线使用<br>✅ 无限制 | ❌ 需要 NVIDIA GPU<br>❌ 安装复杂 | 大规模批量处理<br>高质量要求 |

## 推荐：使用在线 OCR（新方案）

### 为什么推荐？

你的系统配置：
- ❌ 没有 NVIDIA GPU（只有 Intel Arc）
- ❌ Python 3.15.0a1（alpha版本，兼容性问题）
- ✅ 有网络连接

**结论**: 在线 OCR 方案最适合你！

### 立即开始（3步）

#### 1. 测试 OCR 功能

```bash
cd D:\code\WSJF
python scripts/ocr/test_ocr.py
```

会提示你输入一个测试文件路径（图片或 PDF）。

#### 2. 基本使用

```bash
# 转换图片
python scripts/ocr/simple_ocr.py 需求截图.png -o 需求.txt

# 转换 PDF
python scripts/ocr/simple_ocr.py 扫描文档.pdf -o 文档.txt

# 查看帮助
python scripts/ocr/simple_ocr.py --help
```

#### 3. 集成到项目

```python
import sys
sys.path.append('scripts/ocr')
from simple_ocr import SimpleOCR

# 创建 OCR 实例
ocr = SimpleOCR()

# 提取文本
text = ocr.convert_file('需求文档.png')

# 使用文本
print(text)
```

## 示例：从截图创建需求

### 场景
你在 Slack/邮件中看到一段需求描述，想快速添加到 WSJF：

1. **截图保存**
   ```
   Win + Shift + S (Windows 截图) → 保存为 requirement.png
   ```

2. **OCR 识别**
   ```bash
   python scripts/ocr/simple_ocr.py requirement.png -o requirement.txt
   ```

3. **查看结果**
   ```bash
   cat requirement.txt
   # 或
   type requirement.txt  # Windows
   ```

4. **手动创建需求或使用 AI 分析**
   ```python
   # 可以进一步集成 AI 自动提取字段
   text = open('requirement.txt').read()
   # 使用 GPT/Claude 分析 text，提取结构化信息
   ```

## API 配额说明

### 免费额度
- **25,000 次/月**（足够个人使用）
- **1MB 文件大小限制**
- **PDF 最多 3 页**

### 如果需要更多
1. 免费注册: https://ocr.space/ocrapi
2. 获取自己的 API Key
3. 使用方式:
   ```bash
   python simple_ocr.py file.pdf --api-key YOUR_KEY
   ```

## 完整文档

- **工具说明**: `scripts/ocr/README.md`
- **代码示例**: `scripts/ocr/simple_ocr.py`
- **测试脚本**: `scripts/ocr/test_ocr.py`

## 如果遇到问题

### 网络错误
```bash
# 确认可以访问 API
curl https://api.ocr.space
```

### API 限额用尽
- 等待下月重置
- 或注册自己的 API Key

### 识别质量不好
- 提高图片质量（建议 300 DPI 以上）
- 确保文字清晰
- 避免倾斜和模糊

## 升级到 DeepSeek-OCR

如果以后需要更高质量或离线使用，可以升级：

1. 购买 NVIDIA GPU（至少 6GB VRAM）
2. 参考 `docs/OCR_INTEGRATION.md`
3. 使用批量转换工具

**但现在，在线方案已经够用了！** 🎉
