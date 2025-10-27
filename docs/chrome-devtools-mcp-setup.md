# Chrome DevTools MCP 集成方案

> ⚠️ **重要说明**：本方案为 WSJF Sprint Planner 项目添加 Chrome DevTools MCP 支持，用于 AI 辅助的浏览器调试和性能分析。

## 一、快速安装（推荐）

### 前置条件
- ✅ Node.js 22+ （检查：`node -v`）
- ✅ Chrome 浏览器（稳定版）
- ✅ Claude Code CLI

### 一键安装
```bash
# Claude Code 自动配置（最简单）
claude mcp add chrome-devtools npx chrome-devtools-mcp@latest
```

安装完成后会提示重启 Claude Code。

---

## 二、手动配置（高级）

### 1. 基础配置

在 `.claude/settings.json` 中添加：

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

### 2. 高级配置（开发环境优化）

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--isolated=true",        // 使用临时配置，不影响主浏览器
        "--headless=false",       // 显示浏览器窗口（开发时推荐）
        "--viewport=1920x1080"    // 设置视口大小
      ]
    }
  }
}
```

### 3. 连接已运行的 Chrome（调试现有应用）

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

**启动 Chrome 时需要添加调试端口**：
```bash
# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222

# Mac
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222
```

---

## 三、核心功能说明

### 1. 性能分析能力 ⭐⭐⭐⭐⭐

```typescript
// AI 可以执行的操作
performance_start_trace    // 开始录制性能追踪
performance_stop_trace     // 停止录制
performance_analyze_insight // 自动分析并提取关键指标
```

**使用场景**：
- LCP（最大内容绘制）优化
- CLS（累积布局偏移）检测
- TBT（总阻塞时间）分析
- 首屏加载性能诊断

**对话示例**：
```
你：分析一下首页的性能问题

AI：
1. [启动性能追踪]
2. [加载页面]
3. [停止追踪并分析]

结果：
- LCP: 1082ms（良好）
- CLS: 0.00（优秀）
- TBT: 450ms（需要优化）

问题：
- Load delay 占了 837ms
- 原因：LCP 图片使用了 loading="lazy"

建议：
- 移除 loading="lazy"
- 添加 fetchpriority="high"
```

### 2. 页面控制能力

```typescript
navigate_page(url)         // 页面导航
new_page()                 // 新建标签页
click(selector)            // 点击元素
fill(selector, value)      // 填充表单
drag(from, to)             // 拖拽操作
hover(selector)            // 悬停
wait_for(condition)        // 等待条件
```

**使用场景**：
- 模拟用户操作
- 表单填写测试
- 拖拽功能验证（对 WSJF 的需求排期很有用）

### 3. 调试分析能力 ⭐⭐⭐⭐⭐

```typescript
take_screenshot()          // 截图
take_snapshot()            // 获取 DOM 快照
list_console_messages()    // 读取控制台日志
evaluate_script(code)      // 执行 JavaScript
list_network_requests()    // 列出网络请求
get_network_request(id)    // 获取请求详情
```

**使用场景**：
- 定位 CORS 错误
- 分析 API 请求失败原因
- 检测 JavaScript 错误
- 验证数据加载是否正确

**对话示例**：
```
你：为什么需求卡片的颜色没有显示？

AI：
1. [打开页面]
2. [检查控制台错误]
3. [截图对比]
4. [检查 CSS 样式]

发现问题：
- Console 显示：Failed to load tailwind CSS
- 原因：Vite 配置中缺少 PostCSS 插件

已修复：添加 postcss.config.js
```

### 4. 环境模拟能力

```typescript
emulate_cpu(rate)          // 模拟 CPU 限制（4x/6x 慢速）
emulate_network(preset)    // 模拟网络（3G/4G/Offline）
resize_page(width, height) // 调整视口大小
```

**使用场景**：
- 低端设备性能测试
- 弱网环境验证
- 响应式设计测试

---

## 四、与现有测试体系集成

### 当前测试体系（Playwright）

```
WSJF/
├── tests/
│   └── comprehensive-fixed-v2/  # Playwright 自动化测试
├── playwright.config.ts
└── package.json
```

### 集成后的测试体系

```
测试金字塔：

