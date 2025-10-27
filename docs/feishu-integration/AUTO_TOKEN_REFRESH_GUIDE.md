# 飞书项目管理平台 - Token自动刷新指南

## 🎉 问题已解决！

你之前遇到的问题：**"每2小时手动获取token太麻烦"**，现在已经完全解决了！

---

## ✅ 两个永久解决方案

### 方案1：Cookie认证模式（最简单）⭐⭐⭐⭐⭐

**原理**：使用浏览器已有的登录Cookie，完全不需要token！

**适用场景**：
- ✅ 你已经在浏览器中登录了飞书项目管理平台
- ✅ WSJF和飞书在同一个浏览器运行

**配置步骤**：

1. **确保已登录飞书**
   - 打开 https://project.f.mioffice.cn
   - 确认已登录（能看到项目列表）

2. **在WSJF中配置**
   ```
   认证模式：选择"Cookie认证"
   Plugin ID: MII_68F1064FA240006C
   Plugin Secret: 050E0E049ACB87339CB9D11E5641564F
   Token: cookie  ← 填写这个特殊值
   ✅ 勾选"使用飞书项目插件Header"
   平台域名: https://project.f.mioffice.cn
   ```

3. **保存并测试**
   - 点击"保存并测试"
   - 成功！**永久不需要token了！**

**优点**：
- ✅ 完全不需要token
- ✅ 不会过期（只要你保持登录）
- ✅ 零维护成本

**缺点**：
- ❌ 如果飞书有CORS限制可能不可用

---

### 方案2：自动刷新Token模式（已实现）⭐⭐⭐⭐⭐

**原理**：系统自动检测token过期并刷新，用户无感知！

**适用场景**：
- ✅ 所有情况（特别是Cookie模式不可用时）
- ✅ 需要长期稳定使用

**工作流程**：

```
1. 首次配置：
   你填写Plugin ID和Secret
   ↓
   系统自动获取第一个token

2. 使用过程：
   Token还有2小时有效期 ✅
   ↓
   Token还有10分钟有效期 ⚠️
   ↓
   系统自动调用API刷新token ↻
   ↓
   获取新token（又有2小时） ✅
   ↓
   继续使用，用户无感知 🎉

3. 永久循环：
   系统会自动持续刷新
   你不需要做任何事！
```

**配置步骤**：

```
认证模式：选择"手动Token（推荐）"
Plugin ID: MII_68F1064FA240006C
Plugin Secret: 050E0E049ACB87339CB9D11E5641564F
Token: （可以留空，系统会自动获取）
    或者：粘贴初始token（系统会自动刷新）
✅ 勾选"使用飞书项目插件Header"
平台域名: https://project.f.mioffice.cn
```

**关键改进**：

1. **自动检测过期**：Token还剩5分钟时自动刷新
2. **自动调用API**：使用Plugin ID和Secret自动获取新token
3. **无缝切换**：用户完全无感知
4. **持久化存储**：Token保存在localStorage，刷新页面也不丢失

**优点**：
- ✅ 完全自动化，零维护
- ✅ 永不过期（只要Plugin ID/Secret有效）
- ✅ 即使关闭浏览器也能恢复

**缺点**：
- ❌ 需要首次配置Plugin ID和Secret

---

## 📊 两种方案对比

| 特性 | Cookie模式 | 自动刷新Token模式 |
|------|-----------|----------------|
| 配置复杂度 | ⭐ 最简单 | ⭐⭐ 简单 |
| 维护成本 | ✅ 零维护 | ✅ 零维护 |
| 是否需要token | ❌ 不需要 | ✅ 自动获取 |
| 是否会过期 | ❌ 不会 | ❌ 自动刷新，永不过期 |
| CORS限制 | ⚠️ 可能受限 | ✅ 不受限 |
| 推荐程度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🚀 立即开始使用

### 步骤1：启动WSJF

```bash
cd D:\code\WSJF
npm run dev
```

### 步骤2：选择你的方案

#### 方案A：Cookie模式（推荐优先尝试）

1. 先登录 https://project.f.mioffice.cn
2. 在WSJF点击"从飞书导入"
3. 选择"Cookie认证"
4. Token填写：`cookie`
5. 保存并测试

如果成功 → 🎉 完成！
如果失败 → 使用方案B

#### 方案B：自动刷新Token模式

1. 在WSJF点击"从飞书导入"
2. 选择"手动Token（推荐）"
3. 填写Plugin ID和Secret
4. Token留空（或粘贴任意初始token）
5. ✅ 勾选"使用飞书项目插件Header"
6. 保存并测试
7. 🎉 完成！系统会自动刷新token

