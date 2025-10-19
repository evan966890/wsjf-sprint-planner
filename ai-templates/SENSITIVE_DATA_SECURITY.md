# 敏感信息安全管理规范

> 通用AI协作规范 - 适用于所有AI辅助开发项目
>
> **目的**: 防止API密钥、密码等敏感信息泄露到代码仓库

## 🚨 核心原则

### ⚠️ 黄金法则

**永远不要在代码中提交明文密钥、密码等敏感信息**

- ❌ **严禁**：在 `src/config/api.ts` 等配置文件中写入明文API Key
- ❌ **严禁**：将包含密钥的配置文件提交到 Git
- ❌ **严禁**：在代码注释中写入真实密钥（即使注释掉）
- ✅ **必须**：使用环境变量或配置文件管理敏感信息
- ✅ **必须**：将敏感配置文件加入 `.gitignore`

**后果**：
- 🔓 密钥泄露到公开仓库 → 被恶意使用 → 产生高额费用
- 🔓 数据库密码泄露 → 数据被窃取/删除 → 业务中断
- 🔓 服务器密钥泄露 → 服务器被入侵 → 安全事故

---

## 📋 敏感信息分类

### 1. API密钥类

**包括**：
- OpenAI API Key
- DeepSeek API Key
- Google Gemini API Key
- 阿里云 Access Key
- 腾讯云 Secret Key
- 各种第三方服务的 API Token

**识别特征**：
- 通常很长（32-64位）
- 包含随机字母数字组合
- 名称中包含 `key`, `token`, `secret`, `api_key`

### 2. 数据库凭证类

**包括**：
- 数据库密码
- Redis 密码
- MongoDB 连接字符串
- 数据库连接 URL（包含密码）

### 3. 加密密钥类

**包括**：
- JWT Secret
- Session Secret
- 加密算法密钥
- SSL/TLS 证书私钥

### 4. 账号密码类

**包括**：
- 邮箱密码
- FTP/SFTP 密码
- 管理后台密码
- 第三方服务账号密码

### 5. 其他敏感信息

**包括**：
- 服务器 IP 地址（生产环境）
- 内部域名
- 企业微信/钉钉 Webhook URL
- 身份证号、手机号等个人信息

---

## ✅ 正确的密钥管理方式

### 方式1: 环境变量（推荐）⭐⭐⭐

**原理**: 密钥存储在系统环境变量中，不提交到代码仓库

**实现步骤**：

#### 1.1 创建 .env 文件

```bash
# 在项目根目录创建 .env 文件（本地开发）
touch .env
```

```env
# .env 文件内容
VITE_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
VITE_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
VITE_GEMINI_API_KEY=xxxxxxxxxxxxxxxxxxxxx

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
REDIS_URL=redis://localhost:6379

# 其他密钥
JWT_SECRET=your-super-secret-key
```

**命名规范**：
- Vite 项目：`VITE_` 前缀（前端可访问）
- Next.js 项目：`NEXT_PUBLIC_` 前缀（前端可访问）
- 后端密钥：不需要特殊前缀

#### 1.2 添加 .env 到 .gitignore

```bash
# .gitignore
.env
.env.local
.env.*.local
```

#### 1.3 创建 .env.example 模板

```bash
# .env.example（提交到 Git，作为模板）
VITE_OPENAI_API_KEY=
VITE_DEEPSEEK_API_KEY=
VITE_GEMINI_API_KEY=

DATABASE_URL=
REDIS_URL=

JWT_SECRET=
```

**说明文档**：
```markdown
# .env.example 同级创建 README.md 或在项目 README 中说明

## 环境变量配置

1. 复制 `.env.example` 为 `.env`
   ```bash
   cp .env.example .env
   ```

2. 填入真实的 API Key
   - `VITE_OPENAI_API_KEY`: 从 https://platform.openai.com/api-keys 获取
   - `VITE_GEMINI_API_KEY`: 从 https://makersuite.google.com/app/apikey 获取

3. 不要提交 `.env` 文件到 Git
```

#### 1.4 代码中读取环境变量