┌─────────────────────────────┐
│  手动测试（用户验收）        │  ← Chrome DevTools MCP 辅助
├─────────────────────────────┤
│  端到端测试（Playwright）    │  ← 自动化回归测试
├─────────────────────────────┤
│  集成测试                    │
├─────────────────────────────┤
│  单元测试                    │
└─────────────────────────────┘
```

### 工作流整合

**开发阶段（使用 Chrome DevTools MCP）**：
```bash
# 1. 启动开发服务器
npm run dev

# 2. 对话式调试
你：帮我检查一下需求编辑弹窗的性能
AI：[自动分析] → 发现问题 → 提供修复建议 → 验证修复
```

**提交阶段（使用 Playwright）**：
```bash
# 自动化测试
npm run test:quick
```

---

## 五、实战场景

### 场景 1：调试需求卡片拖拽问题

**问题**：需求卡片拖拽到迭代池后，有时候会失败

**使用 Chrome DevTools MCP 调试**：
```
你：帮我调试需求卡片的拖拽功能，为什么有时候会失败？

AI：
1. [打开页面] http://localhost:3000
2. [启动性能追踪]
3. [模拟拖拽操作]
4. [检查控制台错误]
5. [分析 JavaScript 事件]

发现问题：
- dataTransfer.getData() 在某些情况下返回空字符串
- 原因：drop 事件触发时 dragstart 的数据还未设置完成

建议修复：
// src/components/RequirementCard.tsx
const handleDragStart = (e: React.DragEvent) => {
  // 延迟设置数据，确保 dataTransfer 已初始化
  setTimeout(() => {
    e.dataTransfer.setData('requirementId', requirement.id);
  }, 0);
};
```

### 场景 2：性能优化

**问题**：需求列表有 100+ 条数据时，滚动卡顿

**使用 Chrome DevTools MCP 分析**：
```
你：帮我分析需求列表滚动卡顿的原因

AI：
1. [录制性能追踪]
2. [滚动需求列表]
3. [分析帧率]

发现问题：
- Scripting 时间占比 85%
- 每次滚动触发 100+ 次 calculateScores()
- 原因：未使用 useMemo 缓存计算结果

优化方案：
// src/hooks/useRequirements.ts
const scoredRequirements = useMemo(() => {
  return requirements.map(req => ({
    ...req,
    ...calculateScores(req)
  }));
}, [requirements]);

优化结果：
- 帧率从 30fps 提升到 60fps
- Scripting 时间降低 70%
```

### 场景 3：样式问题诊断

**问题**：需求卡片的颜色在某些情况下不显示

**使用 Chrome DevTools MCP 调试**：
```
你：需求卡片的渐变背景有时候不显示，帮我查一下

AI：
1. [打开页面并截图]
2. [检查元素样式]
3. [分析 Tailwind CSS 类名]
4. [检查条件渲染逻辑]

发现问题：
- getColor() 函数在 techProgress 为空时返回 undefined
- Tailwind 的动态类名未被 JIT 编译器识别

修复方案：
1. 在 tailwind.config.js 中添加 safelist
2. 修改 getColor() 提供默认值
```

---

## 六、配置验证

### 验证安装

安装完成后，在 Claude Code 中测试：

```
你：帮我测试一下 Chrome DevTools MCP 是否安装成功

AI：让我检查一下...
[执行：navigate_page("https://example.com")]
[执行：take_screenshot()]

✅ Chrome DevTools MCP 工作正常！
```

### 常见问题排查

#### 问题 1：Node.js 版本不够
```bash
错误：Node.js version must be >= 22.0.0

解决：
# Windows（使用 nvm-windows）
nvm install 22
nvm use 22

# Mac（使用 Homebrew）
brew install node@22
brew link node@22

