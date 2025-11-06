# refactoring-assistant

## Description
AI助手重构工作流程专家。当用户请求重构UI组件时，自动引导完整的三阶段重构流程（准备→执行→验证），确保样式一致性和功能完整性。

## Trigger Keywords
- 重构
- refactor
- 拆分文件
- 拆分组件
- 重构UI
- 重构组件

## Instructions

### 核心原则
**重构三大原则**：
- ✅ 功能完整性 > 代码行数
- ✅ 样式和颜色必须保持一致
- ✅ 用户验证是最终把关

### AI助手重构工作流程（必须遵守）

当用户请求重构UI组件时，AI必须按照以下流程执行：

#### 阶段1: 重构前准备（必须询问用户）

**AI回复模板**：
```
我来帮您重构 <组件名>。这是一个UI组件，重构前请先运行：

bash scripts/prepare-refactor.sh <ComponentName>

脚本会引导您完成截图和创建样式快照。

完成后请回复'已完成'，我再开始重构。

或者，如果您已经准备好了，请确认：
□ 已截图保存到 docs/screenshots/before-refactor/
□ 已运行开发服务器

请回复'确认'或'需要帮助'。
```

#### 阶段2: 重构执行（保持样式）

重构过程中必须：
- ✅ 保持所有颜色和渐变效果
- ✅ 保持所有 `type="button"` 属性
- ✅ 保持所有 section 的布局和字段位置
- ✅ 渐进式重构，每完成一个 section 说明保留了哪些样式

重构策略：
1. **业务逻辑 → 提取到 Hook**（优先）
2. **大段 JSX → 拆分为子组件**（次要）
3. **配置/常量 → 独立文件**（必须）

#### 阶段3: 重构后验证（必须提醒用户）

**AI回复模板**：
```
✅ 重构完成！

现在请您验证UI（非常重要）：
1. 打开 http://localhost:3000
2. 对比截图 docs/screenshots/before-refactor/
3. 检查清单：
   □ 标题栏颜色正确？（应该是蓝色渐变）
   □ Section背景颜色正确？
   □ 按钮点击正常？（不会下载文件）
   □ 所有字段位置正确？

请告诉我验证结果：
- '一致' → 重构成功
- '有差异' → 请详细说明，我会修复或回滚
```

### 禁止的行为
- ❌ 直接开始重构，不询问用户准备
- ❌ 重构完成后不提醒用户验证UI
- ❌ 用户说"有问题"时辩解，应立即修复或回滚

### 用户手动操作流程参考

**方法1: 使用准备脚本（推荐）**
```bash
bash scripts/prepare-refactor.sh EditRequirementModal
# 脚本会引导完成所有准备工作
```

**方法2: 手动准备**
1. 运行 `npm run dev`
2. 截图保存所有UI状态到 `docs/screenshots/before-refactor/`
3. 告诉AI"已完成截图，开始重构吧"

**重构后验证**：
1. 打开 http://localhost:3000
2. 对比截图
3. 反馈给AI验证结果

### 相关文档
详见项目文档：
- docs/standards/refactoring-standards.md - 强制执行规范
- docs/checklists/refactoring-checklist.md
- docs/refactoring-lessons/refactoring-bug-analysis.md
