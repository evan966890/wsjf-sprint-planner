# 重构规范 (Refactoring Standards)

> ⚠️ **强制执行**: 所有重构工作必须严格遵守本规范

**版本**: v1.0
**最后更新**: 2025-10-25
**适用范围**: 所有代码重构工作

---

## 🎯 重构目标

重构的目标排序（优先级从高到低）：

1. **功能完整性** - 不引入bug，不丢失功能
2. **可维护性** - 代码清晰，易于理解
3. **性能优化** - 提升运行效率
4. **代码简洁** - 减少冗余代码

**核心原则**: 质量 > 速度，功能完整性 > 代码行数

---

## 📋 强制性规范

### 1. 样式和UI完整性规范 ⭐⭐⭐

#### 1.1 颜色保持规范
**规定**: 重构时必须保持原有的颜色方案

**常见丢失的样式**:
```tsx
// ❌ 错误：丢失了颜色
<div className="bg-gray-50">

// ✅ 正确：保持原有的蓝色渐变
<div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
```

**检查方法**:
```bash
# 检查是否有丢失的渐变样式
git diff | grep -E "^\-.*bg-gradient"

# 检查是否有丢失的彩色背景
git diff | grep -E "^\-.*bg-(blue|purple|green|red|yellow|indigo)"
```

#### 1.2 必须保持的UI元素
- ✅ 彩色的section背景（不能全部变成灰色）
- ✅ 渐变效果（gradient）
- ✅ 图标颜色（icon colors）
- ✅ 按钮状态（hover/active/disabled）
- ✅ 边框样式（border colors）
- ✅ 文本颜色（text colors）

#### 1.3 标准颜色映射

**EditRequirementModal 标准配色**:
```tsx
// 标题栏 - 蓝色渐变
<div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">

// 业务影响度评分 - 蓝色主题
<div className="bg-blue-50 border-2 border-blue-200">

// AI智能打分 - 紫色渐变主题
<div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300">

// 技术评估 - 橙色图标主题
<Settings className="text-orange-600" />
<div className="bg-gray-50 border border-gray-200">  // 此处灰色正常

// 影响范围 - 绿色图标主题
<Store className="text-green-600" />
```

---

### 2. 属性完整性规范 ⭐⭐⭐

#### 2.1 按钮 type 属性
**规定**: 所有 `<button>` 必须显式声明 `type` 属性

```tsx
// ❌ 错误
<button onClick={...}>

// ✅ 正确
<button type="button" onClick={...}>
```

#### 2.2 关键HTML属性
必须保留的属性：
- `type` (button, submit, reset)
- `className` (特别是颜色相关的class)
- `id` 和 `data-*` 属性
- `aria-*` 无障碍属性
- 事件处理器（onClick, onChange等）

---

### 3. 重构前准备规范 ⭐⭐⭐

#### 3.1 必须完成的准备工作
- [ ] 阅读 [重构检查清单](../checklists/refactoring-checklist.md)
- [ ] 记录当前文件行数
- [ ] **截图所有UI状态**（默认、hover、激活、错误、成功等）
- [ ] **记录所有颜色和样式** （创建样式快照）
- [ ] 提取关键代码片段作为参考
- [ ] 创建测试清单

#### 3.2 样式快照创建方法
```bash
# 1. 导出所有 className 到文件
git show HEAD:src/components/XXX.tsx | \
  grep -o 'className="[^"]*"' | \
  sort | uniq > styles-before.txt

# 2. 重构后对比
grep -o 'className="[^"]*"' src/components/XXX.tsx | \
  sort | uniq > styles-after.txt

# 3. 找出差异
diff styles-before.txt styles-after.txt
```

---

### 4. 重构中执行规范 ⭐⭐⭐

#### 4.1 渐进式重构
- 每次只重构一个小模块
- 每完成一个模块立即验证
- 频繁 commit（每个模块一次）

