# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WSJF Sprint Planner 是一个基于 WSJF (Weighted Shortest Job First) 方法的加权优先级排期可视化工具。用于帮助团队进行迭代需求排期决策。

技术栈：React 18 + TypeScript + Vite + Tailwind CSS + Lucide React

## Development Commands

### 启动开发服务器
```bash
npm install  # 首次运行需要安装依赖
npm run dev  # 启动开发服务器，自动在浏览器打开 http://localhost:3000
```

### 构建和预览
```bash
npm run build    # 构建生产版本到 dist 目录
npm run preview  # 预览生产构建
```


## Architecture

⚠️ **重要：开发前必读**
- 🔒 [安全规范](docs/standards/security-standards.md) - **强制执行（v1.5新增）** - CSRF/XSS防护
- 💧 [资源管理规范](docs/standards/resource-management.md) - **强制执行（v1.5新增）** - 防止内存泄漏
- ✅ [AI代码质量检查清单](ai-templates/CODE_QUALITY_CHECKLIST.md) - **AI开发必读**
- 📖 [架构指导原则](docs/architecture-guide.md) - 文件大小限制和代码组织规范
- 📋 [新功能开发流程](docs/new-feature-workflow.md) - 标准开发检查清单
- 🔧 [文件大小重构计划](docs/refactoring-plan.md) - 当前重构任务和执行指南
- ⭐ [重构规范](docs/standards/refactoring-standards.md) - **强制执行的重构规范**
- 📚 [规范标准目录](docs/standards/README.md) - 所有项目规范文档
- 🔍 运行 `npm run check-file-size` 检查文件大小
- ✅ 运行 `npm run pre-commit` 提交前检查

### 项目结构
```
WSJF/
├── src/
│   ├── components/            # UI 组件（每个 < 500 行）
│   ├── constants/             # 常量定义
│   ├── config/                # 配置文件
│   ├── data/                  # 数据生成和模拟数据
│   ├── utils/                 # 工具函数
│   ├── hooks/                 # 自定义 React Hooks
│   ├── store/                 # Zustand 状态管理
│   ├── types/                 # TypeScript 类型定义
│   ├── main.tsx               # 应用入口
│   ├── index.css              # Tailwind CSS 全局样式
│   └── wsjf-sprint-planner.tsx # 主应用组件
├── docs/                      # 📚 项目文档
│   ├── standards/             # ⭐ 项目规范（强制执行）
│   │   ├── README.md          # 规范索引
│   │   ├── refactoring-standards.md  # 重构规范
│   │   ├── coding-standards.md       # 编码规范（待创建）
│   │   └── ui-design-standards.md    # UI设计规范（待创建）
│   ├── checklists/            # 检查清单
│   │   ├── refactoring-checklist.md  # 重构检查清单
│   │   └── pr-review-checklist.md    # PR审查清单（待创建）
│   ├── refactoring-lessons/   # 重构经验教训
│   │   ├── refactoring-bug-analysis.md  # Bug分析报告
│   │   └── best-practices.md         # 最佳实践（待创建）
│   ├── architecture-guide.md  # 架构指导原则
│   ├── new-feature-workflow.md # 新功能开发流程
│   ├── refactoring-plan.md    # 重构计划（当前任务）
│   ├── prevention-measures.md # 预防措施实施指南
│   ├── refactoring-guides/    # 详细重构指南
│   │   ├── unscheduled-area-refactoring.md
│   │   ├── batch-evaluation-refactoring.md
│   │   ├── edit-requirement-modal-refactoring.md
│   │   └── main-app-refactoring.md
│   └── templates/             # 代码模板
│       ├── hook-template.ts
│       ├── component-template.tsx
│       └── util-template.ts
├── scripts/                   # 自动化脚本
│   └── check-file-size.js     # 文件大小检查
├── index.html                 # HTML 模板
├── vite.config.ts             # Vite 配置
├── tsconfig.json              # TypeScript 配置
└── tailwind.config.js         # Tailwind CSS 配置
```

### 核心组件说明

**wsjf-sprint-planner.tsx** - 单文件包含所有组件：

- `RequirementCard` - 需求卡片组件，显示需求信息和权重分
- `HandbookModal` - WSJF-Lite 评分说明书弹窗
- `EditRequirementModal` - 需求编辑弹窗，包含实时预览
- `EditSprintModal` - 迭代池编辑弹窗
- `SprintPoolComponent` - 迭代池组件，支持拖拽排期
- `UnscheduledArea` - 待排期区组件，包含筛选功能
- `WSJFPlanner` - 主应用组件，状态管理

### 评分算法

**原始分 (RawScore) 计算**：
```
RawScore = BV + TC + DDL + WorkloadScore
```

