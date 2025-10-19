# WSJF Sprint Planner - 项目规则

本文档定义项目的核心开发规范，所有团队成员和 AI 助手必须遵守。

---

## 🎯 核心原则

1. **类型安全优先**：充分利用 TypeScript，避免 `any` 类型
2. **用户体验至上**：所有改动必须考虑用户体验影响
3. **渐进式增强**：优先保证核心功能，再添加高级特性
4. **文档同步更新**：代码变更必须同步更新相关文档
5. **术语一致性**：统一使用规范术语，避免混淆

---

## 📝 术语规范（Terminology Standards）

### 核心术语

| 术语 | 英文 | 说明 | ❌ 禁止使用 |
|------|------|------|------------|
| **权重分** | Weight Score | WSJF 计算后的 1-100 归一化分数 | 热度分、优先级分 |
| **业务影响度** | Business Impact | 1-10 分制评分，评估业务价值 | 业务价值、BV |
| **技术复杂度** | Complexity | 1-10 分制评分，评估技术难度 | 复杂度分、难度 |
| **工作量** | Effort | 预估人天数 | 工作日、人日 |
| **时间窗口** | Time Criticality | 随时/三月窗口/一月硬窗口 | 时间临界性、TC |
| **强制 DDL** | Hard Deadline | 是否有强制截止日期 | 死线、截止时间 |
| **星级** | Star Rating | ★★★★★ 评级系统（2-5星） | 评分、等级 |

### 重要规则

- ✅ **必须**：在代码、UI、文档中保持术语一致
- ✅ **必须**：新增术语时先在此文档中定义
- ❌ **禁止**：同一概念使用多个不同名称

---

## 🏗️ 代码规范

### TypeScript 规范

```typescript
// ✅ 推荐：完整的类型定义
interface RequirementCardProps {
  requirement: Requirement;
  onEdit: (id: string) => void;
  isDragging?: boolean;
}

// ❌ 避免：使用 any
const handleData = (data: any) => { ... }

// ✅ 推荐：使用具体类型或泛型
const handleData = <T extends Requirement>(data: T) => { ... }
```

**规则：**
- ✅ 使用严格的 TypeScript 模式
- ✅ 所有组件 props 必须定义接口
- ✅ 优先使用 `interface` 定义对象类型
- ✅ 使用 `type` 定义联合类型和工具类型
- ❌ 禁止使用 `any`，必要时使用 `unknown`
- ✅ 所有函数必须有明确的返回类型（公共 API）

### React 组件规范

```typescript
// ✅ 推荐：函数组件 + TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary'
}) => {
  return (
    <button
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
};
```

**规则：**
- ✅ 使用函数组件 + Hooks
- ✅ 组件文件名使用 PascalCase：`EditRequirementModal.tsx`
- ✅ 一个文件一个主组件（辅助组件可放同文件）
- ✅ Props 接口命名：`{ComponentName}Props`
- ✅ 使用解构传递 props
- ✅ 为可选 props 提供默认值
- ❌ 禁止使用 class 组件（除非有特殊需求）

### 状态管理规范

```typescript
// ✅ 推荐：明确的状态类型
const [requirements, setRequirements] = useState<Requirement[]>([]);
const [isLoading, setIsLoading] = useState<boolean>(false);

// ✅ 推荐：复杂状态使用 useReducer
type Action =
  | { type: 'ADD_REQUIREMENT'; payload: Requirement }
  | { type: 'DELETE_REQUIREMENT'; payload: string };

const reducer = (state: Requirement[], action: Action): Requirement[] => {
  switch (action.type) {
    case 'ADD_REQUIREMENT':
      return [...state, action.payload];
    // ...
  }
};
```

**规则：**
- ✅ 状态必须有明确类型
- ✅ 复杂状态逻辑使用 `useReducer`
- ✅ 避免过深的状态嵌套（≤3层）
- ✅ 使用 `useMemo` / `useCallback` 优化性能
- ❌ 避免在 render 中直接修改状态

