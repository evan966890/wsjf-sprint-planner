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
- 📖 [架构指导原则](docs/architecture-guide.md) - 文件大小限制和代码组织规范
- 📋 [新功能开发流程](docs/new-feature-workflow.md) - 标准开发检查清单
- 🔍 运行 `npm run check-file-size` 检查文件大小

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
│   ├── architecture-guide.md  # 架构指导原则
│   └── new-feature-workflow.md # 新功能开发流程
├── scripts/                   # 自动化脚本
│   └── check-file-size.js     # 文件大小检查
├── index.html                 # HTML 模板
├── vite.config.ts             # Vite 配置
├── tsconfig.json              # TypeScript 配置
└── tailwind.config.js         # Tailwind CSS 配置
```

### 核心组件说明

**wsjf-sprint-planner.tsx** - 单文件包含所有组件：

- `RequirementCard` - 需求卡片组件，显示需求信息和热度分
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

- BV (业务价值)：局部 3 | 明显 6 | 撬动核心 8 | 战略平台 10
- TC (时间临界)：随时 0 | 三月窗口 3 | 一月硬窗口 5
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
- `unscheduled` - 待排期需求列表（按热度分降序）
- 各种 UI 状态（编辑弹窗、拖拽状态、筛选条件等）

### 样式系统

使用 Tailwind CSS utility classes：
- 渐变背景区分业务价值等级
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

详见 [架构指导原则](docs/architecture-guide.md) 和 [新功能开发流程](docs/new-feature-workflow.md)

### 类型安全违规处理（v1.5.0新增）
**新增/修改枚举类型时的强制检查清单**：

1. ✅ 在 `src/types/*.ts` 中定义联合类型
2. ✅ 在 `src/constants/*.ts` 中定义常量
3. ✅ 全局搜索使用处，确保所有分支处理新值
4. ✅ 添加运行时验证（开发环境）
5. ✅ 更新单元测试
6. ✅ 更新相关文档

**参考文档**：
- [调试决策树](docs/debugging-decision-tree.md) - 系统化排查问题
- [代码审查检查清单](docs/code-review-checklist.md) - PR审查标准
- [调试经验教训](ai-templates/DEBUGGING_LESSONS_LEARNED.md) - 案例学习

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