#### 4.2 定期检查（每30分钟）
```bash
# 1. 查看 diff
git diff

# 2. 检查丢失的样式
git diff | grep -E "^\-.*className.*bg-" | wc -l
git diff | grep -E "^\+.*className.*bg-" | wc -l
# 两个数字应该相近

# 3. 检查丢失的 type 属性
git diff | grep -E "^\-.*type=\"button\"" | wc -l
# 应该是 0

# 4. 检查丢失的颜色
git diff | grep -E "^\-.*text-(blue|purple|green|red|orange|yellow)"
```

---

### 5. 重构后验证规范 ⭐⭐⭐

#### 5.1 自动化检查（必须全部通过）
```bash
# 1. Pre-commit 检查
npm run pre-commit

# 2. TypeScript 编译
npx tsc --noEmit

# 3. ESLint 检查
npm run lint

# 4. 生产构建
npm run build
```

#### 5.2 手动UI测试（必须全部测试）
- [ ] 打开所有模态框/弹窗
- [ ] 检查所有section的背景颜色
- [ ] 检查所有按钮的hover状态
- [ ] 检查所有图标的颜色
- [ ] 检查所有边框的颜色
- [ ] 对比截图，确认UI一致

#### 5.3 样式对比验证
```bash
# 对比 className 差异
diff styles-before.txt styles-after.txt

# 应该只有以下类型的差异：
# - 重构引入的新组件类名（预期的）
# - 布局调整的类名变化（可接受的）
# ❌ 不应该有：颜色类名的删除或改变
```

---

### 6. 质量自评规范 ⭐⭐

#### 6.1 评分标准

| 项目 | 权重 | 自评 (1-5) | 检查项 |
|------|------|-----------|--------|
| **功能完整性** | 40% | [ ] | 无功能丢失、无bug |
| **UI完整性** | 20% | [ ] | 颜色、样式保持一致 |
| **代码简洁性** | 15% | [ ] | 行数减少 > 30% |
| **测试覆盖率** | 15% | [ ] | 所有测试通过 |
| **可维护性** | 10% | [ ] | 代码清晰易读 |
| **总分** | 100% | [ ] | ≥ 4.0 才能提交 |

#### 6.2 提交标准
- ✅ 总分 ≥ 4.5 - 优秀，可以提交
- ✅ 总分 4.0-4.4 - 良好，可以提交
- ⚠️ 总分 3.5-3.9 - 需要改进
- ❌ 总分 < 3.5 - 不能提交

---

## 🚫 禁止的重构模式

### 1. 批量替换样式
```tsx
// ❌ 禁止：一次性将所有彩色背景改成灰色
// 从 bg-blue-50 → bg-gray-50
// 从 bg-purple-50 → bg-gray-50
// 理由：丢失了UI的视觉层次

// ✅ 正确：保持原有的颜色方案
// bg-blue-50 → bg-blue-50
// bg-purple-50 → bg-purple-50
```

### 2. 删除"看起来没用"的类名
```tsx
// ❌ 禁止：删除渐变类名
<div className="bg-blue-50">  // 删除了 bg-gradient-to-br

// ✅ 正确：保留所有样式类名
<div className="bg-gradient-to-br from-purple-50 to-indigo-50">
```

### 3. 简化颜色系统
```tsx
// ❌ 禁止：统一使用单一颜色
<Icon className="text-gray-600" />  // 所有图标都是灰色

// ✅ 正确：保持不同section的颜色区分
<Target className="text-blue-600" />   // 业务影响度
<Sparkles className="text-purple-600" /> // AI打分
<Store className="text-green-600" />   // 影响范围
<Settings className="text-orange-600" /> // 技术评估
```

### 4. 批量删除属性
```tsx
// ❌ 禁止：复制代码时丢失属性
<button onClick={...}>  // 丢失了 type="button"

// ✅ 正确：保留所有属性
<button type="button" onClick={...}>
```

---

## ✅ 推荐的重构模式

### 1. 提取为Hook（逻辑分离）
```tsx
// ✅ 推荐：提取业务逻辑到 Hook
const { form, updateField, validate } = useRequirementForm(requirement);
```

