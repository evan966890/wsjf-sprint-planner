# 双 OCR 方案使用指南

## 概述

WSJF 项目现在支持两种 OCR 方案，用户可以自由选择：

| 方案 | 优势 | 免费额度 | 适用场景 |
|------|------|----------|----------|
| **OCR.space** | 免费额度大，无需认证 | 25,000次/月 | 中英文混合、快速识别 |
| **百度 OCR** | 中文准确率最高 | 1,000-2,000次/月 | 纯中文、手写、复杂场景 |

## 快速开始

### 1. 安装依赖

```bash
# 基础依赖（已安装）
pip install requests

# 百度 OCR 依赖（新增）
pip install baidu-aip
```

### 2. 配置百度 OCR（可选）

#### 方法 A：环境变量（推荐）

```bash
# Windows (cmd)
set BAIDU_OCR_APP_ID=your_app_id
set BAIDU_OCR_API_KEY=your_api_key
set BAIDU_OCR_SECRET_KEY=your_secret_key

# Windows (PowerShell)
$env:BAIDU_OCR_APP_ID="your_app_id"
$env:BAIDU_OCR_API_KEY="your_api_key"
$env:BAIDU_OCR_SECRET_KEY="your_secret_key"

# Linux/Mac
export BAIDU_OCR_APP_ID=your_app_id
export BAIDU_OCR_API_KEY=your_api_key
export BAIDU_OCR_SECRET_KEY=your_secret_key
```

#### 方法 B：配置文件

复制配置模板并填写：
```bash
cp baidu_ocr_config.json.example baidu_ocr_config.json
# 编辑 baidu_ocr_config.json，填入你的配置
```

#### 获取百度 OCR 配置：

1. 访问 https://ai.baidu.com
2. 注册并完成实名认证
3. 创建应用
4. 获取 App ID, API Key, Secret Key

**注意**：
- 个人认证：1,000次/月
- 企业认证：2,000次/月

### 3. 使用指南

#### 方案 A：智能 OCR（推荐）

自动选择最佳后端：

```bash
# 自动选择（推荐）
python scripts/ocr/smart_ocr.py image.png -o output.txt

# 指定使用 OCR.space
python scripts/ocr/smart_ocr.py image.png -o output.txt --backend ocrspace

# 指定使用百度 OCR
python scripts/ocr/smart_ocr.py image.png -o output.txt --backend baidu

# 百度 OCR 高精度版本（更准确，消耗额度更快）
python scripts/ocr/smart_ocr.py image.png -o output.txt --backend baidu --high-precision
```

#### 方案 B：单独使用

```bash
# 仅使用 OCR.space
python scripts/ocr/simple_ocr.py image.png -o output.txt

# 仅使用百度 OCR
python scripts/ocr/baidu_ocr.py image.png -o output.txt
```

#### 方案 C：交互式测试

```bash
python scripts/ocr/test_ocr.py
```

会提示你：
1. 选择文件
2. 选择后端（OCR.space / 百度 OCR / 自动）
3. 显示识别结果

## Python 代码集成

### 基本使用

```python
import sys
sys.path.append('scripts/ocr')
from smart_ocr import SmartOCR

# 创建智能 OCR 实例
ocr = SmartOCR()

# 自动选择后端
text = ocr.convert_file('image.png')

# 指定后端
text = ocr.convert_file('image.png', backend='baidu')
text = ocr.convert_file('image.png', backend='ocrspace')
```

### 高级用法：根据内容智能选择

```python
from smart_ocr import SmartOCR

def smart_convert(file_path, prefer_chinese=False):
    """智能转换：根据场景选择最佳 OCR"""
    ocr = SmartOCR()

    # 检测是否有百度 OCR
    has_baidu = 'baidu' in ocr.get_available_backends()

    if prefer_chinese and has_baidu:
        # 中文文档优先百度
        try:
            return ocr.convert_file(file_path, backend='baidu')
        except Exception as e:
            print(f"百度 OCR 失败，切换到 OCR.space: {e}")
            return ocr.convert_file(file_path, backend='ocrspace')
    else:
        # 其他情况优先 OCR.space（免费额度大）
        try:
            return ocr.convert_file(file_path, backend='ocrspace')
        except Exception as e:
            if has_baidu:
                print(f"OCR.space 失败，切换到百度: {e}")
                return ocr.convert_file(file_path, backend='baidu')
            raise

# 使用示例
text = smart_convert('中文需求.png', prefer_chinese=True)
text = smart_convert('english_doc.png', prefer_chinese=False)
```

### 带配额管理

```python
from smart_ocr import SmartOCR

class QuotaAwareOCR:
    """带配额管理的 OCR"""

    def __init__(self):
        self.ocr = SmartOCR()
        self.ocrspace_count = 0
        self.baidu_count = 0

    def convert(self, file_path, prefer_chinese=False):
        """智能转换，优先使用免费额度"""

        # 如果是中文且百度额度充足
        if prefer_chinese and self.baidu_count < 900:  # 保留100次备用
            try:
                text = self.ocr.convert_file(file_path, backend='baidu')
                self.baidu_count += 1
                return text
            except:
                pass

        # 使用 OCR.space
        if self.ocrspace_count < 24000:  # 保留1000次备用
            text = self.ocr.convert_file(file_path, backend='ocrspace')
            self.ocrspace_count += 1
            return text

        # 最后使用百度
        text = self.ocr.convert_file(file_path, backend='baidu')
        self.baidu_count += 1
        return text

# 使用
quota_ocr = QuotaAwareOCR()
text = quota_ocr.convert('file.png', prefer_chinese=True)
```

