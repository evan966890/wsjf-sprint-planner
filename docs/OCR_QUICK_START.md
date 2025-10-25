# OCR快速入门指南

5分钟快速上手DeepSeek-OCR，处理扫描PDF和图片文件。

## 🚀 最快方式（Windows用户）

### 1. 双击运行批量转换工具

```
📁 D:\code\WSJF\scripts\ocr-tools\batch-convert.bat
   ↑ 双击这个文件
```

### 2. 按提示选择

```
选择转换模式:
1. 快速转换 (base分辨率, 200 DPI)    ← 推荐
2. 高质量转换 (large分辨率, 300 DPI)
3. 快速转换 (small分辨率, 适合简单文档)

请选择 (1-3): 1
```

### 3. 等待转换完成

```
输出目录: 当前目录\markdown_output
```

### 4. 上传Markdown文件

将生成的`.md`文件上传到项目中使用。

**完成！**

---

## 📋 场景示例

### 场景1: 单个扫描PDF

**问题**: 我有一个扫描的需求文档`需求.pdf`

**解决**:
1. 把`需求.pdf`放在一个文件夹里
2. 双击`batch-convert.bat`
3. 拖拽该文件夹到窗口（或输入路径）
4. 选择模式1（快速转换）
5. 完成后在`markdown_output/需求.md`查看结果

### 场景2: 一堆混合文件

**问题**: 文件夹里有PDF、PNG、JPG混在一起

**解决**:
1. 双击`batch-convert.bat`
2. 指定文件夹路径
3. 工具会自动识别所有支持的格式
4. 一次性全部转换完成

### 场景3: 已有部分转换，只转新文件

**问题**: 每天新增文件，不想重复转换

**解决**:
- 批量工具默认跳过已存在的文件
- 直接运行即可，只转换新文件

### 场景4: 某个文件质量不好

**问题**: 某个扫描件转换效果不理想

**解决**:
```bash
# 命令行单独处理，使用高质量设置
python scripts/ocr-tools/batch-convert.py problem.pdf --resolution large --dpi 300 --no-skip
```

---

## 💡 3个关键点

### 1. 首次运行会下载模型
- 大小: ~3-6GB
- 只需下载一次
- 耐心等待完成

### 2. 需要GPU
- NVIDIA GPU（6GB+ VRAM推荐）
- 没有GPU会非常慢（不建议）

### 3. 质量设置

| 设置 | 速度 | 质量 | 何时用 |
|------|------|------|--------|
| small | 快 | 一般 | 简单文档、快速预览 |
| **base** | **中** | **好** | **大多数情况（推荐）** |
| large | 慢 | 最好 | 复杂布局、重要文档 |

---

## 🔧 命令行用法（高级）

```bash
# 基本用法
python scripts/ocr-tools/batch-convert.py <文件夹路径>

# 常用选项
python scripts/ocr-tools/batch-convert.py ./我的PDF \
  --resolution base \      # 分辨率：tiny/small/base/large
  --dpi 200 \             # DPI设置
  --output ./markdown     # 输出目录
```

**提示**: 不确定用什么参数？直接用默认的就好（`--resolution base --dpi 200`）

---

## ❓ 遇到问题？

### "无法导入DocumentProcessor"

DeepSeek-OCR技能未安装。

**解决**:
```bash
cd ~/.claude/skills/deepseek-ocr-to-md
python scripts/install.py
```

### "CUDA out of memory"

GPU内存不足。

**解决**:
```bash
# 使用小尺寸
python batch-convert.py ./pdfs --resolution small
```

### "找不到Poppler"

PDF处理工具未安装（仅影响PDF，图片不受影响）

**解决** (Windows):
1. 下载: https://github.com/oschwartz10612/poppler-windows/releases/
2. 解压后添加`bin`文件夹到PATH

---

## 📚 更多信息

- **详细文档**: `docs/OCR_INTEGRATION.md`
- **工具说明**: `scripts/ocr-tools/README.md`
- **项目集成**: `src/utils/ocrParser.ts`

---

**就这么简单！** 🎉

有问题随时查看文档或询问。
