# 📦 批量 OCR 处理指南

## 功能说明

批量识别文件夹中的所有图片和 PDF 文件，转换为文本。

**支持格式**:
- 图片: `.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`, `.gif`, `.tiff`
- 文档: `.pdf`

**特点**:
- ✅ 自动处理整个文件夹
- ✅ 自动跳过已处理的文件
- ✅ 支持双 OCR 后端
- ✅ 进度显示和统计

---

## 🚀 使用方法

### 方式 1: Windows 双击批处理（最简单）⭐

1. **双击运行**：
   ```
   D:\code\WSJF\scripts\ocr\batch-ocr.bat
   ```

2. **按提示选择**：
   ```
   请选择 OCR 后端:
     1. 自动选择（推荐）
     2. OCR.space（免费 25,000次/月）
     3. 百度 OCR（中文准确率高）

   请选择 (1-3) [默认: 1]: 2
   ```

3. **输入文件夹路径**：
   ```
   请输入要处理的文件夹路径:
   路径: D:\我的PDF文件夹

   # 或直接拖拽文件夹到窗口
   ```

4. **等待处理完成**：
   ```
   [1/10] 文档1.pdf
     🌐 使用 OCR.space API 识别...
     ✓ 完成 (1523 字符, 42 行, 3.2秒)

   [2/10] 文档2.png
     ...
   ```

5. **查看结果**：
   ```
   输出目录: D:\我的PDF文件夹\ocr_output\
   ```

---

### 方式 2: 命令行使用

```bash
cd D:\code\WSJF

# 处理整个文件夹
python scripts/ocr/batch_ocr.py D:\我的PDF文件夹

# 处理单个文件
python scripts/ocr/batch_ocr.py document.pdf

# 使用百度 OCR（中文文档）
python scripts/ocr/batch_ocr.py D:\中文文档 --backend baidu

# 使用 OCR.space（批量处理）
python scripts/ocr/batch_ocr.py D:\大量文件 --backend ocrspace

# 自定义输出目录
python scripts/ocr/batch_ocr.py ./文件夹 --output-dir 识别结果

# 强制重新处理（不跳过已存在的文件）
python scripts/ocr/batch_ocr.py ./文件夹 --no-skip
```

---

## 📂 输出结构

### 默认输出位置

```
输入目录/
├── 文档1.pdf
├── 文档2.png
├── 图片3.jpg
└── ocr_output/              # 输出目录
    ├── 文档1.txt            # PDF 识别结果
    ├── 文档2.txt            # PNG 识别结果
    └── 图片3.txt            # JPG 识别结果
```

### 自定义输出目录

```bash
python batch_ocr.py ./文件夹 --output-dir 我的识别结果
```

```
输入目录/
├── ...原文件...
└── 我的识别结果/
    └── ...识别结果...
```

---

## 🎯 使用场景

### 场景 1: 批量处理扫描 PDF

**需求**: 有一堆扫描的需求文档 PDF

**操作**:
```bash
# 1. 把所有 PDF 放在一个文件夹
D:\需求文档\
  ├── 需求1.pdf
  ├── 需求2.pdf
  └── 需求3.pdf

# 2. 运行批处理
双击: batch-ocr.bat
输入: D:\需求文档
选择: 3 (百度 OCR - 中文准确)

# 3. 等待完成
输出到: D:\需求文档\ocr_output\
```

### 场景 2: 批量处理截图

**需求**: 有很多 Slack/邮件截图要识别

**操作**:
```bash
# 1. 把截图放在一起
D:\截图\
  ├── 需求讨论1.png
  ├── 需求讨论2.png
  └── 产品需求.png

# 2. 运行批处理
python batch_ocr.py D:\截图 --backend ocrspace

# 3. 查看结果
D:\截图\ocr_output\
```

### 场景 3: 增量处理

**需求**: 每天新增一些文件，只处理新文件

**操作**:
```bash
# 第一次处理
python batch_ocr.py D:\文档

# 新增文件后
python batch_ocr.py D:\文档
# 自动跳过已处理的，只处理新文件
```

### 场景 4: 大批量处理（>1000 个文件）

