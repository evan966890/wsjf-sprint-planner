# CloudBase云函数CORS配置指南

**更新时间**: 2025-11-14
**问题**: 飞书代理云函数CORS跨域限制
**影响**: 生产环境飞书导入功能暂时不可用
**解决时间**: 预计30分钟

---

## 问题描述

CloudBase云函数 `feishu-proxy` 已部署，但返回的HTTP响应缺少CORS头，导致浏览器阻止请求：

```
Access to fetch at 'https://xiaomi-4g92opdf60df693e-1314072882.service.tcloudbase.com/feishu-api/plugin-token'
from origin 'https://xiaomi-4g92opdf60df693e-1314072882.tcloudbaseapp.com'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

---

## 解决方案1：云接入配置（推荐，最快）

### 步骤1：登录CloudBase控制台

访问：https://console.cloud.tencent.com/tcb/env/overview?envId=xiaomi-4g92opdf60df693e

### 步骤2：进入云接入设置

1. 左侧菜单：**云接入** → **HTTP访问服务**
2. 找到函数：`feishu-proxy`
3. 点击右侧的"配置"或"编辑"

### 步骤3：配置CORS

在HTTP触发器设置中：

**允许的源（Origin）**：
```
https://xiaomi-4g92opdf60df693e-1314072882.tcloudbaseapp.com
```

**允许的方法（Methods）**：
```
GET, POST, OPTIONS, PUT, DELETE
```

**允许的头（Headers）**：
```
Content-Type, Authorization, X-User-Key, X-Plugin-Token
```

**允许携带凭证（Credentials）**：
```
是
```

**预检请求缓存时间（Max-Age）**：
```
86400
```

### 步骤4：保存并测试

1. 点击"保存"
2. 等待配置生效（1-2分钟）
3. 刷新WSJF应用页面（Ctrl+F5）
4. 测试飞书导入功能

---

## 解决方案2：修改云函数代码（备选）

如果方案1不可用，修改云函数返回头：

### 文件：cloudbase-functions/feishu-proxy/index.js

确保每个返回都包含CORS头：

```javascript
return {
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',  // 生产环境应改为具体域名
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-User-Key,X-Plugin-Token',
    'Access-Control-Allow-Credentials': 'true'
  },
  body: JSON.stringify(data)
};
```

### 重新部署

```bash
cloudbase framework deploy
```

---

## 解决方案3：使用API网关（最佳实践）

### 步骤1：创建API网关

1. 访问 [API网关控制台](https://console.cloud.tencent.com/apigateway)
2. 创建新服务：`wsjf-feishu-proxy`
3. 区域选择：上海（与CloudBase环境一致）

### 步骤2：创建API

1. 点击"新建API"
2. 配置：
   - 前端配置：
     - 协议：HTTPS
     - 路径：`/feishu-api/{proxy+}`
     - 方法：ANY
   - 后端配置：
     - 类型：云函数SCF
     - 选择：`feishu-proxy`

### 步骤3：配置CORS

在API编辑页面：
1. 开启CORS
2. Access-Control-Allow-Origin: `https://xiaomi-4g92opdf60df693e-1314072882.tcloudbaseapp.com`
3. Access-Control-Allow-Methods: `*`
4. Access-Control-Allow-Headers: `*`

### 步骤4：发布服务

1. 发布到"release"环境
2. 获取访问域名（如：`service-xxx.gz.apigw.tencentcs.com`）
3. 更新 `.env.local`:
   ```
   VITE_FEISHU_PROXY_URL=https://service-xxx.gz.apigw.tencentcs.com/release/feishu-api
   ```
4. 重新部署前端

---

## 验证步骤

### 1. 检查OPTIONS请求

打开浏览器开发者工具 → Network：

```http
OPTIONS /feishu-api/plugin-token HTTP/1.1
Host: xiaomi-4g92opdf60df693e-1314072882.service.tcloudbase.com

HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://xiaomi-4g92opdf60df693e-1314072882.tcloudbaseapp.com
Access-Control-Allow-Methods: GET,POST,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization
```

### 2. 测试POST请求

```http
POST /feishu-api/plugin-token HTTP/1.1
Content-Type: application/json

{
  "plugin_id": "xxx",
  "plugin_secret": "xxx"
}

HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://xiaomi-4g92opdf60df693e-1314072882.tcloudbaseapp.com
Content-Type: application/json

{
  "code": 0,
  "data": { "access_token": "..." }
}
```

### 3. 端到端测试

1. 访问：https://xiaomi-4g92opdf60df693e-1314072882.tcloudbaseapp.com/
2. 登录应用
3. 点击"从飞书导入"
4. 填写User Key
5. 点击"保存并测试"
6. **预期结果**：成功进入项目选择步骤，显示项目列表

---

## 常见问题

### Q1: OPTIONS预检请求返回404

**原因**：云函数没有处理OPTIONS方法

**解决**：检查 `cloudbase-functions/feishu-proxy/index.js` 第17-28行的OPTIONS处理代码

### Q2: CORS头存在但仍然报错

**原因**：
1. Origin不匹配（严格匹配，包括协议和端口）
2. 浏览器缓存了旧的CORS策略

**解决**：
1. 清除浏览器缓存（Ctrl+Shift+Delete）
2. 使用隐私模式测试
3. 检查Origin是否精确匹配

### Q3: 云函数无法访问

**原因**：云函数未开启HTTP触发器

**解决**：
1. 进入CloudBase控制台
2. 云函数 → feishu-proxy → 触发器
3. 添加HTTP触发器

---

## 临时解决方案

在CORS配置完成前，使用本地开发模式：

```bash
# 启动完整开发环境
npm run dev:full

# 访问
http://localhost:3000

# 飞书导入功能完全可用
```

---

## 相关文档

- [CloudBase云函数文档](https://docs.cloudbase.net/cloud-function/introduction.html)
- [HTTP访问服务](https://docs.cloudbase.net/cloud-function/http.html)
- [CORS配置指南](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [飞书集成生产部署](./PRODUCTION_DEPLOYMENT.md)

---

## 预期成果

配置完成后：
- ✅ 生产环境飞书导入完全可用
- ✅ 无CORS错误
- ✅ 用户可以直接从飞书导入需求
- ✅ 完整的端到端流程验证

---

**状态**: 🔧 待配置
**优先级**: 🔴 高
**预计完成**: 2025-11-15