```typescript
// ✅ 正确：从环境变量读取
// src/config/api.ts

/**
 * API 配置
 *
 * ⚠️ 重要：不要在此文件中直接写入密钥！
 *
 * 配置方式：
 * 1. 复制 .env.example 为 .env
 * 2. 在 .env 中填入真实的 API Key
 * 3. 密钥会自动从环境变量加载
 */

export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
export const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// 开发环境下检查配置
if (import.meta.env.DEV) {
  if (!OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY 未配置，请检查 .env 文件');
  }
}
```

**不同框架的环境变量读取**：

```typescript
// Vite
const apiKey = import.meta.env.VITE_API_KEY;

// Next.js
const apiKey = process.env.NEXT_PUBLIC_API_KEY;

// Create React App
const apiKey = process.env.REACT_APP_API_KEY;

// Node.js (需要 dotenv)
require('dotenv').config();
const apiKey = process.env.API_KEY;
```

### 方式2: 配置文件 + .gitignore ⭐⭐

**适用场景**: 需要更复杂的配置结构，或团队内部项目

**实现步骤**：

#### 2.1 创建配置文件

```typescript
// src/config/api.local.ts (不提交到 Git)

/**
 * 本地 API 配置
 *
 * ⚠️ 此文件包含敏感信息，已加入 .gitignore
 */

export const API_CONFIG = {
  openai: {
    apiKey: 'sk-xxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
  },
  deepseek: {
    apiKey: 'sk-xxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.deepseek.com/v1',
  },
};
```

#### 2.2 创建模板文件

```typescript
// src/config/api.template.ts (提交到 Git)

/**
 * API 配置模板
 *
 * 使用方式：
 * 1. 复制此文件为 api.local.ts
 * 2. 填入真实的 API Key
 * 3. api.local.ts 不会被提交到 Git
 */

export const API_CONFIG = {
  openai: {
    apiKey: '', // 在 api.local.ts 中填入真实 Key
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
  },
  deepseek: {
    apiKey: '', // 在 api.local.ts 中填入真实 Key
    baseUrl: 'https://api.deepseek.com/v1',
  },
};
```

#### 2.3 统一导出

```typescript
// src/config/api.ts (提交到 Git)

/**
 * API 配置统一导出
 *
 * 优先使用本地配置，如果不存在则使用环境变量
 */

let apiConfig;

try {
  // 尝试导入本地配置文件
  apiConfig = await import('./api.local');
} catch {
  // 本地配置不存在，使用环境变量
  apiConfig = {
    API_CONFIG: {
      openai: {
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
      },
    },
  };
}

export const { API_CONFIG } = apiConfig;
```

#### 2.4 .gitignore 配置

```bash
# .gitignore

# API 配置（敏感信息）
src/config/api.local.ts
src/config/*.local.ts
**/config/*.local.ts

# 环境变量
.env
.env.local
.env.*.local
```

### 方式3: 云平台密钥管理服务 ⭐⭐⭐

**适用场景**: 生产环境、团队协作、企业级应用

**推荐服务**：
- AWS Secrets Manager
- Azure Key Vault
- Google Cloud Secret Manager
- 阿里云密钥管理服务 (KMS)
- 腾讯云密钥管理系统 (KMS)

**优势**：
- ✅ 集中管理密钥
- ✅ 访问控制和审计
- ✅ 自动轮换密钥
- ✅ 加密存储

---

## ❌ 错误的密钥管理方式

### 错误1: 直接硬编码在代码中

```typescript
// ❌ 极其危险：明文密钥硬编码
export const OPENAI_API_KEY = 'sk-proj-xxxxxxxxxxxxxxxxxxxxx';
export const DATABASE_PASSWORD = 'mypassword123';
```

**问题**：
- 提交到 Git → 永久记录在历史中
- 公开仓库 → 全世界可见
- 即使删除 → Git 历史仍然保留

### 错误2: 在注释中写入真实密钥

```typescript
// ❌ 危险：注释中包含真实密钥
// export const OPENAI_API_KEY = 'sk-proj-xxxxxxxxxxxxxxxxxxxxx'; // 旧密钥
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
```

**问题**：
- 注释也会提交到 Git
- 扫描工具可能检测不到

