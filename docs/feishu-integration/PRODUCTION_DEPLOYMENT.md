# 飞书集成 - 生产环境部署说明

## 当前状态

✅ **本地开发环境**：完全可用
⚠️ **生产环境**：因CORS策略限制，暂时不可用

## 问题说明

飞书项目管理平台 (https://project.f.mioffice.cn) 的API需要：
1. 特定的域名白名单
2. 正确的CORS响应头
3. 飞书企业管理员配置

当前CloudBase云函数已部署，但需要额外的CORS配置。

## 临时解决方案：本地开发模式

### 步骤1：启动完整开发环境

```bash
# 启动前端 + OCR服务器 + 飞书代理服务器
npm run dev:full
```

这将启动：
- Vite开发服务器 (http://localhost:3000)
- OCR服务器 (http://localhost:3001)
- 飞书代理服务器 (http://localhost:3002)

### 步骤2：访问应用

打开浏览器访问：http://localhost:3000

### 步骤3：使用飞书导入

1. 点击"从飞书导入"按钮
2. 填写 User Key
3. 点击"保存并测试"
4. 选择项目
5. 选择任务
6. 导入完成

## 生产环境解决方案（进行中）

### 方案1：CloudBase云接入网关（推荐）

1. 登录 [CloudBase控制台](https://console.cloud.tencent.com/tcb)
2. 进入环境 `xiaomi-4g92opdf60df693e`
3. 左侧菜单：云接入 → HTTP访问服务
4. 找到 `feishu-proxy` 函数
5. 配置CORS：
   - 允许的域名：`https://xiaomi-4g92opdf60df693e-1314072882.tcloudbaseapp.com`
   - 允许的方法：`GET, POST, OPTIONS`
   - 允许的头：`Content-Type, Authorization, X-User-Key, X-Plugin-Token`

### 方案2：使用独立后端服务器

部署 `api/feishu-proxy-server.cjs` 到：
- Vercel Serverless Functions
- AWS Lambda
- 阿里云函数计算
- 或任何Node.js服务器

### 方案3：飞书应用域名配置

如果你的飞书应用有管理员权限：
1. 登录飞书开发者后台
2. 进入应用设置
3. 添加可信域名：`xiaomi-4g92opdf60df693e-1314072882.tcloudbaseapp.com`

## 文件清单

**已创建的文件：**
- ✅ `api/feishu-proxy-server.cjs` - 本地代理服务器
- ✅ `cloudbase-functions/feishu-proxy/` - 云函数代码
- ✅ `src/services/feishu/` - 飞书API客户端
- ✅ `src/components/FeishuImportModal.tsx` - 导入UI组件

**配置文件：**
- ✅ `cloudbaserc.json` - CloudBase部署配置
- ✅ `vite.config.ts` - Vite代理配置
- ✅ `.env.local` - 环境变量

## 后续计划

1. [ ] 配置CloudBase云接入网关CORS
2. [ ] 测试生产环境飞书导入功能
3. [ ] 编写自动化测试
4. [ ] 添加错误处理和重试机制

## 技术支持

如有问题，请查看：
- [飞书集成完整指南](./README.md)
- [本地开发快速开始](./QUICK_START_AUTO_TOKEN.md)
- [CloudBase云函数文档](https://docs.cloudbase.net/cloud-function/introduction.html)

---
**更新时间**: 2025-11-14
**状态**: 🔧 进行中
