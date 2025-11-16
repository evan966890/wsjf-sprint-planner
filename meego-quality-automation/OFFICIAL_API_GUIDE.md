# 🚀 飞书项目官方API使用指南

## 重要更正

**我之前的判断是错误的！** 飞书项目确实有完整的官方OpenAPI文档和SDK支持。

## 官方资源

### 1. 官方文档
- **API文档**: https://project.f.mioffice.cn/helpcenter/API/开发者文档.html
- **开发者后台**: https://project.f.mioffice.cn (左下角进入)
- **GitHub SDK**: https://github.com/larksuite/project-oapi-sdk-java

### 2. API覆盖范围

飞书项目已经开放了以下API模块：
- ✅ 空间管理 (Spaces)
- ✅ 用户管理 (Users)
- ✅ 工作项 (Work Items)
- ✅ **字段管理 (Fields)** ← 我们需要的！
- ✅ 流程类型 (Process Types)
- ✅ 视图 (Views)
- ✅ 评论 (Comments)
- ✅ 附件 (Attachments)
- ✅ 群组 (Groups)

## API端点格式

```
https://project.f.mioffice.cn/open_api/:project_key/{resource}
```

### 示例端点

```bash
# 获取工作项类型
GET /open_api/:project_key/work_item_types

# 创建自定义字段
POST /open_api/:project_key/work_item_type/:type_key/field

# 获取字段列表
GET /open_api/:project_key/work_item_type/:type_key/fields
```

## 认证方式

### 1. 获取插件凭证

在飞书项目开发者后台创建插件，获取：
- `plugin_id`: 插件ID
- `plugin_secret`: 插件密钥

### 2. 获取Token

```python
POST /open_api/authen/plugin_token

{
    "plugin_id": "MII_xxxxx",
    "plugin_secret": "xxxxx"
}
```

### 3. 使用Token调用API

```python
headers = {
    "X-PLUGIN-TOKEN": "p-xxxxx",
    "X-USER-KEY": "user_key"
}
```

## 创建质量指标字段

### 请求示例

```python
POST /open_api/iretail/work_item_type/story/field

Headers:
{
    "Content-Type": "application/json",
    "X-PLUGIN-TOKEN": "p-xxxxx",
    "X-USER-KEY": "7541721806923694188"
}

Body:
{
    "field_name": "Lead Time（交付周期）",
    "field_alias": "quality_lead_time",
    "field_type": "number",
    "description": "从需求创建到上线的时间（天）",
    "permissions": {
        "read": ["*"],
        "write": ["*"]
    }
}
```

## SDK使用示例

### Java SDK

```java
import com.larksuite.project.Client;

// 创建客户端
Client client = Client.newBuilder("pluginID", "pluginSecret").build();

// 创建字段
CreateFieldRequest request = CreateFieldRequest.builder()
    .projectKey("iretail")
    .workItemTypeKey("story")
    .fieldName("Lead Time")
    .fieldType("number")
    .build();

CreateFieldResponse response = client.field().create(request);
```

### Python实现

参见 `official_api_solution.py`

## 与之前方案的对比

| 方面 | 之前的方案（逆向工程） | 官方API方案 |
|------|----------------------|-------------|
| 方法 | 通过Chrome DevTools捕获 | 使用官方OpenAPI |
| 认证 | CSRF Token + Cookie | Plugin Token |
| 稳定性 | 可能随前端更新失效 | 官方支持，稳定可靠 |
| 合规性 | 灰色地带 | 完全合规 |
| 文档 | 无文档 | 有官方文档 |
| SDK | 无 | 有官方SDK |

## 步骤指南

### 1. 创建插件

1. 登录飞书项目：https://project.f.mioffice.cn
2. 点击左下角进入"开发者后台"
3. 创建新插件
4. 获取 `plugin_id` 和 `plugin_secret`

### 2. 配置权限

在插件配置中添加以下权限：
- 字段管理 (Field Management)
- 工作项读写 (Work Item Read/Write)

### 3. 运行脚本

```bash
# 使用官方API版本
python official_api_solution.py
```

## 总结

✅ **飞书项目确实有完整的官方API支持**
✅ **可以通过官方API实现全自动配置**
✅ **有官方SDK和文档支持**

我之前说"API不存在"是完全错误的判断。感谢您的纠正！

## 参考链接

1. [飞书项目API文档](https://project.f.mioffice.cn/helpcenter/API/开发者文档.html)
2. [GitHub - 飞书项目Java SDK](https://github.com/larksuite/project-oapi-sdk-java)
3. [飞书开放平台](https://open.feishu.cn/document)
4. [MCP集成文档](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/mcp_integration/mcp_introduction)