- BV (业务影响度)：局部 3 | 明显 6 | 撬动核心 8 | 战略平台 10
- TC (时间窗口)：随时 0 | 三月窗口 3 | 一月硬窗口 5
- DDL (强制截止)：无 0 | 有 5
- WorkloadScore（8档细分）：
  - ≤2天 +8 | 3-5天 +7 | 6-14天 +5 | 15-30天 +3
  - 31-50天 +2 | 51-100天 +1 | 101-150天 0 | >150天 0

原始分范围：3-28

**展示分 (DisplayScore) 归一化**：
```
DisplayScore = 10 + 90 * (RawScore - minRaw) / (maxRaw - minRaw)
```
归一化到 1-100，当所有需求分数相同时统一为 60

**星级分档**：
- ≥85: ★★★★★ (强窗口/立即投入)
- 70-84: ★★★★ (优先执行)
- 55-69: ★★★ (普通计划项)
- ≤54: ★★ (择机安排)

### 拖拽交互

使用原生 HTML5 Drag & Drop API：
- `draggable` 属性启用拖拽
- `dataTransfer` 传递需求 ID 和来源池 ID
- `onDragStart` / `onDragOver` / `onDrop` 事件处理

### 状态管理

使用 React useState，主要状态：
- `requirements` - 所有需求列表（含计算后的分数）
- `sprintPools` - 迭代池列表（含已排期需求）
- `unscheduled` - 待排期需求列表（按权重分降序）
- 各种 UI 状态（编辑弹窗、拖拽状态、筛选条件等）

### 样式系统

使用 Tailwind CSS utility classes：
- 渐变背景区分业务影响度等级
- 响应式布局（flex/grid）
- 自定义颜色映射（蓝色系表示价值，红色表示 DDL）
- hover/active 状态交互反馈

## 代码质量规范（强制执行）

### 文件大小限制
- ❌ **任何文件不得超过 500 行**（硬性规定）
- ⚠️ **超过 300 行时必须评估拆分**
- ✅ **推荐单文件保持在 200-300 行以内**

### 开发前检查
```bash
# 开发新功能前，先检查当前状态
npm run check-file-size

# 如果有严重问题（超过 500 行的文件），必须先重构
```

### 代码组织原则
1. **UI 和逻辑分离**
   - 组件只负责 UI 渲染
   - 业务逻辑提取到 Hook
   - 示例：`EditRequirementModal.tsx` + `useRequirementForm.ts`

2. **常量配置独立**
   - 超过 10 行的常量必须提取到 `constants/` 或 `config/`
   - 示例：`FIELD_NAME_MAP` 在 `constants/fieldNames.ts`

3. **工具函数复用**
   - 重复代码出现 3 次必须提取
   - 提取到 `utils/` 目录
   - 示例：`calculateScores` 在 `utils/scoring.ts`

4. **组件拆分**
   - 组件超过 200 行考虑拆分
   - 拆分为子组件或 Section
   - 示例：将大 Modal 拆分为多个 Section 组件

5. **类型安全（⭐新增 v1.5.0）**
   - **禁止使用宽泛的 `string` 类型表示枚举**
     ```typescript
     // ❌ 错误
     techProgress: string;

     // ✅ 正确
     techProgress: TechProgressStatus; // 联合类型
     ```

   - **所有枚举值必须定义为联合类型**
     ```typescript
     // src/types/techProgress.ts
     export type TechProgressStatus =
       | '待评估'
       | '未评估'
       | '已评估工作量'
       | '已完成技术方案';
     ```

   - **所有枚举值必须在常量文件中定义**
     ```typescript
     // src/constants/techProgress.ts
     export const TECH_PROGRESS = {
       PENDING: '待评估' as const,
       NOT_EVALUATED: '未评估' as const,
       EFFORT_EVALUATED: '已评估工作量' as const,
     } as const;
     ```

   - **禁止硬编码字符串，必须使用常量**
     ```typescript
     // ❌ 错误
     if (req.techProgress === '待评估') { ... }

     // ✅ 正确
     import { TECH_PROGRESS } from '@/constants/techProgress';
     if (req.techProgress === TECH_PROGRESS.PENDING) { ... }
     ```

   - **分组/筛选逻辑必须穷举所有可能值**
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

   - **开发环境必须添加运行时验证**
     ```typescript
     import { validateTechProgress } from '@/utils/validation';

     if (import.meta.env.DEV) {
       validateTechProgress(requirement.techProgress, '需求保存');
     }
     ```

### 违规处理
**发现文件超过 500 行时，必须立即停止开发并重构。**

