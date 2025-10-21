# 重构快速开始指南

> **⏱️ 阅读时间**: 2 分钟
> **📅 创建日期**: 2025-01-20

---

## 📊 当前状态

**🚨 发现 4 个文件严重超标**：

| 文件 | 当前 | 目标 | 超标 |
|------|-----|------|------|
| wsjf-sprint-planner.tsx | 3102行 | <500行 | 🔴 2602行 |
| EditRequirementModal.tsx | 2044行 | <500行 | 🔴 1544行 |
| BatchEvaluationModal.tsx | 744行 | <500行 | 🔴 244行 |
| UnscheduledArea.tsx | 608行 | <500行 | 🔴 108行 |

**总计需要减少**: 4498 行代码

---

## 🎯 任务分配

### 本周任务清单

#### 周一-周二（简单）

**任务 1**: 重构 UnscheduledArea.tsx
- **难度**: ⭐⭐ (简单)
- **工时**: 2-3 小时
- **负责人**: [待分配]
- **指南**: [UnscheduledArea 重构指南](./refactoring-guides/unscheduled-area-refactoring.md)

**任务 2**: 重构 BatchEvaluationModal.tsx
- **难度**: ⭐⭐⭐ (中等)
- **工时**: 3-4 小时
- **负责人**: [待分配]
- **指南**: [BatchEvaluationModal 重构指南](./refactoring-guides/batch-evaluation-refactoring.md)

#### 周三-周四（复杂）

**任务 3**: 重构 EditRequirementModal.tsx
- **难度**: ⭐⭐⭐⭐⭐ (复杂)
- **工时**: 6-8 小时
- **负责人**: [待分配]
- **指南**: [EditRequirementModal 重构指南](./refactoring-guides/edit-requirement-modal-refactoring.md)

#### 周五（最复杂）

**任务 4**: 重构 wsjf-sprint-planner.tsx
- **难度**: ⭐⭐⭐⭐⭐ (最复杂)
- **工时**: 6-8 小时
- **负责人**: [待分配]
- **指南**: [主应用重构指南](./refactoring-guides/main-app-refactoring.md)

---

## 🚀 快速开始（5分钟）

### 1. 认领任务

在 [重构计划文档](./refactoring-plan.md) 的进度追踪表中填写你的名字：

```markdown
| UnscheduledArea.tsx | [你的名字] | 🔄进行中 | 2025-01-20 | - | - |
```

### 2. 创建分支

```bash
git checkout -b refactor/unscheduled-area-reduction
git pull origin main
```

### 3. 阅读指南

打开对应的重构指南，例如：
- [UnscheduledArea 重构指南](./refactoring-guides/unscheduled-area-refactoring.md)

### 4. 开始重构

按照指南中的步骤执行：
1. 创建目录结构
2. 提取 Hook
3. 提取组件
4. 重构主文件
5. 测试功能
6. 提交PR

### 5. 测试验证

```bash
# 检查文件大小
npm run check-file-size

# TypeScript检查
npx tsc --noEmit

# 构建测试
npm run build

# 启动开发服务器测试功能
npm run dev
```

### 6. 提交PR

使用PR模板创建 Pull Request（模板见[重构计划](./refactoring-plan.md)）

---

## 📚 文档索引

### 必读文档

1. **[重构计划总览](./refactoring-plan.md)** - 完整计划和时间线
2. **[架构指导原则](./architecture-guide.md)** - 代码组织规范

### 重构指南（选择一个阅读）

- [UnscheduledArea 重构](./refactoring-guides/unscheduled-area-refactoring.md) - 最简单，推荐新手
- [BatchEvaluationModal 重构](./refactoring-guides/batch-evaluation-refactoring.md) - 中等难度
- [EditRequirementModal 重构](./refactoring-guides/edit-requirement-modal-refactoring.md) - 复杂
- [主应用重构](./refactoring-guides/main-app-refactoring.md) - 最复杂

### 代码模板

- [Hook 模板](./templates/hook-template.ts)
- [组件模板](./templates/component-template.tsx)
- [工具函数模板](./templates/util-template.ts)

---

## ❓ 常见问题

### Q: 我应该选择哪个任务？

**A**:
- **新手/第一次重构**: 选择 UnscheduledArea (⭐⭐)
- **有重构经验**: 选择 BatchEvaluationModal (⭐⭐⭐)
- **经验丰富**: 选择 EditRequirementModal 或主应用 (⭐⭐⭐⭐⭐)

### Q: 重构会不会破坏现有功能？

**A**: 不会！每个重构指南都包含：
- 详细的测试清单
- 功能验证步骤
- 回滚方案

只要按照指南操作，风险很低。

### Q: 我可以修改重构方案吗？

**A**: 可以！如果你有更好的拆分方案，欢迎讨论。但请确保：
- 最终文件 < 500 行
- 功能完全正常
- 代码更易维护

### Q: 遇到问题怎么办？

**A**:
1. 查看指南中的"常见问题"部分
2. 在 PR 中标记 "需要讨论"
3. 咨询团队其他成员
4. 回滚到上一个可工作的版本

---

## 🎯 成功标准

重构完成后，你应该看到：

```bash
npm run check-file-size
```

输出：

```
✅ src/components/UnscheduledArea.tsx - 280 行
✅ src/components/BatchEvaluationModal.tsx - 250 行
✅ src/components/EditRequirementModal.tsx - 250 行
✅ src/wsjf-sprint-planner.tsx - 300 行
```

**全部绿色 ✅ = 重构成功！**

---

## 📞 需要帮助？

- 📖 详细计划: [refactoring-plan.md](./refactoring-plan.md)
- 🏗️ 架构规范: [architecture-guide.md](./architecture-guide.md)
- ✅ Code Review: [code-review-checklist.md](./code-review-checklist.md)

---

**祝重构顺利！** 🚀
