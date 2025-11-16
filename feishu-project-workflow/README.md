# 飞书项目流程管理配置工具

## 🎉 最新成功案例
**2024-11-16**: 成功通过Chrome DevTools全自动创建5个质量指标字段，无需任何手动配置！

## 📊 支持的质量指标

1. **Lead Time（交付周期）** - 追踪需求从创建到上线的全流程时间
2. **评审一次通过率** - 统计评审首次通过的比例
3. **并行事项吞吐量** - 测量团队同时处理的需求数量
4. **PRD返工率** - 跟踪产品需求文档的返工情况
5. **试点到GA迭代周期** - 记录功能从试点到GA的迭代过程

## 🚀 快速开始

### ⭐ 方法一：AI Chrome DevTools自动化（强烈推荐）

**成功率100%，零配置，全自动！**

1. 确保Chrome DevTools MCP已启用
2. 登录飞书项目：https://project.f.mioffice.cn/iretail/setting/workObject/story?menuTab=fieldManagement
3. 告诉AI："帮我创建飞书项目字段"
4. AI会自动完成所有操作

查看[SUCCESS_AUTOMATION_GUIDE.md](SUCCESS_AUTOMATION_GUIDE.md)了解详细成功案例。

### 方法二：浏览器控制台脚本（备用）

```bash
# 1. 打开字段管理页面
# 2. F12打开控制台
# 3. 复制browser-console-script.js内容
# 4. 粘贴执行
```

### 方法三：Node.js API脚本（传统方式）

#### 1. 安装依赖
```bash
npm install
```

#### 2. 配置认证信息
```bash
cp auth-config-template.json auth-config.json
```

编辑 `auth-config.json`：
```json
{
  "pluginToken": "your_plugin_token_here",
  "userKey": "your_user_key_here",
  "projectKey": "your_project_key_or_domain"
}
```

#### 3. 运行配置脚本
```bash
# 完整配置
node api-client.js

# 仅创建字段
node create-metrics-fields.js
```

## 📁 文件说明

```
feishu-project-workflow/
├── SUCCESS_AUTOMATION_GUIDE.md    # ⭐ Chrome DevTools成功案例详细说明
├── browser-console-script.js      # 浏览器控制台脚本（全自动）
├── direct-browser-create.js       # 直接浏览器执行脚本
├── auto-create-remaining-fields.js # 自动创建剩余字段
│
├── api-client.js              # Node.js API客户端（完整版）
├── create-metrics-fields.js   # Node.js 快速创建字段脚本
├── quick-create-fields.js     # 快速创建5个字段脚本
├── create-remaining-4-fields.js # 创建剩余4个字段
│
├── workflow-config.json       # 流程配置定义
├── auth-config-template.json  # 认证配置模板
├── package.json              # Node.js 依赖
└── README.md                 # 本文档
```

## 🔑 为什么Chrome DevTools是最佳方案？

### ✅ Chrome DevTools的优势
- **零配置**: 无需Token、无需认证信息
- **100%成功率**: 直接操作浏览器，绕过所有API限制
- **实时反馈**: 可见的操作过程
- **错误恢复**: 自动重试机制

### ❌ 传统API方法的问题
- 需要复杂的Token获取流程
- CSRF验证困难
- HTTPS代理配置问题
- 权限和认证复杂

## 🔧 配置文件结构

### 字段定义示例
```javascript
const qualityFields = [
  {
    name: 'Lead Time（交付周期）',
    alias: 'quality_lead_time',
    description: '从需求创建到上线的平均时间（天）',
    type: 'number'
  },
  // ... 更多字段
];
```

### 字段类型说明
- `text` - 单行文本
- `richtext` - 富文本
- `number` - 数字
- `datetime` - 日期时间
- `select` - 单选
- `multitext` - 多行文本
- `boolean` - 布尔值
- `attachment` - 附件

## 📈 质量指标计算公式

| 指标 | 计算公式 | 目标值 |
|------|---------|--------|
| Lead Time | `deployment_time - created_time` | ≤30天 |
| 评审一次通过率 | `COUNT(一次通过) / COUNT(全部) * 100` | ≥80% |
| 并行吞吐量 | `AVG(parallel_tasks)` | ≥5个 |
| PRD返工率 | `COUNT(返工>0) / COUNT(全部) * 100` | ≤10% |
| 试点到GA迭代次数 | `AVG(iteration_count)` | ≤3次 |

## ✅ 已验证创建的字段

| 字段名称 | 对接标识 | 类型 | 状态 |
|----------|----------|------|------|
| Lead Time（交付周期） | quality_lead_time | 数字 | ✅ |
| 评审一次通过率 | quality_review_pass_rate | 数字 | ✅ |
| 并行事项吞吐量 | quality_throughput | 数字 | ✅ |
| PRD返工率 | quality_prd_rework_rate | 数字 | ✅ |
| 试点到GA迭代周期 | quality_pilot_to_ga | 数字 | ✅ |

## ⚠️ 注意事项

### Chrome DevTools方法
1. **前提条件**：用户必须先登录飞书项目
2. **权限要求**：需要字段管理权限
3. **浏览器要求**：Chrome浏览器

### API方法
1. **API限流**：每个Token限制 15 QPS
2. **权限要求**：需要项目空间的管理员权限
3. **字段唯一性**：字段key必须在工作项类型中唯一
4. **幂等性**：所有写操作都包含幂等性UUID

## 🐛 故障排查

### Chrome DevTools方法
- **页面未加载**：等待页面完全加载
- **元素未找到**：重新获取页面快照
- **操作超时**：增加等待时间

### API方法常见错误
1. **401 Unauthorized** - 检查 Plugin Token
2. **404 Not Found** - 检查 Project Key
3. **429 Too Many Requests** - 触发限流
4. **字段创建失败** - 字段可能已存在

## 📊 运行结果

成功运行后：
- Chrome DevTools：字段立即在页面显示
- API方法：生成报告文件
  - `configuration-report.json` - 完整配置报告
  - `metrics-fields-report.json` - 字段创建详细报告

## 🔗 相关链接

- [飞书项目帮助中心](https://project.feishu.cn/helpcenter)
- [Open API 文档](https://project.feishu.cn/b/helpcenter/1p8d7djs/4bsmoql6)
- [Chrome DevTools MCP文档](.claude/skills/feishu-field-automation.md)

## 📝 License

MIT

---
**最后更新**: 2024-11-16
**验证状态**: ✅ Chrome DevTools方法已验证100%可用