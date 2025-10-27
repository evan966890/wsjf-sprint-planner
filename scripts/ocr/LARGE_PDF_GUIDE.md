# 📚 超大 PDF 处理指南

## 问题说明

### OCR API 的限制

| OCR 服务 | 文件大小限制 | 页数限制 | 解决方案 |
|----------|--------------|----------|----------|
| **OCR.space** | 最大 1 MB | 最多 3 页/次 | ✅ 自动分批处理 |
| **百度 OCR** | 最大 4 MB | 无页数限制 | ✅ 转图片逐页识别 |

### 什么是"超大 PDF"？

```
超大的定义:
  - 文件大小 > 1 MB（OCR.space 限制）
  - 页数 > 3 页（OCR.space 限制）
  - 页数 > 100 页（处理时间长）
```

---

## 🛠️ 解决方案（3种）

### 方案 1: 自动分页处理（推荐）⭐

**工具**: `large_pdf_ocr.py`

**特点**:
- ✅ 全自动处理
- ✅ 突破页数限制
- ✅ 突破文件大小限制
- ✅ 分页识别，合并结果

**使用方法**:
```bash
cd D:\code\WSJF

# 自动处理（推荐）
python scripts/ocr/large_pdf_ocr.py 超大文档.pdf -o output.txt

# 使用百度 OCR（推荐大 PDF）
python scripts/ocr/large_pdf_ocr.py 超大文档.pdf --backend baidu

# 使用 OCR.space（自动分批）
python scripts/ocr/large_pdf_ocr.py 超大文档.pdf --backend ocrspace
```

**处理流程**:
```
输入: 100 页的 PDF

↓ 自动分析

策略 1（百度 OCR）:
  转为 100 张图片 → 逐页识别 → 合并结果

策略 2（OCR.space）:
  拆分为 34 个小 PDF（每个 3 页）→ 分批识别 → 合并结果

↓ 输出

output.txt（完整识别结果）
```

---

### 方案 2: 先拆分，再批量处理

**适合**: 需要更多控制的场景

#### 步骤 1: 拆分 PDF

```bash
# 拆分为小 PDF（每 3 页一个，适合 OCR.space）
python scripts/ocr/split_pdf.py 超大文档.pdf --pages-per-file 3

# 或每 10 页一个
python scripts/ocr/split_pdf.py 超大文档.pdf --pages-per-file 10
```

**输出**:
```
超大文档_split/
  ├── 超大文档_part001.pdf  # 第 1-3 页
  ├── 超大文档_part002.pdf  # 第 4-6 页
  ├── 超大文档_part003.pdf  # 第 7-9 页
  └── ...
```

#### 步骤 2: 批量 OCR

```bash
# 批量处理拆分后的文件
python scripts/ocr/batch_ocr.py 超大文档_split/ --backend ocrspace
```

**输出**:
```
超大文档_split/ocr_output/
  ├── 超大文档_part001.txt
  ├── 超大文档_part002.txt
  └── ...
```

#### 步骤 3: 合并结果（可选）

```bash
# Windows
type 超大文档_split\ocr_output\*.txt > 完整结果.txt

# Linux/Mac
cat 超大文档_split/ocr_output/*.txt > 完整结果.txt
```

---

### 方案 3: 提取文字层（如果有）

**适合**: PDF 有文字层但被识别为扫描件

```python
# 使用 PyMuPDF 直接提取文字
import fitz  # PyMuPDF

doc = fitz.open("document.pdf")
text = ""
for page in doc:
    text += page.get_text()

# 保存
with open("output.txt", "w", encoding="utf-8") as f:
    f.write(text)
```

**优点**:
- ✅ 不消耗 OCR 额度
- ✅ 速度快（秒级完成）
- ✅ 无大小限制

**缺点**:
- ❌ 仅适用于有文字层的 PDF
- ❌ 扫描的 PDF 无效

---

## 📊 处理策略对比

### 场景 1: 超大中文 PDF（100+ 页）

