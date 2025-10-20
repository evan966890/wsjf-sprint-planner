# 新工具和规范使用指南

**版本**: v1.5.0
**创建日期**: 2025-01-20
**使用策略**: 渐进式应用（保留现有代码，新功能使用新规范）

本文档说明如何在日常开发中使用新增的类型安全工具和调试规范。

---

## 📦 新增内容概览

### 🔧 工具文件

| 文件 | 用途 | 何时使用 |
|-----|------|---------|
| `src/types/techProgress.ts` | 严格的类型定义 | 新功能开发时引用 |
| `src/constants/techProgress.ts` | 状态常量和辅助函数 | 任何涉及状态判断的地方 |
| `src/utils/validation.ts` | 运行时数据验证 | 数据导入、API调用后验证 |
| `src/utils/debugHelpers.ts` | 调试辅助工具 | 遇到Bug时追踪数据流 |
| `src/utils/healthCheck.ts` | 自动健康检查 | 可选启用，自动发现问题 |

### 📚 文档规范

| 文档 | 用途 |
|-----|------|
| `docs/debugging-decision-tree.md` | Bug调试流程图 |
| `docs/code-review-checklist.md` | PR审查标准 |
| `ai-templates/DEBUGGING_LESSONS_LEARNED.md` | 案例学习 |
| `CLAUDE.md` 更新 | 类型安全规范 |

---

## 🚀 场景1：开发新功能

### 示例：添加新的需求状态

**旧方式（不推荐）**:
```typescript
// ❌ 容易出错
requirement.techProgress = '开发完成';  // 拼写错误
if (req.techProgress === '开发完成') { ... }  // 硬编码字符串
```

**新方式（推荐）**:

**第1步：在类型文件中添加新值**
```typescript
// src/types/techProgress.ts (已存在，直接编辑)
export type TechProgressStatus =
  | '待评估'
  | '未评估'
  | '已评估工作量'
  | '开发完成';  // ← 新增
```

**第2步：在常量文件中定义**
```typescript
// src/constants/techProgress.ts (已存在，直接编辑)
export const TECH_PROGRESS = {
  // ... 现有常量
  DEVELOPMENT_DONE: '开发完成' as const,  // ← 新增
} as const;

// 更新分组常量
export const READY_STATUSES: ReadonlyArray<TechProgressStatus> = [
  TECH_PROGRESS.EFFORT_EVALUATED,
  // ...
  TECH_PROGRESS.DEVELOPMENT_DONE,  // ← 新增
] as const;
```

**第3步：在代码中使用常量**
```typescript
// ✅ 正确
import { TECH_PROGRESS } from '@/constants/techProgress';

requirement.techProgress = TECH_PROGRESS.DEVELOPMENT_DONE;

if (req.techProgress === TECH_PROGRESS.DEVELOPMENT_DONE) {
  showSuccessMessage();
}
```

**第4步：验证（可选，但推荐）**
```typescript
import { validateTechProgress } from '@/utils/validation';

if (import.meta.env.DEV) {
  validateTechProgress(requirement.techProgress, '需求保存');
}
```

---

## 🐛 场景2：调试Bug

### 示例：数据不显示问题

**问题**：添加了新数据，但UI不显示

**使用调试决策树**：

```typescript
// 第1步：确认数据存在
console.log('[调试] 原始数据:', unscheduled);
console.log('[调试] 数据长度:', unscheduled.length);
// ✅ 有数据 → 继续

// 第2步：确认数据通过筛选
console.log('[调试] 筛选后:', filteredReqs.length);
// ✅ 数量一致 → 继续

// 第3步：使用调试工具追踪分组
import { debugRenderPipeline, debugAssert } from '@/utils/debugHelpers';

const readyReqs = debugRenderPipeline(filteredReqs, [
  {
    name: '分组-可排期',
    fn: (items) => items.filter(r =>
      r.techProgress && isReadyForSchedule(r.techProgress)
    )
  },
  {
    name: '排序',
    fn: (items) => items.sort((a, b) => b.score - a.score)
  }
]);

// 验证分组完整性
debugAssert(
  filteredReqs.length === readyReqs.length + notReadyReqs.length,
  '分组逻辑有遗漏！',
  {
    total: filteredReqs.length,
    ready: readyReqs.length,
    notReady: notReadyReqs.length
  }
);
// 🎯 如果触发断言 → 说明分组条件有遗漏
```

**完整流程参考**：[docs/debugging-decision-tree.md](./debugging-decision-tree.md)

---

## ✅ 场景3：代码审查

### PR作者自查

在提交PR前，复制检查清单到PR描述：

```markdown
## ✅ 类型安全检查

- [ ] 新增的枚举类型已定义为联合类型（非 `string`）
- [ ] 所有枚举值已在 `constants/` 中定义
- [ ] 所有使用处使用了常量（无硬编码字符串）
- [ ] 分组/筛选逻辑穷举了所有可能值
- [ ] 添加了运行时验证（开发环境）

## ✅ 渲染逻辑检查

- [ ] 验证了分组完整性（total = sum of groups）
- [ ] 使用了 debugAssert 或 validateRenderGroups
- [ ] React key 唯一且稳定
```

