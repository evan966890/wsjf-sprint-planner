# Chrome DevTools MCP 测试规范（通用模板）

> **版本**: 1.0.0
> **最后更新**: 2025-10-27
> **适用项目**: 所有 Web 前端项目
> **可复用性**: ✅ 可直接复制到新项目

---

## 📖 为什么选择 Chrome DevTools MCP？

### 传统测试方案的问题

**Playwright / Puppeteer 等测试框架**：
- ❌ 需要安装大量依赖（100MB+）
- ❌ 需要复杂配置（配置文件、测试脚本）
- ❌ 运行速度慢（启动浏览器、等待测试套件）
- ❌ AI 需要编写测试代码才能验证
- ❌ 用户需要学习测试框架

**Chrome DevTools MCP 的优势**：
- ✅ **零依赖** - 无需安装任何测试框架
- ✅ **零配置** - 只需一个配置文件
- ✅ **即时验证** - AI 直接操作浏览器，实时反馈
- ✅ **完整工具** - 控制台、网络、元素检查、截图
- ✅ **真实环境** - 真实浏览器，非 headless 模拟

### 适用场景

| 场景 | Chrome DevTools MCP | 传统测试框架 |
|------|---------------------|-------------|
| **AI 辅助开发时即时验证** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **重构后 UI 快速检查** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **控制台错误监控** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **CI/CD 自动化测试** | ⭐ | ⭐⭐⭐⭐⭐ |
| **跨浏览器测试** | ⭐ | ⭐⭐⭐⭐⭐ |
| **性能测试** | ⭐⭐ | ⭐⭐⭐⭐ |

**推荐策略**：Chrome DevTools MCP 用于开发验证，传统测试框架用于 CI/CD。

---

## 🚀 快速开始

### 步骤1: 创建 MCP 配置

在项目根目录创建 `.mcp.json`：

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

### 步骤2: 重启 Claude Code

配置后需要重启 Claude Code 以加载 MCP 服务器。

### 步骤3: 验证安装

让 AI 执行：
```typescript
mcp__chrome-devtools__list_pages()
```

如果返回页面列表，说明安装成功！

---

## 🧪 AI 测试工作流程

### 黄金法则

**AI 在以下情况必须主动使用 Chrome DevTools MCP**：

1. ✅ 用户要求"检查控制台错误"
2. ✅ 用户要求"验证功能"或"测试功能"
3. ✅ 重构代码后（必须验证 UI 完整性）
4. ✅ 修改 UI 组件后（必须截图对比）
5. ✅ 添加新功能后（必须测试交互）

### 标准测试流程

```
第1步：导航 → 第2步：快照 → 第3步：交互 → 第4步：检查 → 第5步：报告
```

**详细步骤**：

#### 第1步：导航到页面
```typescript
// 导航到本地开发服务器（根据项目调整端口）
mcp__chrome-devtools__navigate_page("http://localhost:3000")
```

#### 第2步：获取页面快照
```typescript
// 获取所有可交互元素
snapshot = mcp__chrome-devtools__take_snapshot()

// 分析快照：
// - 找到关键按钮/表单的 uid
// - 验证预期元素存在
// - 记录需要测试的元素
```

#### 第3步：执行交互操作
```typescript
// 点击按钮
mcp__chrome-devtools__click(按钮uid)

// 填写表单
mcp__chrome-devtools__fill(输入框uid, "测试值")

// 悬停元素（测试 hover 效果）
mcp__chrome-devtools__hover(元素uid)
```

#### 第4步：检查结果
```typescript
// 检查控制台错误
messages = mcp__chrome-devtools__list_console_messages()
查找 [error] 类型消息

// 检查网络请求
requests = mcp__chrome-devtools__list_network_requests()
查找失败的请求

// 再次快照（验证交互结果）
新snapshot = mcp__chrome-devtools__take_snapshot()
确认预期变化发生（弹窗打开、数据更新等）
```

#### 第5步：生成报告
```typescript
// 截图保存
mcp__chrome-devtools__take_screenshot({
  format: "png",
  filePath: "docs/screenshots/test-result.png"
})

// 输出验证结果
✅ 功能正常
✅ 控制台无错误
✅ UI 渲染完整
```

---