| 方案 | 耗时 | 额度消耗 | 准确率 | 推荐度 |
|------|------|----------|--------|--------|
| **百度 OCR 分页** | ~3-5 分钟 | 100 次 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| OCR.space 分批 | ~5-8 分钟 | 34 次 | ⭐⭐⭐ | ⭐⭐⭐ |
| 拆分后批量 | ~10 分钟 | 34-100 次 | 同上 | ⭐⭐ |

**推荐**: 使用 `large_pdf_ocr.py --backend baidu`

---

### 场景 2: 超大英文 PDF（500+ 页）

| 方案 | 耗时 | 额度消耗 | 准确率 | 推荐度 |
|------|------|----------|--------|--------|
| **OCR.space 分批** | ~25-40 分钟 | 167 次 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 百度 OCR 分页 | ~15-25 分钟 | 500 次 | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 拆分后批量 | ~30-50 分钟 | 167-500 次 | 同上 | ⭐⭐⭐ |

**推荐**: 使用 `large_pdf_ocr.py --backend ocrspace`（额度消耗少）

---

### 场景 3: 超超大 PDF（1000+ 页）

**建议**: 分多次处理

```bash
# 1. 先拆分
python split_pdf.py 超超大文档.pdf --pages-per-file 10

# 2. 分批 OCR（避免一次性用完额度）
# 第 1-50 个文件（500 页）
python batch_ocr.py 超超大文档_split/ --backend ocrspace

# 等一段时间或次月
# 第 51-100 个文件（剩余 500 页）
python batch_ocr.py 超超大文档_split/ --backend ocrspace
```

---

## 🚀 实战示例

### 示例 1: 200 页中文需求文档

**文件**: `需求文档.pdf`（200 页，8 MB）

```bash
# 使用大 PDF 工具（推荐）
python large_pdf_ocr.py 需求文档.pdf --backend baidu -o 需求文档.txt

# 处理过程（约 3-6 分钟）
================================================================
大 PDF 处理工具
================================================================
📄 处理大 PDF: 需求文档.pdf
   总页数: 200
   文件大小: 8.00 MB
   策略: 转图片逐页识别

   转换 PDF 为图片...
   ✓ 已转换 200 页

   处理第 1/200 页...
     🇨🇳 使用百度 OCR
     ✓ 完成 (1523 字符)

   处理第 2/200 页...
     ✓ 完成 (1642 字符)

   ...

   处理第 200/200 页...
     ✓ 完成 (1485 字符)

   ✓ 已保存到: 需求文档.txt

================================================================
✅ 处理完成！
================================================================
总字符数: 312,450
总行数: 8,523
```

**额度消耗**: 200 次（百度 OCR）

---

### 示例 2: 50 页英文文档（500 KB）

**文件**: `report.pdf`（50 页，500 KB）

```bash
# 使用 OCR.space（额度大）
python large_pdf_ocr.py report.pdf --backend ocrspace -o report.txt

# 处理过程
📄 处理大 PDF: report.pdf
   总页数: 50
   文件大小: 0.50 MB
   策略: 分批处理（每批最多 3 页）

   批次 1/17: 第 1-3 页
     🌐 使用 OCR.space API 识别...
     ✓ 完成 (2450 字符)

   批次 2/17: 第 4-6 页
     ✓ 完成 (2380 字符)

   ...

   批次 17/17: 第 49-50 页
     ✓ 完成 (1620 字符)

✅ 处理完成！
```

**额度消耗**: 17 次（OCR.space）

---

### 示例 3: 超大混合文档（500 页，20 MB）

**策略**: 先拆分，再批量处理

```bash
# 步骤 1: 拆分（每 10 页）
python split_pdf.py 超大文档.pdf --pages-per-file 10

# 输出: 超大文档_split/ (50 个小 PDF)

# 步骤 2: 批量 OCR（使用百度，中文准确）
python batch_ocr.py 超大文档_split/ --backend baidu

# 步骤 3: 合并结果
cd 超大文档_split\ocr_output
type *.txt > ..\..\超大文档_完整.txt
```

