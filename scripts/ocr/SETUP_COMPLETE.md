# ✅ 双 OCR 方案配置完成

## 配置状态

### OCR.space
- ✅ **已配置** - 免费 25,000次/月
- ✅ **无需认证**
- ✅ **立即可用**

### 百度 OCR
- ✅ **已配置** - 免费 1,000-2,000次/月
- ✅ **SDK 已安装** (baidu-aip 4.16.13)
- ✅ **配置文件已创建** (`baidu_ocr_config.json`)
- ✅ **立即可用**

**总免费额度**: **27,000 次/月** 🎉

---

## 🚀 立即测试

### 方法 1：使用你自己的图片（推荐）

```bash
cd D:\code\WSJF

# 使用智能OCR（自动选择后端）
python scripts/ocr/smart_ocr.py 你的图片.png -o output.txt

# 或指定使用百度OCR
python scripts/ocr/baidu_ocr.py 你的图片.png --config scripts/ocr/baidu_ocr_config.json -o output.txt
```

### 方法 2：交互式测试

```bash
cd D:\code\WSJF
python scripts/ocr/test_ocr.py
```

会提示你：
1. 输入图片路径
2. 选择后端（1=自动, 2=OCR.space, 3=百度OCR）
3. 显示识别结果

### 方法 3：快速测试（截图）

1. 截一张包含文字的图（Win + Shift + S）
2. 保存为 `test.png`
3. 运行：
   ```bash
   cd D:\code\WSJF
   python scripts/ocr/smart_ocr.py test.png --backend baidu
   ```

---

## 📋 配置信息

### 百度 OCR 配置
```json
{
  "app_id": "7164390",
  "api_key": "6XG7vmbHd2F8krAu0xQQ6KmD",
  "secret_key": "ckqiwoZb7AGk5NfRIWi2NU38uBPvkRg0"
}
```

**配置文件位置**: `D:\code\WSJF\scripts\ocr\baidu_ocr_config.json`

⚠️ **安全提示**:
- 这些是你的私有凭证
- 不要公开分享或提交到公共代码仓库
- 如需分享代码，删除配置文件或使用 `.gitignore`

---

## 🎯 使用方式

### 命令行使用

```bash
# 1. 自动选择后端（推荐）
python scripts/ocr/smart_ocr.py image.png -o output.txt

# 2. 仅使用 OCR.space
python scripts/ocr/simple_ocr.py image.png -o output.txt

# 3. 仅使用百度 OCR
python scripts/ocr/baidu_ocr.py image.png --config scripts/ocr/baidu_ocr_config.json

# 4. 百度 OCR 高精度版本（更准确，消耗额度更快）
python scripts/ocr/baidu_ocr.py image.png --config scripts/ocr/baidu_ocr_config.json --high-precision
```

### Python 代码使用

```python
import sys
sys.path.append('scripts/ocr')
from smart_ocr import SmartOCR

# 创建实例（自动读取配置文件）
ocr = SmartOCR()

# 自动选择后端
text = ocr.convert_file('image.png')

# 指定后端
text = ocr.convert_file('image.png', backend='baidu')
text = ocr.convert_file('image.png', backend='ocrspace')
```

---

## 💡 使用建议

### 什么时候用 OCR.space？
- ✅ 中英文混合文档
- ✅ 日常需求截图
- ✅ 批量处理（利用大额度）
- ✅ 不确定用哪个时（默认选择）

### 什么时候用百度 OCR？
- ✅ 纯中文文档
- ✅ 手写内容
- ✅ 复杂表格/布局
- ✅ 需要高准确率

### Auto 模式（推荐）
```bash
python scripts/ocr/smart_ocr.py file.png --backend auto
```

**自动规则**：
- 文件名包含中文 → 百度 OCR
- 其他情况 → OCR.space

---

## 🔧 高级配置

### 方法 A：使用配置文件（当前方式）

```bash
python scripts/ocr/baidu_ocr.py image.png --config scripts/ocr/baidu_ocr_config.json
```

### 方法 B：使用环境变量

