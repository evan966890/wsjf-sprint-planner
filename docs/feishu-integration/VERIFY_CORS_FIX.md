# 验证飞书CORS修复指南

**更新时间**: 2025-11-14
**云函数已部署**: ✅ 是
**下一步**: 验证CORS是否生效

---

## 📋 验证步骤

### 第一步：等待部署生效（1-2分钟）

刚刚部署的云函数需要时间生效：
- CloudBase CDN缓存刷新
- 云函数实例更新
- 配置同步

**建议**: 等待2分钟后再测试

---

### 第二步：清除浏览器缓存

**重要**：浏览器可能缓存了旧的CORS策略！

#### 方法1：强制刷新（推荐）
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

#### 方法2：清除缓存
1. 打开开发者工具（F12）
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"

#### 方法3：隐身模式
```
Windows: Ctrl + Shift + N
Mac: Cmd + Shift + N
```

---

### 第三步：测试飞书导入

1. 访问：https://xiaomi-4g92opdf60df693e-1314072882.tcloudbaseapp.com/
2. 点击"从飞书导入"按钮
3. 填写User Key（如果已保存会自动填入）
4. 点击"保存并测试"

**预期结果**：
- ✅ 进入步骤2"选择空间"
- ✅ 能看到飞书项目列表
- ✅ 浏览器控制台无CORS错误

---

### 第四步：检查Network请求

打开开发者工具（F12）→ Network 标签页：

#### 查找OPTIONS请求
```
Request URL: https://xiaomi-4g92opdf60df693e-1314072882.service.tcloudbase.com/feishu-api/plugin-token
Request Method: OPTIONS
```

**期望的响应头**：
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,X-User-Key,X-Plugin-Token
```

#### 查找POST请求
```
Request URL: https://xiaomi-4g92opdf60df693e-1314072882.service.tcloudbase.com/feishu-api/plugin-token
Request Method: POST
```

**期望的响应头**：
```
Access-Control-Allow-Origin: *
Content-Type: application/json
```

---

## 🐛 如果仍然失败

### 场景1：OPTIONS返回404

**原因**: 云函数没有正确处理OPTIONS方法

**解决**:
```bash
# 检查云函数代码
cat cloudbase-functions/feishu-proxy/index.js | grep -A 10 "OPTIONS"

# 应该看到第18-28行的OPTIONS处理代码
```

### 场景2：响应缺少CORS头

**原因**: 云函数代码有问题或部署失败

**解决**:
1. 检查CloudBase控制台的云函数日志
2. 重新部署：`npm run deploy:tencent`

### 场景3：仍然显示CORS错误

**可能原因**:
1. **浏览器缓存**: 清除所有缓存（不只是硬性刷新）
2. **CDN缓存**: 腾讯云CDN可能缓存了旧的CORS策略
3. **时间延迟**: 刚部署，还没完全生效

**解决**:
```bash
# 方法1: 等待5-10分钟后重试

# 方法2: 使用curl测试云函数
curl -X OPTIONS \
  -H "Origin: https://xiaomi-4g92opdf60df693e-1314072882.tcloudbaseapp.com" \
  https://xiaomi-4g92opdf60df693e-1314072882.service.tcloudbase.com/feishu-api/plugin-token \
  -i

# 期望看到CORS头
```

---

## 💡 临时解决方案

如果等待后仍然不行，使用本地开发环境：

### 启动本地完整环境

```bash
# 在项目目录下
npm run dev:full
```

这会启动：
- 前端：http://localhost:3000
- 飞书代理：http://localhost:8787

在本地环境中，飞书导入功能**完全可用**，无CORS问题。

---

## 📊 验证结果记录

测试完成后，请记录：

| 项目 | 结果 | 备注 |
|------|------|------|
| 强制刷新后 | ✅/❌ | |
| 隐身模式测试 | ✅/❌ | |
| OPTIONS请求 | ✅/❌ | 是否有CORS头 |
| POST请求 | ✅/❌ | 是否有CORS头 |
| 项目列表显示 | ✅/❌ | |

---

## 🔍 调试技巧

### 查看详细的CORS错误

在浏览器控制台（Console）中，CORS错误会显示具体缺少哪个头：

```
Access to fetch at 'xxx' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

或

```
Access to fetch at 'xxx' has been blocked by CORS policy:
The 'Access-Control-Allow-Origin' header has a value 'xxx' that is not equal to the supplied origin.
```

### 检查云函数日志

1. CloudBase控制台 → 云函数 → feishu-proxy → 日志查询
2. 查找最近的请求日志
3. 确认云函数被调用且返回了正确的响应

---

## ✅ 成功标准

CORS问题完全解决的标准：

- ✅ 点击"从飞书导入"后进入项目选择步骤
- ✅ 能看到飞书项目列表
- ✅ 浏览器控制台无CORS错误
- ✅ Network中的OPTIONS和POST请求都有CORS头
- ✅ 可以成功导入飞书需求

---

## 🕐 预计时间线

- **立即**: 云函数已部署
- **1-2分钟**: CDN缓存刷新
- **5分钟内**: 应该完全生效

**建议**: 2分钟后，强制刷新浏览器（Ctrl+Shift+R），然后重新测试。

---

**下一步**:
1. 等待2分钟
2. 强制刷新浏览器
3. 重新测试飞书导入
4. 如果成功，我们就解决了！
5. 如果失败，请截图Network请求，我继续帮你排查
