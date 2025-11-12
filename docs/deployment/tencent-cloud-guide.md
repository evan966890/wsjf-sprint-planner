# 腾讯云部署指南

## 📋 部署概述

WSJF Sprint Planner 是一个纯前端项目，可以部署到腾讯云静态网站托管服务（CloudBase）。

**部署方式**：
- 腾讯云 CloudBase 静态网站托管（推荐）
- 腾讯云 COS + CDN（高级用户）

---

## 🚀 方案一：CloudBase 静态网站托管（推荐）

### 优势
- ✅ 零配置，开箱即用
- ✅ 自动 HTTPS
- ✅ CDN 加速
- ✅ 版本管理和回滚
- ✅ 免费额度（5GB流量/月）

### 前置要求

1. **腾讯云账号**
   - 注册地址：https://cloud.tencent.com/
   - 需要完成实名认证

2. **Node.js 环境**
   - Node.js >= 18.0.0
   - npm >= 9.0.0

3. **CloudBase CLI**
   ```bash
   npm install -g @cloudbase/cli
   ```

---

## 📝 详细步骤

### 第一步：创建 CloudBase 环境

1. **登录腾讯云控制台**
   - 访问：https://console.cloud.tencent.com/tcb
   - 点击"新建环境"

2. **配置环境**
   ```
   环境名称: wsjf-sprint-planner
   计费方式: 按量计费（推荐）
   区域: 上海（ap-shanghai）
   ```

3. **开通静态网站托管**
   - 进入环境 → 静态网站托管 → 开通服务
   - 记录环境ID（格式：wsjf-xxxxx）

### 第二步：配置项目

1. **配置环境变量**
   ```bash
   # 复制环境变量模板
   cp .env.example .env.local

   # 编辑 .env.local
   ENV_ID=your-env-id-here  # 填写你的环境ID
   ```

2. **登录 CloudBase**
   ```bash
   cloudbase login
   ```
   - 会打开浏览器进行授权
   - 授权成功后回到终端

### 第三步：部署项目

#### 方式 1：使用自动脚本（推荐）

```bash
# Windows (Git Bash)
bash scripts/deploy-tencent.sh

# 或使用 npm 命令
npm run deploy:tencent
```

#### 方式 2：手动部署

```bash
# 1. 运行部署前检查
npm run pre-deploy-check

# 2. 构建项目
npm run build

# 3. 部署到腾讯云
cloudbase framework deploy
```

### 第四步：验证部署

1. **查看部署状态**
   - 登录 CloudBase 控制台
   - 进入环境 → 静态网站托管 → 文件管理
   - 检查文件是否上传成功

2. **获取访问地址**
   - 静态网站托管 → 设置 → 基础配置
   - 复制默认域名（格式：xxx.tcloudbaseapp.com）

3. **访问测试**
   - 在浏览器中打开域名
   - 验证功能是否正常

---

## 🔧 高级配置

### 配置自定义域名

1. **添加域名**
   - 静态网站托管 → 设置 → 域名管理 → 添加域名
   - 输入你的域名（如：wsjf.example.com）

2. **DNS 配置**
   - 在你的域名服务商处添加 CNAME 记录
   ```
   类型: CNAME
   主机记录: wsjf (或 @)
   记录值: xxx.tcloudbaseapp.com
   ```

3. **等待生效**
   - DNS 解析通常需要 10 分钟 - 24 小时

### 配置 HTTPS 证书

1. **自动证书（推荐）**
   - 域名管理 → 选择域名 → 配置证书
   - 选择"自动申请免费证书"
   - 等待证书签发（通常 5-10 分钟）

2. **上传自有证书**
   - 如果有自己的 SSL 证书
   - 上传证书文件和私钥

### 配置环境变量

如果需要使用 AI 功能（可选）：

1. **编辑 `.env.local`**
   ```bash
   # OpenAI 配置
   VITE_OPENAI_API_KEY=sk-xxxxx
   VITE_OPENAI_API_BASE_URL=https://api.openai.com/v1

   # DeepSeek 配置
   VITE_DEEPSEEK_API_KEY=sk-xxxxx
   VITE_DEEPSEEK_API_BASE_URL=https://api.deepseek.com
   ```

2. **重新构建部署**
   ```bash
   npm run deploy:tencent
   ```

---

## 🔄 更新和回滚

### 更新项目