### 2. 拆分为子组件（UI分离）
```tsx
// ✅ 推荐：提取大段JSX到组件
<AIAnalysisPanel
  analysisResult={result}
  onAdopt={handleAdopt}
/>
```

### 3. 提取常量配置
```tsx
// ✅ 推荐：提取颜色映射到常量
export const SECTION_STYLES = {
  base: 'bg-gray-50 border border-gray-200',
  business: 'bg-blue-50 border-2 border-blue-200',
  ai: 'bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300',
} as const;
```

---

## 📊 重构质量检查清单

### Pre-Refactor（重构前）
- [ ] 创建专用分支
- [ ] 截图所有UI状态
- [ ] 创建样式快照（styles-before.txt）
- [ ] 记录文件行数
- [ ] 阅读检查清单

### During-Refactor（重构中）
- [ ] 渐进式重构（每个模块单独commit）
- [ ] 每30分钟运行 `git diff` 检查
- [ ] 保持所有颜色和样式
- [ ] 保持所有HTML属性
- [ ] 保持所有事件处理器

### Post-Refactor（重构后）
- [ ] 运行 `npm run pre-commit` ✅
- [ ] TypeScript编译通过 ✅
- [ ] 生产构建成功 ✅
- [ ] 样式对比无差异 ✅
- [ ] 手动测试所有UI ✅
- [ ] 自评分 ≥ 4.0 ✅

---

## 🔧 工具和脚本

### 样式对比脚本
```bash
# scripts/compare-styles.sh
#!/bin/bash

FILE=$1

echo "提取重构前的样式..."
git show HEAD:$FILE | grep -o 'className="[^"]*"' | sort | uniq > /tmp/styles-before.txt

echo "提取当前的样式..."
grep -o 'className="[^"]*"' $FILE | sort | uniq > /tmp/styles-after.txt

echo ""
echo "=== 删除的样式 ==="
comm -23 /tmp/styles-before.txt /tmp/styles-after.txt

echo ""
echo "=== 新增的样式 ==="
comm -13 /tmp/styles-before.txt /tmp/styles-after.txt

echo ""
echo "=== 检查丢失的颜色 ==="
comm -23 /tmp/styles-before.txt /tmp/styles-after.txt | grep -E "bg-(blue|purple|green|red|yellow|orange|indigo)|text-(blue|purple|green|red|yellow|orange|indigo)|gradient"
```

### 使用方法
```bash
# 给脚本添加执行权限
chmod +x scripts/compare-styles.sh

# 运行对比
./scripts/compare-styles.sh src/components/EditRequirementModal.tsx
```

---

## 📚 案例学习

### 案例1：按钮type属性丢失

**问题**: 重构时21个 `type="button"` 属性全部丢失

**影响**: 点击按钮触发浏览器下载HTML文件

**教训**:
- 不要手动复制粘贴代码
- 必须使用 git diff 检查
- 配置 ESLint 规则自动检查

**相关文档**: [重构Bug分析](../refactoring-lessons/refactoring-bug-analysis.md)

### 案例2：颜色全部丢失

**问题**: 重构时所有彩色背景变成灰色

**影响**: UI失去视觉层次，用户体验下降

**教训**:
- 必须截图对比
- 必须创建样式快照
- 必须手动测试UI

**修复方案**: 参照原版逐个恢复颜色

---

## 🎯 总结

### 核心要点
1. **样式和颜色是功能的一部分** - 不能丢失
2. **HTML属性必须完整** - 特别是 type
3. **截图对比是必须的** - 不能只看代码
4. **自动化工具是保障** - hooks、ESLint、scripts

### 成功的重构三要素
1. **充分准备** - 截图、快照、检查清单
2. **渐进执行** - 小步快跑、频繁验证
3. **严格验证** - 自动检查 + 手动测试

---

**记住**: 重构不是重写，是在保持功能和UI完整的前提下优化代码结构！
