# WSJF Sprint Planner - 腾讯云 CloudBase 部署指南

## 目录
- [简介](#简介)
- [准备工作](#准备工作)
- [快速部署](#快速部署)
- [详细步骤](#详细步骤)
- [环境变量配置](#环境变量配置)
- [常见问题](#常见问题)
- [进阶配置](#进阶配置)

## 简介

本项目支持一键部署到**腾讯云 CloudBase**（云开发）静态托管服务。

### CloudBase 优势

- ✅ **免费额度充足** - 每月 5GB 流量 + 5GB 存储
- ✅ **自动 HTTPS** - 免费 SSL 证书自动配置
- ✅ **全球 CDN** - 腾讯云 CDN 全球加速
- ✅ **简单部署** - 命令行一键部署
- ✅ **自动构建** - 支持 CI/CD 自动化
- ✅ **高可用性** - 99.95% SLA 保证
- ✅ **国内访问快** - 针对国内用户优化

### 费用说明

**免费额度（每月）：**
- CDN 流量：5GB
- 存储容量：5GB
- 数据库读：50,000 次
- 数据库写：30,000 次
- 云函数调用：100 万次

**超出部分：**
- CDN 流量：¥0.18/GB（国内）
- 存储：¥0.0043/GB/天

> 对于中小型项目，免费额度完全够用！

## 准备工作

### 1. 注册腾讯云账号

访问 [腾讯云官网](https://cloud.tencent.com/) 注册账号

- 支持微信/QQ/邮箱注册
- 需要实名认证（个人/企业）
- 新用户有额外代金券

### 2. 创建 CloudBase 环境

1. 登录 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)

2. 点击「新建环境」

3. 选择「按量计费」（免费额度内无需付费）

4. 填写环境信息：
   - **环境名称**：`wsjf-planner`（或自定义）
   - **环境 ID**：自动生成（如 `wsjf-planner-xxx`）
   - **区域**：选择离用户最近的区域（推荐：上海、广州）

5. 开通「静态网站托管」服务
   - 进入环境详情
   - 点击左侧「静态网站托管」
   - 点击「开通」按钮

6. **记录环境 ID**（后续配置需要）

### 3. 安装 Node.js

确保已安装 Node.js 16+

```bash
node --version  # 检查版本
```

如未安装，访问 [Node.js 官网](https://nodejs.org/) 下载安装。

## 快速部署

### 方式一：使用部署脚本（推荐）

```bash
# 双击运行（Windows）
deploy-tencent.bat
```

脚本会自动：
1. 检查 Node.js 环境
2. 构建生产版本
3. 安装 CloudBase CLI（如需要）
4. 执行部署

### 方式二：手动命令部署

```bash
# 1. 安装 CloudBase CLI（首次需要）
npm install -g @cloudbase/cli

# 2. 登录腾讯云账号
cloudbase login

# 3. 构建项目
npm run build

# 4. 部署
cloudbase framework deploy
```

## 详细步骤

### 步骤 1: 安装 CloudBase CLI

```bash
npm install -g @cloudbase/cli
```

**验证安装：**

```bash
cloudbase --version
```

应输出版本号，例如：`@cloudbase/cli@2.x.x`

### 步骤 2: 登录腾讯云账号

```bash
cloudbase login
```

系统会：
1. 打开浏览器登录页面
2. 使用微信扫码或账号密码登录
3. 授权 CloudBase CLI

**验证登录：**

```bash
cloudbase env:list
```

应显示你的环境列表。

### 步骤 3: 配置环境 ID

编辑项目根目录下的 `cloudbaserc.json` 文件：

```json
{
  "version": "2.0",
  "envId": "你的环境ID",  // ← 修改这里
  "framework": {
    "name": "wsjf-sprint-planner",
    "plugins": {
      "client": {
        "use": "@cloudbase/framework-plugin-website",
        "inputs": {
          "buildCommand": "npm run build",
          "outputPath": "dist",
          "cloudPath": "/"
        }
      }
    }
  }
}
```

**获取环境 ID：**

1. 访问 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 点击你创建的环境
3. 在「概览」页面找到「环境 ID」
4. 格式类似：`wsjf-planner-xxx` 或 `env-xxx`

### 步骤 4: 构建项目

```bash
npm install  # 安装依赖（首次需要）
npm run build
```

构建完成后，`dist` 目录包含生产版本文件。

### 步骤 5: 部署到 CloudBase

```bash
cloudbase framework deploy
```

部署过程：

```
√ 检测环境信息
√ 构建项目
√ 打包文件
√ 上传文件 (100%)
√ 配置 CDN
√ 部署完成
```

**部署成功后，会显示访问地址：**

```
部署成功！
访问地址: https://wsjf-planner-xxx.tcloudbaseapp.com
```

### 步骤 6: 访问网站

1. 复制部署成功后的 URL
2. 在浏览器中打开
3. 确认页面正常加载

## 环境变量配置

如果需要配置 Gemini API Key 等环境变量：

### 方式一：在代码中配置（已实现）

在 `src/wsjf-sprint-planner.tsx` 中配置：

```typescript
// 第34-47行
const GEMINI_API_KEY = "你的API_KEY"; // 直接填写
```

### 方式二：使用环境变量（进阶）

1. 创建 `.env.production` 文件：

```bash
VITE_GEMINI_API_KEY=你的API_KEY
```

2. 在代码中使用：

```typescript
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
```

3. 在 `cloudbaserc.json` 中配置：

```json
{
  "envId": "你的环境ID",
  "framework": {
    "plugins": {
      "client": {
        "inputs": {
          "envVariables": {
            "VITE_GEMINI_API_KEY": "你的API_KEY"
          }
        }
      }
    }
  }
}
```

## 常见问题

### 问题 1: 登录失败

**错误信息：**
```
Error: login failed
```

**解决方案：**

```bash
# 清除登录缓存
cloudbase logout

# 重新登录
cloudbase login
```

### 问题 2: 环境 ID 错误

**错误信息：**
```
Error: 环境不存在或无权限访问
```

**解决方案：**

1. 检查 `cloudbaserc.json` 中的 `envId` 是否正确
2. 访问控制台确认环境 ID：https://console.cloud.tencent.com/tcb
3. 确保当前账号有该环境的访问权限

### 问题 3: 部署超时

**错误信息：**
```
Error: upload timeout
```

**解决方案：**

```bash
# 清除构建缓存
rm -rf dist node_modules/.vite

# 重新构建
npm run build

# 重新部署
cloudbase framework deploy
```

### 问题 4: 文件上传失败

**错误信息：**
```
Error: upload failed
```

**解决方案：**

1. 检查网络连接
2. 确认存储空间未超出配额
3. 尝试分步部署：

```bash
# 只构建不上传
npm run build

# 单独上传静态文件
cloudbase hosting deploy dist -e 你的环境ID
```

### 问题 5: 访问域名 404

**可能原因：**

1. 部署未完成（等待 1-2 分钟）
2. CDN 缓存未刷新
3. 路由配置问题

**解决方案：**

```bash
# 刷新 CDN 缓存
cloudbase hosting purge -e 你的环境ID

# 检查部署状态
cloudbase framework functions:list
```

### 问题 6: HTTPS 证书错误

CloudBase 会自动配置免费 SSL 证书，如果出现证书问题：

1. 等待 5-10 分钟（证书签发需要时间）
2. 刷新浏览器缓存（Ctrl+Shift+Delete）
3. 使用隐私模式访问测试

## 进阶配置

### 自定义域名

1. 进入 CloudBase 控制台
2. 点击「静态网站托管」→「设置」
3. 添加自定义域名（需要已备案）
4. 配置 CNAME 记录：

```
类型: CNAME
主机记录: wsjf（或 @ 根域名）
记录值: 控制台提供的 CNAME 地址
```

5. 等待 DNS 生效（5-30 分钟）
6. CloudBase 自动签发 SSL 证书

### 开启 CDN 加速

在控制台「静态网站托管」→「设置」中：

- ✅ 开启 CDN 加速
- ✅ 开启 HTTPS 强制跳转
- ✅ 开启 Gzip 压缩
- ✅ 配置缓存规则：
  - HTML: 不缓存
  - JS/CSS: 缓存 30 天
  - 图片: 缓存 1 年

### CI/CD 自动部署

#### GitHub Actions 配置

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Tencent CloudBase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Deploy to CloudBase
        run: |
          npm install -g @cloudbase/cli
          echo "${{ secrets.CLOUDBASE_SECRET }}" | cloudbase login --apiKeyId "${{ secrets.CLOUDBASE_SECRET_ID }}"
          cloudbase framework deploy --envId "${{ secrets.ENV_ID }}"
```

**配置 GitHub Secrets：**

1. 获取 CloudBase API 密钥：
   - 访问 https://console.cloud.tencent.com/cam/capi
   - 新建密钥，记录 SecretId 和 SecretKey

2. 在 GitHub 仓库设置中添加 Secrets：
   - `CLOUDBASE_SECRET_ID`: 你的 SecretId
   - `CLOUDBASE_SECRET`: 你的 SecretKey
   - `ENV_ID`: CloudBase 环境 ID

### 性能优化

#### 1. 启用资源压缩

在 `vite.config.ts` 中：

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'utils': ['xlsx', 'html2canvas', 'jspdf']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true // 移除 console.log
      }
    }
  }
})
```

#### 2. 配置缓存策略

在控制台「静态网站托管」→「设置」→「缓存配置」：

```
路径: /assets/*
缓存时长: 31536000 秒（1年）

路径: /index.html
缓存时长: 0 秒（不缓存）
```

### 监控与分析

1. **访问统计**
   - 控制台 → 统计分析
   - 查看 UV/PV、地域分布、访问来源

2. **性能监控**
   - 控制台 → 性能监控
   - 查看加载时间、错误率

3. **日志查询**
   - 控制台 → 日志
   - 查看访问日志、错误日志

## 更新部署

每次修改代码后，重新部署：

```bash
# 方式一：使用脚本
deploy-tencent.bat

# 方式二：手动命令
npm run build
cloudbase framework deploy
```

**或使用一行命令：**

```bash
npm run build && cloudbase framework deploy
```

## 回滚部署

如果新版本有问题，可以回滚到上一个版本：

```bash
# 查看历史版本
cloudbase hosting versions -e 你的环境ID

# 回滚到指定版本
cloudbase hosting rollback -v 版本ID -e 你的环境ID
```

## 成本估算

### 示例场景

**每月访问量：10,000 次**
- 平均页面大小：1MB
- 总流量：10GB

**费用计算：**
- 免费额度：5GB（免费）
- 超出流量：5GB × ¥0.18/GB = ¥0.90
- **总费用：¥0.90/月**

> 对于个人项目和中小型应用，成本极低！

## 技术支持

### 官方资源

- 📚 官方文档：https://docs.cloudbase.net/
- 💬 社区论坛：https://cloudbase.net/community
- 📞 技术支持：https://cloud.tencent.com/document/product/876

### 常用链接

- CloudBase 控制台：https://console.cloud.tencent.com/tcb
- 费用中心：https://console.cloud.tencent.com/expense
- API 密钥管理：https://console.cloud.tencent.com/cam/capi
- 域名备案：https://console.cloud.tencent.com/beian

## 对比 Vercel

| 特性 | CloudBase | Vercel |
|------|-----------|--------|
| 国内访问速度 | ⭐⭐⭐⭐⭐ 极快 | ⭐⭐ 较慢 |
| 免费流量 | 5GB/月 | 100GB/月 |
| 自定义域名 | 需备案 | 无需备案 |
| CDN 节点 | 国内为主 | 全球为主 |
| 部署速度 | 快 | 快 |
| 学习成本 | 中等 | 低 |
| 费用（超额） | 低 | 中等 |

**推荐使用场景：**
- **国内用户为主** → 优先 CloudBase
- **海外用户为主** → 优先 Vercel
- **双线部署** → 两者都用（国内指向 CloudBase，海外指向 Vercel）

## 下一步

- [ ] 配置自定义域名
- [ ] 开启 CDN 加速
- [ ] 设置访问统计
- [ ] 配置 CI/CD 自动部署
- [ ] 性能优化和缓存策略

---

**祝部署顺利！🚀**

如有问题，请参考[常见问题](#常见问题)或联系技术支持。
