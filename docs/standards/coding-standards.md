# 编码规范 (Coding Standards)

本文档定义了WSJF项目的编码规范，确保代码质量和可维护性。

---

## 📏 文件大小限制

### 硬性规定
- ❌ **任何文件不得超过 500 行**（包括空行和注释）
- ⚠️ **超过 300 行时必须评估拆分**
- ✅ **推荐单文件保持在 200-300 行以内**

### 分级预警机制
```
🟢 < 200 行    安全区    正常开发
🟡 200-300 行  注意区    开始评估拆分
🟠 300-400 行  警告区    必须规划拆分方案
🔴 400-500 行  危险区    立即拆分，禁止添加新代码
❌ > 500 行    禁止区    拒绝提交（Git hook 拦截）
```

### 检查命令
```bash
# 开发前检查
npm run check-file-size

# 提交前自动检查（Git pre-commit hook）
# 将在 .husky/pre-commit 中自动执行
```

---

## 🎯 代码组织原则

### 1. UI 和逻辑分离
组件只负责 UI 渲染，业务逻辑提取到 Hook。

**示例：**
```typescript
// ❌ 错误：逻辑混在组件中
function EditModal() {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    // 100行业务逻辑...
    setLoading(false);
  };

  return <div>...</div>;
}

// ✅ 正确：逻辑提取到Hook
function EditModal() {
  const { data, loading, handleSave } = useEditModal();
  return <div>...</div>;
}

// hooks/useEditModal.ts
export function useEditModal() {
  // 业务逻辑...
  return { data, loading, handleSave };
}
```

### 2. 常量配置独立
超过 10 行的常量必须提取到 `constants/` 或 `config/`。

**示例：**
```typescript
// ❌ 错误：常量硬编码在组件中
const FIELD_MAP = {
  name: '需求名称',
  desc: '需求描述',
  // 20+ 个字段...
};

// ✅ 正确：提取到常量文件
// constants/fieldNames.ts
export const FIELD_NAME_MAP = {
  name: '需求名称',
  desc: '需求描述',
  // ...
};
```

### 3. 工具函数复用
重复代码出现 3 次必须提取到 `utils/` 目录。

**示例：**
```typescript
// ❌ 错误：重复计算逻辑
function ComponentA() {
  const score = bv + tc + ddl + workload;
  // ...
}

function ComponentB() {
  const score = bv + tc + ddl + workload;
  // ...
}

// ✅ 正确：提取为工具函数
// utils/scoring.ts
export function calculateRawScore(bv, tc, ddl, workload) {
  return bv + tc + ddl + workload;
}
```

### 4. 组件拆分
组件超过 200 行考虑拆分为子组件或 Section。

**示例：**
```typescript
// ❌ 错误：单个组件超过 500 行
function LargeModal() {
  return (
    <div>
      {/* 100行：基本信息表单 */}
      {/* 100行：业务影响度选择 */}
      {/* 100行：指标选择 */}
      {/* 200行：AI分析 */}
    </div>
  );
}

// ✅ 正确：拆分为多个Section组件
function LargeModal() {
  return (
    <div>
      <BasicInfoSection />
      <BusinessImpactSection />
      <MetricSelectionSection />
      <AIAnalysisSection />
    </div>
  );
}
```

---

## 🔒 类型安全规范（⭐ v1.5.0强制执行）

### 1. 禁止使用宽泛的 `string` 类型表示枚举

```typescript
// ❌ 错误
interface Requirement {
  techProgress: string;
  submitter: string;
}

// ✅ 正确
interface Requirement {
  techProgress: TechProgressStatus;
  submitter: SubmitterType;
}
```

### 2. 所有枚举值必须定义为联合类型

```typescript
// src/types/techProgress.ts
export type TechProgressStatus =
  | '待评估'
  | '未评估'
  | '已评估工作量'
  | '已完成技术方案';

export type SubmitterType = '业务' | '产品' | '技术';
```

### 3. 所有枚举值必须在常量文件中定义

