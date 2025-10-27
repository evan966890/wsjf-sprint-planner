# Chrome DevTools MCP 测试规范

> **版本**: 1.0.0
> **最后更新**: 2025-10-27
> **替代方案**: 本规范取代了之前的 Playwright 测试方案

---

## 📖 概述

本项目使用 **Chrome DevTools MCP** 进行UI测试和调试，完全取代 Playwright 等传统测试框架。

### 核心优势

- ✅ **零依赖** - 无需安装测试框架（Playwright、Puppeteer等）
- ✅ **零配置** - 只需一个 `.mcp.json` 配置文件
- ✅ **实时交互** - 真实浏览器环境，完整开发者工具
- ✅ **AI自主验证** - AI可以自己导航、截图、检查错误
- ✅ **即时反馈** - 无需等待测试套件运行

---

## 🚀 快速开始

### 1. 配置 MCP

确保项目根目录有 `.mcp.json` 文件：

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

### 2. 重启 Claude Code

配置后需要重启 Claude Code 才能加载 MCP 服务器。

### 3. 开始测试

AI 现在可以直接使用 Chrome DevTools MCP 工具进行测试。

---

## 🧪 AI 测试工作流程

### 标准测试流程

当用户要求"检查控制台错误"或"验证功能"时，AI 应该按照以下流程：

**第1步：导航到页面**
```typescript
mcp__chrome-devtools__navigate_page("http://localhost:3000")
```

**第2步：检查控制台消息**
```typescript
mcp__chrome-devtools__list_console_messages()
```
- 查找 `[error]` 类型的消息
- 分析错误来源和影响

**第3步：检查网络请求**
```typescript
mcp__chrome-devtools__list_network_requests()
```
- 查找失败的请求（404、500等）
- 区分功能性错误和无害错误（如 favicon）

**第4步：截图验证**
```typescript
mcp__chrome-devtools__take_screenshot()
```
- 保存当前UI状态
- 用于对比或报告

**第5步：元素检查**
```typescript
mcp__chrome-devtools__take_snapshot()
```
- 获取页面所有可交互元素
- 验证关键元素是否存在

---

## 📋 常见测试场景

### 场景1: 功能完整性测试

**目标**: 验证所有主要功能正常工作

```typescript
// 1. 导航到页面
mcp__chrome-devtools__navigate_page("http://localhost:3000")

// 2. 获取页面元素
snapshot = mcp__chrome-devtools__take_snapshot()

// 3. 验证关键按钮存在
找到 "新增需求" 按钮
找到 "导入" 按钮
找到 "导出" 按钮

// 4. 测试交互
mcp__chrome-devtools__click(按钮uid)
验证弹窗是否打开

// 5. 检查错误
mcp__chrome-devtools__list_console_messages()
确认无错误
```

### 场景2: 重构后验证

**目标**: 确保重构后UI和功能完整

**重构前**：
```typescript
// 1. 截图保存baseline
mcp__chrome-devtools__navigate_page("http://localhost:3000")
mcp__chrome-devtools__take_screenshot({
  filePath: "docs/screenshots/before-refactor/component-name.png"
})

// 2. 记录元素列表
snapshot = mcp__chrome-devtools__take_snapshot()
// 保存关键元素的uid和描述
```

**重构后**：
```typescript
// 1. 重新截图
mcp__chrome-devtools__navigate_page("http://localhost:3000")
mcp__chrome-devtools__take_screenshot({
  filePath: "docs/screenshots/after-refactor/component-name.png"
})

// 2. 对比元素
新snapshot = mcp__chrome-devtools__take_snapshot()
// 对比前后是否一致

// 3. 检查控制台
messages = mcp__chrome-devtools__list_console_messages()
// 确认无新增错误

// 4. 功能测试
// 点击关键按钮，验证交互正常
```

### 场景3: 表单验证测试

**目标**: 测试表单填写和提交