## 📋 测试场景模板

### 模板1: 基础功能验证

**用途**: 验证应用是否正常启动和运行

```typescript
// 1. 导航到页面
mcp__chrome-devtools__navigate_page("http://localhost:PORT")

// 2. 等待加载
等待 3-5 秒

// 3. 检查控制台
messages = mcp__chrome-devtools__list_console_messages()
确认无功能性错误

// 4. 检查元素
snapshot = mcp__chrome-devtools__take_snapshot()
确认关键元素存在

// 5. 截图
mcp__chrome-devtools__take_screenshot()

报告：✅ 页面正常加载
```

### 模板2: 表单交互测试

**用途**: 验证表单填写和提交功能

```typescript
// 1. 获取页面元素
snapshot = mcp__chrome-devtools__take_snapshot()

// 2. 找到表单按钮
找到 "新增/编辑" 等按钮

// 3. 打开表单
mcp__chrome-devtools__click(按钮uid)

// 4. 填写表单
新snapshot = mcp__chrome-devtools__take_snapshot()
mcp__chrome-devtools__fill(字段1uid, "值1")
mcp__chrome-devtools__fill(字段2uid, "值2")

// 5. 提交验证
mcp__chrome-devtools__click(提交按钮uid)
检查是否有成功提示或错误

// 6. 检查控制台
messages = mcp__chrome-devtools__list_console_messages()
确认无错误

报告：✅ 表单功能正常
```

### 模板3: 重构后对比验证

**用途**: 重构后验证 UI 和功能完整性

```typescript
// === 重构前 ===
// 1. 截图保存 baseline
mcp__chrome-devtools__navigate_page("http://localhost:PORT")
mcp__chrome-devtools__take_screenshot({
  filePath: "docs/screenshots/before-refactor/component.png"
})

// 2. 记录元素列表
baseline_snapshot = mcp__chrome-devtools__take_snapshot()
// 保存关键元素清单

// === 重构后 ===
// 3. 重新截图
mcp__chrome-devtools__navigate_page("http://localhost:PORT")
mcp__chrome-devtools__take_screenshot({
  filePath: "docs/screenshots/after-refactor/component.png"
})

// 4. 对比元素
新snapshot = mcp__chrome-devtools__take_snapshot()
对比元素列表是否一致

// 5. 功能测试
测试关键交互（点击按钮、填写表单等）

// 6. 控制台检查
messages = mcp__chrome-devtools__list_console_messages()
确认无新增错误

// 7. 生成对比报告
- 元素数量对比
- 功能测试结果
- 控制台错误对比
- UI 视觉对比（手动查看截图）

报告：✅ 重构成功，UI 和功能完整
```

### 模板4: 控制台错误诊断

**用途**: 快速定位和修复控制台错误

```typescript
// 1. 导航到问题页面
mcp__chrome-devtools__navigate_page("http://localhost:PORT/问题路径")

// 2. 获取所有控制台消息
messages = mcp__chrome-devtools__list_console_messages()

// 3. 分析错误
for each message:
  if type == 'error':
    detail = mcp__chrome-devtools__get_console_message(msgid)
    分析错误原因
    定位代码位置

// 4. 检查网络请求
requests = mcp__chrome-devtools__list_network_requests()
查找失败的请求
获取详细信息

// 5. 截图保存错误状态
mcp__chrome-devtools__take_screenshot({
  filePath: "docs/debug/error-screenshot.png"
})

// 6. 生成诊断报告
列出所有错误
提供修复建议

报告：找到 X 个错误，建议修复...
```

---

## 🎯 最佳实践

### ✅ 推荐做法

#### 1. 重构前必须截图
```
重构前：
1. 导航到页面
2. 截图保存到 docs/screenshots/before-refactor/
3. 记录元素 uid 列表

重构后：
1. 重新截图到 docs/screenshots/after-refactor/
2. 使用 Chrome DevTools MCP 对比元素
3. 测试关键交互
```

#### 2. 分层验证策略
```
L1（快速验证）：
- 导航 + 快照 + 控制台检查
- 耗时：10-30秒
- 适用：小改动后验证

L2（标准验证）：
- L1 + 关键交互测试 + 截图
- 耗时：1-2分钟
- 适用：功能开发后验证

L3（完整验证）：
- L2 + 所有功能测试 + 对比截图
- 耗时：3-5分钟
- 适用：重构后验证
```

