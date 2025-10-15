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

### 项目结构
```
WSJF/
├── src/
│   ├── main.tsx                   # 应用入口
│   ├── index.css                  # Tailwind CSS 全局样式
│   └── wsjf-sprint-planner.tsx   # 主组件（单文件架构）
├── index.html                     # HTML 模板
├── vite.config.ts                 # Vite 配置
├── tsconfig.json                  # TypeScript 配置
└── tailwind.config.js             # Tailwind CSS 配置
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
- WorkloadScore：≤5天 +6 | 6-15天 +4 | 16-30天 +2 | >30天 0

原始分范围：3-26

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

## 常见开发任务

### 修改评分规则
修改 `calculateScores` 函数中的映射表 `BV_MAP`, `TC_MAP` 和 `getWorkloadScore` 函数

### 添加新的筛选维度
在 `UnscheduledArea` 组件中：
1. 添加新的 state（如 `newFilter`）
2. 添加对应的 select 元素
3. 在 `filteredReqs` 计算中添加筛选逻辑

### 修改卡片样式
修改 `RequirementCard` 组件中的 `getColor` 函数和 className

### 调整迭代池容量计算
修改 `SprintPoolComponent` 中的资源计算逻辑（`netAvailable`, `percentage` 等）
