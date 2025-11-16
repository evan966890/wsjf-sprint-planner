# 🚀 飞书 MCP 导入 - 简易启动指南

## 问题说明

由于端口冲突和多个僵尸进程，使用 `npm run dev:mcp` 经常失败。

## ✅ 推荐解决方案

### 方案 A：使用启动脚本（最简单）

**双击运行**：`start-feishu-mcp.bat`

这个脚本会：
1. 自动清理旧的 Node 进程
2. 分别启动后端和前端（在两个独立的命令行窗口）
3. 避免端口冲突

**启动后**：
- 后端窗口标题："飞书 MCP 代理"
- 前端窗口标题："WSJF 前端"
- 等待两个窗口都显示"ready"后即可使用

### 方案 B：手动分别启动（最稳定）

**步骤 1：启动后端**

打开命令行窗口 1：
```bash
cd d:\code\WSJF\server
npm start
```

等待看到：
```
🚀 飞书 MCP 代理服务器已启动
📡 监听端口: 9999
```

**步骤 2：启动前端**

打开命令行窗口 2：
```bash
cd d:\code\WSJF
npm run dev
```

等待看到：
```
➜  Local:   http://localhost:3000/
```

**步骤 3：访问应用**

打开浏览器：http://localhost:3000（或显示的实际端口）

## 🎯 使用飞书导入

1. 点击顶部"从飞书导入"按钮
2. 设置查询选项（数量、状态筛选等）
3. 点击"开始查询"
4. 预览数据并选择需求
5. 点击"导入选中的需求"

## 📊 当前配置

**后端端口**：9999
**MCP 工具**：
- `get_view_detail_by_name` - 获取视图工作项
- 默认视图："全部需求"

**字段映射**：
飞书字段 → WSJF 字段（自动转换）

## 🐛 如遇到问题

### 问题 1：后端端口 9999 被占用

**解决**：
```bash
# 查看占用进程
netstat -ano | findstr :9999

# 杀掉进程（替换 PID）
taskkill /F /PID <PID>
```

### 问题 2：查询返回空数据

**可能原因**：
1. 飞书项目中没有"全部需求"这个视图
2. 视图中没有工作项

**解决**：
修改 `server/feishu-mcp-proxy.js` 第 125 行的视图名称：
```javascript
const result = await callMCPTool('get_view_detail_by_name', {
  view_name: '你的视图名称',  // ← 改成实际的视图名称
  work_item_type_key: 'story',
  page_num: pageNum,
  page_size: pageSize,
});
```

### 问题 3：数据格式错误

查看后端控制台日志中的：
```
[MCP Proxy] MCP 原始返回: ...
[MCP Proxy] 解析后的数据: ...
```

根据实际数据结构调整解析逻辑。

## 📚 完整文档

- [README_FEISHU_MCP.md](README_FEISHU_MCP.md) - 完整说明
- [docs/FEISHU_MCP_SETUP.md](docs/FEISHU_MCP_SETUP.md) - 详细配置
- [docs/FEISHU_MCP_IMPORT_GUIDE.md](docs/FEISHU_MCP_IMPORT_GUIDE.md) - 使用手册

---

**💡 建议**：使用"方案 B：手动分别启动"最稳定，虽然需要两个窗口，但不会有端口冲突问题。