#### 3. 自动化 AI 验证

**在项目规范中添加**：
```markdown
## AI 测试规范

当 AI 完成以下任务后，必须主动使用 Chrome DevTools MCP 验证：

1. 重构 UI 组件
2. 修改表单逻辑
3. 添加新功能
4. 修复 Bug

验证流程：
1. 导航到页面
2. 检查控制台错误
3. 测试关键交互
4. 截图保存
5. 报告验证结果
```

#### 4. 错误分类处理

```
无害错误（可忽略）：
- favicon.ico 404
- Chrome 扩展错误
- 开发者工具提示

功能性错误（必须修复）：
- JavaScript 运行时错误
- API 请求失败
- 资源加载失败
- React 警告
```

### ❌ 避免的做法

1. **不要跳过控制台检查**
   - 即使 UI "看起来正常"
   - 错误可能在特定条件下触发

2. **不要只截图不测试**
   - 截图是静态的
   - 必须测试交互功能

3. **不要忽略网络请求**
   - API 失败可能延迟出现
   - 检查所有请求状态

4. **不要重复 navigate 同一页面**
   - 使用 `take_snapshot()` 获取最新状态
   - 避免不必要的页面刷新

---

## 🛠️ 工具速查表

### 核心工具

| 工具 | 用途 | 返回 | 示例 |
|------|------|------|------|
| `navigate_page` | 导航到URL | 页面信息 | `navigate_page("http://localhost:3000")` |
| `take_snapshot` | 获取页面元素树 | 元素列表（uid） | `take_snapshot()` |
| `take_screenshot` | 截图 | 图片 | `take_screenshot({ format: "png" })` |
| `list_console_messages` | 控制台消息列表 | 消息数组 | `list_console_messages()` |
| `get_console_message` | 错误详情 | 完整错误信息 | `get_console_message(msgid)` |
| `list_network_requests` | 网络请求列表 | 请求数组 | `list_network_requests()` |
| `get_network_request` | 请求详情 | 完整请求信息 | `get_network_request(reqid)` |

### 交互工具

| 工具 | 用途 | 参数 | 示例 |
|------|------|------|------|
| `click` | 点击元素 | uid | `click("9_20")` |
| `fill` | 填写表单 | uid, value | `fill("9_57", "测试")` |
| `fill_form` | 批量填写 | 元素数组 | `fill_form([{uid, value}, ...])` |
| `hover` | 悬停元素 | uid | `hover("9_10")` |
| `drag` | 拖拽元素 | from_uid, to_uid | `drag("9_1", "9_2")` |

### 高级工具

| 工具 | 用途 | 场景 |
|------|------|------|
| `evaluate_script` | 执行 JavaScript | 获取自定义数据 |
| `wait_for` | 等待文本出现 | 等待异步加载 |
| `handle_dialog` | 处理对话框 | alert/confirm |
| `resize_page` | 调整窗口大小 | 响应式测试 |

---

## 📊 测试检查清单模板

### 提交前检查清单

复制到项目的 `docs/checklists/pre-commit-checklist.md`：

```markdown
## Chrome DevTools MCP 验证清单

提交代码前，AI 或开发者必须完成：

- [ ] 导航到 http://localhost:PORT 成功
- [ ] 控制台无功能性错误
- [ ] 关键按钮可点击（列出项目的关键按钮）
- [ ] 表单填写正常
- [ ] 数据加载正常
- [ ] 截图验证 UI 完整（如果是 UI 变更）

如有错误：
- [ ] 已分类错误（功能性 vs 无害）
- [ ] 已修复所有功能性错误
- [ ] 已记录无害错误（如 favicon）
```

### 重构后检查清单

复制到项目的 `docs/checklists/refactoring-checklist.md`：

