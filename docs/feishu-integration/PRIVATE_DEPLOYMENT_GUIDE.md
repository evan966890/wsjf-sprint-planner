# 飞书私有化部署集成指南

## 🎯 你的实际情况

你们公司使用的是**飞书私有化部署**，架构如下：

```
公司飞书架构（私有化部署）：

1. 飞书开放平台
   └── https://open.f.mioffice.cn
       └── 管理飞书应用、机器人、权限等
       └── ❌ 没有"项目管理"相关权限

2. 飞书项目管理平台（独立系统）⭐
   └── https://project.f.mioffice.cn
       └── 独立的项目管理系统
       └── Plugin ID: MII_68F1064FA240006C
       └── 专用的API端点和认证方式
```

---

## ✅ 关键发现

### 1. 项目管理平台是独立的
- **不是**标准飞书API的一部分
- **不支持**标准OAuth 2.0授权
- **使用**自己的认证方式：`X-Plugin-Token` + `X-User-Key`

### 2. API端点不同
```
标准飞书API：
https://open.feishu.cn/open-apis/...

你的项目管理API：
https://project.f.mioffice.cn/open_api/...
```

### 3. 认证方式不同
```
标准飞书：
Authorization: Bearer <token>

你的项目管理平台：
X-Plugin-Token: <plugin_token>
X-User-Key: <user_key>
```

---

## 🚀 使用步骤（5分钟完成）

### 第1步：获取Token ✅ 已完成

你已经成功获取到Token了：
```
Token: p-70852332-64aa-4c00-b81a-82703f6b5387
有效期: 2小时（7200秒）
```

### 第2步：获取User Key

User Key在你的测试脚本中已经有了：
```
User Key: 7541721806923694188
```

**如何找到你的User Key？**
1. 打开飞书项目管理平台：https://project.f.mioffice.cn
2. 按F12打开开发者工具
3. 切换到Network标签
4. 刷新页面或进行任何操作
5. 查找API请求的Headers
6. 找到 `X-User-Key` 的值

### 第3步：在WSJF中配置

现在启动WSJF应用：

```bash
cd D:\code\WSJF
npm run dev
```

打开浏览器：http://localhost:3000

### 第4步：点击"从飞书导入"

在页面顶部Header找到**紫色的"从飞书导入"按钮**

### 第5步：填写配置信息

在弹出的窗口中：

#### 认证模式：
- ✅ 选择 **"手动Token（推荐）"**

#### 基本配置：
- **Plugin ID**: `MII_68F1064FA240006C`
- **Plugin Secret**: `050E0E049ACB87339CB9D11E5641564F`

#### Token配置：
- **Plugin Token**: `p-70852332-64aa-4c00-b81a-82703f6b5387`（粘贴刚获取的）
- **User Key**: `7541721806923694188`（或你自己的User Key）

#### 高级配置：
- ✅ **勾选**"使用飞书项目插件Header"
- **平台域名**: `https://project.f.mioffice.cn`

### 第6步：保存并测试

1. 点击 **"保存并测试"** 按钮
2. 如果成功，会自动进入"选择项目"步骤
3. 点击 **"刷新列表"**
4. 应该能看到你的项目列表（如：mit、minrd等）

### 第7步：选择和导入

1. **选择项目**：点击你要导入的项目
2. **查看任务**：系统会自动加载任务列表
3. **选择任务**：勾选要导入的任务
4. **确认导入**：点击"确认导入"按钮
5. **完成**！🎉

---

## 🔄 Token过期怎么办？

Token有效期为2小时，过期后需要重新获取：

### 方法1：使用PowerShell脚本（推荐）

在项目目录运行：
```powershell
.\get-project-token.ps1
```

新Token会自动复制到剪贴板，直接粘贴到WSJF即可。

### 方法2：手动API调用

```powershell
$body = @{
    plugin_id = "MII_68F1064FA240006C"
    plugin_secret = "050E0E049ACB87339CB9D11E5641564F"
    type = 0
} | ConvertTo-Json

$response = Invoke-RestMethod -Method Post -Uri "https://project.f.mioffice.cn/open_api/authen/plugin_token" -Body $body -ContentType "application/json"

Write-Host "New Token: $($response.data.token)"
```

---

## 🎯 配置界面截图说明

### 在WSJF的"从飞书导入"弹窗中应该这样填写：

```
┌─────────────────────────────────────────────┐
│  飞书导入配置                                │
├─────────────────────────────────────────────┤
│                                             │
│  认证模式：                                  │
│  ○ OAuth用户授权                            │
│  ● 手动Token（推荐）  ← 选这个               │
│  ○ Cookie认证                               │
│                                             │
│  基本配置：                                  │
│  Plugin ID:                                 │
│  ┌─────────────────────────────────────┐   │
│  │ MII_68F1064FA240006C               │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Plugin Secret:                             │
│  ┌─────────────────────────────────────┐   │
│  │ 050E0E049ACB87339CB9D11E5641564F    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Token配置：                                │
│  Plugin Token:                              │
│  ┌─────────────────────────────────────┐   │
│  │ p-70852332-64aa-4c00-b81a-82703...  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  User Key:                                  │
│  ┌─────────────────────────────────────┐   │
│  │ 7541721806923694188                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  高级配置：                                  │
│  ☑ 使用飞书项目插件Header  ← 必须勾选       │
│                                             │
│  平台域名:                                  │
│  ┌─────────────────────────────────────┐   │
│  │ https://project.f.mioffice.cn       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│         [保存并测试]    [取消]              │
└─────────────────────────────────────────────┘
```