**完整检查清单**：[docs/code-review-checklist.md](./code-review-checklist.md)

### 审查者检查

引用检查项编号快速沟通：

```
请检查 B-3：分组逻辑是否处理了所有可能的 techProgress 值？
看起来 '待评估' 状态会被遗漏。
```

---

## 🏥 场景4：启用自动健康检查（可选）

在开发环境自动检测数据完整性问题：

```typescript
// src/wsjf-sprint-planner.tsx (或主入口文件)
import { startHealthCheckMonitor } from '@/utils/healthCheck';

function WSJFPlanner() {
  // 启动健康检查（仅开发环境）
  useEffect(() => {
    const stop = startHealthCheckMonitor();
    return stop;  // 组件卸载时停止
  }, []);

  // ... 其他代码
}
```

**控制台输出示例**：
```
✅ 所有健康检查通过

或

⚠️ 1 项健康检查失败:
  ❌ 数据完整性: 需求总数与待排期+已排期之和不匹配
    详细信息: {总需求数: 51, 待排期: 50, 已排期: 0, 差异: 1}
```

**手动执行**（浏览器控制台）：
```javascript
window.__healthCheck();  // 执行健康检查
window.__debugStore();    // 查看Store状态
```

---

## 📊 场景5：学习案例

遇到类似问题时，查阅经验教训文档：

[ai-templates/DEBUGGING_LESSONS_LEARNED.md](../ai-templates/DEBUGGING_LESSONS_LEARNED.md)

包含：
- **案例1**: UI渲染遗漏问题（2025-01-20）
  - 错误调试路径 vs 正确路径对比
  - 从20轮到3轮的效率提升
  - 根本原因和预防措施

**适合场景**：
- 新人学习调试经验
- 复盘类似Bug
- 建立团队调试规范

---

## 🎯 渐进式应用策略

### 立即应用

1. **新功能开发**
   - ✅ 使用类型定义和常量
   - ✅ 添加运行时验证
   - ✅ 使用调试工具

2. **Bug修复**
   - ✅ 使用调试决策树
   - ✅ 验证分组完整性
   - ✅ 记录经验教训

3. **代码审查**
   - ✅ 使用检查清单
   - ✅ 引用编号沟通

### 逐步重构

**不要立即重构现有代码**，而是：

1. **遇到Bug时重构**
   - 修复Bug的同时，将相关代码改为使用新规范

2. **修改功能时重构**
   - 修改现有功能时，顺便重构为符合新规范

3. **代码审查时提醒**
   - 提醒作者可以使用新工具和规范

### 完全不需要做

❌ 大规模替换现有代码
❌ 立即编写所有单元测试
❌ 强制所有人立即使用

---

## 💡 快速参考

### 常用导入

```typescript
// 类型
import type { TechProgressStatus } from '@/types/techProgress';

// 常量
import { TECH_PROGRESS, NOT_READY_STATUSES } from '@/constants/techProgress';

// 辅助函数
import { isReadyForSchedule, needsEvaluation } from '@/constants/techProgress';

// 验证
import { validateTechProgress } from '@/utils/validation';

// 调试
import { debugRenderPipeline, debugAssert } from '@/utils/debugHelpers';

// 健康检查
import { validateRenderGroups } from '@/utils/healthCheck';
```

### 调试命令（浏览器控制台）

```javascript
// 执行健康检查
window.__healthCheck();

// 查看Store状态
window.__debugStore();
```

---

## 📞 FAQ

### Q1: 现有代码需要立即改为使用新规范吗？

**A**: ❌ 不需要。保持现有代码不变，新功能使用新规范即可。

### Q2: 如果不启用健康检查会怎样？

**A**: 不影响功能。健康检查是可选的辅助工具，不启用也可以正常开发。

### Q3: 调试工具会影响性能吗？

**A**: ❌ 不会。所有调试代码都包含 `if (import.meta.env.DEV)` 判断，生产环境会被完全移除。

### Q4: 一定要使用常量吗，直接写字符串不行吗？

**A**:
- 现有代码：可以继续用字符串
- 新代码：强烈建议用常量（避免拼写错误、便于重构、IDE自动补全）

### Q5: 遇到Bug时一定要用调试决策树吗？

**A**: 不强制，但推荐。决策树可以将调试效率提升3-5倍，避免走弯路。

---

## 📖 相关文档索引

| 文档 | 用途 | 何时查阅 |
|-----|------|---------|
| [debugging-decision-tree.md](./debugging-decision-tree.md) | 系统化调试流程 | 遇到Bug时 |
| [code-review-checklist.md](./code-review-checklist.md) | PR审查标准 | 提交/审查PR时 |
| [DEBUGGING_LESSONS_LEARNED.md](../ai-templates/DEBUGGING_LESSONS_LEARNED.md) | 案例学习 | 学习经验、复盘 |
| [CLAUDE.md](../CLAUDE.md) | 项目开发规范 | 开发新功能前 |

---

**最后更新**: 2025-01-20
**维护者**: Claude Code Team

有问题欢迎提Issue或直接询问！
