# code-quality-enforcer

## Description
代码质量规范执行专家。负责检查代码组织、类型安全、常量提取等质量标准，防止违规代码提交。

## Trigger Keywords
- 检查代码
- 代码质量
- 代码规范
- code review
- 质量检查
- 规范检查

## Instructions

### 代码组织原则

#### 1. UI 和逻辑分离
- **组件只负责 UI 渲染**
- **业务逻辑提取到 Hook**
- 示例：`EditRequirementModal.tsx` + `useRequirementForm.ts`

#### 2. 常量配置独立
- **超过 10 行的常量必须提取到 `constants/` 或 `config/`**
- 示例：`FIELD_NAME_MAP` 在 `constants/fieldNames.ts`

#### 3. 工具函数复用
- **重复代码出现 3 次必须提取**
- **提取到 `utils/` 目录**
- 示例：`calculateScores` 在 `utils/scoring.ts`

#### 4. 组件拆分
- **组件超过 200 行考虑拆分**
- **拆分为子组件或 Section**
- 示例：将大 Modal 拆分为多个 Section 组件

### 类型安全规范（⭐核心）

#### 规则 1：禁止使用宽泛的 `string` 类型表示枚举

```typescript
// ❌ 错误
techProgress: string;

// ✅ 正确
techProgress: TechProgressStatus; // 联合类型
```

#### 规则 2：所有枚举值必须定义为联合类型

```typescript
// src/types/techProgress.ts
export type TechProgressStatus =
  | '待评估'
  | '未评估'
  | '已评估工作量'
  | '已完成技术方案';
```

#### 规则 3：所有枚举值必须在常量文件中定义

```typescript
// src/constants/techProgress.ts
export const TECH_PROGRESS = {
  PENDING: '待评估' as const,
  NOT_EVALUATED: '未评估' as const,
  EFFORT_EVALUATED: '已评估工作量' as const,
} as const;
```

#### 规则 4：禁止硬编码字符串，必须使用常量

```typescript
// ❌ 错误
if (req.techProgress === '待评估') { ... }

// ✅ 正确
import { TECH_PROGRESS } from '@/constants/techProgress';
if (req.techProgress === TECH_PROGRESS.PENDING) { ... }
```

#### 规则 5：分组/筛选逻辑必须穷举所有可能值

```typescript
// ❌ 错误：遗漏 '待评估'
const ready = items.filter(r => r.status === '已评估');
const notReady = items.filter(r => r.status === '未评估');

// ✅ 正确：使用分组常量
import { NOT_READY_STATUSES } from '@/constants/techProgress';
const ready = items.filter(r => r.status && !NOT_READY_STATUSES.includes(r.status));
const notReady = items.filter(r => !r.status || NOT_READY_STATUSES.includes(r.status));

// ✅ 必须验证分组完整性
debugAssert(
  items.length === ready.length + notReady.length,
  '分组逻辑有遗漏'
);
```

#### 规则 6：开发环境必须添加运行时验证

```typescript
import { validateTechProgress } from '@/utils/validation';

if (import.meta.env.DEV) {
  validateTechProgress(requirement.techProgress, '需求保存');
}
```

### 类型安全违规处理

**新增/修改枚举类型时的强制检查清单**：

1. ✅ 在 `src/types/*.ts` 中定义联合类型
2. ✅ 在 `src/constants/*.ts` 中定义常量
3. ✅ 全局搜索使用处，确保所有分支处理新值
4. ✅ 添加运行时验证（开发环境）
5. ✅ 更新相关文档

### AI检查流程

当用户要求检查代码质量时：

1. **检查文件大小**：运行 `npm run check-file-size`
2. **检查类型安全**：
   - 搜索所有 `string` 类型的枚举字段
   - 检查是否有硬编码字符串
   - 验证常量文件是否完整
3. **检查代码组织**：
   - 组件是否过大（>200行）
   - 是否有重复代码
   - 常量是否独立
4. **生成检查报告**：列出所有违规项
5. **提供修复建议**：按优先级排序

### 违规处理

**发现文件超过 500 行时，必须立即停止开发并重构。**

详见：
- docs/architecture-guide.md - 规范说明
- docs/new-feature-workflow.md - 开发流程
- docs/refactoring-plan.md - 重构执行方案
- docs/standards/refactoring-standards.md - 强制执行规范

### 检查报告模板

```markdown
## 代码质量检查报告

### 📊 文件大小检查
- ✅/❌ 所有文件 < 500 行
- ⚠️ 需要关注的文件：
  - file1.tsx (450行) - 接近红线
  - file2.ts (520行) - ❌ 超过限制

### 🔒 类型安全检查
- ✅/❌ 无硬编码字符串
- ✅/❌ 枚举类型完整
- ⚠️ 发现问题：
  - file3.tsx:42 - 硬编码 '待评估'
  - file4.ts - 缺少运行时验证

### 🏗️ 代码组织检查
- ✅/❌ UI逻辑分离
- ✅/❌ 常量独立
- ⚠️ 改进建议：
  - LargeComponent.tsx - 建议拆分
  - utils/mixed.ts - 建议按功能分类

### 📋 修复优先级
1. 🔴 紧急：file2.ts 超过500行
2. 🟠 重要：file3.tsx 类型安全问题
3. 🟡 建议：LargeComponent.tsx 拆分
```

### 相关文档
- docs/standards/refactoring-standards.md - 重构规范
- docs/debugging-decision-tree.md - 调试决策树
- docs/code-review-checklist.md - PR审查标准
- ai-templates/DEBUGGING_LESSONS_LEARNED.md - 案例学习
- ai-templates/CODE_QUALITY_CHECKLIST.md - AI开发检查清单
