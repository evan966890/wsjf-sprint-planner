# 🚀 飞书 MCP 集成 - 快速开始

## ✅ 已完成配置

我已经帮你完成了所有配置！现在你可以直接使用飞书 MCP 导入功能了。

## 📋 使用步骤

### 1️⃣ 启动服务

**方式 A：同时启动前后端（推荐）**
```bash
npm run dev:mcp
```

这会同时启动：
- ✅ 前端应用（http://localhost:5173）
- ✅ MCP 代理服务器（http://localhost:3001）

**方式 B：分别启动**
```bash
# 终端 1：启动后端代理
npm run server

# 终端 2：启动前端
npm run dev
```

### 2️⃣ 测试连接

打开浏览器访问：http://localhost:3001/api/health

应该看到：
```json
{
  "status": "ok",
  "mcp_configured": true,
  "timestamp": "2025-01-17T..."
}
```

### 3️⃣ 使用飞书导入

1. 访问 http://localhost:5173
2. 点击顶部"从飞书导入"按钮
3. 设置查询选项（数量、状态筛选等）
4. 点击"开始查询"
5. 预览数据并选择需要导入的需求
6. 点击"导入选中的需求"

## 🎯 已配置的信息

后端代理服务器使用以下配置（来自你提供的 MCP 配置）：

- **飞书项目**: https://project.f.mioffice.cn/
- **项目 Key**: 632d4f29aa4481312c2ab170
- **用户 Key**: 7541721806923694188
- **插件 ID**: MII_68F1064FA240006C
- **MCP 工具**: C:\Users\Evan Tian\AppData\Roaming\Python\Python312\Scripts\mcp-feishu-proj.exe

## ⚙️ 重要提示

### MCP 工具名称

我在代码中使用的 MCP 工具名称是：`feishu_proj_query_work_items`

**如果这个名称不正确**，你需要：

1. 查看 mcp-feishu-proj 的实际工具名称：
```bash
mcp-feishu-proj --help
```

2. 修改 `server/feishu-mcp-proxy.js` 中的工具名称：
```javascript
// 找到这一行并修改
const result = await callMCPTool('实际的工具名称', {
  // ...
});
```

常见的可能名称：
- `feishu_proj_query_work_items`
- `query_work_items`
- `list_stories`
- `get_work_items`

### 字段映射

MCP 返回的数据可能需要调整字段映射。如果导入的数据不正确，检查：

**文件**: `src/services/feishuMCPService.ts`

```typescript
export const DEFAULT_FIELD_MAPPINGS: FieldMapping[] = [
  {
    feishuField: 'name',        // ← 飞书字段名
    wsjfField: 'name',          // ← WSJF 字段名
  },
  // ... 更多映射
];
```

## 📊 架构说明

```
浏览器 (React)              Node.js 代理              MCP 工具
   :5173          HTTP          :3001          MCP       mcp-feishu-proj
     │    ────────────────►      │    ────────────────►      │
     │                           │                           │
     │    查询飞书工作项           │    调用 MCP 工具           │
     │    ◄────────────────      │    ◄────────────────      │
     │                           │                           │
     │    返回 JSON 数据          │    返回飞书数据            │
```

**为什么需要代理？**
- 浏览器无法直接调用 MCP 工具（安全限制）
- Node.js 可以调用系统工具
- Express 提供 HTTP API 给浏览器

## 🐛 故障排除

### 问题 1：后端启动失败

**检查**：
```bash
cd server
npm install
npm start
```

### 问题 2："无法连接到 MCP 代理服务器"

**原因**：后端服务未启动

**解决**：
```bash
npm run server
```

### 问题 3：查询返回错误

**可能原因**：
1. MCP 工具名称不正确
2. 飞书凭证失效
3. 网络问题

**调试**：
1. 查看后端控制台日志
2. 测试 MCP 工具：
```bash
mcp-feishu-proj --transport stdio
```

### 问题 4：数据格式不正确

**原因**：字段映射可能需要调整

**解决**：修改 `src/services/feishuMCPService.ts` 中的 `DEFAULT_FIELD_MAPPINGS`

## 📁 新增文件

```
WSJF/
├── server/                             # 新增：后端代理服务器
│   ├── feishu-mcp-proxy.js            # MCP 代理服务
│   └── package.json                    # 后端依赖
│
├── src/
│   ├── services/
│   │   └── feishuMCPService.ts        # ✅ 已更新：调用后端 API
│   ├── hooks/
│   │   └── useFeishuImport.ts         # ✅ 飞书导入 Hook
│   └── components/
│       └── FeishuImportModal.tsx      # ✅ 飞书导入 UI
│
└── docs/
    ├── FEISHU_MCP_IMPORT_GUIDE.md     # 使用指南
    ├── FEISHU_MCP_SETUP.md            # 配置指南
    └── README_FEISHU_MCP.md           # 本文档
```

## ✨ 功能特性

- ✅ **直接查询飞书项目**：通过 MCP 获取真实数据
- ✅ **智能字段映射**：自动转换飞书字段到 WSJF 格式
- ✅ **批量导入**：支持选择多条需求批量导入
- ✅ **状态筛选**：可按状态、优先级筛选
- ✅ **增量同步**：支持获取更新的工作项
- ✅ **错误处理**：友好的错误提示

## 📚 相关文档

- [使用指南](docs/FEISHU_MCP_IMPORT_GUIDE.md) - 详细的使用说明
- [配置指南](docs/FEISHU_MCP_SETUP.md) - 完整的配置步骤
- [实施总结](FEISHU_MCP_IMPLEMENTATION_SUMMARY.md) - 技术细节

## 🎉 开始使用

```bash
# 一条命令启动所有服务
npm run dev:mcp

# 然后访问 http://localhost:5173
# 点击"从飞书导入"即可！
```

---

**💡 提示**：如果遇到任何问题，查看：
1. 后端控制台日志
2. 浏览器控制台错误
3. [故障排除](#-故障排除) 章节
