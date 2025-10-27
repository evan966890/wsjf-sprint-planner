# 飞书集成 + Chrome DevTools MCP 技术方案

> **更新时间**：2025-10-27
> 本文档整合了两个重要功能：
> 1. **飞书项目集成** - 从飞书多维表格导入需求
> 2. **Chrome DevTools MCP** - AI 辅助浏览器调试（NEW）

---

## 🔍 Chrome DevTools MCP（NEW - 强烈推荐）

### 什么是 Chrome DevTools MCP？

Chrome DevTools MCP 让 Claude Code 能够像人类开发者一样**"看见"浏览器内部发生的事**，实现对话式调试和性能优化。

**核心价值**：
- ✅ AI 可以自动诊断前端问题（不再需要截图、复制日志）
- ✅ 自动分析性能瓶颈并给出优化建议
- ✅ 实时验证修复效果
- ✅ 效率提升 **6-10倍**

### 一键安装

```bash
# 在 Claude Code 中执行（或直接告诉 Claude）
claude mcp add chrome-devtools npx chrome-devtools-mcp@latest
```

**前置条件**：
- Node.js 22+ （检查：`node -v`）
- Chrome 浏览器

安装后重启 Claude Code 即可使用。

### 快速验证

安装完成后，在 Claude Code 中测试：

```
你：帮我测试 Chrome DevTools MCP 是否安装成功

AI：[自动打开浏览器并截图]
✅ Chrome DevTools MCP 工作正常！
```

### 实战场景示例

**场景 1：调试需求卡片拖拽问题**
```
你：需求卡片拖拽到迭代池有时会失败，帮我查原因

AI：
1. [打开页面 http://localhost:3000]
2. [模拟拖拽操作]
3. [检查控制台错误]
4. [分析 JavaScript 事件]

发现问题：dataTransfer.getData() 时序问题
建议修复：在 handleDragStart 中添加延迟
[自动应用修复]
✅ 验证修复成功
```

**场景 2：性能优化**
```
你：需求列表滚动很卡，帮我优化

AI：
1. [录制性能追踪]
2. [滚动页面]
3. [分析帧率]

发现问题：
- 当前帧率：30fps
- Scripting 占比 85%
- 原因：calculateScores() 重复计算

优化方案：使用 useMemo 缓存
[实施优化]
新帧率：60fps ✅
```

**场景 3：样式调试**
```
你：需求卡片的渐变背景有时不显示

AI：
1. [截图对比]
2. [检查 CSS 样式]
3. [分析 Tailwind 类名]

发现问题：动态类名未被 JIT 编译器识别
修复：添加到 tailwind.config.js safelist
✅ 样式显示正常
```

### 效率对比

**传统调试**：30-60分钟
```
发现问题 → 打开DevTools → 录制分析 → 搜索方案 → 修复 → 验证
```

**使用 MCP**：5-10分钟
```
描述问题 → AI自动诊断 → AI提供方案 → AI验证修复
```

**效率提升：6-10倍** 🚀

### 与 Playwright 的配合

| 工具 | 适用场景 | 核心优势 |
|------|---------|---------|
| **Chrome DevTools MCP** | 开发调试、性能优化 | AI 对话式调试，自动分析 |
| **Playwright** | 自动化测试、CI/CD | 脚本化测试，跨浏览器 |

**推荐工作流**：
- **开发时** → 用 Chrome DevTools MCP 快速调试
- **提交前** → 用 `npm run test:quick` 自动化测试

### 详细文档

**完整配置和使用指南**：[Chrome DevTools MCP 集成方案](docs/chrome-devtools-mcp-setup.md)

包含：
- 高级配置选项
- 常见问题排查
- 最佳实践
- 更多实战案例

---

## 🔗 飞书项目集成使用指南

WSJF已集成飞书项目平台，支持从飞书项目导入需求。本指南将帮助您完成配置并开始使用。

## 前置条件

- ✅ 已在飞书项目平台（MIT空间）安装插件
- ✅ 拥有以下信息：
  - **Plugin ID**: `MII_68F1064FA240006C`
  - **Plugin Secret**: `050E0E049ACB87339CB9D11E5641564F`
  - **User Key**: `7541721806923694188`（您在飞书项目中的用户ID）
  - **Platform Domain**: `https://project.f.mioffice.cn`

## 推荐方式：Cookie认证（最简单）

这是**最简单**的方式，无需获取任何token！

### 步骤

1. **启动WSJF应用**
   ```bash
   npm run dev
   ```
   浏览器会自动打开 http://localhost:3000

2. **在浏览器中登录飞书项目平台**
   - 打开新标签页，访问 https://project.f.mioffice.cn
   - 使用您的飞书账号登录
   - 确认可以看到MIT空间

3. **在WSJF中配置Cookie认证**
   - 在WSJF页面，点击"导入"按钮
   - 选择"从飞书导入"
   - 在认证方式中选择 **"Cookie（推荐）"**
   - 点击"使用Cookie认证"

4. **完成！**
   - WSJF会自动使用您的浏览器登录状态
   - 可以立即选择项目和导入任务

### 优点
- ✅ 无需获取token
- ✅ 无需配置任何密钥
- ✅ 自动复用浏览器登录状态
- ✅ 最安全（不需要存储任何密钥）

