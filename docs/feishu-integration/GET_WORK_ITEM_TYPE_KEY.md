# 如何获取Work Item Type Key

## 🎯 问题说明

飞书项目管理平台的API需要**work_item_type_key**参数，这是一个类似 `6337b4e95f9672378dda1432` 的ID值，不是"story"这样的名称。

---

## 📋 获取步骤（5分钟）

### 方法1：通过浏览器开发者工具（推荐）

1. **打开飞书项目管理平台**
   - 访问：https://project.f.mioffice.cn
   - 登录你的账号

2. **进入MIT项目**
   - 点击MIT项目

3. **打开开发者工具**
   - 按**F12**键
   - 切换到**Network**标签

4. **筛选XHR请求**
   - 在Network面板顶部，点击**XHR**按钮筛选

5. **触发工作项加载**
   - 在飞书界面点击**"需求"**或**"story"**菜单
   - 或者刷新页面

6. **查找filter请求**
   - 在Network列表中找到包含 `work_item/filter` 的请求
   - 点击该请求

7. **查看请求详情**
   - 切换到**Payload**或**Request**标签
   - 找到 `work_item_type_key` 字段
   - **复制这个key的值**（类似：6337b4e95f9672378dda1432）

### 方法2：使用PowerShell脚本获取（备选）

如果方法1找不到，可以尝试用你的token直接调用API：

```powershell
# 运行这个脚本获取work_item_type_key
$token = "你的token"  # 运行 get-project-token.ps1 获取
$userKey = "7541721806923694188"
$projectKey = "632d4f29aa4481312c2ab170"  # MIT项目的key

$headers = @{
    "X-Plugin-Token" = $token
    "X-User-Key" = $userKey
    "Content-Type" = "application/json"
}

# 获取工作项类型列表
$url = "https://project.f.mioffice.cn/open_api/$projectKey/work_item/types"
$response = Invoke-RestMethod -Method Get -Uri $url -Headers $headers

# 显示所有类型
$response.data | ForEach-Object {
    Write-Host "类型名称: $($_.name)"
    Write-Host "Type Key: $($_.work_item_type_key)"
    Write-Host "---"
}
```

---

## 📸 示例截图说明

在Network面板中，你应该看到类似这样的请求：

```
POST /open_api/632d4f29aa4481312c2ab170/work_item/filter

Request Payload:
{
  "page_size": 100,
  "page_num": 1,
  "work_item_type_key": "6337b4e95f9672378dda1432"  ← 复制这个值
}
```

---

## ✅ 获取到key后怎么做？

1. **复制work_item_type_key的值**（例如：6337b4e95f9672378dda1432）

2. **在WSJF中配置**：
   - 打开"从飞书导入"
   - 在"工作项类型名称"字段粘贴这个key
   - 点击"保存并测试"

3. **测试**：
   - 点击"刷新列表"
   - 点击MIT项目
   - 应该能看到需求列表了！

---

## 🎯 为什么需要这个key？

- ❌ 类型名称"story"：人类可读，但API不接受
- ✅ 类型key"6337b4e95f9672378dda1432"：系统内部ID，API需要这个

就像：
- 用户名：Evan Tian（人类可读）
- 用户ID：7541721806923694188（系统需要）

---

## 💡 未来改进

理想情况下，应该能：
1. 调用 `/open_api/:project_key/work_item/types` 获取类型列表
2. 从中找到name=story的类型
3. 提取它的work_item_type_key

但目前这个API返回500错误，所以只能手动获取。

---

## 📞 需要帮助？

如果你在Network面板找不到这个请求：

1. **截图你的Network面板**
2. **告诉我你点击了什么操作**
3. **我会帮你找到正确的请求**

---

**预计耗时**：5分钟
**难度**：⭐⭐☆☆☆

获取到key后，立即就能成功导入需求了！🚀
