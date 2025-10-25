## 批量PDF/图片转Markdown工具

用于批量转换PDF和图片文件为Markdown格式，使用DeepSeek-OCR进行高质量识别。

## 快速开始

### Windows用户（推荐）

1. **双击运行**：
   ```
   双击 batch-convert.bat
   ```
   - 将转换当前目录的所有PDF和图片
   - 跟随提示选择转换模式

2. **拖拽文件夹**：
   - 将要转换的文件夹拖到 `batch-convert.bat` 上
   - 跟随提示完成转换

### 命令行使用

```bash
# 转换当前目录
python batch-convert.py .

# 转换指定目录
python batch-convert.py ./我的PDF文件

# 指定输出目录
python batch-convert.py ./pdfs --output ./markdown

# 高质量转换（慢但质量好）
python batch-convert.py ./scans --resolution large --dpi 300

# 快速转换（快但质量一般）
python batch-convert.py ./pdfs --resolution small --dpi 150

# 强制使用OCR（即使PDF有文字层）
python batch-convert.py ./pdfs --force-ocr

# 覆盖已存在的文件
python batch-convert.py ./pdfs --no-skip
```

## 支持的文件类型

| 类型 | 扩展名 |
|------|--------|
| PDF | `.pdf` |
| 图片 | `.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`, `.tiff` |

## 转换模式说明

### 1. 快速转换（推荐）
- 分辨率：base (1024x1024)
- DPI：200
- 适用：大多数文档
- 速度：快
- GPU内存：~6GB

### 2. 高质量转换
- 分辨率：large (1280x1280)
- DPI：300
- 适用：高质量扫描件、复杂布局
- 速度：慢
- GPU内存：~10GB

### 3. 快速转换（小尺寸）
- 分辨率：small (640x640)
- DPI：150
- 适用：简单文档、快速预览
- 速度：很快
- GPU内存：~3GB

## 输出说明

- 默认输出目录：`输入目录/markdown_output/`
- 文件名：保持原名，扩展名改为`.md`
- 目录结构：保持输入目录的结构
- 已存在文件：默认跳过（可用`--no-skip`覆盖）

### 输出示例

输入：
```
pdfs/
├── 需求文档1.pdf
├── 设计图/
│   ├── 界面设计.png
│   └── 流程图.jpg
└── 扫描件.pdf
```

输出：
```
pdfs/markdown_output/
├── 需求文档1.md
├── 设计图/
│   ├── 界面设计.md
│   └── 流程图.md
└── 扫描件.md
```

## 使用场景

### 场景1：批量处理扫描文档
```bash
# 您有一批扫描的需求文档需要数字化
python batch-convert.py ./扫描需求文档 --resolution large --dpi 300
```

### 场景2：快速预览PDF内容
```bash
# 快速查看PDF文件内容
python batch-convert.py ./待审查PDF --resolution small
```

### 场景3：定期转换新文件
```bash
# 每天运行，只转换新增文件（跳过已存在）
python batch-convert.py ./每日上传 --output ./markdown数据库
```

### 场景4：混合文件批处理
```bash
# PDF和图片混合目录
python batch-convert.py ./混合文件夹
# 工具会自动识别和处理所有支持的格式
```

## 性能参考

基于 NVIDIA A100 GPU：

| 分辨率 | 速度 | 单页耗时 | GPU内存 |
|--------|------|----------|---------|
| tiny | 最快 | ~1秒 | ~2GB |
| small | 快 | ~1-2秒 | ~3GB |
| **base** | **平衡** | **~2-3秒** | **~6GB** |
| large | 慢 | ~3-5秒 | ~10GB |

多页PDF：速度 × 页数

## 常见问题

### Q: CUDA内存不足
**症状**: `CUDA out of memory` 错误

**解决方案**:
```bash
# 使用更小的分辨率
python batch-convert.py ./pdfs --resolution small
```

### Q: 转换速度太慢
**症状**: 每个文件需要很长时间

**可能原因**:
1. 使用了过高的分辨率/DPI
2. GPU性能不足
3. 文件太大

**解决方案**:
```bash
# 降低质量设置
python batch-convert.py ./pdfs --resolution small --dpi 150
```

### Q: 输出质量不好
**症状**: 识别错误、漏字

**可能原因**:
1. 扫描质量太差
2. 分辨率设置太低

**解决方案**:
```bash
# 使用高质量设置
python batch-convert.py ./pdfs --resolution large --dpi 300
```

### Q: 已经有文字层的PDF还需要OCR吗？
**回答**: 不需要

工具会自动检测：
- 如果PDF有文字层 → 快速提取文本
- 如果PDF是扫描件 → 自动使用OCR

如果想强制OCR：
```bash
python batch-convert.py ./pdfs --force-ocr
```

### Q: 可以转换中文文档吗？
**回答**: 可以

DeepSeek-OCR支持多语言，包括中文、英文等。

### Q: 输出的Markdown格式正确吗？
**回答**: 是的

- 保留段落结构
- 保留表格（转换为Markdown表格）
- 保留标题层级
- 多页PDF会用分隔符标记页码

## 高级用法

### 定时批量转换

创建定时任务（Windows任务计划程序）：

1. 打开任务计划程序
2. 创建基本任务
3. 操作：启动程序
4. 程序：`python`
5. 参数：`D:\code\WSJF\scripts\ocr-tools\batch-convert.py "D:\待转换PDF" --output "D:\Markdown库"`
6. 设置每天运行

### 与项目集成

参考 `../../src/utils/ocrParser.ts` 的集成示例。

## 故障排除

### 1. 找不到DeepSeek-OCR
**错误信息**: `无法导入DocumentProcessor`

**解决**:
```bash
# 检查技能是否安装
ls ~/.claude/skills/deepseek-ocr-to-md

# 如果没有，安装技能
cd ~/.claude/skills/deepseek-ocr-to-md
python scripts/install.py
```

### 2. Python依赖缺失
**错误信息**: `ModuleNotFoundError`

**解决**:
```bash
pip install vllm==0.8.5 pillow pdf2image
```

### 3. Poppler缺失（PDF支持）
**错误信息**: `pdf2image requires poppler`

**解决** (Windows):
1. 下载: https://github.com/oschwartz10612/poppler-windows/releases/
2. 解压并添加`bin`文件夹到PATH

## 获取帮助

```bash
# 查看完整帮助
python batch-convert.py --help

# 查看支持的文件类型
python batch-convert.py --help | grep "支持的文件类型"
```

## 相关文档

- [DeepSeek-OCR技能文档](~/.claude/skills/deepseek-ocr-to-md/SKILL.md)
- [项目集成指南](~/.claude/skills/deepseek-ocr-to-md/integration_example.py)
- [DeepSeek-OCR官方仓库](https://github.com/deepseek-ai/DeepSeek-OCR)

---

**提示**: 首次运行会下载模型（~3-6GB），请耐心等待。