详见：
- [架构指导原则](docs/architecture-guide.md) - 规范说明
- [新功能开发流程](docs/new-feature-workflow.md) - 开发流程
- [文件大小重构计划](docs/refactoring-plan.md) - 重构执行方案
- ⭐ [重构规范](docs/standards/refactoring-standards.md) - **强制执行规范**

### 类型安全违规处理（v1.5.0新增）
**新增/修改枚举类型时的强制检查清单**：

1. ✅ 在 `src/types/*.ts` 中定义联合类型
2. ✅ 在 `src/constants/*.ts` 中定义常量
3. ✅ 全局搜索使用处，确保所有分支处理新值
4. ✅ 添加运行时验证（开发环境）
5. ✅ 更新相关文档

**参考文档**：
- [调试决策树](docs/debugging-decision-tree.md) - 系统化排查问题
- [代码审查检查清单](docs/code-review-checklist.md) - PR审查标准
- [调试经验教训](ai-templates/DEBUGGING_LESSONS_LEARNED.md) - 案例学习

---

## 🔒 文件大小强制执行机制（v2.0 新增）

> ⚠️ **重要**: 本项目经历了一次大规模重构（5000+ 行代码重构）。为防止未来再次出现文件膨胀问题，引入以下强制执行机制。

### 为什么需要强制执行？

**血泪教训**：
- 2025-10-21 重构：EditRequirementModal (2229 → 442行)，ImportPreviewModal (1082 → 361行)，wsjf-sprint-planner (3102 → 534行)
- **耗时**: 8+ 小时重构工作
- **根本原因**: 规范存在但未自动化执行，开发者逐步突破红线

**核心原则**：
```
规范不自动化 = 规范不存在
人工遵守规范不可靠，必须工具化执行
```

### 📋 重构经验教训（必读）

**详细分析和案例**：
- 📚 [重构经验教训总结](ai-templates/REFACTORING_LESSONS_LEARNED.md) - 完整的失败原因分析和解决方案
- 🛠️ [文件大小强制执行规范](ai-templates/FILE_SIZE_ENFORCEMENT.md) - 新项目自动化实施模板

**五大教训**：
1. ⭐⭐⭐ **规范必须自动化执行** - Git hooks + CI/CD 强制拦截
2. ⭐⭐⭐ **超过 200 行就应该警觉** - 分级预警机制（200/300/400/500）
3. ⭐⭐ **"临时"代码必须立即清理** - 所有"稍后重构"永远不会发生
4. ⭐⭐ **新功能开发前必须评估影响** - 预估代码量，提前规划拆分
5. ⭐ **重构成本远高于预防成本** - 重构8小时 vs 预防30分钟

### 🚨 分级预警机制

```
🟢 < 200 行    安全区    正常开发
🟡 200-300 行  注意区    开始评估拆分
🟠 300-400 行  警告区    必须规划拆分方案
🔴 400-500 行  危险区    立即拆分，禁止添加新代码
❌ > 500 行    禁止区    拒绝提交（Git hook 拦截）
```

### 🛠️ 强制执行工具链

#### 1. 本地检查（开发时）
```bash
# 开发前检查
npm run check-file-size

# 提交前自动检查（Git pre-commit hook）
# 将在 scripts/pre-deploy-check.sh 中自动执行
```

#### 2. Git Hooks（提交时）
```bash
# 配置 Git pre-commit hook
# 超过 500 行的文件将被拒绝提交
# 详见：ai-templates/FILE_SIZE_ENFORCEMENT.md
```

#### 3. CI/CD 集成（推送时）
```yaml
# GitHub Actions / GitLab CI 自动检查
# PR 合并前必须通过文件大小检查
# 详见：ai-templates/FILE_SIZE_ENFORCEMENT.md
```

### 📐 开发新功能前强制检查清单

**每次添加新功能前必须完成以下检查**：

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

□ 6. 开始实现
     严格按照拆分方案执行