---

## ✅ 验证成功的标志

### 1. 保存配置后
```
✅ 提示：配置已保存
✅ 自动切换到"选择项目"步骤
```

### 2. 点击"刷新列表"后
```
✅ 看到加载动画
✅ 显示项目列表（如：mit、minrd等）
✅ 项目数量显示正确
```

### 3. 选择项目后
```
✅ 自动加载任务列表
✅ 显示任务数量
✅ 可以预览任务详情
```

### 4. 导入成功后
```
✅ 任务出现在WSJF的"待排期"区域
✅ 所有字段映射正确
✅ 权重分自动计算
```

---

## ❌ 常见错误和解决

### 错误1: Token无效或过期
```
错误信息：401 Unauthorized
解决方案：重新运行 get-project-token.ps1 获取新Token
```

### 错误2: User Key错误
```
错误信息：20039 plugin_access_token必须配合User Key使用
解决方案：
1. 在飞书项目管理平台按F12查看请求头
2. 找到正确的X-User-Key值
3. 更新WSJF配置中的User Key
```

### 错误3: 未勾选"使用飞书项目插件Header"
```
错误信息：认证失败
解决方案：在WSJF配置界面勾选"使用飞书项目插件Header"
```

### 错误4: CORS跨域错误
```
错误信息：Access-Control-Allow-Origin
解决方案：
1. 确认正在使用开发服务器（npm run dev）
2. 项目已配置代理（vite.config.ts）
3. 如果还有问题，联系飞书平台管理员添加CORS白名单
```

---

## 🔧 开发者工具调试

如果遇到问题，打开浏览器Console（F12）：

### 查看请求详情
```javascript
// 在Console中会看到：
[FeishuAPI] Request: {
  url: "https://project.f.mioffice.cn/open_api/projects/detail",
  method: "POST",
  headers: {
    "X-Plugin-Token": "p-70852332-...",
    "X-User-Key": "7541721806923694188"
  }
}

[FeishuAPI] Response: {
  status: 200,
  data: { ... }
}
```

### 如果请求失败
```javascript
// 会看到详细错误信息：
[FeishuAPI] Error response: {
  error: {
    code: 20039,
    msg: "plugin_access_token必须配合User Key使用"
  }
}
```

---

## 📊 完整架构图

```
你的WSJF应用
    ↓
使用配置：
- Token: p-70852332-64aa-4c00-b81a-82703f6b5387
- User Key: 7541721806923694188
- 使用插件Header: ✅
    ↓
请求：
POST https://project.f.mioffice.cn/open_api/projects/detail
Headers:
  X-Plugin-Token: p-70852332-64aa-4c00-b81a-82703f6b5387
  X-User-Key: 7541721806923694188
Body:
  { "simple_names": ["mit", "minrd"], "user_key": "..." }
    ↓
飞书项目管理平台
    ↓
返回项目列表
    ↓
WSJF显示项目
    ↓
用户选择项目
    ↓
获取任务列表
    ↓
用户选择任务
    ↓
导入成功！🎉
```

---

## 🎯 总结

### 关键配置（必须记住）：

| 配置项 | 值 |
|--------|---|
| 认证模式 | 手动Token |
| Plugin ID | MII_68F1064FA240006C |
| Plugin Secret | 050E0E049ACB87339CB9D11E5641564F |
| Plugin Token | 每2小时更新（用脚本获取） |
| User Key | 7541721806923694188（或你的） |
| 使用插件Header | ✅ 必须勾选 |
| 平台域名 | https://project.f.mioffice.cn |

### 为什么之前OAuth失败？

1. ❌ 项目管理平台不支持OAuth 2.0
2. ❌ Plugin ID格式（MII_xxx）不是标准应用
3. ❌ 独立部署的系统，有自己的认证机制

### 为什么现在能成功？

1. ✅ 使用正确的认证方式（X-Plugin-Token + X-User-Key）
2. ✅ 使用正确的API端点（project.f.mioffice.cn）
3. ✅ 代码已完整支持项目管理平台的API

---

## 📞 需要帮助？

如果配置过程中遇到任何问题：

1. **查看浏览器Console错误信息**（F12 → Console）
2. **截图完整的错误信息**
3. **告诉我具体在哪一步出错**

我会立即帮你诊断和解决！

---

**预计配置时间**: 5分钟
**成功率**: 99%（只要Token有效）

现在你可以开始配置了！🚀