### 样式规范（Tailwind CSS）

```tsx
// ✅ 推荐：语义化的 className 组合
<div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
  <span className="text-sm font-semibold text-blue-600">权重 {score}</span>
</div>

// ✅ 推荐：复杂样式抽取为常量
const CARD_BASE_STYLE = "p-4 rounded-lg border transition-all duration-200";
const CARD_VARIANTS = {
  default: "bg-white border-gray-200",
  selected: "bg-blue-50 border-blue-400",
  dragging: "opacity-50 scale-95"
};

// ❌ 避免：内联 style（除非动态计算）
<div style={{ width: '100px' }}>...</div>
```

**规则：**
- ✅ 优先使用 Tailwind utility classes
- ✅ 颜色使用预定义的调色板（blue-50, gray-600 等）
- ✅ 间距使用标准值（gap-2, p-4, mb-3 等）
- ✅ 复杂组合抽取为常量或组件
- ❌ 避免使用内联 `style`（动态计算除外）
- ✅ 响应式设计使用 `sm:` `md:` `lg:` 等前缀

---

## 📁 文件组织规范

### 目录结构

```
src/
├── components/          # 可复用组件
│   ├── BatchEvaluationModal.tsx
│   ├── EditRequirementModal.tsx
│   └── BusinessImpactScoreSelector.tsx
├── config/             # 配置文件
│   ├── aiPrompts.ts          # AI 提示词配置
│   └── complexityStandards.ts # 复杂度标准
├── constants/          # 常量定义
│   ├── ui-text.ts           # UI 文案常量
│   └── scoring-rules.ts     # 评分规则常量
├── types/              # 类型定义
│   └── index.ts             # 所有 TypeScript 接口
├── utils/              # 工具函数
│   └── calculations.ts      # 计算相关工具
├── hooks/              # 自定义 Hooks（未来）
├── main.tsx            # 应用入口
└── wsjf-sprint-planner.tsx  # 主组件
```

### 文件命名规范

| 类型 | 命名规则 | 示例 |
|------|---------|------|
| 组件文件 | PascalCase.tsx | `EditRequirementModal.tsx` |
| 配置文件 | camelCase.ts | `aiPrompts.ts` |
| 常量文件 | kebab-case.ts | `ui-text.ts` |
| 工具文件 | kebab-case.ts | `date-utils.ts` |
| 类型文件 | index.ts | `types/index.ts` |

### 导入顺序

```typescript
// 1. React 相关
import React, { useState, useEffect } from 'react';

// 2. 第三方库
import { X, AlertCircle } from 'lucide-react';

// 3. 类型定义
import type { Requirement, AIModelType } from '../types';

// 4. 组件
import { BusinessImpactScoreSelector } from './BusinessImpactScoreSelector';

// 5. 配置和常量
import { AI_MODELS } from '../constants/ai-models';
import { formatAIPrompt } from '../config/aiPrompts';

// 6. 工具函数
import { calculateScore } from '../utils/calculations';

// 7. 样式（如果有）
import './styles.css';
```

---

## 📐 命名规范

### 变量命名

```typescript
// ✅ 推荐：语义化命名
const businessImpactScore = 8;
const affectedMetrics: AffectedMetric[] = [];
const isModalOpen = false;

// ❌ 避免：缩写和不明确的命名
const bis = 8;
const metrics = [];
const open = false;
```

**规则：**
- ✅ 使用 camelCase
- ✅ 布尔值使用 `is` / `has` / `should` 前缀
- ✅ 数组使用复数形式：`requirements`, `metrics`
- ✅ 常量使用 UPPER_SNAKE_CASE：`MAX_SCORE`, `DEFAULT_EFFORT`
- ❌ 避免单字母变量（循环除外）

### 函数命名