```markdown
## 重构后 Chrome DevTools MCP 验证

重构 UI 组件后，必须完成：

- [ ] 重构前已截图保存（docs/screenshots/before-refactor/）
- [ ] 重构后已截图保存（docs/screenshots/after-refactor/）
- [ ] 视觉对比一致（颜色、布局、样式）
- [ ] 所有按钮可点击
- [ ] 所有表单可填写
- [ ] 控制台无新增错误
- [ ] 网络请求无新增失败
- [ ] 关键交互功能正常（列出项目的关键交互）

对比项目：
- [ ] 元素数量一致
- [ ] 按钮 type 属性保留
- [ ] 所有颜色和渐变保留
- [ ] 字段位置和顺序一致
```

---

## 🎓 使用示例

### 示例1: 验证登录功能

```typescript
// 场景：用户要求"检查登录功能是否正常"

// 1. 导航到页面
mcp__chrome-devtools__navigate_page("http://localhost:3000")

// 2. 获取登录表单
snapshot = mcp__chrome-devtools__take_snapshot()
// 找到：
// - 姓名输入框 (uid=3_57)
// - 邮箱输入框 (uid=3_59)
// - 登录按钮 (uid=3_60)

// 3. 填写登录信息
mcp__chrome-devtools__fill("3_57", "测试用户")
mcp__chrome-devtools__fill("3_59", "test@example.com")

// 4. 点击登录
mcp__chrome-devtools__click("3_60")

// 5. 验证登录成功
新snapshot = mcp__chrome-devtools__take_snapshot()
// 查找用户信息显示：
// - 应该看到 "测试用户 (test@example.com)"

// 6. 检查控制台
messages = mcp__chrome-devtools__list_console_messages()
// 确认无错误

// 7. 截图保存
mcp__chrome-devtools__take_screenshot()

// AI 报告：
✅ 登录功能正常
✅ 用户信息显示正确
✅ 控制台无错误
```

### 示例2: 重构后验证

```typescript
// 场景：AI 刚完成组件重构

// === 重构前（AI 应该主动做）===
// 1. 导航并截图
mcp__chrome-devtools__navigate_page("http://localhost:3000")
mcp__chrome-devtools__take_screenshot({
  filePath: "docs/screenshots/before-refactor/modal-component.png"
})

// 2. 记录元素
baseline_snapshot = mcp__chrome-devtools__take_snapshot()
// 记录关键元素：
// - 按钮数量: 5
// - 输入框数量: 8
// - 下拉框数量: 6

// === 执行重构 ===
// [AI 重构代码...]

// === 重构后验证 ===
// 3. 重新导航和截图
mcp__chrome-devtools__navigate_page("http://localhost:3000")
mcp__chrome-devtools__take_screenshot({
  filePath: "docs/screenshots/after-refactor/modal-component.png"
})

// 4. 对比元素
新snapshot = mcp__chrome-devtools__take_snapshot()
// 验证：
// - 按钮数量: 5 ✅
// - 输入框数量: 8 ✅
// - 下拉框数量: 6 ✅

// 5. 功能测试
// 点击 "新增需求" 按钮
mcp__chrome-devtools__click(按钮uid)
// 确认弹窗打开

// 6. 控制台检查
messages = mcp__chrome-devtools__list_console_messages()
对比重构前后错误数量

// AI 报告：
✅ 重构验证通过
✅ UI 元素完整（5按钮/8输入/6下拉）
✅ 交互功能正常
✅ 控制台无新增错误
⚠️ 建议：人工查看截图对比颜色
```

### 示例3: 新功能验证

```typescript
// 场景：AI 刚添加了一个新按钮

// 1. 导航到页面
mcp__chrome-devtools__navigate_page("http://localhost:3000")

// 2. 查找新按钮
snapshot = mcp__chrome-devtools__take_snapshot()
// 搜索按钮文本，例如 "从飞书导入"
// 找到 uid=6_9 button "从飞书导入"

// 3. 截图保存
mcp__chrome-devtools__take_screenshot({
  filePath: "docs/screenshots/new-feature/feishu-import-btn.png"
})

// 4. 测试点击
mcp__chrome-devtools__click("6_9")

// 5. 验证交互结果
新snapshot = mcp__chrome-devtools__take_snapshot()
// 确认预期行为（弹窗打开/页面跳转等）

// 6. 控制台检查
messages = mcp__chrome-devtools__list_console_messages()
// 确认无错误

// AI 报告：
✅ 新按钮已添加
✅ 点击功能正常
✅ 控制台无错误
```

