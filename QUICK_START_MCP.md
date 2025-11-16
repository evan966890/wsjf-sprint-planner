# 🚀 飞书 MCP 导入 - 快速开始指南

## ✅ 第一步：启动服务

运行以下命令启动前后端服务：

```bash
npm run dev:mcp
```

你会看到：
```
✅ Vite 前端服务启动成功
   ➜ Local:   http://localhost:3000/

✅ 飞书 MCP 代理服务器已启动
   📡 监听端口: 3001
   🔗 健康检查: http://localhost:3001/api/health
```

## 🌐 第二步：访问应用

打开浏览器访问：**http://localhost:3000**

## 🔧 第三步：测试飞书导入

1. 点击顶部"**从飞书导入**"按钮
2. 在弹出的窗口中设置查询选项
3. 点击"**开始查询**"

## ⚠️ 重要：首次使用可能需要调整

### 问题：MCP 工具名称可能不正确

我在代码中使用的工具名称是：`feishu_proj_query_work_items`

**如果查询时报错"未找到工具"或类似错误**，请按以下步骤修复：

---

### 🛠️ 修复步骤

#### 方式 A：查看 MCP 工具文档（推荐）

运行以下命令查看可用的工具：

```bash
C:\Users\Evan Tian\AppData\Roaming\Python\Python312\Scripts\mcp-feishu-proj.exe --help
```

或者：
```bash
mcp-feishu-proj list-tools
```

#### 方式 B：尝试常见的工具名称

打开 `server/feishu-mcp-proxy.js`，找到第 95 行和第 115 行：

**当前代码（第 95 行）：**
```javascript
const result = await callMCPTool('feishu_proj_query_work_items', {
```

**尝试替换为以下名称之一：**
- `query_work_items`
- `list_stories`
- `get_work_items`
- `feishu_query_stories`
- `query_stories`

**修改示例：**
```javascript
// 第 95 行 - 查询工作项
const result = await callMCPTool('query_work_items', {  // ← 改这里
  project_key: MCP_CONFIG.env.FS_PROJ_PROJECT_KEY,
  work_item_type: 'story',
  status,
  priority,
  limit,
  offset,
});

// 第 115 行 - 增量同步
const result = await callMCPTool('query_work_items', {  // ← 改这里
  project_key: MCP_CONFIG.env.FS_PROJ_PROJECT_KEY,
  work_item_type: 'story',
  updated_after: lastSyncTime,
});
```

#### 方式 C：查看 mcp-feishu-proj 源代码

如果上述方法都不行，可以查看 mcp-feishu-proj 的：
- GitHub 仓库文档
- PyPI 包说明
- 或运行 `pip show mcp-feishu-proj` 查看包信息

---

## 📊 如何验证工具名称正确

### 方法 1：查看后端日志

启动服务后，后端会输出详细日志。如果工具名称错误，会看到：
```
❌ MCP process exited with code 1: Unknown tool: feishu_proj_query_work_items
```

### 方法 2：测试 MCP 调用

在命令行手动测试：

```bash
# 启动 MCP 工具
C:\Users\Evan Tian\AppData\Roaming\Python\Python312\Scripts\mcp-feishu-proj.exe --transport stdio

# 然后输入（粘贴后按回车）：
{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
```

这会返回所有可用的工具列表。

---

## ✅ 验证清单

启动后确认：

- [ ] 前端可访问（http://localhost:3000）
- [ ] 后端健康检查通过（http://localhost:3001/api/health）
- [ ] 点击"从飞书导入"可以打开弹窗
- [ ] 点击"开始查询"没有报错（或根据错误调整工具名称）
- [ ] 可以看到飞书项目的工作项数据
- [ ] 可以选择并导入需求

---

## 📚 相关文档

- [README_FEISHU_MCP.md](README_FEISHU_MCP.md) - 完整说明
- [docs/FEISHU_MCP_SETUP.md](docs/FEISHU_MCP_SETUP.md) - 详细配置
- [docs/FEISHU_MCP_IMPORT_GUIDE.md](docs/FEISHU_MCP_IMPORT_GUIDE.md) - 使用手册

---

## 🐛 常见问题

### Q1: 后端启动失败

**原因**：可能缺少依赖

**解决**：
```bash
cd server
npm install
```

### Q2: 前端启动在 localhost:3000 而不是 5173

**原因**：5173 端口被占用

**无需处理**：使用 3000 端口即可

### Q3: 无法连接到后端

**检查**：
1. 后端是否启动（查看控制台是否有 "监听端口: 3001"）
2. 访问 http://localhost:3001/api/health 是否返回 {"status":"ok"}

### Q4: MCP 工具调用失败

**最可能的原因**：工具名称不正确

**解决**：按照上面的"修复步骤"调整工具名称

---

## 💡 提示

**第一次使用时**，建议：

1. 先尝试查询，看是否报错
2. 如果报错，查看后端控制台的详细错误信息
3. 根据错误信息调整 `server/feishu-mcp-proxy.js` 中的工具名称
4. 修改后无需重启，刷新浏览器即可（后端会自动重新加载）

---

**🎉 完成！现在你可以从飞书项目导入数据了！**

如果遇到任何问题，查看后端控制台的详细错误信息，通常会有明确的提示。