# 或直接下载：https://nodejs.org
```

#### 问题 2：找不到 Chrome
```bash
错误：Could not find Chrome installation

解决：
# 手动指定 Chrome 路径
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--browserPath=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      ]
    }
  }
}
```

#### 问题 3：端口占用
```bash
错误：Port 9222 is already in use

解决：
# 关闭占用端口的 Chrome 进程
# Windows
taskkill /F /IM chrome.exe

# Mac/Linux
pkill -f chrome
```

---

## 七、最佳实践

### 1. 何时使用 Chrome DevTools MCP

✅ **适合使用**：
- 首次开发新功能，需要快速调试
- 性能问题诊断和优化
- 样式和布局问题排查
- 网络请求问题分析
- 用户报告的随机 bug 复现

❌ **不适合使用**：
- CI/CD 自动化流程（用 Playwright）
- 跨浏览器兼容性测试（用 Playwright）
- 长时间运行的稳定性测试（用 Playwright）

### 2. 与 AI 对话的最佳实践

**清晰描述问题**：
```
❌ 不好："这里有个 bug"
✅ 好："需求编辑弹窗点击保存按钮后，颜色选择器的值没有保存成功"
```

**提供上下文**：
```
✅ "在 RequirementCard 组件中，当 techProgress 为'待评估'时，
    卡片背景颜色应该是黄色渐变，但现在显示为灰色"
```

**分步调试**：
```
你：先帮我截图看一下当前状态
AI：[截图]
你：现在点击'新增需求'按钮
AI：[点击并截图]
你：检查一下控制台有没有错误
AI：[显示控制台日志]
```

### 3. 性能优化工作流

```
1. 建立基准
   你：录制一下当前页面的性能数据

2. 分析问题
   AI：发现 3 个性能瓶颈...

3. 应用优化
   你：帮我实现你建议的优化方案

4. 验证效果
   你：重新测试性能，对比前后差异

5. 回归测试
   npm run test:quick
```

---

## 八、下一步计划

### 短期（本周）
- [ ] 安装配置 Chrome DevTools MCP
- [ ] 验证基础功能
- [ ] 用 MCP 调试一个实际问题

### 中期（本月）
- [ ] 整合到日常开发流程
- [ ] 建立性能基准数据
- [ ] 编写使用文档和案例

### 长期（持续）
- [ ] 形成"开发用 MCP + 测试用 Playwright"的混合模式
- [ ] 累积常见问题的调试模式
- [ ] 贡献使用经验到团队知识库

---

## 九、参考资源

### 官方文档
- [Chrome DevTools MCP 官方博客](https://developer.chrome.com/blog/chrome-devtools-mcp)
- [GitHub 仓库](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [Model Context Protocol 规范](https://modelcontextprotocol.io/)

### 教程和案例
- [Addy Osmani: Give your AI eyes](https://addyosmani.com/blog/devtools-mcp/)
- [DebugBear: Performance Debugging With MCP](https://www.debugbear.com/blog/chrome-devtools-mcp-performance-debugging)

### 社区支持
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [Chrome DevTools MCP Issues](https://github.com/ChromeDevTools/chrome-devtools-mcp/issues)

---

## 十、总结

Chrome DevTools MCP 带来的变化：

**之前的调试流程**：
```
1. 发现问题
2. 手动打开 DevTools
3. 录制 trace
4. 分析数据（5-10分钟）
5. 搜索解决方案
6. 实施修复
7. 手动验证
总耗时：30-60分钟
```

**使用 Chrome DevTools MCP 后**：
```
1. 描述问题给 AI
2. AI 自动诊断、分析、提供方案
3. AI 实施修复
4. AI 自动验证
总耗时：5-10分钟
```

**效率提升：6-10倍** 🚀

---

**更新记录**：
- 2025-10-27: 创建文档
- 作者：Claude Code + Human

**相关文档**：
- [自动化测试规范](./standards/testing-standards.md)
- [重构规范](./standards/refactoring-standards.md)