---

## 备选方式：手动Token认证

如果Cookie模式不工作，可以使用手动Token模式。

### 步骤1: 获取Plugin Token

**⚠️ 重要提示**：飞书项目平台的Plugin Token需要从开放平台获取。

有两种方式获取：

#### 方式A: 从飞书开放平台获取（推荐）

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 进入您的插件管理页面
3. 导航到：**开发 → 权限管理 → 虚拟Token**
4. 复制显示的Token（格式类似：`p-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）

#### 方式B: 使用PowerShell脚本获取

```powershell
# 运行脚本
.\get-token.ps1
```

**注意**：标准的飞书Open API获取的token可能不适用于飞书项目平台。建议使用方式A。

### 步骤2: 在WSJF中配置

1. **启动WSJF应用**
   ```bash
   npm run dev
   ```

2. **打开飞书导入配置**
   - 点击"导入" → "从飞书导入"
   - 选择认证方式：**"手动Token"**

3. **填写配置信息**
   ```
   Plugin ID:      MII_68F1064FA240006C
   Plugin Secret:  050E0E049ACB87339CB9D11E5641564F
   Platform Domain: https://project.f.mioffice.cn
   Plugin Token:   [粘贴您从开放平台获取的token]
   User Key:       7541721806923694188
   ```

4. **保存并测试**
   - ✅ 勾选"使用飞书项目插件Header"
   - 点击"保存并测试"
   - 如果连接成功，会自动进入项目选择页面

### 步骤3: 导入需求

1. **选择项目**
   - 系统会显示MIT空间下的所有项目
   - 点击要导入的项目

2. **选择任务**
   - 查看项目中的所有工作项
   - 勾选要导入的任务
   - 点击"全选"可以快速选择所有任务

3. **预览和确认**
   - 系统会显示转换后的需求列表
   - 检查字段映射是否正确
   - 点击"确认导入"

4. **完成！**
   - 需求会自动添加到WSJF的待排期区域
   - 可以开始使用WSJF进行优先级评估和排期

---

## 故障排查

### 问题1: Cookie认证失败

**症状**：点击"使用Cookie认证"后显示错误

**解决方案**：
1. 确认已在浏览器中登录飞书项目平台
2. 尝试刷新飞书项目平台页面
3. 清除浏览器缓存后重新登录
4. 如果仍然失败，切换到"手动Token"模式

### 问题2: 手动Token认证失败

**错误代码20039**：plugin_access_token校验失败

**原因**：Plugin Token必须配合User Key使用

**解决方案**：
1. 确认User Key填写正确
2. 确认勾选了"使用飞书项目插件Header"
3. 确认Token从飞书开放平台正确获取

**错误代码401**：认证失败

**解决方案**：
1. 检查Plugin ID和Secret是否正确
2. 确认插件已在飞书项目平台正确安装
3. 尝试重新获取Token

### 问题3: 获取项目列表为空

**原因**：可能没有权限访问MIT空间

**解决方案**：
1. 确认您的账号有MIT空间的访问权限
2. 在飞书项目平台手动确认可以看到MIT空间
3. 检查插件权限配置

### 问题4: CORS错误

**症状**：浏览器控制台显示跨域错误

**原因**：开发服务器代理配置问题

**解决方案**：
```bash
# 重启开发服务器
npm run dev
```

确认vite.config.ts中有代理配置：
```typescript
proxy: {
  '/feishu-proxy': {
    target: 'https://project.f.mioffice.cn',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/feishu-proxy/, ''),
  }
}
```

---

## 技术说明

### 认证模式对比

| 模式 | 复杂度 | 安全性 | 推荐场景 |
|------|--------|--------|----------|
| Cookie | ⭐ 简单 | ⭐⭐⭐ 最安全 | 开发环境，个人使用 |
| 手动Token | ⭐⭐ 中等 | ⭐⭐ 中等 | 需要长期使用，自动化 |
| OAuth | ⭐⭐⭐ 复杂 | ⭐⭐⭐ 最安全 | 生产环境，多用户 |

### 数据映射规则

飞书项目字段 → WSJF字段：
- `name` → `需求名称`
- `estimated_hours` → `工作量(天)` (自动转换：小时 ÷ 8)
- `status` → `技术进度` (映射规则见代码)
- `assignee.name` → `提交人`

### Token有效期

- **Plugin Token**: 约2小时（需要定期刷新）
- **Cookie**: 根据飞书平台会话时长

---

## 快速开始（推荐流程）

```bash
# 1. 启动开发服务器
npm run dev

# 2. 在浏览器中登录飞书项目平台
# 访问 https://project.f.mioffice.cn

# 3. 回到WSJF应用
# 点击"导入" → "从飞书导入" → 选择"Cookie认证"

# 4. 开始导入！
```

---

## 联系支持

如果遇到问题：
1. 查看浏览器控制台的错误信息
2. 查看Network标签页的API请求详情
3. 确认飞书项目平台的访问权限
4. 联系开发团队获取帮助

---

## 版本历史

- **v1.6.0** (2025-10-27)
  - ✨ 新增Cookie认证模式（推荐）
  - ✨ 新增手动Token认证模式
  - 🔧 配置Vite代理解决CORS
  - 📚 完善集成文档

---

**祝您使用愉快！** 🎉
