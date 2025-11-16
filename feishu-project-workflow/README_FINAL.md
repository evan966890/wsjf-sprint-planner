# 🚀 飞书项目质量指标自动配置工具 - 最终方案

## 📌 当前状态

由于飞书项目API的安全机制，需要以下两个凭证配合使用：
1. **CSRF Token** - 跨站请求伪造防护令牌
2. **Session Cookie** - 会话认证信息

这两个凭证必须从您的浏览器会话中获取。

## ✅ 解决方案

我们已创建了一套完整的工具，可以在您提供凭证后自动创建5个质量指标字段。

## 📝 要创建的字段

1. **Lead Time（交付周期）** - 从需求创建到上线的平均时间（天）
2. **评审一次通过率** - 评审一次通过的比例（%）
3. **并行事项吞吐量** - 团队并行处理的工作项数量
4. **PRD返工率** - 需求文档返工的比例（%）
5. **试点到GA迭代周期** - 从试点到全面推广的迭代次数

## 🔧 使用步骤

### 步骤1：获取凭证

1. **登录飞书项目**
   - 访问：https://project.f.mioffice.cn/iretail
   - 使用您的账号登录

2. **打开开发者工具**
   - 按 `F12` 打开开发者工具
   - 切换到 **Network（网络）** 标签
   - 勾选 **Preserve log（保留日志）**

3. **捕获API请求**
   - 访问字段管理页面：https://project.f.mioffice.cn/iretail/setting/workObject/story?menuTab=fieldManagement
   - 点击"新建字段"，创建一个测试字段
   - 在Network标签中找到 `field` 请求（POST方法）

4. **提取凭证**
   在请求的Headers中找到：
   - `x-meego-csrf-token`: 复制这个值
   - `Cookie`: 复制整个Cookie字符串

### 步骤2：创建凭证文件

在 `D:\code\WSJF\feishu-project-workflow` 目录下创建 `auth-credentials.json`：

```json
{
  "csrf_token": "您的CSRF令牌",
  "cookie": "您的完整Cookie字符串"
}
```

### 步骤3：运行自动配置

双击运行：
```
install-and-run.bat
```

或手动执行：
```bash
node create-fields-with-auth.js
```

## 📁 文件说明

- **install-and-run.bat** - 一键运行脚本（Windows）
- **create-fields-with-auth.js** - 使用浏览器凭证创建字段的主程序
- **GET_CREDENTIALS.md** - 详细的凭证获取指南
- **auth-credentials.json** - 凭证配置文件（需要您创建）

## ⚠️ 注意事项

1. **凭证有效期**：CSRF Token和Cookie通常只有几小时有效期
2. **权限要求**：确保您有项目的字段管理权限
3. **重复创建**：如果字段已存在，脚本会自动跳过
4. **安全提醒**：不要将凭证文件提交到版本控制系统

## 🛠️ 故障排除

### 问题1：CSRF Token错误
- **原因**：凭证已过期
- **解决**：重新获取凭证（重复步骤1）

### 问题2：未授权错误
- **原因**：Cookie无效或权限不足
- **解决**：确认登录状态和管理员权限

### 问题3：字段已存在
- **表现**：提示字段已存在
- **解决**：这是正常的，脚本会跳过已存在的字段

## 📊 预期结果

成功运行后，您将在飞书项目中看到5个新的质量指标字段，可用于：
- 跟踪需求交付效率
- 监控评审质量
- 评估团队产能
- 分析返工情况
- 衡量推广速度

## 🔗 验证地址

https://project.f.mioffice.cn/iretail/setting/workObject/story?menuTab=fieldManagement

---

## 💡 技术说明

### API端点
```
POST /goapi/v3/settings/{project_key}/story/field
```

### 认证机制
- CSRF Token + Session Cookie 双重认证
- 插件Token认证（适用于官方插件）

### 已尝试的方案
1. ✅ 浏览器凭证方案（当前方案）
2. ❌ 纯API Token方案（需要官方插件权限）
3. ❌ 自动获取CSRF方案（跨域限制）

---

**如有问题，请查看 GET_CREDENTIALS.md 获取更详细的指导。**