---

## 💰 额度消耗对比

### 100 页 PDF 的额度消耗

| 方案 | OCR.space | 百度 OCR |
|------|-----------|----------|
| **分页识别** | 34 次 | 100 次 |
| **拆分后批量** | 10-34 次 | 10-100 次 |

**建议**:
- 中文 → 百度 OCR（准确率高）
- 英文 → OCR.space（额度消耗少）

---

## ⚙️ 安装依赖

### 基础依赖（必须）

```bash
pip install PyPDF2
```

### 分页识别依赖（可选）

```bash
# 安装 pdf2image（用于转图片）
pip install pdf2image

# Windows 还需要 Poppler
# 下载: https://github.com/oschwartz10612/poppler-windows/releases/
# 解压后添加 bin 文件夹到 PATH
```

---

## 🎯 推荐工作流

### 中文大 PDF（推荐）

```bash
# 一步到位
python large_pdf_ocr.py 中文文档.pdf --backend baidu
```

### 英文/混合大 PDF

```bash
# 使用 OCR.space（额度消耗少）
python large_pdf_ocr.py english_doc.pdf --backend ocrspace
```

### 超超大 PDF（>500 页）

```bash
# 1. 先拆分
python split_pdf.py 超大.pdf --pages-per-file 10

# 2. 分批处理（避免一次性用完额度）
python batch_ocr.py 超大_split/ --backend ocrspace
```

---

## 📋 快速命令参考

```bash
# 自动处理大 PDF
python large_pdf_ocr.py large.pdf

# 拆分 PDF
python split_pdf.py large.pdf --pages-per-file 3

# 批量处理拆分后的文件
python batch_ocr.py large_split/ --backend ocrspace

# 合并结果（Windows）
type ocr_output\*.txt > 完整结果.txt
```

---

## 💡 性能优化建议

### 1. 选择合适的策略

```
< 50 页:   直接用 large_pdf_ocr.py（自动处理）
50-200 页: 使用百度 OCR 分页识别（准确快速）
> 200 页:  拆分后分批处理（避免长时间运行）
```

### 2. 合理使用额度

```
中文为主 + < 1000 页:  百度 OCR（准确率高）
英文为主 + < 5000 页:  OCR.space（额度大）
超大批量 > 5000 页:    分多次处理
```

### 3. 避免重复处理

```bash
# 处理完保存结果
# 下次直接使用结果文件，不要重新 OCR
```

---

## 🎬 完整示例

### 处理 300 页中文合同 PDF

```bash
# 场景
文件: 合同汇编.pdf
大小: 15 MB
页数: 300 页
语言: 中文

# 问题
- 文件太大（> 4 MB）
- 页数太多（> 3 页）

# 解决方案（推荐）
cd D:\code\WSJF
python scripts/ocr/large_pdf_ocr.py 合同汇编.pdf --backend baidu -o 合同.txt

# 处理过程
📄 处理大 PDF: 合同汇编.pdf
   总页数: 300
   文件大小: 15.00 MB
   策略: 转图片逐页识别

   转换 PDF 为图片...
   ✓ 已转换 300 页

   处理第 1/300 页...
     🇨🇳 使用百度 OCR
     ✓ 完成 (1850 字符)

   ... (约 5-10 分钟)

   处理第 300/300 页...
     ✓ 完成 (1720 字符)

✅ 处理完成！
总字符数: 523,450
总行数: 12,845

# 结果
输出文件: 合同.txt
额度消耗: 300 次（百度 OCR）
```

---

### 处理 1000 页英文文档

```bash
# 场景
文件: handbook.pdf
大小: 50 MB
页数: 1000 页
语言: 英文

# 策略: 先拆分，再分批处理

# 步骤 1: 拆分（每 3 页）
python split_pdf.py handbook.pdf --pages-per-file 3

# 输出: handbook_split/ (334 个小 PDF)

# 步骤 2: 第一批（处理前 100 个文件 = 300 页）
python batch_ocr.py handbook_split/ --backend ocrspace

# 等待完成...

# 步骤 3: 第二批（处理剩余）
python batch_ocr.py handbook_split/ --backend ocrspace

# 步骤 4: 合并
cd handbook_split\ocr_output
type *.txt > ..\..\handbook_完整.txt

# 总额度消耗: 334 次（OCR.space）
# 分两个月处理可节省成本
```

