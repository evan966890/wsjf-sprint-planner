# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WSJF Sprint Planner 是一个基于 WSJF (Weighted Shortest Job First) 方法的加权优先级排期可视化工具。用于帮助团队进行迭代需求排期决策。

**技术栈**：React 18 + TypeScript + Vite + Tailwind CSS + Lucide React

## Development Commands

```bash
npm install       # 首次运行需要安装依赖
npm run dev       # 启动开发服务器 (http://localhost:3000)
npm run build     # 构建生产版本到 dist 目录
npm run preview   # 预览生产构建

# 质量检查
npm run check-file-size  # 检查文件大小
npm run pre-commit       # 提交前检查
```

## Architecture Quick Reference

### ⚠️ 核心规范（触发自动 Skills）

当遇到特定任务时，AI 会自动加载相关 skill：

| 场景 | 触发关键词 | 加载的 Skill |
|-----|----------|-------------|
| 🔄 重构 UI 组件 | 重构、refactor、拆分 | `refactoring-assistant` |
| 📏 添加新功能 | 新功能、添加功能、开发 | `file-size-checker` |
| ✅ 代码质量检查 | 检查代码、质量检查、规范 | `code-quality-enforcer` |
| 📊 WSJF 算法问题 | WSJF、评分、算法、架构 | `wsjf-domain-expert` |
| 🛠️ 常见开发任务 | 怎么修改、如何添加 | `common-tasks-guide` |

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
│   └── wsjf-sprint-planner.tsx # 主应用组件
│
├── docs/                      # 📚 项目文档
│   ├── standards/             # ⭐ 项目规范（强制执行）
│   ├── checklists/            # 检查清单
│   ├── refactoring-lessons/   # 重构经验教训
│   └── refactoring-guides/    # 详细重构指南
│
├── .claude/skills/            # 🎯 Claude Skills（按需加载）
│   ├── refactoring-assistant.md
│   ├── file-size-checker.md
│   ├── code-quality-enforcer.md
│   ├── wsjf-domain-expert.md
│   └── common-tasks-guide.md
│
└── scripts/                   # 自动化脚本
    └── check-file-size.js
```

### 核心组件

**主应用**：`wsjf-sprint-planner.tsx`
- `RequirementCard` - 需求卡片
- `HandbookModal` - WSJF 评分说明书
- `EditRequirementModal` - 需求编辑弹窗
- `SprintPoolComponent` - 迭代池（支持拖拽）
- `UnscheduledArea` - 待排期区（支持筛选）
- `WSJFPlanner` - 主应用（状态管理）

## 代码质量红线（强制执行）

### 文件大小限制

```
🟢 < 200 行    安全区    正常开发
🟡 200-300 行  注意区    开始评估拆分
🟠 300-400 行  警告区    必须规划拆分方案
🔴 400-500 行  危险区    立即拆分，禁止添加新代码
❌ > 500 行    禁止区    拒绝提交（Git hook 拦截）
```

**发现文件超过 500 行时，必须立即停止开发并重构。**

### 代码组织原则

1. **UI 和逻辑分离** - 组件只负责 UI，业务逻辑提取到 Hook
2. **常量配置独立** - 超过 10 行的常量必须提取到 `constants/`
3. **工具函数复用** - 重复代码出现 3 次必须提取到 `utils/`
4. **组件拆分** - 组件超过 200 行考虑拆分
5. **类型安全** - 禁止使用宽泛的 `string` 类型表示枚举

## Skills 系统说明

本项目使用 Claude Skills 实现按需加载的专业知识系统，大幅减少首次加载的 token 消耗。

### Skills 列表

#### 1. refactoring-assistant (重构助手)
**触发场景**：用户说"重构"、"拆分文件"
**功能**：引导完整的三阶段重构流程（准备→执行→验证）

#### 2. file-size-checker (文件大小检查)
**触发场景**：用户说"新功能"、"添加功能"
**功能**：检查文件大小、评估代码量、规划拆分方案

#### 3. code-quality-enforcer (代码质量执行)
**触发场景**：用户说"检查代码"、"质量检查"
**功能**：检查代码组织、类型安全、生成检查报告

#### 4. wsjf-domain-expert (WSJF 领域专家)
**触发场景**：用户问"WSJF"、"评分算法"、"架构"
**功能**：解答评分规则、组件结构、拖拽交互等专业问题

#### 5. common-tasks-guide (常见任务指南)
**触发场景**：用户说"怎么修改"、"如何添加"
**功能**：提供常见开发任务的具体操作步骤

### Skills 优势

**优化前**（原 CLAUDE.md）：
- 文件大小：543 行
- 首次加载：~4 万 token
- 简单对话：token 消耗高，响应慢

**优化后**（Skills 系统）：
- 核心文档：~150 行
- 首次加载：~1.2 万 token（减少 70%）
- 简单对话：快速响应
- 专业任务：按需加载精准知识

## 快速开始

### 新功能开发流程

1. **检查文件大小**：`npm run check-file-size`
2. **评估代码量**：预估新功能行数
3. **判断是否需要拆分**：超过 300 行建议先重构
4. **开发**：遵循代码组织原则
5. **验证**：`npm run build` 确保构建成功

### 重构 UI 组件流程

1. **准备**：截图所有 UI 状态
2. **执行**：渐进式重构，保持样式一致
3. **验证**：对比截图，确认 UI 无变化

（详细流程会在触发时自动加载 `refactoring-assistant` skill）

## 重要文档索引

### 规范文档（强制执行）
- [重构规范](docs/standards/refactoring-standards.md) - ⭐ 必读
- [安全规范](docs/standards/security-standards.md) - CSRF/XSS 防护
- [资源管理规范](docs/standards/resource-management.md) - 防止内存泄漏

### 开发指南
- [架构指导原则](docs/architecture-guide.md) - 代码组织规范
- [新功能开发流程](docs/new-feature-workflow.md) - 标准开发检查清单
- [文件大小重构计划](docs/refactoring-plan.md) - 当前重构任务

### 检查清单
- [AI 代码质量检查清单](ai-templates/CODE_QUALITY_CHECKLIST.md)
- [重构检查清单](docs/checklists/refactoring-checklist.md)

### 经验教训
- [重构经验教训](ai-templates/REFACTORING_LESSONS_LEARNED.md) - 5000+ 行重构血泪教训
- [文件大小强制执行](ai-templates/FILE_SIZE_ENFORCEMENT.md) - 新项目实施指南

## 常见问题

**Q: 如何修改评分规则？**
A: 修改 `utils/scoring.ts` 中的 `calculateScores` 函数（详细说明会自动加载 `wsjf-domain-expert` skill）

**Q: 文件超过 500 行怎么办？**
A: 必须立即重构（详细流程会自动加载 `refactoring-assistant` skill）

**Q: 如何添加新的筛选维度？**
A: 在 `UnscheduledArea` 组件中添加（详细步骤会自动加载 `common-tasks-guide` skill）

---

**💡 提示**：当你提出具体开发需求时，AI 会自动加载相关的 skill，提供专业的指导和步骤。