**策略**: 分批处理，避免一次性消耗完额度

```bash
# 第一批（使用 OCR.space 的大额度）
python batch_ocr.py D:\文档批次1 --backend ocrspace

# 第二批（继续用 OCR.space）
python batch_ocr.py D:\文档批次2 --backend ocrspace

# 如果 OCR.space 额度用完，切换到百度
python batch_ocr.py D:\文档批次3 --backend baidu
```

---

## ⚙️ 高级选项

### 跳过控制

```bash
# 默认跳过已存在的文件（推荐，避免重复消耗额度）
python batch_ocr.py ./文件夹

# 强制重新处理所有文件
python batch_ocr.py ./文件夹 --no-skip
```

### 后端选择策略

| 场景 | 推荐后端 | 命令 |
|------|----------|------|
| 批量中文文档（<1000个） | 百度 OCR | `--backend baidu` |
| 批量英文/混合（<20000个） | OCR.space | `--backend ocrspace` |
| 大批量（>10000个） | OCR.space 为主 | `--backend ocrspace` |
| 不确定 | Auto | `--backend auto` |

---

## 📊 性能参考

### OCR.space
- **速度**: ~2-5 秒/文件
- **并发**: 可同时处理（但建议单线程避免限流）
- **适合**: 大批量处理（25,000次额度）

### 百度 OCR
- **速度**: ~1-3 秒/文件
- **并发**: QPS 2（免费版）
- **适合**: 中文文档（准确率高）

### 批量处理时间估算

| 文件数 | 使用 OCR.space | 使用百度 OCR |
|--------|----------------|--------------|
| 10 个 | ~30-50 秒 | ~10-30 秒 |
| 100 个 | ~5-8 分钟 | ~2-5 分钟 |
| 1000 个 | ~50-80 分钟 | ~17-50 分钟 |

**建议**: 大批量处理时在后台运行

---

## 💰 配额管理

### OCR.space（25,000次/月）

**建议用法**:
```
日常批量: 使用 OCR.space
月底剩余: 继续用 OCR.space
额度用完: 切换百度 OCR
```

### 百度 OCR（1,000-2,000次/月）

**建议用法**:
```
重要中文文档: 百度 OCR
需要高准确率: 百度 OCR
OCR.space 用完: 百度 OCR 补充
```

### 混合策略（推荐）

```bash
# 1. 先用 OCR.space 处理大部分文件
python batch_ocr.py ./所有文件 --backend ocrspace

# 2. 检查结果，对识别不好的中文文档用百度重新处理
python batch_ocr.py ./识别不好的中文文档 --backend baidu --no-skip
```

---

## 🛠️ 故障排查

### 问题 1: 网络超时

**症状**: 大量文件显示 "Failed to connect"

**解决**:
```bash
# 切换到另一个后端
python batch_ocr.py ./文件夹 --backend baidu  # 如果 OCR.space 超时
python batch_ocr.py ./文件夹 --backend ocrspace  # 如果百度超时
```

### 问题 2: API 额度用尽

**症状**: "API daily/monthly limit reached"

**解决**:
```bash
# 切换到另一个后端
python batch_ocr.py ./剩余文件 --backend baidu  # OCR.space 用完
python batch_ocr.py ./剩余文件 --backend ocrspace  # 百度用完

# 或等待下月重置
```

### 问题 3: PDF 识别失败

**OCR.space 的 PDF 限制**:
- ⚠️ 最多 3 页（免费版）
- ⚠️ 最大 1 MB

**解决**:
```bash
# 对于大型 PDF，建议先转换为图片
# 或使用 PyMuPDF 提取文字层（如果有的话）
```

### 问题 4: 部分文件处理失败

**症状**: 总结显示 "失败: 5 ✗"

**排查**:
1. 检查失败的文件格式是否支持
2. 检查文件是否损坏
3. 检查网络连接
4. 尝试单独处理失败的文件

**重新处理失败的文件**:
```bash
# 手动处理单个文件
python smart_ocr.py 失败的文件.pdf --backend baidu
```

---

## 💡 最佳实践

### 1. 先小批量测试