```bash
# Windows (PowerShell)
$env:BAIDU_OCR_APP_ID="7164390"
$env:BAIDU_OCR_API_KEY="6XG7vmbHd2F8krAu0xQQ6KmD"
$env:BAIDU_OCR_SECRET_KEY="ckqiwoZb7AGk5NfRIWi2NU38uBPvkRg0"

# 然后直接使用
python scripts/ocr/baidu_ocr.py image.png
```

### 方法 C：命令行参数

```bash
python scripts/ocr/baidu_ocr.py image.png \
  --app-id 7164390 \
  --api-key 6XG7vmbHd2F8krAu0xQQ6KmD \
  --secret-key ckqiwoZb7AGk5NfRIWi2NU38uBPvkRg0
```

---

## 📊 配额使用情况

### 如何查看配额？

百度 OCR 没有直接查询配额的 API，只能通过以下方式：

1. **登录百度 AI 控制台**
   - https://console.bce.baidu.com/ai/#/ai/ocr/overview/index
   - 查看"资源使用情况"

2. **通过错误信息判断**
   - 如果超出配额，会返回错误：`Open api daily request limit reached`

3. **本地记录（可选）**
   - 创建简单的计数器记录使用次数

---

## 🎨 前端集成

### 创建选择界面

```typescript
// 在需求编辑组件中
function OCRUpload() {
  const [backend, setBackend] = useState<'auto' | 'ocrspace' | 'baidu'>('auto');

  return (
    <div>
      <select value={backend} onChange={(e) => setBackend(e.target.value)}>
        <option value="auto">🤖 自动选择（推荐）</option>
        <option value="ocrspace">🌐 OCR.space（免费额度大）</option>
        <option value="baidu">🇨🇳 百度OCR（中文准确）</option>
      </select>

      <input type="file" onChange={(e) => handleOCR(e.target.files[0], backend)} />
    </div>
  );
}

async function handleOCR(file: File, backend: string) {
  // 调用后端 API
  const formData = new FormData();
  formData.append('file', file);
  formData.append('backend', backend);

  const response = await fetch('/api/ocr', {
    method: 'POST',
    body: formData
  });

  const { text, backend_used } = await response.json();
  console.log(`使用了 ${backend_used} 识别`);
  return text;
}
```

---

## 📚 相关文档

| 文档 | 路径 | 说明 |
|------|------|------|
| **双OCR使用指南** | `DUAL_OCR_GUIDE.md` | ⭐ 完整使用说明 |
| **方案对比** | `OCR_COMPARISON.md` | 详细对比分析 |
| **实现总结** | `IMPLEMENTATION_COMPLETE.md` | 技术实现细节 |
| **本配置说明** | `SETUP_COMPLETE.md` | 本文档 |

---

## ✅ 验证清单

- [x] OCR.space 可用
- [x] 百度 OCR SDK 已安装
- [x] 百度 OCR 配置文件已创建
- [x] 智能 OCR 工具可用
- [x] 测试脚本支持双后端
- [ ] **待你测试**: 用真实图片验证功能

---

## 🎯 下一步

### 立即行动：

1. **截个图测试**：
   ```bash
   # 截图保存为 test.png，然后运行：
   cd D:\code\WSJF
   python scripts/ocr/test_ocr.py
   # 选择选项 3（百度OCR）
   ```

2. **对比两个后端**：
   ```bash
   # 同一张图片用两个后端识别，对比准确率
   python scripts/ocr/smart_ocr.py test.png --backend ocrspace
   python scripts/ocr/smart_ocr.py test.png --backend baidu
   ```

3. **集成到项目**：
   - 在需求导入功能中添加 OCR 选择
   - 参考 `DUAL_OCR_GUIDE.md` 中的前端示例

---

## 🎊 恭喜！

你的 WSJF 项目现在支持：

- ✅ **双 OCR 后端**（OCR.space + 百度 OCR）
- ✅ **用户可选择**使用哪个
- ✅ **总免费额度 27,000 次/月**
- ✅ **智能自动选择**
- ✅ **完整文档支持**

**所有配置已完成，随时可用！** 🚀

如有问题，查看 `DUAL_OCR_GUIDE.md` 或测试脚本输出的提示信息。

祝使用愉快！