---

## 🔍 故障排查

### 问题1: MCP 工具不可用

**症状**: AI 提示 "工具不可用" 或 找不到 `mcp__chrome-devtools__*` 工具

**原因**:
- MCP 配置文件不存在或格式错误
- Claude Code 未重启
- MCP 服务器未启动

**解决方案**:
1. 检查 `.mcp.json` 配置格式
2. 重启 Claude Code
3. 确保 Chrome 浏览器已安装

### 问题2: 导航超时

**症状**: `Navigation timeout exceeded`

**原因**:
- 开发服务器未运行
- 端口不正确
- 页面加载过慢

**解决方案**:
1. 确认开发服务器运行：`npm run dev`
2. 确认端口正确（检查 vite.config 或 package.json）
3. 增加超时时间参数

### 问题3: 元素 UID 过期

**症状**: `This uid is coming from a stale snapshot`

**原因**:
- 页面已更新，快照过期
- 使用了之前的 uid

**解决方案**:
- 重新调用 `take_snapshot()` 获取最新快照
- 使用新快照中的 uid

### 问题4: 点击无响应

**症状**: 点击按钮后无反应

**原因**:
- 元素被遮挡
- 元素不可点击（disabled）
- 需要等待异步加载

**解决方案**:
1. 检查 snapshot 中元素的 `disabled` 属性
2. 使用 `wait_for("预期文本")` 等待加载
3. 检查是否有弹窗遮挡

---

## 📐 项目集成指南

### 新项目集成步骤

**步骤1: 创建配置文件**
```bash
# 创建 .mcp.json
cat > .mcp.json << 'EOF'
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
EOF
```

**步骤2: 创建文档目录**
```bash
# 创建截图目录
mkdir -p docs/screenshots/{before-refactor,after-refactor,test-results}

# 创建规范目录
mkdir -p docs/standards
mkdir -p docs/checklists
```

**步骤3: 复制规范文档**
```bash
# 从模板复制
cp ai-templates/CHROME_DEVTOOLS_TESTING.md docs/standards/chrome-devtools-testing-standards.md

# 编辑项目特定信息：
# - 端口号（localhost:3000 → 你的端口）
# - 关键功能清单
# - 项目特定测试场景
```

**步骤4: 更新项目规范**

在 `.claude/project-rules.md` 或 `CLAUDE.md` 中添加：

```markdown
## 测试和验证规范

本项目使用 Chrome DevTools MCP 进行 UI 测试和验证。

### AI 测试职责

AI 在以下情况必须主动使用 Chrome DevTools MCP：
1. 重构 UI 组件后
2. 修改表单逻辑后
3. 添加新功能后
4. 用户要求"检查错误"时

详见：[Chrome DevTools 测试规范](docs/standards/chrome-devtools-testing-standards.md)
```

**步骤5: 验证安装**
```bash
# 重启 Claude Code

# 让 AI 执行验证
# AI: "请使用 Chrome DevTools MCP 检查页面"
```

---

## 🎨 截图组织规范

### 目录结构

```
docs/screenshots/
├── before-refactor/        # 重构前截图
│   ├── modal-component.png
│   └── form-component.png
├── after-refactor/         # 重构后截图
│   ├── modal-component.png
│   └── form-component.png
├── test-results/           # 测试结果截图
│   ├── login-success.png
│   └── error-state.png
└── debug/                  # 调试截图
    └── console-error.png
```

### 命名规范

```
格式: {功能模块}-{状态}.png

示例:
✅ login-modal-open.png          # 登录弹窗打开状态
✅ requirement-card-hover.png    # 需求卡片悬停效果
✅ import-modal-filled.png       # 导入弹窗填写完成
❌ screenshot1.png               # 不明确
❌ test.png                      # 不明确
```

---

## 🤖 AI 助手使用规范

### AI 必须主动验证的场景

**场景1: 重构 UI 组件**
```
用户: "帮我重构 EditRequirementModal 组件"

AI 流程:
1. 询问用户是否已启动开发服务器
2. 重构前截图保存
3. 执行重构
4. 重构后截图和功能验证
5. 报告验证结果
6. 提醒用户人工查看截图对比

禁止：
❌ 重构完直接提交，不验证
❌ 只运行代码审查，不测试功能
```