```bash
# 先处理 5-10 个文件测试效果
python batch_ocr.py ./测试样本 --backend auto

# 检查识别质量
cat ocr_output/文件1.txt

# 满意后再大批量处理
python batch_ocr.py ./所有文件 --backend ocrspace
```

### 2. 分类处理

```bash
# 中文文档用百度
python batch_ocr.py ./中文PDF --backend baidu

# 英文/混合用 OCR.space
python batch_ocr.py ./英文文档 --backend ocrspace
```

### 3. 后台运行（大批量）

```bash
# Windows (PowerShell)
Start-Process python -ArgumentList "batch_ocr.py", "D:\大量文件", "--backend", "ocrspace" -NoNewWindow

# 或使用 nohup（如果有）
nohup python batch_ocr.py ./大量文件 --backend ocrspace > batch.log 2>&1 &
```

### 4. 进度监控

```bash
# 处理过程中，可以查看输出目录
ls -l ocr_output/

# 统计已处理文件数
ls ocr_output/ | wc -l
```

---

## 📋 快速参考卡

### 常用命令

```bash
# 双击批处理（推荐）
双击: batch-ocr.bat

# 处理文件夹（自动选择）
python batch_ocr.py ./文件夹

# 处理文件夹（OCR.space，大批量）
python batch_ocr.py ./文件夹 --backend ocrspace

# 处理文件夹（百度，中文）
python batch_ocr.py ./文件夹 --backend baidu

# 处理单个文件
python batch_ocr.py document.pdf

# 强制重新处理
python batch_ocr.py ./文件夹 --no-skip

# 帮助
python batch_ocr.py --help
```

### 输出位置

```
默认: 输入目录/ocr_output/
自定义: --output-dir 自定义名称
```

### 后端选择

```
auto      # 自动选择（文件名含中文→百度，否则→OCR.space）
ocrspace  # OCR.space（免费 25,000次/月）
baidu     # 百度 OCR（中文准确率高）
```

---

## 🎬 完整示例

### 示例 1: 批量处理中文需求文档

**场景**: 你有 50 个扫描的中文需求 PDF

```bash
# 1. 准备文件
D:\需求文档\
  ├── 需求1.pdf
  ├── 需求2.pdf
  ├── ...
  └── 需求50.pdf

# 2. 双击批处理
双击: D:\code\WSJF\scripts\ocr\batch-ocr.bat

# 3. 输入配置
OCR 后端: 3 (百度 OCR)
文件夹路径: D:\需求文档

# 4. 等待处理（约 1-3 分钟）
[1/50] 需求1.pdf
  🇨🇳 使用百度 OCR
  ✓ 完成 (2150 字符, 68 行, 2.1秒)
...

# 5. 查看结果
D:\需求文档\ocr_output\
  ├── 需求1.txt
  ├── 需求2.txt
  └── ...
```

### 示例 2: 批量处理英文截图

**场景**: 你有 200 个 Slack 讨论截图

```bash
# 1. 准备文件
D:\Screenshots\
  ├── slack1.png
  ├── slack2.png
  ├── ...
  └── slack200.png

# 2. 命令行处理
cd D:\code\WSJF
python scripts/ocr/batch_ocr.py D:\Screenshots --backend ocrspace

# 3. 等待完成（约 10-15 分钟）
处理完成
================================================================
总文件数: 200
成功:     198 ✓
失败:     2 ✗
跳过:     0 ⏭
================================================================

# 4. 查看结果
D:\Screenshots\ocr_output\
```

### 示例 3: 混合批量处理

**场景**: 文件夹里有 PDF、PNG、JPG 混在一起

```bash
# 1. 准备文件（混合格式）
D:\文档\
  ├── 报告1.pdf
  ├── 截图2.png
  ├── 照片3.jpg
  └── ...

# 2. 自动处理（会识别所有支持的格式）
python batch_ocr.py D:\文档 --backend auto

# 3. 自动处理所有支持的文件
支持的格式自动识别: PDF, PNG, JPG, WEBP 等
```

---

## ⚡ 性能优化

### 1. 使用合适的后端

