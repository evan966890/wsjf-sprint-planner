# 🚀 OCR 功能使用指南 - 从这里开始

## ✅ 配置完成状态

你的 WSJF 项目现在支持 **双 OCR 方案**：

| 后端 | 状态 | 免费额度 | 优势 |
|------|------|----------|------|
| **OCR.space** | ✅ 可用 | 25,000次/月 | 免费额度大，无需认证 |
| **百度 OCR** | ✅ 可用 | 1,000-2,000次/月 | 中文准确率最高 |

**总免费额度**: **27,000 次/月** 🎉

---

## 🎯 立即开始（3种方式）

### 方式 1：交互式测试（推荐新手）

```bash
cd D:\code\WSJF
python scripts/ocr/test_ocr.py
```

**会发生什么**：
1. 提示你输入图片路径
2. 让你选择后端（Auto / OCR.space / 百度）
3. 显示识别结果和统计信息

### 方式 2：命令行快速转换

```bash
cd D:\code\WSJF

# 自动选择后端（推荐）
python scripts/ocr/smart_ocr.py 你的图片.png -o output.txt

# 指定 OCR.space
python scripts/ocr/smart_ocr.py 你的图片.png --backend ocrspace

# 指定百度 OCR
python scripts/ocr/smart_ocr.py 你的图片.png --backend baidu
```

### 方式 3：Python 代码调用

```python
import sys
sys.path.append('scripts/ocr')
from smart_ocr import SmartOCR

# 创建实例
ocr = SmartOCR()

# 转换文件
text = ocr.convert_file('image.png')  # 自动选择
text = ocr.convert_file('image.png', backend='baidu')  # 百度OCR
text = ocr.convert_file('image.png', backend='ocrspace')  # OCR.space

print(text)
```

---

## 📖 使用示例

### 场景 1：快速测试（截图识别）

```bash
# 1. 截图（Win + Shift + S）保存为 test.png
# 2. 运行测试
cd D:\code\WSJF
python scripts/ocr/test_ocr.py
# 输入: test.png
# 选择: 1 (自动选择)
```

### 场景 2：转换需求文档

```bash
# 如果是中文文档，使用百度 OCR
python scripts/ocr/smart_ocr.py 需求文档.png --backend baidu -o 需求.txt

# 如果是英文/混合，使用 OCR.space
python scripts/ocr/smart_ocr.py requirement.png --backend ocrspace -o output.txt
```

### 场景 3：批量处理

```bash
# 创建批处理脚本
for file in *.png; do
    python scripts/ocr/smart_ocr.py "$file" --backend auto -o "${file%.png}.txt"
done
```

---

## 🤖 智能选择规则（Auto 模式）

当你使用 `--backend auto` 时：

```
if 文件名包含中文:
    使用百度 OCR（中文识别更准确）
else:
    使用 OCR.space（免费额度更大）
```

**示例**：
- `需求文档.png` → 百度 OCR
- `requirement.png` → OCR.space
- `中文English混合.jpg` → 百度 OCR

---

## 💰 配额管理建议

### 策略 1：优先 OCR.space（推荐）

```
日常使用: OCR.space (25,000次)
中文专用: 百度 OCR (1,000-2,000次)

好处：充分利用大额度
```

### 策略 2：按质量要求选择

```
普通文档: OCR.space（够用）
重要文档: 百度 OCR（更准确）

好处：重要内容零错误
```

### 策略 3：主备切换

```
月初: OCR.space（用到月底）
月末/额度用尽: 百度 OCR（补充）

好处：总额度达到 27,000次/月
```

---

## 🎨 前端界面集成

### 简单的选择下拉框

```typescript
<select onChange={(e) => setOCRBackend(e.target.value)}>
  <option value="auto">🤖 自动选择（推荐）</option>
  <option value="ocrspace">🌐 OCR.space（额度大）</option>
  <option value="baidu">🇨🇳 百度OCR（中文准）</option>
</select>
```

### 带说明的选择界面