```typescript
// ✅ 推荐：动词开头，清晰描述行为
const calculateWeightScore = (req: Requirement): number => { ... };
const handleRequirementEdit = (id: string) => { ... };
const validateBusinessImpact = (score: number): boolean => { ... };

// ❌ 避免：名词或不清晰的命名
const score = (req: Requirement): number => { ... };
const edit = (id: string) => { ... };
```

**规则：**
- ✅ 使用 camelCase
- ✅ 动词开头：`get`, `set`, `calculate`, `validate`, `handle`
- ✅ 事件处理函数：`handle{Event}` 或 `on{Event}`
- ✅ 返回布尔值：`is{Condition}`, `has{Property}`, `should{Action}`

### 组件命名

```typescript
// ✅ 推荐：PascalCase，名词，语义清晰
export const EditRequirementModal: React.FC<Props> = () => { ... };
export const BusinessImpactScoreSelector: React.FC<Props> = () => { ... };
export const RequirementCard: React.FC<Props> = () => { ... };

// ❌ 避免：动词或缩写
export const EditModal: React.FC<Props> = () => { ... };
export const BISSelector: React.FC<Props> = () => { ... };
```

**规则：**
- ✅ 使用 PascalCase
- ✅ 名词，清晰描述组件用途
- ✅ Modal/Selector/Card 等后缀标识组件类型
- ❌ 避免过度缩写

---

## 🔄 Git 提交规范

### Commit Message 格式

```
<type>: <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `Feature` | 新功能 | `Feature: AI批量评估功能` |
| `UX` | 用户体验优化 | `UX: 优化需求卡片布局` |
| `Fix` | Bug 修复 | `Fix: 修复权重分计算错误` |
| `Refactor` | 代码重构 | `Refactor: 拆分组件提升可维护性` |
| `Perf` | 性能优化 | `Perf: 优化大列表渲染性能` |
| `Docs` | 文档更新 | `Docs: 更新 API 使用说明` |
| `Style` | 代码格式 | `Style: 统一代码缩进` |
| `Test` | 测试相关 | `Test: 添加评分算法单元测试` |
| `Build` | 构建系统 | `Build: 升级 Vite 到 5.0` |
| `Chore` | 其他杂项 | `Chore: 更新依赖版本` |

### Commit Message 示例

```bash
# ✅ 推荐：清晰的类型和描述
Feature: AI批量评估功能 - 支持 OpenAI 和 DeepSeek

添加 AI 批量评估功能，支持自动分析需求并推荐评分：
- 支持 OpenAI GPT-4 和 DeepSeek 模型
- 提供详细的评分理由和指标推荐
- 配置文件化提示词，便于调整

影响：提升需求评估效率 80%

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>

# ✅ 推荐：简洁版（小改动）
UX: 优化业务域标签可读性

将业务域标签字体从 text-xs 增大到 text-sm

# ❌ 避免：不明确的描述
Fix: 修复 bug
Update: 改了一些东西
```

### Commit 规则

- ✅ 每个 commit 只做一件事
- ✅ Subject 使用中文，清晰描述改动
- ✅ Body 详细说明改动原因和影响（重要改动）
- ✅ 使用 Co-Authored-By 标注协作者
- ❌ 避免 "WIP"、"临时提交" 等无意义描述
- ❌ 避免提交未完成的功能到 main 分支

---

## 🌿 分支管理策略

### 分支命名

```bash
# 功能分支
feature/ai-batch-evaluation
feature/excel-import-v2

# 修复分支
fix/weight-score-calculation
fix/modal-close-bug

# 重构分支
refactor/split-components
refactor/extract-ui-text

