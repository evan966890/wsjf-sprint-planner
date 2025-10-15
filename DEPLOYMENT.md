# WSJF Sprint Planner - 部署指南

## 项目概述

WSJF Sprint Planner 是一个纯前端应用，使用 React + TypeScript + Vite 构建，所有数据存储在浏览器的 localStorage 中，无需后端服务器。

## 技术栈

- **前端框架**: React 18
- **构建工具**: Vite
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **导出功能**: xlsx, jspdf, html2canvas
- **数据存储**: localStorage (浏览器本地存储)

---

## 部署方式

### 方式 1: Vercel 部署 (推荐) ⭐

Vercel 提供免费的静态网站托管，非常适合 Vite 项目。

#### 步骤：

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   cd D:/code/WSJF
   vercel
   ```

4. **首次部署配置**
   - Set up and deploy? **Y**
   - Which scope? 选择你的账号
   - Link to existing project? **N**
   - What's your project's name? `wsjf-planner` (或其他名称)
   - In which directory is your code located? `./`
   - Want to override the settings? **N**

5. **生产部署**
   ```bash
   vercel --prod
   ```

#### 优势：
- ✅ 免费
- ✅ 自动 HTTPS
- ✅ 全球 CDN 加速
- ✅ 支持自定义域名
- ✅ CI/CD 集成 (连接 GitHub 自动部署)

---

### 方式 2: Netlify 部署

Netlify 也提供优秀的免费静态托管服务。

#### 步骤：

1. **安装 Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **构建项目**
   ```bash
   npm run build
   ```

3. **部署**
   ```bash
   netlify deploy
   ```

4. **首次配置**
   - Create & configure a new site? **Y**
   - Team: 选择你的 team
   - Site name: `wsjf-planner`
   - Publish directory: `dist`

5. **生产部署**
   ```bash
   netlify deploy --prod
   ```

---

### 方式 3: GitHub Pages 部署

完全免费，适合个人项目。

#### 步骤：

1. **安装 gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **修改 package.json**
   添加以下脚本：
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **修改 vite.config.ts**
   添加 base 路径：
   ```typescript
   export default defineConfig({
     plugins: [react()],
     base: '/wsjf-planner/',  // 替换为你的 repo 名称
     server: {
       port: 3000,
       open: true
     }
   })
   ```

4. **部署**
   ```bash
   npm run deploy
   ```

5. **配置 GitHub Pages**
   - 进入 GitHub repo → Settings → Pages
   - Source: 选择 `gh-pages` 分支
   - 访问 `https://yourusername.github.io/wsjf-planner/`

---

### 方式 4: 传统服务器部署 (Nginx)

适合自己有服务器的情况。

#### 步骤：

1. **构建项目**
   ```bash
   npm run build
   ```
   生成的文件在 `dist` 目录

2. **上传到服务器**
   ```bash
   scp -r dist/* user@your-server:/var/www/wsjf-planner/
   ```

3. **Nginx 配置**
   创建 `/etc/nginx/sites-available/wsjf-planner`：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/wsjf-planner;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # 启用 gzip 压缩
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   }
   ```

4. **启用站点**
   ```bash
   sudo ln -s /etc/nginx/sites-available/wsjf-planner /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

### 方式 5: Docker 部署

适合容器化部署场景。

#### 创建 Dockerfile：

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 创建 nginx.conf：

```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

#### 构建和运行：

```bash
docker build -t wsjf-planner .
docker run -d -p 8080:80 wsjf-planner
```

---

## 环境变量配置

本项目不需要环境变量配置，所有数据存储在浏览器 localStorage。

---

## 数据备份

### 导出数据

用户可以通过以下方式备份数据：

1. **Excel 导出**: 点击"导出" → "导出为 Excel"
2. **PDF 导出**: 点击"导出" → "导出为 PDF"
3. **图片导出**: 点击"导出" → "导出为图片"

### localStorage 数据

用户数据存储在 localStorage，格式为：
```
wsjf_current_user: {"name":"用户名","email":"email@example.com"}
wsjf_data_email@example.com: {requirements: [], sprintPools: [], unscheduled: []}
```

---

## 性能优化建议

### 1. 启用 CDN
- 使用 Vercel/Netlify 自动获得全球 CDN
- 或使用 Cloudflare 作为 CDN 代理

### 2. 构建优化
```bash
# 使用生产构建
npm run build

# 分析包大小
npm run build -- --report
```

### 3. 资源压缩
- Vite 自动进行代码压缩和 tree-shaking
- 图片资源已经过优化

---

## 域名配置

### Vercel
```bash
vercel domains add yourdomain.com
```

### Netlify
```bash
netlify domains:add yourdomain.com
```

### 自定义域名 DNS 配置
- A 记录指向服务器 IP
- 或 CNAME 记录指向 Vercel/Netlify 提供的域名

---

## 监控和分析

### 添加 Google Analytics (可选)

1. 创建 `src/analytics.ts`:
```typescript
export const initGA = () => {
  const script = document.createElement('script');
  script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
};
```

2. 在 `main.tsx` 中调用:
```typescript
import { initGA } from './analytics';
initGA();
```

---

## 常见问题

### Q1: 刷新页面后数据丢失？
A: 检查浏览器是否禁用了 localStorage，或是否处于隐身模式。

### Q2: 导出功能不工作？
A: 检查浏览器是否阻止了下载，允许下载弹窗。

### Q3: 如何清除所有数据？
A: 打开浏览器开发者工具 → Application → Local Storage → 删除 `wsjf_*` 相关的键。

### Q4: 多人如何协作？
A: 当前版本不支持多人实时协作。每个用户的数据独立存储在各自的浏览器中。如需协作，可以：
   - 导出 Excel 文件共享
   - 使用屏幕共享进行讨论
   - 未来版本可以考虑添加云端同步功能

### Q5: 数据安全吗？
A: 数据存储在用户浏览器本地，不会上传到服务器。注意：
   - 定期导出数据进行备份
   - 不要清除浏览器缓存，否则会丢失数据

---

## 更新和维护

### 更新代码
```bash
git pull origin main
npm install
npm run build
vercel --prod  # 或其他部署方式
```

### 版本管理
建议使用 Git 进行版本控制：
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

---

## 推荐部署方案总结

| 方案 | 适用场景 | 费用 | 难度 |
|------|---------|------|------|
| Vercel | 个人/小团队，追求极致性能 | 免费 | ⭐ 简单 |
| Netlify | 个人/小团队，需要表单等功能 | 免费 | ⭐ 简单 |
| GitHub Pages | 开源项目，GitHub 托管 | 免费 | ⭐⭐ 中等 |
| Nginx | 有自己服务器，需要完全控制 | 服务器费用 | ⭐⭐⭐ 较难 |
| Docker | 容器化环境，K8s 集群 | 服务器费用 | ⭐⭐⭐ 较难 |

**推荐**: 对于大多数用户，**Vercel** 是最佳选择，部署简单，性能出色，且完全免费。

---

## 技术支持

如有问题，请：
1. 查看 [README.md](./README.md) 和 [CLAUDE.md](./CLAUDE.md)
2. 提交 GitHub Issue
3. 联系开发团队

---

## 许可证

MIT License - 详见 LICENSE 文件
