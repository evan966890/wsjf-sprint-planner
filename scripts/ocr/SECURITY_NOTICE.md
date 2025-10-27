# 🔒 安全提示

## 重要：保护你的 API Keys

### ⚠️ 敏感文件

以下文件包含你的私有凭证，**请勿公开分享或提交到公共代码仓库**：

```
❌ scripts/ocr/baidu_ocr_config.json    # 包含百度 API Keys
```

### ✅ 已采取的保护措施

1. **已添加到 .gitignore**
   - ✅ `baidu_ocr_config.json` 不会被 git 跟踪
   - ✅ 即使你运行 `git add .`，这个文件也会被忽略

2. **提供配置模板**
   - ✅ `baidu_ocr_config.json.example` - 空模板（可以提交）
   - ✅ 其他开发者可以复制模板并填入自己的配置

### 📋 检查清单

在分享代码前，请确认：

- [ ] `baidu_ocr_config.json` 不在 git 中
- [ ] 查看 `git status`，确认敏感文件未被跟踪
- [ ] 如果要分享代码，只分享 `.example` 文件

### 🚨 如果不小心提交了怎么办？

如果你已经提交了包含 API Keys 的文件：

```bash
# 1. 从 git 历史中删除敏感文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch scripts/ocr/baidu_ocr_config.json" \
  --prune-empty --tag-name-filter cat -- --all

# 2. 立即更换 API Keys
# 访问 https://ai.baidu.com 重新生成 API Keys

# 3. 强制推送（如果已推送到远程）
git push origin --force --all
```

### 🔐 推荐的安全实践

#### 方案 A：使用环境变量（最安全）

```bash
# Windows (PowerShell) - 永久设置
[System.Environment]::SetEnvironmentVariable('BAIDU_OCR_APP_ID', '7164390', 'User')
[System.Environment]::SetEnvironmentVariable('BAIDU_OCR_API_KEY', 'your_key', 'User')
[System.Environment]::SetEnvironmentVariable('BAIDU_OCR_SECRET_KEY', 'your_secret', 'User')

# Linux/Mac - 添加到 ~/.bashrc 或 ~/.zshrc
export BAIDU_OCR_APP_ID=7164390
export BAIDU_OCR_API_KEY=your_key
export BAIDU_OCR_SECRET_KEY=your_secret
```

**优点**：
- ✅ 不会出现在任何文件中
- ✅ 不会被 git 跟踪
- ✅ 系统级保护

#### 方案 B：使用配置文件（当前方式）

```bash
# 1. 配置文件仅在本地
# 2. 已添加到 .gitignore
# 3. 不会被提交到 git
```

**注意**：
- ⚠️ 确保 `.gitignore` 包含 `baidu_ocr_config.json`
- ⚠️ 不要分享包含配置的项目文件夹

#### 方案 C：加密配置文件（高级）

```python
# 使用加密存储（如果需要额外安全性）
from cryptography.fernet import Fernet

# 生成密钥（只执行一次，保存好）
key = Fernet.generate_key()

# 加密配置
f = Fernet(key)
encrypted = f.encrypt(b'your_api_key')

# 解密使用
decrypted = f.decrypt(encrypted)
```

### 📊 当前配置状态

**你的百度 OCR 配置**：
```
App ID: 7164390
API Key: 6XG7***（已隐藏）
Secret Key: ckqi***（已隐藏）
```

**存储位置**：
```
D:\code\WSJF\scripts\ocr\baidu_ocr_config.json
```

**Git 状态**：
```bash
# 运行检查
git status scripts/ocr/baidu_ocr_config.json
# 应该显示: 该文件被 .gitignore 忽略
```

### 🔄 如何安全分享项目

如果你想分享 WSJF 项目给其他人：

```bash
# 1. 确认敏感文件未被跟踪
git status

# 2. 提供配置说明（而非实际配置）
# 在 README 或文档中说明：
#   "需要创建 scripts/ocr/baidu_ocr_config.json"
#   "参考 baidu_ocr_config.json.example"

# 3. 分享前检查
git log --all --full-history -- scripts/ocr/baidu_ocr_config.json
# 应该为空（表示从未提交过）
```

### 📚 相关资源

- [百度 OCR 安全文档](https://ai.baidu.com/ai-doc/OCR/ek3h7y48n)
- [API Key 安全最佳实践](https://cloud.baidu.com/doc/Reference/s/9jwvz2egb)

---

**记住**：API Keys 就像密码，要妥善保管！🔐