# 文档分支
docs/development-guide
docs/api-reference
```

### 分支规则

- ✅ `main` - 主分支，始终可发布
- ✅ `feature/*` - 功能开发分支
- ✅ `fix/*` - Bug 修复分支
- ✅ `refactor/*` - 重构分支
- ✅ `docs/*` - 文档更新分支
- ❌ 不直接在 main 分支开发（小改动除外）

### 工作流程

1. 从 `main` 创建分支：`git checkout -b feature/new-feature`
2. 开发并提交：`git commit -m "Feature: 新功能"`
3. 推送分支：`git push origin feature/new-feature`
4. 合并前更新 main：`git merge main`（解决冲突）
5. 合并到 main：`git checkout main && git merge feature/new-feature`
6. 删除分支：`git branch -d feature/new-feature`

---

## 📊 数据模型规范

### 评分字段规范

```typescript
// ✅ 推荐：使用规范的字段名
interface Requirement {
  businessImpactScore?: BusinessImpactScore;  // 1-10 分
  complexityScore?: ComplexityScore;          // 1-10 分
  effortDays: number;                         // 工作量（天）
  timeCriticality?: '随时' | '三月窗口' | '一月硬窗口';
  hardDeadline: boolean;                      // 是否强制 DDL
  deadlineDate?: string;                      // DDL 日期
  displayScore?: number;                      // 权重分 1-100
  stars?: number;                             // 星级 2-5
}

// ❌ 避免：使用缩写或不一致的命名
interface Requirement {
  bis?: number;        // ❌
  complexity?: number; // ❌ 不明确是什么类型的复杂度
  effort: number;      // ❌ 单位不明确
  tc?: string;         // ❌ 缩写
  ddl: boolean;        // ❌ 缩写
}
```

### 数据验证规范

```typescript
// ✅ 推荐：完整的数据验证
const validateRequirement = (req: Partial<Requirement>): string[] => {
  const errors: string[] = [];

  if (!req.name?.trim()) {
    errors.push('需求名称不能为空');
  }

  if (req.businessImpactScore &&
      (req.businessImpactScore < 1 || req.businessImpactScore > 10)) {
    errors.push('业务影响度必须在 1-10 之间');
  }

  if (req.effortDays && req.effortDays <= 0) {
    errors.push('工作量必须大于 0');
  }

  return errors;
};
```

---

## 🎨 UI/UX 规范

### 颜色使用规范

| 用途 | 颜色 | Tailwind Class | 示例 |
|------|------|----------------|------|
| 权重分/评分 | 蓝色 | `text-blue-600` | 权重分显示 |
| 技术复杂度 | 橙色 | `text-orange-600` | 复杂度显示 |
| 强制 DDL | 红色 | `text-red-600` | 截止日期警告 |
| 星级 | 黄色 | `text-yellow-500` | ★★★★★ |
| 成功状态 | 绿色 | `text-green-600` | 操作成功提示 |
| 业务域标签 | 紫蓝色 | `bg-indigo-100 text-indigo-700` | 业务域 |
| RMS 标签 | 深蓝 | `bg-indigo-600 text-white` | RMS 重构标识 |

### 间距规范

```tsx
// ✅ 推荐：使用标准间距
<div className="p-4">           {/* 内边距：1rem */}
<div className="gap-3">         {/* 间隔：0.75rem */}
<div className="mb-2">          {/* 下边距：0.5rem */}
<div className="space-y-4">     {/* 垂直间距：1rem */}

// 标准间距值（优先使用）
gap-1  (0.25rem, 4px)
gap-2  (0.5rem,  8px)
gap-3  (0.75rem, 12px)
gap-4  (1rem,    16px)
gap-6  (1.5rem,  24px)
```

### 字体规范

```tsx
// 标题
text-base font-bold          // 主标题
text-sm font-semibold        // 次级标题

// 正文
text-sm text-gray-900        // 主要文本
text-xs text-gray-600        // 次要文本
text-xs text-gray-400        // 辅助文本