```typescript
// 1. 打开表单
snapshot = mcp__chrome-devtools__take_snapshot()
找到 "新增需求" 按钮
mcp__chrome-devtools__click(按钮uid)

// 2. 填写表单
新snapshot = mcp__chrome-devtools__take_snapshot()
mcp__chrome-devtools__fill(姓名输入框uid, "测试用户")
mcp__chrome-devtools__fill(邮箱输入框uid, "test@example.com")

// 3. 提交验证
mcp__chrome-devtools__click(提交按钮uid)
检查是否有错误提示或成功消息
```

### 场景4: 控制台错误监控

**目标**: 持续监控页面是否有错误

```typescript
// 每次重要操作后检查
mcp__chrome-devtools__list_console_messages()

// 过滤错误类型
查找 type === 'error' 的消息
分析错误内容

// 获取详细信息
mcp__chrome-devtools__get_console_message(msgid)
```

---

## 🎯 最佳实践

### ✅ 推荐做法

1. **重构前必须截图**
   - 保存到 `docs/screenshots/before-refactor/`
   - 作为对比基准

2. **重要操作后检查控制台**
   - 登录后检查
   - 提交表单后检查
   - 导入数据后检查

3. **使用 verbose snapshot**
   - 需要详细元素信息时使用
   - `mcp__chrome-devtools__take_snapshot({ verbose: true })`

4. **保存关键截图**
   - 重要功能的截图保存到文件
   - 方便后续对比和文档

5. **区分功能性错误和无害错误**
   - favicon 404 → 无害，不影响功能
   - API 500 → 功能性错误，必须修复

### ❌ 避免的做法

1. **不要忽略控制台错误**
   - 即使应用"看起来正常"
   - 错误可能在特定场景下触发

2. **不要只测试首页**
   - 需要测试所有主要功能
   - 登录、表单、筛选、拖拽等

3. **不要重复导航**
   - 已经在页面上就不要重复导航
   - 使用 `take_snapshot()` 获取最新状态

4. **不要跳过截图对比**
   - 重构后必须视觉对比
   - 仅代码审查不够

---

## 📊 测试检查清单

### 提交前必须完成

- [ ] 导航到 http://localhost:3000 成功
- [ ] 控制台无功能性错误（favicon除外）
- [ ] 关键按钮可点击（新增需求、导入、导出）
- [ ] 登录流程正常
- [ ] 表单填写正常
- [ ] 截图验证UI完整

### 重构后必须完成

- [ ] 重构前已截图保存
- [ ] 重构后截图对比一致
- [ ] 控制台无新增错误
- [ ] 所有颜色和样式保持一致
- [ ] 所有交互功能正常
- [ ] 用户数据正常加载

---

## 🔧 常用 MCP 工具速查

| 工具 | 用途 | 示例 |
|------|------|------|
| `navigate_page` | 导航到URL | `navigate_page("http://localhost:3000")` |
| `take_snapshot` | 获取页面元素 | `take_snapshot()` |
| `take_screenshot` | 截图 | `take_screenshot({ format: "png" })` |
| `list_console_messages` | 控制台消息 | `list_console_messages()` |
| `get_console_message` | 错误详情 | `get_console_message(msgid)` |
| `list_network_requests` | 网络请求 | `list_network_requests()` |
| `click` | 点击元素 | `click(uid)` |
| `fill` | 填写表单 | `fill(uid, "value")` |
| `hover` | 悬停元素 | `hover(uid)` |

---

## 📝 错误处理指南

### 常见错误类型

#### 1. Favicon 404
```
错误: Failed to load resource: favicon.ico (404)
影响: 无害，不影响功能
处理: 添加 favicon 到 index.html
```

#### 2. API 请求失败
```
错误: Failed to load resource: /api/xxx (500)
影响: 功能性错误
处理: 必须修复后端API
```

