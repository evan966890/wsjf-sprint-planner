# WSJF Sprint Planner - Vercel 部署指南

## 当前状态

- ✅ 代码已构建成功（dist 目录已生成）
- ✅ Vercel CLI 已安装
- ✅ vercel.json 配置文件已创建
- ⚠️ 需要登录 Vercel 账号

## 解决 SSL 证书错误（NET::ERR_CERT_COMMON_NAME_INVALID）

您遇到的 SSL 证书错误通常由以下原因引起：

1. **使用了预览域名而非生产域名**
   - 预览域名：`project-name-xxx.vercel.app`（临时）
   - 生产域名：`project-name.vercel.app`（永久，带SSL）

2. **旧项目配置问题**
   - 之前的部署可能配置不正确
   - 需要重新部署或删除旧项目

3. **DNS传播延迟**
   - 新部署的域名需要等待几分钟才能完全生效

## 完整部署步骤

### 步骤 1: 登录 Vercel

打开命令行，执行：

```bash
vercel login
```

系统会提示您选择登录方式：
- GitHub
- GitLab
- Bitbucket
- Email

**推荐使用 GitHub 登录**，这样可以方便地连接 GitHub 仓库实现自动部署。

### 步骤 2: 部署到生产环境

```bash
vercel --prod
```

首次部署会询问以下问题：

1. **Set up and deploy "D:\code\WSJF"?** → 输入 `Y`

2. **Which scope?** → 选择您的账号名称

3. **Link to existing project?** → 如果之前有项目出现问题，输入 `N` 创建新项目

4. **What's your project's name?** → 输入 `wsjf-sprint-planner`（或其他名称）

5. **In which directory is your code located?** → 直接回车（默认 `./`）

6. **Want to modify these settings?** → 输入 `N`

### 步骤 3: 等待部署完成

部署过程约 30-60 秒，完成后会显示：

```
✅ Production: https://wsjf-sprint-planner.vercel.app [copied to clipboard]
```

这就是您的**正式生产域名**，带有自动配置的 SSL 证书。

### 步骤 4: 验证 HTTPS 访问

1. 复制部署完成后显示的 URL
2. 在浏览器中打开（Chrome/Edge/Firefox）
3. 确认地址栏显示 🔒 图标（表示 HTTPS 安全连接）
4. 如果仍有证书警告，请等待 2-5 分钟后刷新（DNS 传播延迟）

### 步骤 5: 设置自动部署（可选但推荐）

如果使用 GitHub 登录，可以连接仓库实现自动部署：

1. 访问 https://vercel.com/dashboard
2. 进入项目设置 → Git
3. 连接 GitHub 仓库
4. 每次 push 到 main 分支，自动触发部署

## 如果遇到问题

### 问题 1: 仍然出现 SSL 证书错误

**解决方案A - 删除旧项目重新部署**：

```bash
# 1. 删除本地配置
rm -rf .vercel

# 2. 登录 Vercel Dashboard
# 访问 https://vercel.com/dashboard
# 找到旧的 wsjf-sprint-planner 项目
# 点击 Settings → Advanced → Delete Project

# 3. 重新部署
vercel --prod
```

**解决方案B - 使用新的项目名称**：

```bash
# 使用不同的项目名称
vercel --prod

# 在询问项目名称时输入新名称，例如：
# wsjf-planner-v2
# wsjf-sprint-tool
# 等等
```

### 问题 2: 登录失败

```bash
# 清除旧的登录信息
vercel logout

# 重新登录
vercel login
```

### 问题 3: 构建失败

```bash
# 重新构建本地版本
npm run build

# 确认 dist 目录存在且包含文件
ls -la dist/

# 然后重新部署
vercel --prod
```

### 问题 4: 域名访问超时

可能原因：
- DNS 还在传播中（等待 5-10 分钟）
- 网络防火墙拦截（尝试切换网络或使用 VPN）
- Vercel 服务暂时不可用（查看 https://www.vercelstatus.com/）

## 快速部署脚本

您也可以直接使用项目中的 `deploy.bat` 脚本：

```bash
# Windows
.\deploy.bat

# 或者直接双击 deploy.bat 文件
```

该脚本会自动：
1. 构建生产版本
2. 检查 Vercel CLI
3. 执行部署命令

## 生产环境特性

Vercel 自动提供：

- ✅ 免费 HTTPS/SSL 证书（Let's Encrypt）
- ✅ 全球 CDN 加速
- ✅ 自动压缩（Gzip/Brotli）
- ✅ HTTP/2 支持
- ✅ 自动缓存优化
- ✅ DDoS 防护
- ✅ 99.99% SLA 保证

## 监控部署状态

访问 Vercel Dashboard 查看：
- 部署历史
- 访问统计
- 性能指标
- 错误日志

URL: https://vercel.com/dashboard

## 域名配置（可选）

如果您有自己的域名（例如 wsjf.yourdomain.com）：

1. 在 Vercel Dashboard 中进入项目
2. 点击 Domains 标签
3. 添加自定义域名
4. 按提示配置 DNS 记录（A 或 CNAME）
5. 等待 SSL 证书自动签发（约 1-2 分钟）

## 更新部署

每次修改代码后，只需运行：

```bash
# 重新构建
npm run build

# 部署到生产环境
vercel --prod
```

或者使用一行命令：

```bash
npm run build && vercel --prod
```

## 技术支持

如有问题，请联系：
- Vercel 官方文档：https://vercel.com/docs
- Vercel 社区支持：https://github.com/vercel/vercel/discussions
- 项目 GitHub Issues

---

**祝部署顺利！🚀**