**场景2: 修复 Bug**
```
用户: "修复表单提交的 Bug"

AI 流程:
1. 理解 Bug 描述
2. 修复代码
3. 导航到页面测试修复
4. 填写表单并提交
5. 检查控制台是否还有错误
6. 报告修复结果

禁止：
❌ 修复代码后不测试
❌ 假设修复成功，不验证
```

**场景3: 添加新功能**
```
用户: "添加一个导出 PDF 的按钮"

AI 流程:
1. 添加按钮代码
2. 导航到页面
3. 查找新按钮（take_snapshot）
4. 截图保存
5. 测试点击功能
6. 检查控制台错误
7. 报告新功能状态

禁止：
❌ 添加代码后不验证按钮是否显示
❌ 不测试点击功能
```

### AI 报告模板

**标准验证报告**：
```markdown
## Chrome DevTools MCP 验证报告

### 验证内容
- ✅ 页面导航成功
- ✅ 控制台检查完成
- ✅ 功能测试完成
- ✅ 截图已保存

### 验证结果
**控制台**:
- 错误: 0
- 警告: 0
- 页面错误: 0

**功能测试**:
- ✅ 登录流程正常
- ✅ 表单填写正常
- ✅ 按钮点击正常

**网络请求**:
- 成功: 92/93
- 失败: 1 (favicon.ico - 无害)

### 截图
- 保存位置: docs/screenshots/test-results/xxx.png

### 结论
✅ 所有功能验证通过，应用运行正常！
```

---

## 📚 相关资源

### 官方文档
- Chrome DevTools MCP: https://github.com/AndrewBand/chrome-devtools-mcp
- MCP 协议: https://github.com/anthropics/mcp

### 项目文档
- 创建 `docs/standards/chrome-devtools-testing-standards.md` - 项目特定规范
- 创建 `docs/checklists/testing-checklist.md` - 测试检查清单

### AI 协作
- 在 `CLAUDE.md` 中引用本规范
- 在重构规范中要求使用 Chrome DevTools MCP 验证

---

## 🔄 迁移指南

### 从 Playwright 迁移

**步骤1: 卸载依赖**
```bash
npm uninstall @playwright/test pixelmatch pngjs
```

**步骤2: 删除配置**
```bash
rm playwright.config.ts
rm -rf tests/
rm -rf playwright-report/
```

**步骤3: 删除脚本**
```bash
rm scripts/*test*.sh
rm scripts/*playwright*.sh
```

**步骤4: 清理 package.json**
```json
// 删除所有 test:* 命令
// 只保留核心命令：dev, build, preview
```

**步骤5: 配置 MCP**
```bash
# 创建 .mcp.json（参考快速开始）
```

**步骤6: 更新文档**
- 删除 Playwright 相关文档
- 添加 Chrome DevTools MCP 规范
- 更新 CLAUDE.md 和 README

---

## ⚡ 性能优化建议

### 减少不必要的操作

```typescript
// ❌ 低效做法
mcp__chrome-devtools__navigate_page("http://localhost:3000")
mcp__chrome-devtools__take_snapshot()
mcp__chrome-devtools__click(button)
mcp__chrome-devtools__take_snapshot() // 重复
mcp__chrome-devtools__take_snapshot() // 重复

// ✅ 高效做法
mcp__chrome-devtools__navigate_page("http://localhost:3000")
snapshot1 = mcp__chrome-devtools__take_snapshot()
mcp__chrome-devtools__click(button)
snapshot2 = mcp__chrome-devtools__take_snapshot() // 只在需要时
```

### 批量操作

```typescript
// ❌ 一次一个
mcp__chrome-devtools__fill(uid1, "value1")
mcp__chrome-devtools__fill(uid2, "value2")
mcp__chrome-devtools__fill(uid3, "value3")

// ✅ 批量填写
mcp__chrome-devtools__fill_form([
  { uid: uid1, value: "value1" },
  { uid: uid2, value: "value2" },
  { uid: uid3, value: "value3" }
])
```

---

## 💡 进阶技巧

### 技巧1: 使用 verbose snapshot 获取详细信息

