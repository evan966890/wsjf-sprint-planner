# OCR 转换工具 for WSJF 项目

## 简介

这个 OCR 工具可以将图片和扫描的 PDF 转换为文本，用于 WSJF 项目的需求文档识别。

**特点**:
- ✅ **零安装** - 无需安装 Tesseract 或其他 OCR 软件
- ✅ **免费使用** - 25,000 次/月免费额度
- ✅ **中英文混合** - 自动识别中文和英文
- ✅ **支持 PDF** - 直接处理扫描的 PDF 文件
- ✅ **跨平台** - Windows/Mac/Linux 通用

## 快速开始

### 1. 安装依赖

```bash
cd D:\code\WSJF
python -m pip install requests
```

### 2. 使用示例

#### 转换图片
```bash
python scripts/ocr/simple_ocr.py 需求文档.png -o 需求文档.txt
```

#### 转换 PDF
```bash
python scripts/ocr/simple_ocr.py 扫描文档.pdf -o 扫描文档.txt
```

#### 查看帮助
```bash
python scripts/ocr/simple_ocr.py --help
```

## 集成到 WSJF 项目

### 方案 1: Python 脚本调用

```python
import subprocess
from pathlib import Path

def extract_text_from_file(file_path: str) -> str:
    """从图片或 PDF 提取文本"""
    output_path = Path(file_path).with_suffix('.txt')

    # 调用 OCR 脚本
    result = subprocess.run([
        'python',
        'scripts/ocr/simple_ocr.py',
        file_path,
        '-o', str(output_path)
    ], capture_output=True, text=True)

    if result.returncode != 0:
        raise Exception(f"OCR 失败: {result.stderr}")

    # 读取结果
    return output_path.read_text(encoding='utf-8')

# 使用示例
text = extract_text_from_file('需求文档.png')
print(text)
```

### 方案 2: 直接导入模块

```python
import sys
sys.path.append('scripts/ocr')

from simple_ocr import SimpleOCR

# 创建 OCR 实例
ocr = SimpleOCR()

# 转换文件
text = ocr.convert_file('需求文档.pdf', 'output.txt')

# 或者只获取文本，不保存
text = ocr.convert_file('需求文档.png')
print(text)
```

### 方案 3: 在需求导入功能中集成

在 `EditRequirementModal.tsx` 或相关组件中：

```typescript
// 添加文件上传处理
const handleFileUpload = async (file: File) => {
  // 检查是否是图片或 PDF
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';

  if (isImage || isPDF) {
    // 调用后端 OCR API
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/ocr', {
      method: 'POST',
      body: formData
    });

    const { text } = await response.json();

    // 使用 AI 分析文本，提取需求信息
    const requirement = await analyzeRequirementText(text);

    // 填充表单
    setFormData(requirement);
  }
};
```

## 支持的文件格式

- **图片**: `.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`, `.gif`, `.tiff`
- **文档**: `.pdf` (扫描的 PDF，无文字图层)

## API 限制和配额

### 免费 API（默认）
- **请求次数**: 25,000 次/月
- **文件大小**: 最大 1MB
- **页数**: PDF 最多 3 页

### 申请自己的 API Key（推荐）

如果需要更高配额，可以免费注册：

1. 访问 https://ocr.space/ocrapi
2. 注册免费账号
3. 获取 API Key
4. 使用自己的 Key：

```bash
python simple_ocr.py document.pdf --api-key YOUR_API_KEY
```

或在代码中：

```python
ocr = SimpleOCR(api_key='YOUR_API_KEY')
```

## 常见问题

### Q: 识别准确率如何？
A: 对于清晰的打印文档，准确率可达 95%+。对于手写、低质量扫描，建议使用本地 Tesseract 或 DeepSeek-OCR。

### Q: 支持哪些语言？
A: 当前配置支持中文简体和英文混合。可通过修改 `language` 参数支持其他语言。

### Q: 如何处理多页 PDF？
A: OCR.space API 会自动处理多页 PDF（免费版最多 3 页）。如需处理更多页数，建议拆分 PDF 或使用本地 Tesseract。

### Q: 网络请求失败怎么办？
A:
1. 检查网络连接
2. 确认文件大小 < 1MB
3. 如频繁失败，可能达到 API 限额，等待次月重置或注册自己的 API Key

### Q: 如何在离线环境使用？
A: 需要安装本地 Tesseract OCR：
1. 下载安装: https://github.com/UB-Mannheim/tesseract/wiki
2. 运行安装脚本: `powershell scripts/ocr/install-tesseract.ps1`
3. 使用完整版: `python scripts/ocr/ocr_converter.py --backend tesseract`

## 进阶选项

### 升级到本地 OCR (Tesseract)

如果需要离线使用或处理大量文档：

1. **安装 Tesseract**
   ```bash
   powershell -ExecutionPolicy Bypass -File scripts/ocr/install-tesseract.ps1
   ```

2. **安装 Python 依赖**（需要 Python 3.12 或更低版本）
   ```bash
   pip install pytesseract pillow pdf2image
   ```

3. **使用完整版 OCR 工具**
   ```bash
   python scripts/ocr/ocr_converter.py document.pdf -o output.md
   ```

### 升级到 DeepSeek-OCR（最高质量）

如果需要最高识别质量（需要 NVIDIA GPU）：

1. 激活 Claude 插件：
   ```
   /skill deepseek-ocr-to-md
   ```

2. 按照插件文档安装 DeepSeek-OCR

## 支持

遇到问题？

1. 查看日志输出的错误信息
2. 检查 [OCR.space API 文档](https://ocr.space/ocrapi)
3. 在 WSJF 项目中提交 Issue

## 许可

本工具基于 OCR.space API 开发，遵循其[服务条款](https://ocr.space/tos)。