```bash
# 大批量（>5000个）→ OCR.space（额度大）
python batch_ocr.py ./大量文件 --backend ocrspace

# 中文为主（<1000个）→ 百度 OCR（准确）
python batch_ocr.py ./中文文档 --backend baidu
```

### 2. 避免重复处理

```bash
# 默认跳过已存在的文件
python batch_ocr.py ./文件夹

# 只有需要重新识别时才用 --no-skip
python batch_ocr.py ./文件夹 --no-skip
```

### 3. 分批处理

```bash
# 如果文件很多，分批处理
python batch_ocr.py ./批次1 --backend ocrspace
python batch_ocr.py ./批次2 --backend ocrspace
python batch_ocr.py ./批次3 --backend baidu
```

### 4. 后台运行（长时间任务）

```powershell
# Windows PowerShell - 后台运行
Start-Job -ScriptBlock {
    cd D:\code\WSJF
    python scripts/ocr/batch_ocr.py D:\大量文件 --backend ocrspace
}

# 查看任务状态
Get-Job

# 查看输出
Receive-Job -Id 1
```

---

## 📊 批量处理统计示例

```
================================================================
批量 OCR 处理
================================================================
输入路径: D:\需求文档
输出目录: D:\需求文档\ocr_output
找到文件: 50 个
OCR 后端: BAIDU
================================================================

[1/50] 需求1.pdf
  🇨🇳 使用百度 OCR
  🔍 使用通用版本识别...
  ✓ 完成 (2150 字符, 68 行, 2.1秒)

[2/50] 需求2.pdf
  🇨🇳 使用百度 OCR
  ✓ 完成 (1823 字符, 54 行, 1.8秒)

...

[50/50] 需求50.pdf
  ✓ 完成 (1956 字符, 61 行, 2.0秒)


================================================================
处理完成
================================================================
总文件数: 50
成功:     48 ✓
失败:     2 ✗
跳过:     0 ⏭
================================================================

输出目录: D:\需求文档\ocr_output

💡 提示:
  - 识别结果保存在: D:\需求文档\ocr_output
  - 文件命名: 原文件名.txt
  - 使用后端: BAIDU

⚠️ 有 2 个文件处理失败
  可能原因: 网络问题、文件格式、API 限额
  建议: 检查失败文件，或切换到另一个后端重试
```

---

## 🔐 安全提示

### 处理敏感文档

如果 PDF 包含敏感信息：

**OCR.space**:
- ⚠️ 文件上传到云端
- ⚠️ 根据隐私政策可能保留短期

**百度 OCR**:
- ⚠️ 文件上传到百度云
- ⚠️ 根据隐私政策处理

**建议**:
- 对于高度敏感文档，考虑本地 OCR（Tesseract）
- 或使用私有部署的 OCR 服务

---

## 📝 输出文件格式

### 默认输出（纯文本）

```
文件1.txt:
  这是识别出的文本
  保持原始换行
  不包含格式信息
```

### 如需保留格式

```python
# 可以自己修改 batch_ocr.py 中的保存逻辑
# 例如保存为 Markdown:
output_file = output_base / f"{file_path.stem}.md"
```

---

## 🎁 额外功能（未来可扩展）

### 可以添加的功能

- [ ] 并行处理（多线程）
- [ ] 进度条（tqdm）
- [ ] 结果去重
- [ ] 自动分类（按内容分文件夹）
- [ ] 生成处理报告（HTML/PDF）
- [ ] 失败文件自动重试
- [ ] 配额使用统计

**需要这些功能？** 告诉我，我可以帮你实现！

---

## ✅ 总结

### 核心功能
- ✅ 批量处理文件夹
- ✅ 支持图片和 PDF
- ✅ 双 OCR 后端可选
- ✅ 自动跳过已处理
- ✅ 统计和进度显示

### 使用方式
1. **双击批处理** - 最简单
2. **命令行** - 最灵活
3. **Python 调用** - 最强大

### 推荐工作流
```
1. 双击 batch-ocr.bat
2. 拖拽文件夹
3. 选择后端（中文→百度，其他→OCR.space）
4. 等待完成
5. 查看 ocr_output/ 目录
```

**开始使用吧！** 🚀
