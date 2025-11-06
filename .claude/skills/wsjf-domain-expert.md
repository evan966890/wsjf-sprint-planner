# wsjf-domain-expert

## Description
WSJF算法和项目架构专家。负责解答WSJF评分规则、组件结构、拖拽交互、状态管理等领域专业问题。

## Trigger Keywords
- WSJF
- 评分
- 算法
- 权重
- 组件结构
- 架构
- 拖拽
- 状态管理

## Instructions

### 核心组件说明

**wsjf-sprint-planner.tsx** - 主应用文件，包含所有组件：

- `RequirementCard` - 需求卡片组件，显示需求信息和权重分
- `HandbookModal` - WSJF-Lite 评分说明书弹窗
- `EditRequirementModal` - 需求编辑弹窗，包含实时预览
- `EditSprintModal` - 迭代池编辑弹窗
- `SprintPoolComponent` - 迭代池组件，支持拖拽排期
- `UnscheduledArea` - 待排期区组件，包含筛选功能
- `WSJFPlanner` - 主应用组件，状态管理

### 评分算法详解

#### 原始分 (RawScore) 计算

```
RawScore = BV + TC + DDL + WorkloadScore
```

**各维度详解**：

1. **BV (业务影响度)** - Business Value
   - 局部优化：3 分
   - 明显改善：6 分
   - 撬动核心：8 分
   - 战略平台：10 分

2. **TC (时间窗口)** - Time Criticality
   - 随时可做：0 分
   - 三月窗口：3 分
   - 一月硬窗口：5 分

3. **DDL (强制截止)** - Deadline
   - 无强制截止：0 分
   - 有强制截止：5 分

4. **WorkloadScore (工作量反向分)** - 8档细分
   - ≤2天：+8 分
   - 3-5天：+7 分
   - 6-14天：+5 分
   - 15-30天：+3 分
   - 31-50天：+2 分
   - 51-100天：+1 分
   - 101-150天：0 分
   - >150天：0 分

**原始分范围**：3-28 分

#### 展示分 (DisplayScore) 归一化

```typescript
DisplayScore = 10 + 90 * (RawScore - minRaw) / (maxRaw - minRaw)
```

- **目的**：归一化到 1-100 区间，便于用户理解
- **特殊情况**：当所有需求分数相同时，统一为 60 分
- **展示分范围**：1-100 分

#### 星级分档

- **≥85 分**：★★★★★ (强窗口/立即投入)
- **70-84 分**：★★★★ (优先执行)
- **55-69 分**：★★★ (普通计划项)
- **≤54 分**：★★ (择机安排)

### 拖拽交互

使用原生 HTML5 Drag & Drop API：

```typescript
// 启用拖拽
<div draggable={true}>

// 拖拽开始
onDragStart={(e) => {
  e.dataTransfer.setData('requirementId', req.id);
  e.dataTransfer.setData('sourcePoolId', poolId);
}}

// 允许放置
onDragOver={(e) => {
  e.preventDefault(); // 必须调用才能触发 drop
}}

// 放置处理
onDrop={(e) => {
  e.preventDefault();
  const reqId = e.dataTransfer.getData('requirementId');
  const sourcePoolId = e.dataTransfer.getData('sourcePoolId');
  // 处理需求移动逻辑
}}
```

### 状态管理

使用 React useState，主要状态：

```typescript
// 所有需求列表（含计算后的分数）
const [requirements, setRequirements] = useState<Requirement[]>([]);

// 迭代池列表（含已排期需求）
const [sprintPools, setSprintPools] = useState<SprintPool[]>([]);

// 待排期需求列表（按权重分降序）
const [unscheduled, setUnscheduled] = useState<Requirement[]>([]);

// UI 状态
const [editingReq, setEditingReq] = useState<Requirement | null>(null);
const [showHandbook, setShowHandbook] = useState(false);
const [dragState, setDragState] = useState<DragState>({ ... });
// ... 更多状态
```

**状态更新原则**：
- 所有需求修改通过 `setRequirements` 更新
- 排期操作同时更新 `sprintPools` 和 `unscheduled`
- 使用 immutable 更新模式

### 样式系统

使用 Tailwind CSS utility classes：

```typescript
// 渐变背景区分业务影响度等级
const getColor = (bv: number) => {
  if (bv >= 10) return 'bg-gradient-to-r from-blue-500 to-purple-600';
  if (bv >= 8) return 'bg-gradient-to-r from-blue-400 to-purple-500';
  if (bv >= 6) return 'bg-gradient-to-r from-blue-300 to-purple-400';
  return 'bg-gradient-to-r from-blue-200 to-purple-300';
};
```

**设计系统**：
- **蓝色系**：表示业务价值（from-blue-X to-purple-X）
- **红色系**：表示 DDL（text-red-600, border-red-500）
- **绿色系**：表示技术进展（bg-green-50, text-green-700）
- **响应式布局**：flex/grid + gap + responsive classes

### 常见问题解答

#### Q1: 如何修改评分规则？
A: 修改 `utils/scoring.ts` 中的 `calculateScores` 函数。

#### Q2: 如何添加新的筛选维度？
A: 在 `UnscheduledArea` 组件中：
1. 添加新的 state（如 `newFilter`）
2. 添加对应的 select 元素
3. 在 `filteredReqs` 计算中添加筛选逻辑

#### Q3: 如何修改卡片样式？
A: 修改 `RequirementCard` 组件中的 `getColor` 函数和 className

#### Q4: 如何调整迭代池容量计算？
A: 修改 `SprintPoolComponent` 中的资源计算逻辑（`netAvailable`, `percentage` 等）

#### Q5: 为什么有些需求不显示分数？
A: 未完成技术评估的需求（待评估/未评估状态）不显示分数，因为它们不可排期。

### 技术架构

```
┌─────────────────────────────────────┐
│     WSJFPlanner (主应用)             │
├─────────────────────────────────────┤
│  State Management (useState)        │
│  - requirements                     │
│  - sprintPools                      │
│  - unscheduled                      │
└─────────────────────────────────────┘
         │              │
         ▼              ▼
┌──────────────┐  ┌──────────────┐
│ Sprint Pools │  │ Unscheduled  │
│  Component   │  │    Area      │
└──────────────┘  └──────────────┘
         │              │
         ▼              ▼
┌────────────────────────────────┐
│    RequirementCard (复用)       │
│  - 显示需求信息                  │
│  - 权重分和星级                  │
│  - 拖拽支持                      │
└────────────────────────────────┘
```

### 相关代码位置

- **评分算法**：`src/utils/scoring.ts`
- **主应用**：`src/wsjf-sprint-planner.tsx`
- **类型定义**：`src/types/requirement.ts`
- **常量配置**：`src/constants/`
- **工具函数**：`src/utils/`
- **自定义 Hooks**：`src/hooks/`

### 修改建议

当用户需要修改功能时，根据类型引导：

- **算法调整** → `utils/scoring.ts`
- **UI 样式** → 对应组件的 className 或 getColor 函数
- **数据结构** → `types/requirement.ts` + 迁移逻辑
- **筛选逻辑** → `UnscheduledArea` 组件
- **拖拽行为** → 对应组件的 drag 事件处理函数