```typescript
// src/constants/techProgress.ts
export const TECH_PROGRESS = {
  PENDING: '待评估' as const,
  NOT_EVALUATED: '未评估' as const,
  EFFORT_EVALUATED: '已评估工作量' as const,
  SOLUTION_COMPLETED: '已完成技术方案' as const,
} as const;

export const SUBMITTER_TYPE = {
  BUSINESS: '业务' as const,
  PRODUCT: '产品' as const,
  TECH: '技术' as const,
} as const;
```

### 4. 禁止硬编码字符串，必须使用常量

```typescript
// ❌ 错误
if (req.techProgress === '待评估') { ... }
if (req.submitter === '业务') { ... }

// ✅ 正确
import { TECH_PROGRESS, SUBMITTER_TYPE } from '@/constants';

if (req.techProgress === TECH_PROGRESS.PENDING) { ... }
if (req.submitter === SUBMITTER_TYPE.BUSINESS) { ... }
```

### 5. 分组/筛选逻辑必须穷举所有可能值

```typescript
// ❌ 错误：遗漏 '待评估'
const ready = items.filter(r => r.status === '已评估');
const notReady = items.filter(r => r.status === '未评估');

// ✅ 正确：使用分组常量
import { NOT_READY_STATUSES } from '@/constants/techProgress';

const ready = items.filter(r =>
  r.status && !NOT_READY_STATUSES.includes(r.status)
);
const notReady = items.filter(r =>
  !r.status || NOT_READY_STATUSES.includes(r.status)
);

// ✅ 必须验证分组完整性
if (import.meta.env.DEV) {
  console.assert(
    items.length === ready.length + notReady.length,
    '分组逻辑有遗漏'
  );
}
```

### 6. 开发环境必须添加运行时验证

```typescript
// src/utils/validation.ts
export function validateTechProgress(
  value: string,
  context: string
): value is TechProgressStatus {
  const validValues = Object.values(TECH_PROGRESS);
  const isValid = validValues.includes(value as TechProgressStatus);

  if (!isValid && import.meta.env.DEV) {
    console.error(
      `[验证失败] ${context}: 无效的技术进度状态 "${value}"\n` +
      `有效值: ${validValues.join(', ')}`
    );
  }

  return isValid;
}

// 使用示例
if (import.meta.env.DEV) {
  validateTechProgress(requirement.techProgress, '需求保存');
}
```

---

## 📝 命名规范

### 文件命名
- **组件文件**: PascalCase - `EditRequirementModal.tsx`
- **工具文件**: camelCase - `calculateScore.ts`
- **常量文件**: camelCase - `fieldNames.ts`
- **类型文件**: camelCase - `techProgress.ts`
- **Hook文件**: camelCase - `useRequirementForm.ts`

### 变量命名
- **组件**: PascalCase - `EditRequirementModal`
- **函数/方法**: camelCase - `calculateScore`
- **常量**: UPPER_SNAKE_CASE - `TECH_PROGRESS`
- **类型/接口**: PascalCase - `Requirement`, `TechProgressStatus`
- **私有变量**: 前缀 `_` - `_internalState`

### 布尔值命名
使用 `is`, `has`, `should`, `can` 前缀：
```typescript
const isLoading = true;
const hasError = false;
const shouldUpdate = true;
const canSubmit = false;
```

---

## 💬 注释规范

### JSDoc 注释（必须）
所有导出的函数、接口必须有 JSDoc 注释：

```typescript
/**
 * 计算需求的WSJF原始分数
 *
 * @param bv - 业务影响度（1-10）
 * @param tc - 时间紧迫性（0-5）
 * @param ddl - 是否有强制DDL（0-5）
 * @param workload - 工作量奖励（0-8）
 * @returns 原始分数（3-28范围）
 */
export function calculateRawScore(
  bv: number,
  tc: number,
  ddl: number,
  workload: number
): number {
  return bv + tc + ddl + workload;
}
```

### 内联注释（推荐）
复杂逻辑必须添加说明性注释：

```typescript
// 归一化到 1-100 范围，当所有需求分数相同时统一为 60
if (minRaw === maxRaw) {
  return 60;
}

// 策略：如果文件名包含中文，优先使用百度OCR（准确率更高）
if (/[\u4e00-\u9fa5]/.test(fileName)) {
  backend = 'baidu';
}
```

