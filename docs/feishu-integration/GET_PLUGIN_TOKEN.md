# 如何获取飞书项目插件Token

## 🎯 为什么需要Plugin Token？

由于您的应用是**飞书项目插件**（不是标准网页应用），它使用飞书项目的专用认证方式：
- ✅ **plugin_token** - 插件身份凭证
- ✅ **虚拟plugin_token** - 开发调试专用（⭐ 我们用这个）

**好消息**：虚拟token立即生效，无需发布，非常适合开发和测试！

---

## ⚡ 获取虚拟Plugin Token（3分钟）

### 方法1：在权限管理页面获取

根据飞书官方文档，虚拟plugin_token可以在权限管理页面获取：

1. **进入您的插件页面**
   - 打开 https://open.feishu.cn
   - 进入"WSJF-Lite"插件

2. **点击左侧"权限管理"**
   - 这是您第3张截图显示的页面

3. **查找虚拟Token或测试Token**
   - 在权限页面应该有"虚拟plugin_token"或"开发调试Token"
   - 可能在页面顶部或右侧
   - 可能有一个"查看Token"或"获取测试Token"按钮

4. **复制Token**
   - Token格式通常是：`p-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - 复制完整的token字符串

### 方法2：通过开发者文档查找

1. **点击"开发者文档"链接**
   - 在您的第2张截图中，有"开发者文档"部分
   - 点击"Token - 权限的使用说明"旁边的"前往查看"

2. **查看Token获取说明**
   - 文档中会说明如何获取虚拟token
   - 可能有一个"复制虚拟token"的按钮

### 方法3：使用API接口获取（编程方式）

如果上述方法都找不到，可以通过API获取：

```bash
curl --location --request POST 'https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal' \
--header 'Content-Type: application/json' \
--data-raw '{
  "app_id": "MII_68F1064FA240006C",
  "app_secret": "050E0E049ACB87339CB9D11E5641564F"
}'
```

响应中的 `app_access_token` 就是您需要的token。

---

## 📸 在飞书开放平台应该看到什么

### 权限管理页面可能的位置：

```
权限管理页面
├── 权限列表（您已经看到）
├── 开发调试区域
│   ├── 虚拟plugin_token: p-xxxx-xxxx-xxxx-xxxx  [复制]
│   └── 说明：用于开发调试，勾选权限后即时生效
└── 接口使用说明
```

### 如果找不到虚拟token显示

有些飞书项目插件界面可能不直接显示token，而是需要：

1. **先勾选需要的权限** （您已经做了）
2. **使用API获取token** （上面的curl命令）
3. **或者在开发工具中查看** （浏览器F12看network请求）

---

## 🔍 排查方法

### 方法A: 查看网络请求

1. 打开飞书项目（https://project.feishu.cn 或 https://project.f.mioffice.cn）
2. 按F12打开开发者工具
3. 切换到Network标签
4. 刷新页面或进行任何操作
5. 查找API请求的Header中是否有 `X-Plugin-Token`
6. 如果找到了，复制该token值

### 方法B: 使用Postman/Apifox测试

1. 使用上面的curl命令获取app_access_token
2. 在WSJF中输入这个token
3. 勾选"使用飞书项目插件Header"
4. 测试是否能获取项目列表

---

## 🚀 在WSJF中如何使用

获取到token后：

1. **在WSJF点击"从飞书导入"**
2. **选择"手动Token（推荐）"**
3. **填写信息**：
   - Plugin ID: `MII_68F1064FA240006C`
   - Plugin Secret: `050E0E049ACB87339CB9D11E5641564F`
   - Plugin Token: `p-xxxx-xxxx-xxxx-xxxx`（粘贴您获取的token）
   - ✅ 勾选"使用飞书项目插件Header"

4. **点击"保存并测试"**
5. **应该能看到项目列表了！**

---

## 💡 快速验证方法（使用API）

如果您想立即获取token进行测试，可以使用以下命令：

### Windows PowerShell:
```powershell
$body = @{
    app_id = "MII_68F1064FA240006C"
    app_secret = "050E0E049ACB87339CB9D11E5641564F"
} | ConvertTo-Json

$response = Invoke-RestMethod -Method Post -Uri "https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal" -Body $body -ContentType "application/json"

Write-Host "Token: $($response.app_access_token)"
```

### Windows CMD (使用curl):
```cmd
curl -X POST "https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal" ^
-H "Content-Type: application/json" ^
-d "{\"app_id\":\"MII_68F1064FA240006C\",\"app_secret\":\"050E0E049ACB87339CB9D11E5641564F\"}"
```

响应示例：
```json
{
  "code": 0,
  "msg": "success",
  "tenant_access_token": "t-xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "expire": 7200
}
```

复制 `tenant_access_token` 的值，在WSJF中使用！

---

## ⚠️ Token有效期

- **虚拟token**: 通常2小时有效期
- **过期后**: 需要重新获取
- **自动刷新**: 暂不支持（手动模式）

---

## 📞 还是找不到？

如果您尝试了所有方法都找不到虚拟token：

1. **截图您的权限管理页面全屏**（包括右侧所有内容）
2. **使用上面的PowerShell/CMD命令获取token**
3. **把获取到的token直接用于WSJF**

**使用API获取的token是最可靠的方法！** ✅

---

## 🎉 预期结果

成功配置后：
- ✅ 点击"保存并测试" → 显示"Token已保存"
- ✅ 自动进入"选择项目"步骤
- ✅ 点击"刷新列表" → 看到您的飞书项目
- ✅ 选择项目 → 看到任务列表
- ✅ 导入成功！

---

**建议：先用PowerShell命令快速获取token，立即测试功能！** 🚀
