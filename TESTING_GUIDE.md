# 完整测试和验证指南

## 🎯 测试目标

验证所有文件格式的导入功能正常工作，确保OCR功能完整可用。

---

## 📋 测试环境准备

### 1. WSL2 + DeepSeek-OCR安装

**状态**: 安装脚本正在后台运行

**手动验证安装** (在PowerShell中):
```powershell
# 检查WSL2
wsl -d Ubuntu echo "WSL2 working"

# 检查Python环境
wsl -d Ubuntu bash -c "source ~/deepseek-env/bin/activate && python3 --version"

# 检查vLLM
wsl -d Ubuntu bash -c "source ~/deepseek-env/bin/activate && python3 -c 'import vllm; print(vllm.__version__)'"
```

全部成功 → 安装完成 ✓

### 2. WSJF项目代码

**修改的文件**:
- ✅ `src/wsjf-sprint-planner.tsx` - 文件类型支持
- ✅ `src/utils/fileParser.ts` - Word解析
- ✅ `src/utils/wordParser.ts` - Word解析器
- ✅ `src/utils/ocrParser.ts` - OCR检测
- ✅ `src/utils/fileImportHelpers.ts` - 文件导入

**依赖安装**:
- ✅ `npm install mammoth` - Word解析库

---

## 🧪 测试清单

### 阶段1: 基础功能测试（无需OCR）

#### 测试1.1: Word文档导入

**准备**:
```
1. 打开Word
2. 创建新文档，输入：
   需求名称：测试需求
   描述：这是一个测试需求

3. 保存为：test.docx
```

**测试**:
```
1. 启动: npm run dev
2. 打开: http://localhost:3001
3. 点击"导入"
4. 选择 test.docx
5. 验证：文本被正确提取
6. 确认导入
```

**预期结果**:
- ✅ 文件名映射到"需求名称"
- ✅ 内容映射到"需求描述"
- ✅ 成功导入为一条需求

---

#### 测试1.2: 文本文件导入

**测试文件**: `test-ocr-files/test-requirement-cn.txt`

**测试**:
```
1. 在应用中点击"导入"
2. 选择 test-requirement-cn.txt
3. 查看字段映射
4. 确认导入
```

**预期结果**:
- ✅ 文件内容完整显示
- ✅ 自动映射到需求描述
- ✅ 成功导入

---

#### 测试1.3: Excel导入（回归）

**准备**:
创建Excel文件包含：
```
| 需求名称 | 提交人 | 工作量 |
| 需求A   | 张三   | 5      |
| 需求B   | 李四   | 3      |
```

**测试**:
```
1. 点击"导入"
2. 选择Excel文件
3. 验证自动映射
4. 确认导入
```

**预期结果**:
- ✅ 导入2条需求
- ✅ 字段正确映射
- ✅ 原有功能正常

---

#### 测试1.4: 有文字层PDF导入

**准备**: 任意PDF文档（非扫描件）

**测试**:
```
1. 点击"导入"
2. 选择PDF文件
3. 等待文本提取
4. 查看结果
```

**预期结果**:
- ✅ 文本被成功提取
- ✅ 没有OCR警告
- ✅ 可以导入

---

### 阶段2: OCR功能测试（需DeepSeek-OCR）

#### 测试2.1: 检测扫描PDF

**准备**: 扫描的PDF文件（无文字层）

**测试**:
```
1. 点击"导入"
2. 选择扫描PDF
3. 观察提示
```

**预期结果**:
- ✅ 显示OCR建议提示
- ✅ 提示内容包含转换工具使用方法
- ✅ 当前提取的文本很少或为空

---

#### 测试2.2: WSL2单文件转换

**前提**: DeepSeek-OCR已安装

**测试** (在PowerShell中):
```powershell
# 转换扫描PDF
wsl -d Ubuntu bash -c "source ~/deepseek-env/bin/activate && python3 ~/.claude/skills/deepseek-ocr-to-md/scripts/convert_to_md.py --input '/mnt/c/Users/Evan Tian/Downloads/scan.pdf' --output '/mnt/c/Users/Evan Tian/Downloads/output.md' --resolution base"
```

**预期结果**:
- ✅ 成功生成output.md
- ✅ 文件包含识别的文本
- ✅ 识别质量良好

---

#### 测试2.3: 批量转换

**测试**:
```powershell
wsl -d Ubuntu bash /mnt/d/code/WSJF/scripts/ocr-tools/wsl2-batch-convert.sh "C:\Users\Evan Tian\Downloads\DSTE"
```

**预期结果**:
- ✅ 找到所有PDF和图片文件
- ✅ 逐个转换
- ✅ 生成markdown_output目录
- ✅ 所有文件成功转换

---

#### 测试2.4: 不同质量设置

**测试low质量**:
```bash
wsl -d Ubuntu bash -c "source ~/deepseek-env/bin/activate && python3 ~/.claude/skills/deepseek-ocr-to-md/scripts/convert_to_md.py --input '/mnt/c/path/file.pdf' --output 'output-small.md' --resolution small"
```