### 禁止的注释
```typescript
// ❌ 禁止：无意义的注释
const name = 'John'; // 名字

// ❌ 禁止：注释掉的代码（应删除或使用版本控制）
// const oldLogic = () => { ... };

// ❌ 禁止：TODO注释超过1周未处理
// TODO: 稍后重构这部分代码
```

---

## 🎨 代码风格

### 缩进和格式
- 使用 **2空格** 缩进
- 单行最大长度：**100字符**
- 使用 Prettier 自动格式化

### 导入顺序
```typescript
// 1. React相关
import React, { useState, useEffect } from 'react';

// 2. 第三方库
import { X, Save } from 'lucide-react';

// 3. 类型定义
import type { Requirement } from '../types';

// 4. 组件
import Button from './Button';

// 5. 工具函数
import { calculateScore } from '../utils/scoring';

// 6. 常量
import { TECH_PROGRESS } from '../constants';

// 7. 样式（如果有）
import './styles.css';
```

### 解构和简写
```typescript
// ✅ 使用解构
const { name, age } = user;

// ✅ 使用属性简写
const user = { name, age };

// ✅ 使用箭头函数
const add = (a, b) => a + b;
```

---

## 🚫 禁止的模式

### 1. 禁止使用 `any`
```typescript
// ❌ 错误
function process(data: any) { ... }

// ✅ 正确
function process(data: Requirement) { ... }
// 或
function process(data: unknown) {
  // 使用类型守卫
}
```

### 2. 禁止忽略TypeScript错误
```typescript
// ❌ 错误
// @ts-ignore
const value = something;

// ✅ 正确：修复类型问题
const value: string = something as string;
```

### 3. 禁止嵌套超过3层
```typescript
// ❌ 错误
if (a) {
  if (b) {
    if (c) {
      if (d) {
        // 太深了！
      }
    }
  }
}

// ✅ 正确：提前返回
if (!a) return;
if (!b) return;
if (!c) return;
if (!d) return;
// 主要逻辑
```

### 4. 禁止超长函数
```typescript
// ❌ 错误：函数超过50行
function doEverything() {
  // 100行代码...
}

// ✅ 正确：拆分为多个函数
function doTask1() { ... }
function doTask2() { ... }
function doTask3() { ... }
```

---

## ✅ 开发前检查清单

每次开发新功能前必须完成：

```
□ 1. 估算新功能代码行数
     方法：参考类似功能 × 1.5（保守估计）

□ 2. 检查目标文件当前大小
     运行：npm run check-file-size

□ 3. 计算最终大小
     当前行数 + 预估行数 = ?

□ 4. 判断是否需要拆分
     - 如果 < 300 行：可以直接添加
     - 如果 300-400 行：建议先拆分
     - 如果 > 400 行：必须先拆分

□ 5. 创建拆分方案（如果需要）
     - 确定需要创建的 Hook 文件
     - 确定需要创建的组件文件
     - 规划代码组织结构

□ 6. 定义类型和常量（如果新增枚举）
     - 在 src/types/ 中定义联合类型
     - 在 src/constants/ 中定义常量
     - 添加运行时验证（开发环境）

□ 7. 开始实现
     严格按照拆分方案执行
```

---

## 📊 违规处理

### 发现文件超过 500 行
**必须立即停止开发并重构。**

参考文档：
- [架构指导原则](../architecture-guide.md)
- [文件大小重构计划](../refactoring-plan.md)
- [重构规范](./refactoring-standards.md)

### 类型安全违规
**新增/修改枚举类型时的强制检查清单**：

1. ✅ 在 `src/types/*.ts` 中定义联合类型
2. ✅ 在 `src/constants/*.ts` 中定义常量
3. ✅ 全局搜索使用处，确保所有分支处理新值
4. ✅ 添加运行时验证（开发环境）
5. ✅ 更新相关文档

---

## 🔄 持续改进

### 代码审查要点
- 文件大小是否合规？
- 类型定义是否完整？
- 是否有硬编码字符串？
- 是否有重复代码？
- 注释是否清晰？

### 自动化检查
- ESLint 规则
- Git pre-commit hook
- CI/CD 检查

---

**记住**：编码规范不是限制创造力，而是保证代码质量和团队协作效率的基础！
