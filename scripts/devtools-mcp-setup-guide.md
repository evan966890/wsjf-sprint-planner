# Chrome DevTools MCP 配置指南

## 什么是 Chrome DevTools MCP？

Chrome DevTools MCP 是 Google 官方推出的基于 MCP（Model Context Protocol）标准的浏览器自动化工具。它将 Chrome 浏览器的 DevTools 底层方法暴露给 AI 大语言模型使用，使 AI 能够：

- 🌐 自动化浏览器操作（导航、点击、填表）
- 📊 性能分析和追踪
- 🐛 调试和诊断
- 📸 截图和视觉验证
- 🌐 网络请求监控

## 配置步骤

### 方法一：在 Claude Code 中配置

1. **打开 Claude Code 设置**
   - 点击右上角设置图标
   - 选择 "Model Context Protocol" 或 "MCP Settings"

2. **添加 DevTools MCP 配置**
   ```json
   {
     "mcpServers": {
       "chrome-devtools": {
         "command": "npx",
         "args": ["-y", "chrome-devtools-mcp@latest"]
       }
     }
   }
   ```

3. **重启 Claude Code**
   - 关闭并重新打开 Claude Code
   - 验证 DevTools MCP 已加载（应该在可用工具列表中看到）

### 方法二：在 Cursor 中配置

1. **打开 Cursor 设置**
   - 按 `Ctrl+,` (Windows) 或 `Cmd+,` (Mac)
   - 搜索 "MCP" 或找到 MCP 配置页面

2. **添加 MCP 服务器**
   - 点击 "Add MCP Server"
   - 输入名称：`chrome-devtools`
   - 命令：`npx`
   - 参数：`["-y", "chrome-devtools-mcp@latest"]`

3. **保存并重启 Cursor**

### 方法三：使用项目本地配置文件

项目中已包含 `.mcp/config.json` 文件，内容如下：

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

某些 AI 客户端会自动读取此配置。

## 验证配置

配置完成后，向 AI 发送以下提示词验证：

```
请列出所有可用的 Chrome DevTools MCP 工具
```

应该看到类似以下工具列表：

**输入自动化（7个）**
- click - 点击元素
- drag - 拖拽元素
- fill - 填充输入框
- fill_form - 填充表单
- handle_dialog - 处理对话框
- hover - 悬停元素
- upload_file - 上传文件

**导航自动化（7个）**
- close_page - 关闭页面
- list_pages - 列出所有页面
- navigate_page - 导航到URL
- navigate_page_history - 前进/后退
- new_page - 新建页面
- select_page - 选择页面
- wait_for - 等待条件

**性能分析（3个）**
- performance_analyze_insight - 分析性能
- performance_start_trace - 开始追踪
- performance_stop_trace - 停止追踪

**调试工具（4个）**
- evaluate_script - 执行脚本
- list_console_messages - 列出控制台消息
- take_screenshot - 截图
- take_snapshot - 快照

**网络监控（2个）**
- get_network_request - 获取网络请求
- list_network_requests - 列出所有请求

**仿真工具（3个）**
- emulate_cpu - 模拟CPU限制
- emulate_network - 模拟网络条件
- resize_page - 调整页面大小

## 常见问题

### Q: 提示 "npx: command not found"

**解决方案**：确保已安装 Node.js 18+
```bash
node --version
npm --version
```

### Q: DevTools MCP 启动失败

**解决方案**：
1. 检查网络连接（需要下载 chrome-devtools-mcp 包）
2. 尝试手动安装：`npm install -g chrome-devtools-mcp`
3. 使用完整路径：`"command": "C:\\path\\to\\node.exe"`

### Q: 在 AI 中看不到 DevTools 工具

**解决方案**：
1. 确认 AI 客户端重启
2. 检查 AI 客户端的 MCP 日志
3. 尝试在新对话中询问可用工具

### Q: 与 Playwright 相比有什么区别？

**DevTools MCP 优势**：
- ✅ AI 驱动，更灵活
- ✅ 优秀的性能分析能力
- ✅ 直接访问浏览器底层 API
- ✅ 更接近真实用户行为

**Playwright 优势**：
- ✅ 更完整的自动化 API
- ✅ 更好的拖拽支持
- ✅ 可编写可重复执行的脚本
- ✅ 更快的执行速度
- ✅ 更成熟的生态系统

## 下一步

配置完成后，请参阅：
- 📋 [DevTools MCP 测试计划](./devtools-mcp-test-plan.md) - 详细的测试用例
- 🎯 [测试套件总结](../tests/comprehensive/00-test-suite-summary.md) - 完整测试覆盖

## 参考资料

- [Chrome DevTools MCP GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [MCP 协议文档](https://modelcontextprotocol.io/)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