#### 3. JavaScript 运行时错误
```
错误: TypeError: Cannot read property 'x' of undefined
影响: 功能性错误
处理: 必须修复代码逻辑
```

#### 4. 资源加载失败
```
错误: Failed to load resource: /assets/xxx.js (404)
影响: 功能性错误
处理: 检查构建配置或文件路径
```

### 错误优先级

| 优先级 | 错误类型 | 示例 | 处理 |
|--------|---------|------|------|
| 🔴 P0 | 阻塞性错误 | 白屏、无法登录 | 立即修复 |
| 🟠 P1 | 功能性错误 | API失败、表单提交失败 | 必须修复 |
| 🟡 P2 | 体验性问题 | 样式错误、控制台警告 | 建议修复 |
| 🟢 P3 | 无害错误 | favicon 404 | 可选修复 |

---

## 🎓 示例：完整测试流程

### 验证应用整体功能

```typescript
// 1. 导航到页面
await mcp__chrome-devtools__navigate_page("http://localhost:3000");

// 2. 登录
let snapshot = await mcp__chrome-devtools__take_snapshot();
// 找到姓名输入框（uid=3_57）和邮箱输入框（uid=3_59）
await mcp__chrome-devtools__fill("3_57", "测试用户");
await mcp__chrome-devtools__fill("3_59", "test@example.com");
await mcp__chrome-devtools__click("3_60"); // 点击"进入应用"

// 3. 验证主界面
snapshot = await mcp__chrome-devtools__take_snapshot();
// 确认：
// - 用户信息显示（测试用户）
// - 需求列表加载（50个需求）
// - 迭代池显示（3个迭代池）
// - 统计信息正确

// 4. 测试新增需求
await mcp__chrome-devtools__click("新增需求按钮uid");
snapshot = await mcp__chrome-devtools__take_snapshot();
// 确认弹窗打开，所有表单字段显示

// 5. 检查控制台
messages = await mcp__chrome-devtools__list_console_messages();
// 确认：
// - 无功能性错误
// - 只有 favicon 404（可忽略）

// 6. 截图保存
await mcp__chrome-devtools__take_screenshot({
  format: "png",
  filePath: "docs/screenshots/test-results/main-page.png"
});

// 7. 生成报告
console.log("✅ 所有功能验证通过");
console.log(`控制台错误: ${错误数量}`);
console.log(`页面加载: ${需求数量} 个需求`);
```

---

## 🔍 调试技巧

### 技巧1: 查找元素 UID

```typescript
// 1. 获取快照
snapshot = mcp__chrome-devtools__take_snapshot();

// 2. 搜索关键词
// 在快照中查找 "新增需求" → 找到 uid
// 例如: uid=9_20 button "新增需求"

// 3. 使用 uid 操作
mcp__chrome-devtools__click("9_20");
```

### 技巧2: 分析网络请求

```typescript
// 获取所有请求
requests = mcp__chrome-devtools__list_network_requests();

// 过滤失败的请求
查找 [failed - xxx] 标记

// 获取详细信息
details = mcp__chrome-devtools__get_network_request(reqid);
```

### 技巧3: 监控特定错误类型

```typescript
// 只获取错误消息
messages = mcp__chrome-devtools__list_console_messages();

// 在结果中查找 [error] 类型
// 忽略 [debug] 和 [info]

// 获取错误详情
error = mcp__chrome-devtools__get_console_message(msgid);
```

---

## 📐 项目特定规范

### 本项目的测试场景

#### 1. 登录流程验证
- 填写姓名和邮箱
- 点击"进入应用"
- 验证用户信息显示
- 验证示例数据加载（50个需求）

#### 2. 需求管理功能
- 点击"新增需求"
- 验证表单字段完整性
- 测试表单填写和提交
- 检查需求卡片渲染

#### 3. 筛选和排序
- 测试业务域筛选
- 测试RMS筛选
- 测试排序切换（权重分、业务影响度等）