// 强调
font-semibold text-blue-600  // 重要数字/分数
font-medium text-gray-700    // 标签/字段名
```

### 交互反馈规范

```tsx
// ✅ 推荐：完整的交互状态
<button className="
  px-4 py-2 rounded
  bg-blue-600 text-white
  hover:bg-blue-700
  active:bg-blue-800
  disabled:bg-gray-300 disabled:cursor-not-allowed
  transition-colors duration-200
">
  提交
</button>

// ✅ 推荐：加载状态
{isLoading ? (
  <div className="flex items-center gap-2">
    <Loader2 className="animate-spin" size={16} />
    <span>加载中...</span>
  </div>
) : (
  <span>加载完成</span>
)}
```

---

## 🧪 代码质量保障

### 必须进行的检查

```bash
# 1. TypeScript 类型检查
npx tsc --noEmit

# 2. 构建测试
npm run build

# 3. 本地预览
npm run dev
```

### 代码审查清单（Code Review Checklist）

- [ ] TypeScript 类型定义完整且正确
- [ ] 没有使用 `any` 类型
- [ ] 组件 props 有明确的接口定义
- [ ] 使用了规范的术语（权重分、业务影响度等）
- [ ] 变量和函数命名清晰语义化
- [ ] 代码有必要的注释（中文）
- [ ] UI 文案统一且符合术语规范
- [ ] 交互状态完整（hover、active、disabled、loading）
- [ ] 错误处理完善（空值检查、边界情况）
- [ ] 没有 console.log 调试代码
- [ ] Git commit message 符合规范

---

## 📚 文档更新规范

### 需要同步更新的文档

| 变更类型 | 需要更新的文档 |
|---------|--------------|
| 新增功能 | README.md, DEVELOPMENT.md |
| 重构优化 | REFACTOR_LOG.md |
| API 变更 | CLAUDE.md（架构说明） |
| 术语新增 | .claude/project-rules.md（本文档） |
| 配置变更 | DEVELOPMENT.md |

### 文档编写规范

- ✅ 使用中文编写
- ✅ 使用 Markdown 格式
- ✅ 添加目录（长文档）
- ✅ 代码示例使用代码块并标注语言
- ✅ 重要信息使用表格或列表
- ✅ 添加 emoji 提升可读性（适度使用）

---

## 🚀 发布流程

### 版本号规范（Semantic Versioning）

```
v{major}.{minor}.{patch}

示例：v1.3.0
```

- **major**：重大架构变更或不兼容更新
- **minor**：新功能添加（向后兼容）
- **patch**：Bug 修复和小优化

### 发布检查清单

- [ ] 所有功能在本地测试通过
- [ ] TypeScript 编译无错误：`npx tsc --noEmit`
- [ ] 生产构建成功：`npm run build`
- [ ] **【重要】说明书术语一致性检查**
  - [ ] 说明书中术语从常量获取
  - [ ] 评分规则与代码一致
  - [ ] 示例数据准确
- [ ] **【重要】手动验证说明书内容**
  - [ ] 打开所有说明书检查术语
  - [ ] 验证评分标准说明正确
- [ ] 更新版本号（package.json, README.md）
- [ ] 更新 CHANGELOG 或版本历史
- [ ] 创建 Git tag：`git tag -a v1.3.0 -m "Release v1.3.0"`
- [ ] 推送代码和 tag：`git push && git push --tags`
- [ ] 部署到 Vercel 和腾讯云

---

## 📖 说明书与常量同步规范

### 说明书常量化原则

**核心原则：说明书中的所有术语和文案必须从常量中动态获取**

- ✅ **必须**：说明书（HandbookModal、评分说明等）中的术语从 `src/constants/ui-text.ts` 获取
- ✅ **必须**：评分规则、分数说明从 `src/constants/scoring-rules.ts` 获取
- ✅ **必须**：标准描述从配置文件（如 `complexityStandards.ts`）获取
- ❌ **禁止**：在说明书组件中硬编码术语和文案
- ❌ **禁止**：说明书与代码使用不一致的术语

### 实现方式

```typescript
// ✅ 推荐：从常量中获取术语
import { UI_TEXT } from '@/constants/ui-text';
import { SCORING_RULES } from '@/constants/scoring-rules';