```typescript
<div>
  <label>选择 OCR 方案：</label>
  <select value={backend} onChange={(e) => setBackend(e.target.value)}>
    <option value="auto">自动选择（推荐）</option>
    <option value="ocrspace">OCR.space - 免费25,000次/月</option>
    <option value="baidu">百度OCR - 中文准确率最高</option>
  </select>

  {backend === 'baidu' && (
    <small>💡 使用百度OCR，中文识别准确率可达98%+</small>
  )}
</div>
```

**完整集成示例**: 查看 `DUAL_OCR_GUIDE.md` 中的前端集成章节

---

## 📚 文档导航

| 文档 | 用途 | 适合谁 |
|------|------|--------|
| **START_HERE.md** (本文) | ⭐ 快速开始 | 所有用户 |
| **DUAL_OCR_GUIDE.md** | 完整使用指南 | 开发者 |
| **OCR_COMPARISON.md** | 方案对比分析 | 决策者 |
| **SECURITY_NOTICE.md** | 安全提示 | 所有用户 |
| **SETUP_COMPLETE.md** | 配置说明 | 新用户 |

---

## ❓ 常见问题

### Q1: 如何选择使用哪个后端？

**简单规则**：
- 中文为主 → 百度 OCR
- 英文/混合 → OCR.space
- 不确定 → Auto（自动选择）

### Q2: 配额用完了怎么办？

**OCR.space 用完**（25,000次/月）：
- 切换到百度 OCR
- 或等待下月重置

**百度 OCR 用完**（1,000-2,000次/月）：
- 切换到 OCR.space
- 或购买付费版（¥0.004-0.008/次）

### Q3: 识别准确率如何？

**OCR.space**：
- 英文: ~95%
- 中文: ~90-95%
- 适合一般场景

**百度 OCR**：
- 英文: ~95%
- 中文: ~98-99% ⭐
- 适合专业场景

### Q4: 如何提高准确率？

1. **提高图片质量**
   - 分辨率 ≥ 300 DPI
   - 文字清晰，无模糊

2. **预处理图片**
   - 调整对比度
   - 去除噪点
   - 矫正倾斜

3. **选择合适后端**
   - 中文 → 百度 OCR
   - 手写 → 百度 OCR

4. **使用高精度模式**（百度）
   ```bash
   python scripts/ocr/baidu_ocr.py image.png --high-precision --config scripts/ocr/baidu_ocr_config.json
   ```

### Q5: 能处理 PDF 吗？

**OCR.space**：
- ✅ 支持 PDF
- ⚠️ 最多 3 页（免费版）
- ⚠️ 最大 1 MB

**百度 OCR**：
- ⚠️ 需要先将 PDF 转为图片
- 或使用专门的 PDF 识别接口

**建议**：
- 对于 PDF，使用 `pdf2image` 先转图片，再识别
- 或使用 PyMuPDF 提取（如果有文字层）

---

## 🛠️ 故障排查

### 问题：百度 OCR 报错

```
错误: 缺少百度 OCR 配置
```

**检查**：
```bash
# 1. 确认配置文件存在
dir scripts\ocr\baidu_ocr_config.json

# 2. 确认内容正确
type scripts\ocr\baidu_ocr_config.json

# 3. 测试连接
python scripts/ocr/baidu_ocr.py test.png --config scripts/ocr/baidu_ocr_config.json
```

### 问题：OCR.space 网络超时

```
错误: Failed to connect to api.ocr.space
```

**解决**：
```bash
# 切换到百度 OCR
python scripts/ocr/smart_ocr.py image.png --backend baidu
```

### 问题：识别结果为空

**可能原因**：
1. 图片质量太差
2. 文字太小
3. 图片格式不支持

**解决**：
1. 提高图片质量
2. 尝试另一个后端
3. 使用高精度模式（百度）

---

## 🎊 恭喜！

你已经成功配置了双 OCR 方案！

**下一步**：
1. ✅ 用你的真实图片测试
2. ✅ 对比两个后端的识别效果
3. ✅ 集成到 WSJF 项目的需求导入功能

**需要帮助？**
- 查看 `DUAL_OCR_GUIDE.md`
- 运行 `python smart_ocr.py --help`
- 查看测试脚本输出的提示

祝使用愉快！🚀
