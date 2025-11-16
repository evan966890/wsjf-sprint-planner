# 飞书项目 MCP 导入功能使用指南

## 🎯 功能概述

基于 MCP (Model Context Protocol) 的飞书项目导入功能，可以直接从飞书项目中拉取工作项（Story）并转换为 WSJF 需求格式。

**核心优势**：
- ✅ **简单直接**：无需复杂的 OAuth 认证流程
- ✅ **实时查询**：直接从飞书项目获取最新数据
- ✅ **智能映射**：自动将飞书字段映射到 WSJF 字段
- ✅ **批量导入**：支持批量选择和导入需求
- ✅ **增量同步**：支持仅获取更新的工作项

## 📋 前置条件

### 1. MCP 配置

在 Claude Code 的配置文件中添加飞书项目 MCP 配置：

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "feishuproj": {
      "command": "mcp-feishu-proj",
      "args": ["--transport", "stdio"],
      "env": {
        "FS_PROJ_BASE_URL": "https://project.f.mioffice.cn/",
        "FS_PROJ_PROJECT_KEY": "your-project-key",
        "FS_PROJ_USER_KEY": "your-user-key",
        "FS_PROJ_PLUGIN_ID": "your-plugin-id",
        "FS_PROJ_PLUGIN_SECRET": "your-plugin-secret"
      }
    }
  }
}
```

### 2. 获取配置信息

**项目 Key (PROJECT_KEY)**：
- 从飞书项目 URL 获取
- 格式：`https://project.f.mioffice.cn/{PROJECT_KEY}/...`

**用户 Key (USER_KEY)**：
- 飞书项目 → 设置 → 开发者后台 → 用户信息

**插件凭证 (PLUGIN_ID & SECRET)**：
- 飞书项目 → 设置 → 开发者后台 → 创建插件
- 复制插件 ID 和 Secret

## 🚀 使用流程

### 第1步：打开导入弹窗

1. 点击顶部导航栏的"从飞书导入"按钮
2. 系统会打开飞书导入弹窗

### 第2步：配置查询选项

在查询配置页面，你可以设置：

**查询数量**：
- 默认：50 条
- 范围：1-200 条
- 建议：根据项目规模调整

**状态筛选**（可选）：
- 全部
- 待评审
- 评审中
- 设计中
- 开发中
- 已完成

### 第3步：查询工作项

点击"开始查询"按钮，系统会：
1. 通过 MCP 连接到飞书项目
2. 查询符合条件的工作项
3. 自动转换为 WSJF 需求格式
4. 显示预览列表

### 第4步：预览和选择

在预览页面：
- ✅ **默认全选**：所有查询到的工作项默认选中
- 🔘 **切换选中**：点击表格行或复选框切换选中状态
- 📋 **查看详情**：需求名称、状态、评分等信息
- 🔄 **重新查询**：如需调整条件，点击"重新查询"

### 第5步：确认导入

1. 确认选中的需求无误
2. 点击"导入选中的 X 条需求"按钮
3. 系统会：
   - 将需求添加到待排期区
   - 自动计算 WSJF 分数
   - 按分数排序显示

## 📊 字段映射规则

系统会自动将飞书字段映射到 WSJF 字段：

| 飞书字段 | WSJF 字段 | 说明 |
|---------|----------|------|
| name | name | 需求名称 |
| description | description | 需求描述 |
| business_value | businessImpactScore | 业务影响度评分 |
| complexity | complexityScore | 技术复杂度评分 |
| effort_days | effortDays | 工作量（天） |
| owner | developer | 开发负责人 |
| creator | submitterName | 提交人 |
| created_at | submitDate | 提交日期 |
| status | techProgress | 技术进展 |

### 状态映射

| 飞书状态 | WSJF 技术进展 |
|---------|------------|
| 待评审 | 待评估 |
| 评审中 | 待评估 |
| 设计中 | 技术方案设计中 |
| 开发中 | 开发中 |
| 已完成 | 已完成技术方案 |
| 已上线 | 已上线 |

## ⚙️ 高级功能

### 自定义字段映射

如需自定义字段映射，可修改 [src/services/feishuMCPService.ts](../src/services/feishuMCPService.ts) 中的 `DEFAULT_FIELD_MAPPINGS`：

```typescript
export const DEFAULT_FIELD_MAPPINGS: FieldMapping[] = [
  {
    feishuField: 'custom_field_name',  // 飞书自定义字段名
    wsjfField: 'businessImpactScore',  // WSJF 字段名
    transform: (val) => Number(val) || 5  // 转换函数（可选）
  },
  // ... 更多映射
];
```

### 增量同步

暂未实现 UI 入口，可通过代码调用：

```typescript
import { feishuMCPService } from '../services/feishuMCPService';

// 同步最近24小时更新的需求
const lastSyncTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const updatedRequirements = await feishuMCPService.syncUpdatedStories(lastSyncTime);
```

## ⚠️ 注意事项

### 1. MCP 环境限制

当前实现在浏览器环境中使用**模拟数据**，因为：
- MCP 工具在浏览器中无法直接调用
- 需要通过后端代理或使用 Electron 环境

**生产环境部署**：
1. 创建后端 API 代理 MCP 调用
2. 或打包为 Electron 应用
3. 更新 `feishuMCPService.ts` 中的查询逻辑

### 2. 权限要求

- 需要飞书项目的读取权限
- 插件需要授权访问工作项数据

### 3. 数据同步

- 导入后数据独立存储在 WSJF 系统中
- 不会自动同步飞书的后续更新
- 建议定期重新导入或使用增量同步

## 🐛 故障排除

### 问题 1：MCP 连接失败

**症状**：提示"MCP 服务不可用"

**解决方案**：
1. 检查 MCP 配置是否正确
2. 验证插件凭证是否有效
3. 确认飞书项目 Key 正确

### 问题 2：查询返回空数据

**症状**：查询成功但没有数据

**可能原因**：
1. 筛选条件过严
2. 项目中没有符合条件的工作项
3. 权限不足

**解决方案**：
1. 调整查询条件（去除状态筛选）
2. 增加查询数量
3. 检查插件权限

### 问题 3：字段映射不正确

**症状**：导入的数据缺少某些字段

**解决方案**：
1. 检查飞书项目中是否有对应的自定义字段
2. 更新字段映射配置
3. 确认字段名称拼写正确

## 📚 相关文档

- [飞书项目 API 文档](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/project-v1)
- [MCP 协议介绍](https://modelcontextprotocol.io/)
- [WSJF 导入功能架构](./feishu-integration/technical-design.md)

## 🔄 版本历史

### v2.0.0 (2025-01)
- ✨ 基于 MCP 的新实现
- 🗑️ 移除复杂的 OAuth 认证流程
- ⚡ 简化导入流程
- 📦 文件大小优化（从 821 行降至 ~300 行）

### v1.0.0 (2024-12)
- 🎉 首个版本（基于 OAuth 认证）
- ❌ 已废弃，代码移至 `FeishuImportModal.old.tsx`

---

**🎉 完成！**现在你可以轻松地从飞书项目导入需求到 WSJF Sprint Planner 了！