// 说明书组件中使用
<div>
  <h3>{UI_TEXT.WEIGHT_SCORE}</h3>  {/* "权重分" */}
  <p>{SCORING_RULES.WEIGHT_SCORE_DESCRIPTION}</p>
</div>

// ❌ 避免：硬编码文案
<div>
  <h3>权重分</h3>
  <p>WSJF 计算后的 1-100 归一化分数</p>
</div>
```

### 常量文件结构

```typescript
// src/constants/ui-text.ts
export const UI_TEXT = {
  // 核心术语
  WEIGHT_SCORE: '权重分',
  BUSINESS_IMPACT: '业务影响度',
  COMPLEXITY: '技术复杂度',
  EFFORT: '工作量',
  TIME_CRITICALITY: '时间窗口',
  HARD_DEADLINE: '强制 DDL',
  STAR_RATING: '星级',

  // 说明文字
  WEIGHT_SCORE_DESC: 'WSJF 计算后的 1-100 归一化分数',
  BUSINESS_IMPACT_DESC: '1-10 分制评分，评估业务价值',
  // ...
} as const;

// src/constants/scoring-rules.ts
export const SCORING_RULES = {
  // 评分规则说明
  BUSINESS_IMPACT_LEVELS: {
    10: { name: '致命缺陷', description: '不解决直接导致系统崩溃...' },
    9: { name: '严重阻塞', description: '阻塞关键业务流程...' },
    // ...
  },
  COMPLEXITY_LEVELS: {
    10: { name: '全新技术平台', description: '全新技术栈、架构重建...' },
    // ...
  }
} as const;
```

### 发布前检查流程

**⚠️ 云端发布前必须执行的检查**

每次执行 `npm run deploy:vercel` 或 `npm run deploy:tencent` 前，必须完成以下检查：

#### 1. 术语一致性检查

```bash
# 检查说明书组件中是否有硬编码的术语
grep -r "权重分\|业务影响度\|技术复杂度" src/components/*Modal.tsx

# 应该没有直接硬编码，而是从常量导入
```

#### 2. 说明书内容检查

- [ ] **HandbookModal（WSJF评分说明书）**
  - [ ] 术语从 `UI_TEXT` 常量获取
  - [ ] 评分规则从 `SCORING_RULES` 获取
  - [ ] 示例数据反映当前评分标准

- [ ] **业务影响度说明**
  - [ ] 10分制说明从 `BUSINESS_IMPACT_STANDARDS` 获取
  - [ ] 分数档位描述与代码中的标准一致

- [ ] **技术复杂度说明**
  - [ ] 复杂度标准从 `COMPLEXITY_STANDARDS` 获取
  - [ ] 评分维度与配置文件一致

#### 3. 自动化检查脚本（推荐）

```bash
# 创建发布前检查脚本
# scripts/pre-deploy-check.sh

#!/bin/bash

echo "🔍 发布前检查..."

# 1. TypeScript 类型检查
echo "1️⃣ TypeScript 类型检查..."
npx tsc --noEmit || exit 1

# 2. 构建测试
echo "2️⃣ 构建测试..."
npm run build || exit 1

# 3. 检查硬编码术语
echo "3️⃣ 检查说明书中的硬编码..."
HARDCODED=$(grep -rn "权重分\|业务影响度\|技术复杂度" src/components/ | grep -v "UI_TEXT\|SCORING_RULES\|import")
if [ -n "$HARDCODED" ]; then
  echo "❌ 发现硬编码术语："
  echo "$HARDCODED"
  exit 1
fi

echo "✅ 所有检查通过，可以发布！"
```

#### 4. 手动检查步骤

**每次发布前手动验证：**

1. **本地运行** `npm run dev`
2. **打开说明书** - 点击顶部"查看说明书"按钮
3. **检查术语** - 确认所有术语与规范一致：
   - ✅ 使用"权重分"而非"热度分"
   - ✅ 使用"业务影响度"而非"业务价值"
   - ✅ 评分标准与代码中的标准一致
4. **检查评分说明** - 打开新增/编辑需求界面
   - ✅ 业务影响度选择器的说明文字正确
   - ✅ 技术复杂度选择器的说明文字正确
5. **检查示例** - 说明书中的示例分数与实际计算结果一致

### 重构时的同步更新

**当修改以下内容时，必须同步更新说明书：**

| 修改类型 | 需要同步的说明书 | 检查方式 |
|---------|----------------|---------|
| 术语名称变更 | 所有说明书组件 | 自动更新（如使用常量） |
| 评分规则调整 | HandbookModal | 更新 `SCORING_RULES` 常量 |
| 评分标准变更 | 业务影响度/复杂度说明 | 更新对应的 `STANDARDS` 配置 |
| 新增评分维度 | 相关说明文档 | 添加新的说明条目 |

### 违反规范的后果

- ❌ 说明书与实际功能不一致 → 用户困惑，支持成本增加
- ❌ 术语混用 → 团队沟通成本增加，专业性下降
- ❌ 硬编码术语 → 重构时遗漏，维护困难

---

## 🔧 配置文件管理

### 敏感信息处理

```typescript
// ✅ 推荐：配置文件中使用常量，不提交密钥
// src/config/api-keys.ts
export const GEMINI_API_KEY = ''; // 请在此填入您的 API Key

// .gitignore 中忽略包含密钥的文件
# API Keys
src/config/api-keys.local.ts
```

### 可配置项

- ✅ AI 提示词 → `src/config/aiPrompts.ts`
- ✅ 评分标准 → `src/config/complexityStandards.ts`
- ✅ UI 文案 → `src/constants/ui-text.ts`
- ✅ API Keys → `src/config/api-keys.ts`（不提交到 Git）

---

## ⚠️ 重要禁止事项

### 代码层面

- ❌ **禁止**使用 `any` 类型
- ❌ **禁止**直接修改 props 或 state
- ❌ **禁止**在 render 函数中进行副作用操作
- ❌ **禁止**提交包含 `console.log` 的代码
- ❌ **禁止**硬编码 API Key 到代码中

### 术语层面

- ❌ **禁止**混用"权重分"和"热度分"
- ❌ **禁止**使用未定义的缩写（BV, TC, DDL 除外，且需注释）
- ❌ **禁止**自创术语而不在本文档中定义

### Git 层面

- ❌ **禁止**直接在 main 分支强制推送（`git push --force`）
- ❌ **禁止**提交无意义的 commit message
- ❌ **禁止**提交未完成的功能到 main 分支

---

## 📋 规范文档维护

### 修改规范的流程

**⚠️ 重要原则：规范文档不可自动修改**

- ✅ **必须**：修改任何规范文档（project-rules.md, DEVELOPMENT.md 等）前，需得到项目负责人明确指示
- ✅ **必须**：提出修改建议时，先展示修改内容供审核，确认后再执行
- ❌ **禁止**：AI 助手或开发者自动调整规范而不经过审批
- ❌ **禁止**：因个别情况而随意修改已确立的规范

**修改流程：**
1. 发现规范需要调整时，提出修改建议并说明理由
2. 展示具体的修改内容（修改前/后对比）
3. 等待项目负责人审核确认
4. 确认后方可修改文档
5. 修改后提交 Git，commit message 使用 `Docs:` 类型

---

## 📞 问题反馈

如对本规范有疑问或建议，请：
1. 提交 GitHub Issue
2. 在团队会议中讨论
3. 更新本文档并提交 PR

---

**最后更新**: 2025-01-19
**维护者**: 开发团队
**版本**: v1.0