```

### 🎯 成功重构案例（参考）

| 组件 | 重构前 | 重构后 | 减少 | 创建文件 | 耗时 |
|------|--------|--------|------|----------|------|
| EditRequirementModal | 2229 行 | 442 行 | -80% | 5 个 | 2-3h |
| ImportPreviewModal | 1082 行 | 361 行 | -67% | 6 个 | 1-2h |
| wsjf-sprint-planner | 3102 行 | 534 行 | -83% | 8 个 | 3-4h |

**关键模式**：
1. 业务逻辑 → 提取到 Hook（优先）
2. 大段 JSX → 拆分为子组件（次要）
3. 配置/常量 → 独立文件（必须）

### ⚠️ 常见误区（必须避免）

#### 误区 1："稍后重构"
```
❌ 错误想法："现在先快速实现，等功能稳定了再重构"
✅ 正确做法："在实现功能的同时就保持代码质量"
💡 原因：所有"临时"代码都会变成永久代码，"稍后"永远不会到来
```

#### 误区 2："只超一点点"
```
❌ 错误想法："文件 520 行，只超了 20 行，应该没关系"
✅ 正确做法："500 行是红线，超过 1 行也必须重构"
💡 原因：破窗效应 - 一旦突破红线，从 520 行到 1000 行只需要几次提交
```

#### 误区 3："拆分会增加复杂度"
```
❌ 错误想法："拆分成多个文件，反而更难理解"
✅ 正确做法："适当的拆分会降低复杂度"
💡 原因：3000 行单文件 >> 10 个 300 行文件，单一职责的小文件更易维护
```

### 📚 新项目实施指南

**启动新项目时，必须执行**：
1. 复制 `ai-templates/FILE_SIZE_ENFORCEMENT.md` 到新项目
2. 按照其中的"新项目初始化检查清单"配置 Git Hooks
3. 配置 ESLint `max-lines` 规则
4. 配置 CI/CD 自动检查
5. 在团队中宣讲执行机制

**预计耗时**: 30-60 分钟（一次性投入）
**预防收益**: 避免未来 8+ 小时的重构工作

---

## 常见开发任务

### 添加新功能
**⚠️ 开发前必须阅读：** [新功能开发流程](docs/new-feature-workflow.md)

基本步骤：
1. 评估复杂度，预估代码行数
2. 如果 > 200 行，提前规划拆分方案
3. 创建必要的文件和目录
4. 开发过程中持续检查文件大小
5. 完成后运行 `npm run check-file-size`

### 进行重构
**⚠️ 重构前必须阅读：** [重构规范](docs/standards/refactoring-standards.md) ⭐ **强制执行**

#### AI助手重构工作流程（必须遵守）

**当用户请求重构UI组件时，AI必须按照以下流程执行**：

**阶段1: 重构前准备（必须询问用户）**
```
AI回复模板：
"我来帮您重构 <组件名>。这是一个UI组件，重构前请先运行：

bash scripts/prepare-refactor.sh <ComponentName>

脚本会引导您完成截图和创建样式快照。

完成后请回复'已完成'，我再开始重构。

或者，如果您已经准备好了，请确认：
□ 已截图保存到 docs/screenshots/before-refactor/
□ 已运行开发服务器

请回复'确认'或'需要帮助'。"
```

**阶段2: 重构执行（保持样式）**
- 必须保持所有颜色和渐变效果
- 必须保持所有 `type="button"` 属性
- 必须保持所有section的布局和字段位置
- 渐进式重构，每完成一个section说明保留了哪些样式

**阶段3: 重构后验证（必须提醒用户）**
```
AI回复模板：
"✅ 重构完成！

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
- '有差异' → 请详细说明，我会修复或回滚"
```

**禁止的行为**：
- ❌ 直接开始重构，不询问用户准备
- ❌ 重构完成后不提醒用户验证UI
- ❌ 用户说"有问题"时辩解，应立即修复或回滚

#### 用户手动操作流程

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

**重构三大原则**：
- ✅ 功能完整性 > 代码行数
- ✅ 样式和颜色必须保持一致
- ✅ 用户验证是最终把关


### 修改评分规则
修改 `utils/scoring.ts` 中的 `calculateScores` 函数

### 添加新的筛选维度
在 `UnscheduledArea` 组件中：
1. 添加新的 state（如 `newFilter`）
2. 添加对应的 select 元素
3. 在 `filteredReqs` 计算中添加筛选逻辑

### 修改卡片样式
修改 `RequirementCard` 组件中的 `getColor` 函数和 className

### 调整迭代池容量计算
修改 `SprintPoolComponent` 中的资源计算逻辑（`netAvailable`, `percentage` 等）


### 重构超大文件
**⚠️ 当前有 4 个文件超过 500 行，必须重构**

参考：[文件大小重构计划](docs/refactoring-plan.md)

**详细重构指南**：
- [UnscheduledArea 重构指南](docs/refactoring-guides/unscheduled-area-refactoring.md) (608 → 480行)
- [BatchEvaluationModal 重构指南](docs/refactoring-guides/batch-evaluation-refactoring.md) (744 → 480行)
- [EditRequirementModal 重构指南](docs/refactoring-guides/edit-requirement-modal-refactoring.md) (2044 → 480行)
- [主应用重构指南](docs/refactoring-guides/main-app-refactoring.md) (3102 → 480行)

**代码模板**：
- [Hook 模板](docs/templates/hook-template.ts)
- [组件模板](docs/templates/component-template.tsx)
- [工具函数模板](docs/templates/util-template.ts)
