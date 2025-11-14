# CloudBase云函数CORS配置指南（2025最新）

**更新时间**: 2025-11-14
**适用版本**: CloudBase 2025新版控制台
**问题**: 飞书代理云函数CORS跨域限制
**状态**: 🔧 需要配置

---

## 📋 问题描述

CloudBase云函数 `feishu-proxy` 已部署，但返回的HTTP响应缺少CORS头，导致浏览器阻止请求：

```
Access to fetch at 'https://xiaomi-4g92opdf60df693e-1314072882.service.tcloudbase.com/feishu-api/plugin-token'
from origin 'https://xiaomi-4g92opdf60df693e-1314072882.tcloudbaseapp.com'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

---

## ✅ 解决方案：修改云函数代码（当前最佳方案）

由于腾讯云新版界面调整，HTTP访问服务的CORS配置入口已变化。**最直接的方法是在云函数代码中添加CORS响应头。**

### 第一步：修改云函数代码

**文件**: `cloudbase-functions/feishu-proxy/index.js`

确保每个HTTP响应都包含完整的CORS头：

```javascript
// OPTIONS预检请求处理（第17-28行）
if (event.httpMethod === 'OPTIONS') {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://xiaomi-4g92opdf60df693e-1314072882.tcloudbaseapp.com',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-User-Key,X-Plugin-Token',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
    body: '',
  };
}

// 正常请求响应（所有return语句都要加）
return {
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://xiaomi-4g92opdf60df693e-1314072882.tcloudbaseapp.com',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-User-Key,X-Plugin-Token',
    'Access-Control-Allow-Credentials': 'true',
  },
  body: JSON.stringify(result),
};
```

### 第二步：重新部署云函数

```bash
cloudbase framework deploy
```

### 第三步：验证CORS

1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 访问应用并点击"从飞书导入"
4. 检查请求响应头中是否包含：
   ```
   Access-Control-Allow-Origin: https://xiaomi-4g92opdf60df693e-1314072882.tcloudbaseapp.com
   ```

---

## 🔍 如何检查当前云函数代码

### 方法1：通过CloudBase控制台

1. 登录：https://console.cloud.tencent.com/tcb/scf/index
2. 找到环境：`xiaomi-4g92opdf60df693e`
3. 点击函数：`feishu-proxy`
4. 查看"函数代码"标签
5. 检查是否包含完整的CORS头

### 方法2：查看本地代码

```bash
# 检查本地云函数代码
cat cloudbase-functions/feishu-proxy/index.js | grep -A 10 "Access-Control-Allow-Origin"
```

---

## 🔄 替代方案：使用本地代理（开发环境）

如果生产环境CORS配置复杂，可以暂时使用本地代理：

### 启动本地代理服务器

```bash
npm run dev:full
```

这会同时启动：
- 前端开发服务器：http://localhost:3000
- 飞书代理服务器：http://localhost:8787

在本地环境中，飞书导入功能完全可用（无CORS问题）。

---

## ⚠️ 腾讯云2025界面变化说明

### 已废弃的方法

1. **API网关独立服务**（2024年停止售卖新实例）
   - 原文档中的"方案3"已不可用
   - 现有实例仍可使用，但新用户无法创建

2. **云接入的CORS配置UI**
   - 新版控制台的"HTTP访问服务"界面已简化
   - CORS配置选项可能已移除或调整位置

### 当前推荐方案

✅ **在云函数代码中直接添加CORS响应头**
- 优点：完全可控，不依赖平台UI
- 缺点：每次修改需要重新部署
- 适用：所有场景

---

## 📝 快速检查清单

配置CORS前，请确认：

- [ ] 云函数 `feishu-proxy` 已部署
- [ ] 云函数可以正常访问（不考虑CORS）
- [ ] 前端代码中的飞书代理URL正确
- [ ] 本地有 `cloudbase-functions/feishu-proxy/index.js` 文件

配置CORS后，请验证：

- [ ] OPTIONS请求返回200
- [ ] 响应头包含 `Access-Control-Allow-Origin`
- [ ] 响应头包含 `Access-Control-Allow-Methods`
- [ ] 响应头包含 `Access-Control-Allow-Headers`
- [ ] 浏览器控制台无CORS错误
- [ ] 飞书导入功能正常工作

---

## 💡 生产环境安全建议

当前配置使用具体域名：
```javascript
'Access-Control-Allow-Origin': 'https://xiaomi-4g92opdf60df693e-1314072882.tcloudbaseapp.com'
```

**不要使用**：
```javascript
'Access-Control-Allow-Origin': '*'  // ❌ 不安全
```

**原因**：
- `*` 允许任何网站访问你的云函数
- 可能被恶意网站利用
- 违反安全最佳实践

---

## 🆘 如果仍然遇到问题

### 1. 检查云函数日志

CloudBase控制台 → 云函数 → feishu-proxy → 日志查询

### 2. 联系支持

- 腾讯云工单：https://console.cloud.tencent.com/workorder
- CloudBase文档：https://docs.cloudbase.net/

### 3. 使用本地环境

```bash
npm run dev:full
```

本地环境完全可用，可以继续开发和测试。

---

**下一步**: 检查 `cloudbase-functions/feishu-proxy/index.js` 是否存在，并确认CORS头配置