### 错误3: 提交 .env 文件

```bash
# ❌ 错误：没有忽略 .env 文件
git add .env
git commit -m "添加配置"
```

**问题**：
- .env 文件包含所有密钥
- 一旦提交很难彻底删除

### 错误4: 在配置示例中使用真实密钥

```typescript
// ❌ 危险：示例中使用真实密钥
// src/config/api.example.ts
export const OPENAI_API_KEY = 'sk-proj-xxxxxxxxxxxxxxxxxxxxx'; // 真实密钥
```

**正确做法**：
```typescript
// ✅ 正确：示例中使用占位符
// src/config/api.example.ts
export const OPENAI_API_KEY = 'sk-proj-YOUR_API_KEY_HERE';
```

### 错误5: 在前端代码中使用后端密钥

```typescript
// ❌ 危险：前端代码中使用服务器密钥
const response = await fetch('/api/data', {
  headers: {
    'Authorization': `Bearer ${DATABASE_PASSWORD}`, // 暴露给用户
  },
});
```

**问题**：
- 前端代码用户可见
- 密钥完全暴露

---

## 🔍 密钥泄露检测

### Git 提交前检查

**创建 pre-commit hook**：

```bash
#!/bin/bash
# .git/hooks/pre-commit

# 检查是否包含可能的 API Key
if git diff --cached | grep -E "sk-[a-zA-Z0-9]{32,}|api[_-]?key.*=.*['\"][a-zA-Z0-9]{20,}"; then
  echo "⚠️  检测到可能的 API Key，请检查是否误提交敏感信息！"
  echo "如果确认无误，请使用 git commit --no-verify 跳过检查"
  exit 1
fi
```

### 使用 git-secrets 工具

```bash
# 安装 git-secrets
brew install git-secrets  # macOS
apt-get install git-secrets  # Linux

# 配置扫描规则
git secrets --add 'sk-[a-zA-Z0-9]{32,}'
git secrets --add 'api[_-]?key.*=.*['\"][a-zA-Z0-9]{20,}'

# 扫描历史提交
git secrets --scan-history
```

### 使用 truffleHog 扫描

```bash
# 安装 truffleHog
pip install truffleHog

# 扫描整个仓库
truffleHog --regex --entropy=False file:///.
```

---

## 🚨 密钥泄露后的应急处理

### 如果已经提交到 Git

**步骤1: 立即撤销密钥**
```bash
# 前往对应平台撤销/重新生成密钥
# - OpenAI: https://platform.openai.com/api-keys
# - Google: https://console.cloud.google.com/
```

**步骤2: 从 Git 历史中删除**

```bash
# 使用 BFG Repo-Cleaner 清理
# 1. 下载 BFG: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --replace-text passwords.txt

# 2. 或使用 git filter-branch (不推荐，很慢)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch src/config/api.ts" \
  --prune-empty --tag-name-filter cat -- --all

# 3. 强制推送（危险！会改写历史）
git push origin --force --all
git push origin --force --tags
```

**步骤3: 通知团队成员**
```
所有成员需要重新克隆仓库：
git clone <repo-url>
```

**步骤4: 监控异常使用**
- 检查 API 使用记录
- 查看是否有异常调用
- 设置费用告警

### 如果推送到公开仓库

**额外步骤**：
1. **立即将仓库设为私有**
2. **联系平台客服冻结密钥**
3. **检查是否有异常费用**
4. **考虑重置所有相关密钥**

---

## 📖 AI协作时的安全规范

### AI不应该做的事 ❌

1. **不应该建议在代码中写入明文密钥**
   ```
   ❌ AI: "请在 src/config/api.ts 中填入你的 API Key：
        export const OPENAI_API_KEY = 'sk-xxx';"
   ```

2. **不应该要求用户提供真实密钥**
   ```
   ❌ AI: "请提供你的 OpenAI API Key，我来帮你配置"
   ```

3. **不应该在对话中展示真实密钥**
   ```
   ❌ AI: "你的密钥 sk-proj-abcd1234... 配置成功"
   ```

### AI应该做的事 ✅