```typescript
// 标准快照（快速）
snapshot = mcp__chrome-devtools__take_snapshot()
// 只包含基本信息

// 详细快照（完整）
verbose_snapshot = mcp__chrome-devtools__take_snapshot({ verbose: true })
// 包含所有属性、样式、状态
```

### 技巧2: 执行自定义 JavaScript

```typescript
// 获取自定义数据
result = mcp__chrome-devtools__evaluate_script(`
  () => {
    return {
      requirementCount: document.querySelectorAll('.requirement-card').length,
      totalScore: document.querySelector('.total-score')?.textContent
    }
  }
`)
```

### 技巧3: 等待异步加载

```typescript
// 点击导入按钮后等待数据加载
mcp__chrome-devtools__click(导入按钮uid)
mcp__chrome-devtools__wait_for("导入成功", { timeout: 5000 })
// 然后再验证结果
```

---

## 📖 学习路径

### 新手入门

1. **第一步**: 阅读本文档的"快速开始"部分
2. **第二步**: 让 AI 执行"示例1: 验证登录功能"
3. **第三步**: 观察 AI 的操作流程
4. **第四步**: 尝试自己描述测试需求，让 AI 执行

### 进阶使用

1. 学习所有工具的用法（工具速查表）
2. 理解测试场景模板
3. 自定义项目的测试检查清单
4. 集成到 CI/CD（可选）

---

## 🎯 效果对比

### Playwright vs Chrome DevTools MCP

| 指标 | Playwright | Chrome DevTools MCP | 提升 |
|------|------------|---------------------|------|
| **安装时间** | 2-5分钟 | 10秒 | ⬆️ 12-30x |
| **配置复杂度** | 高（需编写测试） | 低（一个配置文件） | ⬆️ 简化90% |
| **验证速度** | 30-120秒 | 5-15秒 | ⬆️ 6-8x |
| **AI 学习成本** | 高（需了解测试框架） | 低（自然语言描述） | ⬆️ 简化80% |
| **依赖大小** | ~100MB | ~0MB | ⬆️ 节省100MB |
| **适用场景** | CI/CD 自动化 | 开发时即时验证 | 互补 |

### 实际案例

**本项目迁移效果**：
- 卸载依赖: -5个包
- 删除文件: -60+ 测试文件
- 简化 scripts: -4个脚本
- 清理文档: -6个测试文档
- 验证速度: 从120秒 → 15秒（⬆️ 8x）

---

## ⚠️ 注意事项

### 1. 不是测试框架替代品

Chrome DevTools MCP 是**开发验证工具**，不是**自动化测试框架**。

**它擅长**：
- ✅ 开发时快速验证
- ✅ 重构后 UI 检查
- ✅ 控制台错误监控
- ✅ AI 辅助调试

**它不擅长**：
- ❌ 回归测试（需要测试框架）
- ❌ CI/CD 集成（需要无头模式）
- ❌ 性能测试（需要专门工具）
- ❌ 跨浏览器测试（只支持 Chrome）

### 2. 需要开发服务器运行

所有测试都需要：
```bash
npm run dev  # 或其他启动命令
```

确保服务器在 `http://localhost:PORT` 可访问。

### 3. 保持快照新鲜

```typescript
// ❌ 错误：使用旧快照
snapshot = take_snapshot()
click(button)
click(旧快照中的uid) // 错误！

// ✅ 正确：重新获取快照
snapshot = take_snapshot()
click(button)
新snapshot = take_snapshot()
click(新快照中的uid) // 正确
```

---

## 🤝 贡献和改进

### 如何改进本规范？

1. **发现新的测试场景**
   - 在实际使用中记录
   - 添加到"测试场景模板"部分

2. **发现新的最佳实践**
   - 总结经验
   - 更新"最佳实践"部分

3. **发现故障排查方法**
   - 记录问题和解决方案
   - 更新"故障排查"部分

4. **更新版本号**
   - 小改动: 1.0.0 → 1.0.1
   - 新增章节: 1.0.0 → 1.1.0
   - 重大变更: 1.0.0 → 2.0.0

---

**版本**: 1.0.0
**最后更新**: 2025-10-27
**适用项目**: 所有 Web 前端项目
**可复用性**: ✅ 可直接复制到新项目
