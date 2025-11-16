# 🔑 获取飞书项目API凭证指南

由于飞书项目API需要CSRF令牌和会话Cookie配合使用，您需要从浏览器获取这些凭证。

## 步骤 1：登录飞书项目

1. 打开浏览器，访问：https://project.f.mioffice.cn/iretail
2. 使用您的账号登录

## 步骤 2：打开开发者工具

1. 按 `F12` 或右键选择"检查"打开开发者工具
2. 切换到 **Network（网络）** 标签
3. 勾选 **Preserve log（保留日志）**

## 步骤 3：进入字段管理页面

访问：https://project.f.mioffice.cn/iretail/setting/workObject/story?menuTab=fieldManagement

## 步骤 4：创建一个测试字段

1. 点击"新建字段"按钮
2. 填写以下信息：
   - 字段名称：测试字段
   - 对接标识：test_field
   - 字段类型：数字
3. 点击"确定"

## 步骤 5：获取凭证

在Network标签中：

1. 找到名为 `field` 的请求（类型为POST）
2. 点击该请求，查看 **Headers（标头）**
3. 记录以下信息：

### A. CSRF Token
在 Request Headers 中找到：
```
x-meego-csrf-token: [复制这个值]
```

### B. Cookie
在 Request Headers 中找到：
```
Cookie: [复制整个cookie字符串]
```

## 步骤 6：更新配置

将获取的凭证更新到 `auth-credentials.json` 文件：

```json
{
  "csrf_token": "您的CSRF令牌",
  "cookie": "您的完整Cookie字符串"
}
```

## 步骤 7：运行自动配置

```bash
node create-fields-with-auth.js
```

---

⚠️ **注意事项**：
- CSRF令牌和Cookie都有有效期，通常为几小时
- 如果创建失败，请重新获取凭证
- 确保您有字段管理权限