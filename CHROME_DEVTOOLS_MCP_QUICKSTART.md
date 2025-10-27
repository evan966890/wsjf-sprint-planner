# Chrome DevTools MCP 快速开始指南

> 5 分钟快速配置，让 Claude Code 拥有"浏览器之眼"

## ⚡ 立即开始

### 步骤 1：检查环境

```bash
# 检查 Node.js 版本（需要 22+）
node -v
```

如果版本低于 22：
- **Windows**: 访问 https://nodejs.org 下载最新版
- **Mac**: `brew install node@22 && brew link node@22`
- **Linux**: `nvm install 22 && nvm use 22`

### 步骤 2：一键安装

**方法 A：直接告诉 Claude（最简单）**

在 Claude Code 中说：
```
帮我安装 Chrome DevTools MCP
```

Claude 会自动执行：
```bash
claude mcp add chrome-devtools npx chrome-devtools-mcp@latest
```

**方法 B：手动执行命令**

在终端中运行：
```bash
claude mcp add chrome-devtools npx chrome-devtools-mcp@latest
```

### 步骤 3：重启 Claude Code

```bash
# 退出 Claude Code
exit

# 重新启动
claude
```

### 步骤 4：验证安装

在 Claude Code 中说：
```
帮我测试 Chrome DevTools MCP 是否正常工作
```

如果看到类似输出，说明安装成功：
```
✅ Chrome DevTools MCP 工作正常！
我可以：
- 打开浏览器页面
- 截图
- 检查控制台
- 分析性能
- 调试网络请求
```

---

## 🎯 第一次使用

### 场景 1：检查 WSJF 应用是否有错误

```bash
# 1. 启动开发服务器（如果还没启动）
npm run dev
```

然后在 Claude Code 中说：
```
打开 http://localhost:3000，帮我检查一下有没有控制台错误
```

Claude 会自动：
1. 打开浏览器
2. 加载页面
3. 检查控制台
4. 报告发现的问题

### 场景 2：分析页面性能

在 Claude Code 中说：
```
分析一下 WSJF 首页的加载性能
```

Claude 会：
1. 录制性能追踪
2. 分析 LCP、CLS、TBT 等指标
3. 提供优化建议

### 场景 3：调试样式问题

在 Claude Code 中说：
```
需求卡片的颜色显示不正确，帮我查一下是什么原因
```

Claude 会：
1. 截图当前状态
2. 检查 CSS 样式
3. 分析样式计算
4. 提供修复方案

---

## 📋 常用命令模板

直接复制这些命令，在 Claude Code 中使用：

### 页面检查
```
打开 http://localhost:3000 并截图
检查页面有没有控制台错误
检查页面有没有网络请求失败
```

### 性能分析
```
分析首页加载性能
录制页面滚动的性能数据
检查是否有内存泄漏
```

### 功能测试
```
帮我测试需求卡片的拖拽功能
模拟点击"新增需求"按钮，看看有没有问题
填写需求表单并提交，检查数据是否正确保存
```

### 样式调试
```
检查需求卡片的背景颜色为什么没显示
分析为什么按钮的样式不对
帮我找出为什么 hover 效果不生效
```

---

## 🚀 高级配置（可选）

### 配置 1：显示浏览器窗口（开发时推荐）

创建或编辑 `.claude/settings.json`：

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--headless=false"  // 显示浏览器窗口
      ]
    }
  }
}
```

这样你可以看到 Claude 在浏览器中的操作过程。

### 配置 2：使用独立浏览器环境

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--isolated=true",      // 使用临时配置
        "--headless=false",     // 显示窗口
        "--viewport=1920x1080"  // 设置视口大小
      ]
    }
  }
}
```

### 配置 3：连接已运行的 Chrome

如果你想让 Claude 控制你已经打开的 Chrome：

```bash
# 1. 启动 Chrome 并开启调试端口
# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222

# Mac
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

然后配置：
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--browser-url=http://127.0.0.1:9222"
      ]
    }
  }
}
```

---

## ❓ 常见问题

### Q1: 提示 Node.js 版本不够怎么办？

**错误信息**：
```
Error: Node.js version must be >= 22.0.0
```

**解决方案**：
```bash
# 检查当前版本
node -v

# 升级 Node.js（见步骤1）
```

### Q2: 找不到 Chrome 浏览器怎么办？

**错误信息**：
```
Error: Could not find Chrome installation
```

**解决方案**：
1. 确保已安装 Chrome 浏览器
2. 或手动指定 Chrome 路径（见配置2）

### Q3: Claude 说找不到 chrome-devtools 工具？

**可能原因**：
- 安装未成功
- 未重启 Claude Code

**解决方案**：
```bash
# 重新安装
claude mcp add chrome-devtools npx chrome-devtools-mcp@latest

# 重启 Claude Code
exit
claude
```

### Q4: 执行命令时超时怎么办？

**错误信息**：
```
Tool execution timeout
```

**解决方案**：
在命令中增加等待时间：
```
打开页面，等待 10 秒，然后截图
```

---

## 📚 下一步

### 学习更多

1. **详细集成方案**：[Chrome DevTools MCP 集成方案](docs/chrome-devtools-mcp-setup.md)
   - 高级配置选项
   - 更多实战案例
   - 性能优化技巧

2. **完整指南**：[飞书集成 + Chrome DevTools MCP](FEISHU_INTEGRATION_GUIDE.md)
   - 与飞书集成配合使用
   - 完整的技术栈说明

3. **项目规范**：[CLAUDE.md](CLAUDE.md)
   - 项目架构和规范
   - 开发工作流
   - 测试标准

### 实践建议

**第一周**：
- 每天用 Chrome DevTools MCP 调试 1-2 个问题
- 熟悉基本命令
- 体验效率提升

**第二周**：
- 尝试性能分析功能
- 用于复杂问题调试
- 探索高级配置

**长期**：
- 形成"开发用 MCP + 测试用 Playwright"的工作流
- 积累常用命令模板
- 分享使用经验

---

## 🎉 总结

Chrome DevTools MCP 让 Claude Code 能够：
- ✅ 自动诊断前端问题
- ✅ 分析性能瓶颈
- ✅ 实时验证修复效果
- ✅ 提升调试效率 6-10 倍

**立即开始**：
```
在 Claude Code 中说："帮我安装 Chrome DevTools MCP"
```

5 分钟后，你将拥有一个能"看见"浏览器的 AI 助手！

---

**相关资源**：
- [官方博客](https://developer.chrome.com/blog/chrome-devtools-mcp)
- [GitHub 仓库](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [MCP 官方网站](https://modelcontextprotocol.io/)

**最后更新**：2025-10-27