#### 4. 迭代池功能
- 验证3个迭代池显示
- 测试拖拽排期
- 检查资源计算

#### 5. 导入导出
- 点击"导入"按钮
- 点击"导出"按钮
- 验证功能正常

### 必须检查的控制台错误

**允许的错误**：
- ✅ `favicon.ico` 404 - 无害，不影响功能

**禁止的错误**：
- ❌ 任何 JavaScript TypeError/ReferenceError
- ❌ 任何 API 请求失败（除 favicon）
- ❌ 任何组件渲染错误
- ❌ 任何 React 警告（key、prop-types等）

---

## 🛠️ 故障排查

### 问题1: MCP 工具不可用

**症状**: AI 无法使用 `mcp__chrome-devtools__*` 工具

**解决方案**:
1. 检查 `.mcp.json` 配置是否正确
2. 重启 Claude Code
3. 确保 Chrome 浏览器已安装

### 问题2: 页面导航超时

**症状**: `Navigation timeout exceeded`

**解决方案**:
1. 检查开发服务器是否运行 (`npm run dev`)
2. 访问 http://localhost:3000 确认可访问
3. 增加超时时间参数

### 问题3: 元素 UID 过期

**症状**: `This uid is coming from a stale snapshot`

**解决方案**:
1. 重新调用 `take_snapshot()` 获取最新快照
2. 使用新快照中的 uid

### 问题4: 控制台无消息

**症状**: `<no console messages found>`

**解决方案**:
- 这是正常的！表示页面没有任何消息
- 不是错误，是好事

---

## 📚 相关文档

### 项目文档
- [重构规范](./refactoring-standards.md) - 重构时必须配合测试
- [规范索引](./README.md) - 所有项目规范

### AI 模板（通用）
- [ai-templates/CHROME_DEVTOOLS_TESTING.md](../../ai-templates/CHROME_DEVTOOLS_TESTING.md) - 通用测试规范

### Chrome DevTools MCP 官方文档
- GitHub: https://github.com/AndrewBand/chrome-devtools-mcp
- 工具列表和使用说明

---

## ⚠️ 重要提醒

### 1. MCP 不是测试框架替代品

Chrome DevTools MCP 用于：
- ✅ 开发时的快速验证
- ✅ 重构后的UI检查
- ✅ 控制台错误监控
- ✅ 交互功能测试

**不适合**：
- ❌ 自动化回归测试（需要 CI/CD 集成）
- ❌ 性能测试（需要专门工具）
- ❌ 跨浏览器测试（只支持 Chrome）
- ❌ 大规模并发测试

### 2. 适用场景

**最佳使用场景**：
- AI 辅助开发时的即时验证
- 重构后的快速UI检查
- 调试控制台错误
- 演示和截图

**不推荐场景**：
- 替代单元测试
- 替代集成测试
- 生产环境监控

### 3. 与传统测试的配合

Chrome DevTools MCP 是**补充**，不是替代：

```
开发流程：
1. 写代码
2. Chrome DevTools MCP 快速验证（AI自动）
3. 提交前运行 npm run check-file-size
4. 提交代码
5. CI/CD 运行完整测试（如果有）
```

---

## 📊 成功案例

### 本项目验证结果

**测试时间**: 2025-10-27

**验证内容**:
- ✅ 登录功能 - 表单填写和提交正常
- ✅ 待排期区 - 50个需求正常显示
- ✅ 新增需求 - 弹窗打开，表单完整
- ✅ 筛选功能 - 下拉框交互正常
- ✅ 迭代池 - 3个池正常显示
- ✅ 统计信息 - 数据计算正确

**控制台检查**:
- 错误: 1 (favicon 404)
- 警告: 0
- 页面错误: 0

**结论**: 应用运行完全正常 ✅

---

**版本**: 1.0.0
**最后更新**: 2025-10-27
**维护者**: WSJF 项目团队