```bash
# 拉取最新代码
git pull

# 部署更新
npm run deploy:tencent
```

### 版本回滚

1. **查看版本历史**
   - CloudBase 控制台 → 静态网站托管 → 版本管理

2. **回滚到指定版本**
   - 选择版本 → 点击"回滚"

---

## 💰 费用说明

### 免费额度（每月）

| 资源 | 免费额度 | 超出计费 |
|------|---------|---------|
| 存储空间 | 5GB | ¥0.0043/GB/天 |
| CDN流量 | 5GB | ¥0.18/GB |
| 函数调用 | 1万次 | ¥0.0133/万次 |

### 预估成本

以中小团队（20-50人）使用为例：
- 月访问量：~5000 PV
- 月流量：~2GB
- **预估费用**：¥0（在免费额度内）

---

## 🐛 常见问题

### 1. 部署失败：未找到 CloudBase CLI

**解决方案**：
```bash
npm install -g @cloudbase/cli@latest
```

### 2. 部署失败：未登录

**解决方案**：
```bash
cloudbase login
```

### 3. 访问 404 错误

**原因**：可能是路由配置问题

**解决方案**：
在 CloudBase 控制台配置 URL 重写规则：
```json
{
  "source": "/*",
  "target": "/index.html",
  "type": "rewrite"
}
```

### 4. 文件上传失败

**原因**：文件过大或网络问题

**解决方案**：
```bash
# 清理构建缓存
rm -rf dist node_modules

# 重新安装依赖
npm install

# 重新构建
npm run build

# 重新部署
cloudbase framework deploy
```

### 5. 构建失败：内存不足

**解决方案**：
增加 Node.js 内存限制
```bash
# Windows
set NODE_OPTIONS=--max-old-space-size=4096

# Linux/Mac
export NODE_OPTIONS=--max-old-space-size=4096

npm run build
```

---

## 🔒 安全建议

### 1. 环境变量保护

- ⚠️ **不要将 `.env.local` 提交到 Git**
- ✅ `.env.local` 已在 `.gitignore` 中
- ✅ 使用 `.env.example` 作为模板

### 2. API 密钥安全

如果使用 AI 功能：
- ⚠️ API 密钥会暴露在前端代码中
- 建议：使用云函数作为代理（高级用户）
- 建议：设置 API 密钥的使用限制和预算

### 3. 访问控制

如果需要限制访问：
1. CloudBase 控制台 → 静态网站托管 → 安全配置
2. 配置访问白名单或基础认证

---

## 📊 监控和日志

### 查看访问统计

1. CloudBase 控制台 → 静态网站托管 → 数据统计
2. 查看：
   - 访问量趋势
   - 流量消耗
   - 热门文件

### 查看错误日志

1. CloudBase 控制台 → 监控告警 → 日志
2. 筛选错误日志
3. 根据错误信息排查问题

---

## 🚀 方案二：COS + CDN（高级）

适合对性能和成本有极致要求的场景。

### 部署步骤

1. **创建 COS 存储桶**
   - 访问：https://console.cloud.tencent.com/cos
   - 创建存储桶，选择公有读私有写

2. **上传构建文件**
   ```bash
   npm run build
   # 手动上传 dist/ 目录到 COS
   ```

3. **配置 CDN**
   - 访问：https://console.cloud.tencent.com/cdn
   - 添加域名，回源到 COS 存储桶

4. **配置 URL 重写**
   ```
   源路径: /*
   目标路径: /index.html
   ```

---

## 📞 技术支持

### 官方文档
- CloudBase 文档：https://docs.cloudbase.net/
- 腾讯云论坛：https://cloud.tencent.com/developer/ask

### 项目支持
- GitHub Issues: https://github.com/your-org/wsjf-sprint-planner/issues
- 企业微信群：（待建立）

---

## 📝 部署检查清单

使用前请确认：

- [ ] 已注册腾讯云账号并实名认证
- [ ] 已创建 CloudBase 环境
- [ ] 已安装 CloudBase CLI
- [ ] 已配置环境变量（如需AI功能）
- [ ] 已运行部署前检查
- [ ] 已成功构建项目
- [ ] 已部署到 CloudBase
- [ ] 已验证访问正常
- [ ] 已配置自定义域名（可选）
- [ ] 已配置 HTTPS 证书（可选）

---

**最后更新**: 2025-01-12
**版本**: v1.6.0
**维护者**: WSJF Team