---

## 🔧 故障排查

### 问题 1: pdf2image 报错

```
错误: Unable to get page count. Is poppler installed?
```

**解决**（Windows）:
1. 下载 Poppler: https://github.com/oschwartz10612/poppler-windows/releases/
2. 解压（如解压到 `C:\poppler`）
3. 添加到 PATH:
   ```bash
   # PowerShell（管理员）
   [Environment]::SetEnvironmentVariable(
       "Path",
       $env:Path + ";C:\poppler\Library\bin",
       "Machine"
   )
   ```
4. 重启终端

**或使用拆分方案**（不需要 pdf2image）:
```bash
python split_pdf.py large.pdf --pages-per-file 3
```

---

### 问题 2: 内存不足

```
错误: MemoryError
```

**解决**:
1. 减小每批页数
   ```bash
   python split_pdf.py large.pdf --pages-per-file 5
   ```

2. 或分多次处理
   ```bash
   # 处理前半部分
   # 等待完成后
   # 处理后半部分
   ```

---

### 问题 3: 处理时间太长

**优化**:
1. 使用百度 OCR（响应更快）
2. 减少页数（只处理需要的部分）
3. 后台运行

```powershell
# Windows 后台运行
Start-Job -ScriptBlock {
    cd D:\code\WSJF
    python scripts/ocr/large_pdf_ocr.py large.pdf --backend baidu
}
```

---

### 问题 4: API 限额快用完

**策略**:
```bash
# 如果百度 OCR 快用完（剩余 < 100 次）
# 切换到 OCR.space
python large_pdf_ocr.py large.pdf --backend ocrspace

# 或分批处理
# 先处理 50 页，等下月再处理剩余
```

---

## 📊 成本估算

### 100 页 PDF

| 后端 | 额度消耗 | 剩余额度 | 可处理量 |
|------|----------|----------|----------|
| OCR.space | 34 次 | 24,966 次 | 还能处理 ~73,000 页 |
| 百度 OCR | 100 次 | 900-1,900 次 | 还能处理 ~900-1,900 页 |

### 1000 页 PDF

| 后端 | 额度消耗 | 剩余额度 | 建议 |
|------|----------|----------|------|
| OCR.space | 334 次 | 24,666 次 | ✅ 推荐 |
| 百度 OCR | 1,000 次 | 0-1,000 次 | ⚠️ 刚好用完 |

**结论**: 超大 PDF 推荐用 OCR.space（额度消耗少）

---

## ✅ 总结

### 超大 PDF 的 3 种解决方案

1. **自动分页处理** ⭐⭐⭐⭐⭐
   ```bash
   python large_pdf_ocr.py large.pdf --backend baidu
   ```
   - 全自动
   - 一步到位
   - 最简单

2. **先拆分再批量** ⭐⭐⭐⭐
   ```bash
   python split_pdf.py large.pdf --pages-per-file 3
   python batch_ocr.py large_split/ --backend ocrspace
   ```
   - 更多控制
   - 可暂停/继续
   - 适合超大文件

3. **提取文字层** ⭐⭐⭐
   ```python
   # 适用于有文字层的 PDF
   # 不消耗 OCR 额度
   ```

### 推荐策略

```
< 100 页:    large_pdf_ocr.py（一步到位）
100-500 页:  large_pdf_ocr.py + 百度 OCR
> 500 页:    split_pdf.py + batch_ocr.py（分批处理）
```

---

**开始处理你的超大 PDF 吧！** 🚀

需要：
```bash
cd D:\code\WSJF
python scripts/ocr/large_pdf_ocr.py 你的大PDF.pdf --backend baidu
```