1. **应该引导使用环境变量**
   ```
   ✅ AI: "我来帮你配置环境变量方式：
        1. 创建 .env 文件
        2. 添加 VITE_OPENAI_API_KEY=你的密钥
        3. 确保 .env 在 .gitignore 中"
   ```

2. **应该创建配置模板**
   ```
   ✅ AI: "我创建了 .env.example 模板文件，
        你可以复制并填入真实密钥，
        .env 文件不会提交到 Git"
   ```

3. **应该检查 .gitignore**
   ```
   ✅ AI: "我检查了 .gitignore，已经包含 .env，
        你可以安全地在 .env 中配置密钥"
   ```

4. **应该提供安全指引**
   ```
   ✅ AI: "配置 API Key 时请注意：
        - 使用环境变量而非硬编码
        - 确保敏感文件在 .gitignore 中
        - 不要在 Git 中提交真实密钥"
   ```

### AI协作检查清单 ✅

**创建配置文件时**：
- [ ] 是否使用环境变量读取密钥？
- [ ] 是否创建了 .env.example 模板？
- [ ] 是否在 .gitignore 中排除了敏感文件？
- [ ] 是否添加了配置说明文档？
- [ ] 代码注释中是否有密钥安全提示？

**修改配置文件时**：
- [ ] 是否要求用户硬编码密钥？（禁止）
- [ ] 是否引导用户使用环境变量？
- [ ] 是否检查 .gitignore 配置？

**审查代码时**：
- [ ] 是否有硬编码的密钥？
- [ ] 是否有注释中的真实密钥？
- [ ] 环境变量是否正确使用？

---

## 📋 项目初始化检查清单

### 新项目启动时

- [ ] 创建 `.env.example` 模板文件
- [ ] 在 `.gitignore` 中添加敏感文件规则
- [ ] 在 `README.md` 中添加环境变量配置说明
- [ ] 创建配置文件时使用环境变量
- [ ] 设置 Git hooks 检测密钥泄露
- [ ] 团队成员学习密钥安全规范

### .gitignore 必备规则

```bash
# .gitignore

# 环境变量
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 本地配置
**/config/*.local.*
**/config/api.local.ts
src/config/keys.ts

# 敏感文件
secrets/
*.key
*.pem
*.p12
*.pfx
```

---

## 🎓 最佳实践总结

### 开发环境

1. **使用 .env 文件**
   - 复制 `.env.example` 为 `.env`
   - 在 `.env` 中配置真实密钥
   - `.env` 在 `.gitignore` 中

2. **代码中读取环境变量**
   - `import.meta.env.VITE_*`（Vite）
   - `process.env.NEXT_PUBLIC_*`（Next.js）
   - 提供默认值和错误提示

3. **提供配置文档**
   - 在 README 中说明如何配置
   - 列出需要的环境变量
   - 提供获取密钥的链接

### 生产环境

1. **使用平台环境变量**
   - Vercel: Environment Variables
   - Netlify: Environment Variables
   - 腾讯云: 环境配置

2. **使用密钥管理服务**
   - AWS Secrets Manager
   - Google Cloud Secret Manager
   - 阿里云 KMS

3. **定期轮换密钥**
   - 每 3-6 个月更换一次
   - 离职员工相关密钥立即更换
   - 使用自动轮换功能

### 团队协作

1. **统一配置方式**
   - 团队使用相同的配置模式
   - 文档化配置流程
   - 新成员入职时培训

2. **代码审查**
   - PR 时检查是否有硬编码密钥
   - 使用自动化工具扫描
   - 设置必要的审批流程

3. **安全意识**
   - 定期安全培训
   - 分享安全事故案例
   - 建立应急响应流程

---

## 🔗 相关资源

### 工具推荐

- **git-secrets**: Git 密钥检测工具
- **truffleHog**: 密钥泄露扫描工具
- **BFG Repo-Cleaner**: Git 历史清理工具
- **dotenv**: Node.js 环境变量加载库

### 参考文档

- [OWASP Top 10 - Sensitive Data Exposure](https://owasp.org/www-project-top-ten/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)

---

**版本**: 1.0.0
**最后更新**: 2025-01-19
**适用项目**: 所有AI辅助开发项目