**测试高质量**:
```bash
wsl -d Ubuntu bash -c "source ~/deepseek-env/bin/activate && python3 ~/.claude/skills/deepseek-ocr-to-md/scripts/convert_to_md.py --input '/mnt/c/path/file.pdf' --output 'output-large.md' --resolution large --dpi 300"
```

**对比**:
- 检查识别准确度
- 检查处理时间
- 检查GPU内存使用

---

### 阶段3: 集成测试

#### 测试3.1: WSJF项目完整流程

```
1. 准备扫描PDF
2. 使用WSL2批量转换
3. 在WSJF中导入生成的MD文件
4. 验证内容完整性
5. 完成需求录入
```

**预期结果**:
- ✅ 完整的端到端流程可用
- ✅ 内容没有丢失
- ✅ 可以正常使用

---

#### 测试3.2: 混合格式导入

```
准备文件:
  - requirement1.xlsx (3条需求)
  - requirement2.docx (1个需求文档)
  - requirement3.pdf (1个PDF)
  - requirement4.txt (1个文本)

依次导入并验证
```

**预期结果**:
- ✅ 所有格式都能导入
- ✅ 数据不冲突
- ✅ 字段映射正确

---

## 🔧 性能测试

### GPU性能测试

```bash
# 在WSL2中检查GPU
wsl -d Ubuntu nvidia-smi

# 测试转换速度
wsl -d Ubuntu bash -c "source ~/deepseek-env/bin/activate && time python3 ~/.claude/skills/deepseek-ocr-to-md/scripts/convert_to_md.py --input test.pdf --output out.md"
```

**记录**:
- GPU型号：
- GPU内存：
- 处理时间：
- 文件页数：

### 质量对比

| 分辨率 | 文件大小 | 处理时间 | 识别准确度 | GPU内存 |
|--------|---------|---------|-----------|---------|
| small  |         |         |           |         |
| base   |         |         |           |         |
| large  |         |         |           |         |

---

## 🐛 问题追踪

### 发现的问题

记录测试中发现的所有问题：

```
问题1: [描述]
  - 现象：
  - 复现步骤：
  - 影响范围：
  - 解决方案：

问题2: [描述]
  ...
```

### 优化建议

记录需要优化的地方：

```
优化1: [描述]
  - 当前状况：
  - 改进方案：
  - 优先级：

优化2: [描述]
  ...
```

---

## ✅ 验收标准

### 必须通过的测试

```
□ Word文档能正常导入
□ Excel文件能正常导入（回归）
□ 有文字层PDF能正常导入
□ 文本文件能正常导入
□ 扫描PDF能检测并提示OCR
□ WSL2单文件转换成功
□ WSL2批量转换成功
□ 不同质量设置都能工作
□ 端到端流程完整可用
□ 性能满足要求（<5秒/页）
```

全部通过 → 功能验收完成 ✓

---

## 📊 测试报告模板

### 测试执行记录

**测试日期**: 2025-10-26
**测试人员**:
**环境**: Windows + WSL2 + DeepSeek-OCR

### 测试结果

| 测试项 | 状态 | 备注 |
|-------|------|------|
| Word导入 | ⏳ 待测试 |  |
| Excel导入 | ⏳ 待测试 |  |
| PDF导入 | ⏳ 待测试 |  |
| 文本导入 | ⏳ 待测试 |  |
| OCR检测 | ⏳ 待测试 |  |
| OCR转换 | ⏳ 待测试 |  |
| 批量转换 | ⏳ 待测试 |  |
| 质量设置 | ⏳ 待测试 |  |

### 问题列表

(记录发现的问题)

### 优化建议

(记录改进建议)

---

## 🎯 下一步行动

### 立即执行

1. **完成DeepSeek-OCR安装**:
   - 复制 `一键安装-复制到PowerShell运行.txt` 中的命令
   - 在PowerShell管理员模式运行
   - 等待安装完成

2. **验证安装**:
   ```powershell
   wsl -d Ubuntu bash -c "source ~/deepseek-env/bin/activate && python3 -c 'import vllm; print(\"OK\")'"
   ```

3. **开始测试**:
   - 按照测试清单逐项测试
   - 记录结果
   - 发现问题立即修复

### 测试文件准备

**已创建**:
- ✅ test-requirement-cn.txt
- ✅ test-requirement-en.txt

**需要准备**:
- ⏳ test.docx (用Word创建)
- ⏳ test.xlsx (用Excel创建)
- ⏳ test.pdf (有文字层)
- ⏳ scan.pdf (扫描件，用于测试OCR)
- ⏳ test.png (包含文字的图片)

---

## 📚 相关文档

- `COMPLETE_FILE_SUPPORT_SUMMARY.md` - 功能总结
- `FINAL_COMPLETION_REPORT.md` - 完成报告
- `README_FILE_IMPORT.md` - 使用手册
- `scripts/ocr-tools/一键安装-复制到PowerShell运行.txt` - 安装命令

---

**开始测试**: 按照清单逐项验证，发现问题立即记录和修复！