## 前端集成示例

### 选项 1：让用户选择后端

```typescript
// types.ts
export type OCRBackend = 'ocrspace' | 'baidu' | 'auto';

// 在需求编辑组件中
interface OCRUploadProps {
  onTextExtracted: (text: string) => void;
}

function OCRUploadForm({ onTextExtracted }: OCRUploadProps) {
  const [backend, setBackend] = useState<OCRBackend>('auto');
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    // 调用后端 OCR API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('backend', backend);

    const response = await fetch('/api/ocr', {
      method: 'POST',
      body: formData
    });

    const { text } = await response.json();
    onTextExtracted(text);
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />

      <select value={backend} onChange={(e) => setBackend(e.target.value as OCRBackend)}>
        <option value="auto">自动选择（推荐）</option>
        <option value="ocrspace">OCR.space（免费额度大）</option>
        <option value="baidu">百度 OCR（中文准确）</option>
      </select>

      <button onClick={handleUpload}>识别文本</button>
    </div>
  );
}
```

### 选项 2：自动选择（推荐）

```typescript
async function handleFileUpload(file: File) {
  // 自动检测文件名是否包含中文
  const hasChinese = /[\u4e00-\u9fff]/.test(file.name);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('backend', 'auto');  // 让后端智能选择
  formData.append('prefer_chinese', hasChinese.toString());

  const response = await fetch('/api/ocr', {
    method: 'POST',
    body: formData
  });

  const { text, backend_used } = await response.json();

  // 显示使用的后端
  console.log(`使用了 ${backend_used} 进行识别`);

  return text;
}
```

## 后端 API 示例

### FastAPI 实现

```python
# api/ocr_endpoint.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import sys
from pathlib import Path

sys.path.append('scripts/ocr')
from smart_ocr import SmartOCR

app = FastAPI()
ocr = SmartOCR()

@app.post("/api/ocr")
async def ocr_upload(
    file: UploadFile = File(...),
    backend: str = Form('auto'),
    high_precision: bool = Form(False)
):
    """OCR 文件上传接口"""

    # 保存上传的文件
    temp_path = Path(f"/tmp/{file.filename}")
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    try:
        # 提取文本
        text = ocr.convert_file(
            str(temp_path),
            backend=backend,
            high_precision=high_precision
        )

        return JSONResponse({
            "success": True,
            "text": text,
            "backend_used": backend,
            "filename": file.filename
        })

    except Exception as e:
        return JSONResponse({
            "success": False,
            "error": str(e)
        }, status_code=500)

    finally:
        # 清理临时文件
        if temp_path.exists():
            temp_path.unlink()

@app.get("/api/ocr/backends")
async def list_backends():
    """列出可用的 OCR 后端"""
    return {
        "backends": ocr.get_available_backends(),
        "default": "auto"
    }
```

## 使用建议

### 场景推荐

| 场景 | 推荐后端 | 理由 |
|------|----------|------|
| Slack/邮件截图（中英混合） | OCR.space | 免费额度大，够用 |
| 纯中文需求文档 | 百度 OCR | 准确率最高 |
| 手写内容 | 百度 OCR | 手写识别强 |
| 表格/复杂布局 | 百度 OCR | 版式还原好 |
| 批量处理（>10,000次） | OCR.space | 免费额度大 |
| 月初大量使用 | OCR.space → 百度 | 先用大额度的 |

### 配额管理策略

**策略 1：优先 OCR.space**
```
好处：充分利用大额度（25,000次）
适合：中英文混合场景为主
```

**策略 2：分场景使用**
```
中文文档 → 百度 OCR
英文/混合 → OCR.space
好处：各取所长，提高准确率
```

**策略 3：主备切换**
```
主：OCR.space（额度大）
备：百度 OCR（主用完后切换）
好处：总额度达到 27,000次/月
```

## 故障排查

### 问题 1：百度 OCR 配置错误

```
错误: 缺少百度 OCR 配置
```

**解决**：
1. 检查环境变量是否设置
2. 检查配置文件是否正确
3. 确认 API Key 是否有效

### 问题 2：baidu-aip 未安装

```
错误: No module named 'aip'
```

**解决**：
```bash
pip install baidu-aip
```

### 问题 3：百度 OCR 额度用尽

```
错误: Open api daily request limit reached
```

**解决**：
- 等待次月重置（每月1号）
- 或切换到 OCR.space
- 或购买付费版

### 问题 4：OCR.space 网络问题

```
错误: Failed to connect to api.ocr.space
```

**解决**：
- 检查网络连接
- 切换到百度 OCR（国内访问更快）

## 相关文档

- [OCR 方案对比](OCR_COMPARISON.md)
- [OCR.space 使用文档](README.md)
- [百度 OCR API 文档](https://ai.baidu.com/ai-doc/OCR/zk3h7xz52)

## 总结

**当前配置**：
- ✅ OCR.space：已配置，25,000次/月
- ⚠️ 百度 OCR：需要配置，1,000-2,000次/月

**推荐使用**：
1. **日常使用**：`smart_ocr.py --backend auto`（自动选择）
2. **测试功能**：`test_ocr.py`（交互式）
3. **前端集成**：让用户选择或自动检测

**配额总计**：27,000 次/月（两者之和）

祝使用愉快！🎉
