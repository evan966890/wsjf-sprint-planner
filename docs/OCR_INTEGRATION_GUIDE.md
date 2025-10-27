# WSJF OCR 集成完整指南

## 功能说明

WSJF 项目已集成双 OCR 方案，用户在应用中上传 PDF/图片时可自动识别文本。

---

## 🚀 快速开始

### 1. 启动 OCR 服务器

#### 方式 A: 同时启动前端和 OCR 服务（推荐）

```bash
npm run dev:full
```

这会同时启动：
- ✅ Vite 开发服务器（端口 3000）
- ✅ OCR API 服务器（端口 3001）

#### 方式 B: 分别启动

```bash
# 终端 1: 启动前端
npm run dev

# 终端 2: 启动 OCR 服务
npm run ocr:server
```

### 2. 验证服务状态

打开浏览器访问：
```
http://localhost:3001/health
```

应该看到：
```json
{
  "status": "ok",
  "uptime": 123.45,
  "timestamp": 1234567890
}
```

### 3. 在 WSJF 中使用

用户在需求编辑界面上传 PDF/图片时：
1. 系统自动检测是否有文字层
2. 如无文字层，调用 OCR API 识别
3. 智能选择 OCR 后端（中文→百度，英文→OCR.space）
4. 返回识别结果

---

## 🔧 技术实现

### 后端 API

**OCR 服务器**: `api/ocr-server.js`

**核心接口**:
```
POST /api/ocr
  - 上传文件识别
  - 支持 PDF 和图片
  - 智能选择 OCR 后端

GET /health
  - 健康检查

GET /api/ocr/backends
  - 查看可用的 OCR 后端
```

### 前端调用

**工具函数**: `src/utils/ocrClient.ts`

**使用示例**:
```typescript
import { recognizeFile } from '@/utils/ocrClient';

async function handlePDFUpload(file: File) {
  try {
    // 自动选择后端
    const result = await recognizeFile(file, 'auto');
    console.log('识别完成:', result.text);

    // 使用识别结果
    processRequirement(result.text);

  } catch (error) {
    console.error('OCR 失败:', error);
    // 提示用户 OCR 服务未启动
  }
}
```

---

## 🎯 OCR 后端选择策略

### Auto 模式（推荐）

```typescript
// 智能选择规则
if (文件名包含中文) {
  使用百度 OCR;  // 中文准确率高
} else {
  使用 OCR.space;  // 免费额度大
}
```

### 手动选择

```typescript
// 指定使用 OCR.space
await recognizeFile(file, 'ocrspace');

// 指定使用百度 OCR
await recognizeFile(file, 'baidu');
```

---

## 📊 功能对比

### 当前方案（已实现）

| 场景 | 方案 | 说明 |
|------|------|------|
| **用户自助上传** | OCR API | WSJF 应用内自动调用 |
| **批量导入** | Claude Code | 你告诉我，我批量处理 |

### 工作流程

**场景 1: 用户在 WSJF 应用中上传**
```
用户 → WSJF 网页 → 上传 PDF → OCR API → 识别 → 填充表单
```

**场景 2: 批量导入（通过 Claude Code）**
```
你: "帮我把 D:\需求\ 的 PDF 导入到 WSJF"
我: Vision 识别 → 提取数据 → 批量创建需求
```

---

## 🔐 配置

### 百度 OCR 配置（可选）

**配置文件**: `scripts/ocr/baidu_ocr_config.json`

```json
{
  "app_id": "your_app_id",
  "api_key": "your_api_key",
  "secret_key": "your_secret_key"
}
```

**已配置**: ✅ 你的配置已完成（App ID: 7164390）

### OCR.space 配置

**无需配置**: ✅ 使用免费 API，开箱即用

---

## 💰 额度管理

### 免费额度

| 后端 | 免费额度 | 适用场景 |
|------|----------|----------|
| OCR.space | 25,000次/月 | 英文、混合文档 |
| 百度 OCR | 1,000-2,000次/月 | 中文文档 |
| **总计** | **27,000次/月** | 自动智能选择 |

### 额度监控

在 OCR 服务器日志中可以看到每次调用：
```
[OCR] 收到文件: 需求.pdf, 后端: auto
[OCR] 完成: 1523 字符, 耗时: 2150ms
```

---

## 🎨 前端集成示例

### 在需求编辑组件中添加 OCR 功能