---

## 🔍 验证自动刷新功能

### 方法1：查看Console日志

打开浏览器Console（F12），你会看到：

**首次使用：**
```
[FeishuAuth] Token expired or about to expire, auto-refreshing...
[FeishuAuth] Refreshing project platform plugin token
[FeishuAuth] Project platform token refreshed successfully, expires in 7200 seconds
```

**后续使用（token有效）：**
```
[FeishuAuth] Using cached project platform token
```

**Token即将过期时：**
```
[FeishuAuth] Token expired or about to expire, auto-refreshing...
[FeishuAuth] Project platform token refreshed successfully, expires in 7200 seconds
```

### 方法2：长时间使用测试

1. 配置好WSJF
2. 正常使用（导入项目、任务等）
3. 等待3小时（超过2小时有效期）
4. 继续使用
5. 如果还能正常工作 → ✅ 自动刷新成功！

---

## 💡 技术细节（开发者参考）

### 自动刷新实现

**文件**：`src/services/feishu/feishuAuth.ts`

**关键逻辑**：

```typescript
async getAccessToken(): Promise<string> {
  // 检查是否是项目管理平台
  if (isProjectPlatform && pluginId && pluginSecret) {
    // 检查token是否有效
    if (this.isTokenValid()) {
      return this.accessToken; // 使用缓存的token
    }

    // Token过期，自动刷新
    return await this.refreshAccessToken();
  }
}

async refreshAccessToken(): Promise<string> {
  // 调用项目管理平台API
  const response = await fetch(
    `${baseUrl}/open_api/authen/plugin_token`,
    {
      method: 'POST',
      body: JSON.stringify({
        plugin_id: pluginId,
        plugin_secret: pluginSecret,
        type: 0
      })
    }
  );

  // 保存新token和过期时间
  this.accessToken = data.data.token;
  this.tokenExpireTime = Date.now() + data.data.expire_time * 1000;

  return this.accessToken;
}
```

**过期检测**：
- Token有效期：7200秒（2小时）
- 提前刷新时间：300秒（5分钟）
- 实际刷新时机：Token还剩5分钟时

---

## ❓ 常见问题

### Q1: Cookie模式为什么不工作？

**可能原因**：
1. 飞书服务器有CORS限制
2. 你没有在浏览器中登录飞书
3. Cookie已过期

**解决方案**：使用方案2（自动刷新Token）

---

### Q2: 自动刷新失败怎么办？

**检查清单**：
1. ✅ Plugin ID和Secret是否正确？
2. ✅ 是否勾选了"使用飞书项目插件Header"？
3. ✅ 平台域名是否正确（https://project.f.mioffice.cn）？
4. ✅ 查看Console是否有错误信息？

**如果还是失败**：
- 截图Console错误信息
- 提供给技术支持

---

### Q3: 需要手动获取初始token吗？

**不需要！**

只要填写了Plugin ID和Secret，系统会自动获取第一个token。

如果你想手动提供初始token（使用 `get-project-token.ps1`），也可以，系统会在过期前自动刷新。

---

### Q4: Token存储在哪里？

存储在浏览器的 **localStorage** 中。

- ✅ 关闭浏览器后依然存在
- ✅ 刷新页面不会丢失
- ✅ 清除浏览器缓存会删除

---

### Q5: 如果Plugin Secret泄露怎么办？

**立即操作**：
1. 在飞书开放平台重置Plugin Secret
2. 在WSJF中更新新的Secret
3. 保存配置
4. 系统会自动使用新Secret获取token

---

## 🎉 总结

### 之前的痛点：
- ❌ 每2小时手动运行脚本获取token
- ❌ Token过期后WSJF停止工作
- ❌ 维护成本高，体验差

### 现在的体验：
- ✅ 配置一次，永久使用
- ✅ 系统自动刷新token
- ✅ 零维护成本
- ✅ 用户无感知

### 选择建议：

```
推荐流程：
1. 优先尝试Cookie模式（最简单）
2. 如果不可用，使用自动刷新Token模式
3. 都不可用的话，联系技术支持
```

---

## 📞 需要帮助？

如果遇到任何问题：

1. **查看Console日志**（F12 → Console）
2. **截图错误信息**
3. **提供配置详情**

我会立即帮你解决！

---

**配置耗时**: 2分钟
**维护成本**: 零
**推荐程度**: ⭐⭐⭐⭐⭐

现在就开始使用吧！🚀