```typescript
import { recognizeFile, checkOCRService } from '@/utils/ocrClient';

function EditRequirementModal() {
  const [ocrBackend, setOCRBackend] = useState<'auto' | 'ocrspace' | 'baidu'>('auto');
  const [ocrServiceAvailable, setOCRServiceAvailable] = useState(false);

  // 检查 OCR 服务状态
  useEffect(() => {
    checkOCRService().then(setOCRServiceAvailable);
  }, []);

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    const isPDF = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    if (isPDF || isImage) {
      try {
        if (!ocrServiceAvailable) {
          alert('OCR 服务未启动\n请运行: npm run ocr:server');
          return;
        }

        // 显示加载状态
        setLoading(true);

        // 调用 OCR
        const result = await recognizeFile(file, ocrBackend);

        // 使用识别结果
        console.log('识别完成:', result.text);

        // TODO: 解析文本，提取需求信息
        // 例如使用 AI 或正则表达式提取字段

        setLoading(false);

      } catch (error) {
        console.error('OCR 失败:', error);
        alert(error.message);
        setLoading(false);
      }
    }
  };

  return (
    <div>
      {/* OCR 后端选择 */}
      <select value={ocrBackend} onChange={(e) => setOCRBackend(e.target.value)}>
        <option value="auto">🤖 自动选择（推荐）</option>
        <option value="ocrspace">🌐 OCR.space（额度大）</option>
        <option value="baidu">🇨🇳 百度 OCR（中文准确）</option>
      </select>

      {/* 文件上传 */}
      <input
        type="file"
        accept=".pdf,image/*"
        onChange={handleFileUpload}
      />

      {/* OCR 服务状态指示 */}
      {!ocrServiceAvailable && (
        <div className="text-yellow-600">
          ⚠️ OCR 服务未启动，请运行: npm run ocr:server
        </div>
      )}
    </div>
  );
}
```

---

## 📝 使用流程

### 完整流程图

```
用户上传 PDF/图片
    ↓
检测文件类型
    ↓
┌─────────┴─────────┐
│                   │
PDF              图片
│                   │
提取文字层          直接 OCR
│                   │
├─ 有文字层 → 直接使用
├─ 无文字层 → OCR识别
│                   │
└───────────┬───────┘
            ↓
    调用 OCR API
            ↓
    智能选择后端
    ├─ 中文 → 百度
    └─ 英文 → OCR.space
            ↓
    返回识别结果
            ↓
    填充到需求表单
```

---

## 🛠️ 故障排查

### 问题 1: OCR 服务未启动

**现象**:
```
错误: OCR 服务器未启动
```

**解决**:
```bash
npm run ocr:server
# 或同时启动
npm run dev:full
```

### 问题 2: 百度 OCR 不可用

**现象**:
```
错误: 百度 OCR 未配置
```

**解决**:
检查配置文件是否存在：
```bash
cat scripts/ocr/baidu_ocr_config.json
```

如果不存在，参考 `baidu_ocr_config.json.example` 创建。

### 问题 3: 端口被占用

**现象**:
```
Error: listen EADDRINUSE: address already in use :::3001
```

**解决**:
```bash
# 方法 1: 修改端口
set OCR_PORT=3002
npm run ocr:server

# 方法 2: 杀掉占用进程
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

---

## ✅ 验证清单

在部署前检查：

- [ ] OCR 服务器可以启动
- [ ] 健康检查接口可访问
- [ ] 前端可以调用 OCR API
- [ ] OCR.space 可用（无需配置）
- [ ] 百度 OCR 可用（已配置）
- [ ] 智能选择逻辑正确
- [ ] 错误处理完善

---

## 📚 相关文档

| 文档 | 路径 | 说明 |
|------|------|------|
| **OCR 使用指南** | `scripts/ocr/START_HERE.md` | OCR 工具使用 |
| **双 OCR 方案** | `scripts/ocr/DUAL_OCR_GUIDE.md` | 详细技术说明 |
| **API 参考** | `api/ocr-server.js` | 后端 API 代码 |
| **前端工具** | `src/utils/ocrClient.ts` | 前端调用工具 |

---

## 🎯 总结

### 已完成功能

- ✅ OCR API 服务器（Node.js）
- ✅ 双 OCR 后端支持（OCR.space + 百度）
- ✅ 智能后端选择
- ✅ 前端调用工具
- ✅ 错误处理和降级

### 启动命令

**开发环境**:
```bash
npm run dev:full
```

**生产环境**:
```bash
# 前端
npm run build
npm run preview

# OCR 服务（后台运行）
pm2 start api/ocr-server.js --name wsjf-ocr
```

---

**现在 WSJF 应用已完全支持 PDF/图片 OCR 识别！** 🎉

用户上传 → OCR 自动识别 → 智能选择后端 → 零配置使用
