# AI协作优化规范（通用版）

**适用于**: Claude Code、Cursor、GitHub Copilot等AI编程助手
**目标**: 避免Token消耗指数级增长，保持高效协作
**版本**: v1.0
**创建时间**: 2025-01-19

---

## 📋 目录

1. [核心原则](#核心原则)
2. [项目启动阶段](#项目启动阶段-0-1000行代码)
3. [成长阶段](#成长阶段-1000-5000行代码)
4. [成熟阶段](#成熟阶段-5000行代码)
5. [AI协作指令优化](#ai协作指令优化)
6. [文件组织规范](#文件组织规范)
7. [检查清单](#检查清单)

---

## 核心原则

### ⭐ 黄金法则

> **避免AI重复阅读相同内容**

Token消耗的最大来源是重复读取。每次对话都是新会话，AI需要重新了解项目。

### 📊 Token消耗曲线

```
项目规模    单次对话Token消耗    常见操作
─────────────────────────────────────────────
0-1K 行     5K-10K tokens       ✅ 正常
1K-5K 行    10K-30K tokens      🟡 需注意
5K-10K 行   30K-80K tokens      ⚠️ 需优化
10K+ 行     80K-150K tokens     🔴 必须优化
```

**临界点**: 5000行代码时开始出现效率下降

---

## 项目启动阶段（0-1000行代码）

### ✅ 必须做的事

#### 1. 创建AI上下文文件

**第一天就创建** `.claude/context.md` 或 `AI_CONTEXT.md`:

```markdown
# 项目快速索引

## 核心文件
- 主入口: src/main.tsx
- 路由: src/router.tsx
- 状态: src/store/index.ts

## 技术栈
- React 18 + TypeScript + Vite
- 状态管理: Zustand/Redux
- UI: Tailwind CSS

## 常用命令
npm run dev      # 开发
npm run build    # 构建
npm test         # 测试

## 项目规范
- 组件文件: PascalCase.tsx
- 工具文件: camelCase.ts
- 禁止使用: any类型, console.log
```

**为什么**: 让AI在每次对话开始时快速了解项目，避免重复探索。

#### 2. 建立配置索引

创建 `src/config/index.ts`:

```typescript
/**
 * 配置中心
 * 所有配置统一从这里导出
 */
export { API_KEY } from './api';
export { ROUTES } from './routes';
export { THEME } from './theme';
// ...
```

**为什么**: AI查找配置时只需读一个文件。

#### 3. 编写架构文档

创建 `ARCHITECTURE.md`:

```markdown
# 架构说明

## 目录结构
src/
├── components/    # UI组件（每个<300行）
├── pages/         # 页面组件
├── utils/         # 工具函数（每个<200行）
├── config/        # 配置文件
└── types/         # TS类型定义

## 数据流
User Action → Component → Store → API → Store → Component
```

**为什么**: AI理解架构后能做出更准确的建议。

---

## 成长阶段（1000-5000行代码）

### ⚠️ 关键优化点

#### 1. 严格控制单文件大小

**硬性规则**:
- 组件文件: **< 300行**
- 工具文件: **< 200行**
- 配置文件: **< 150行**
- 页面文件: **< 400行**

**超过限制立即拆分**，不要拖延！

```bash
# 检查大文件
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -10
```

#### 2. 创建组件索引

每个目录创建 `README.md`:

```markdown
# components/

## Button (Button.tsx, 150行)
用途: 通用按钮组件
Props: { label, onClick, variant }

## Modal (Modal.tsx, 200行)
用途: 模态框组件
Props: { isOpen, onClose, children }
```

**为什么**: AI可以通过README快速定位，不需要读所有组件代码。

#### 3. 使用代码地图

创建 `.claude/codemap.md`:

```markdown
# 代码地图

## 如果要修改评分规则
→ src/utils/scoring.ts (calcScore函数)

## 如果要添加新字段
→ src/types/index.ts (添加类型)
→ src/components/Form.tsx (添加UI)
→ src/store/schema.ts (添加存储)

## 如果要修改样式
→ tailwind.config.js (主题配置)
→ src/styles/ (全局样式)
```

**为什么**: AI收到需求后能直接定位，减少搜索。

---

## 成熟阶段（5000行+代码）

### 🔴 必须优化（否则无法高效协作）

#### 1. 模块化架构

**强制拆分**:

```
❌ 错误: 单个3000行的主文件
src/App.tsx (3000行)

✅ 正确: 拆分为模块
src/
├── App.tsx (100行 - 只做组合)
├── modules/
│   ├── Dashboard/
│   │   ├── index.tsx (50行)
│   │   ├── Header.tsx (100行)
│   │   └── Content.tsx (150行)
│   ├── Settings/
│   │   └── ... (类似结构)
```

**评估标准**: AI应该能通过读取<500行代码完成大部分任务。

#### 2. 分层文档系统

```
项目根目录/
├── README.md                    # 5分钟快速上手
├── ARCHITECTURE.md              # 15分钟理解架构
├── AI_CONTEXT.md                # AI快速索引（关键！）
├── docs/
│   ├── API.md                   # API文档
│   ├── COMPONENTS.md            # 组件文档
│   └── WORKFLOWS.md             # 业务流程文档
├── .claude/
│   ├── context.md               # 项目上下文
│   ├── codemap.md               # 代码地图
│   └── tips.md                  # 优化提示
```

#### 3. 智能索引机制

创建 `.claude/index.json`:

```json
{
  "lastUpdate": "2025-01-19",
  "hotFiles": [
    "src/utils/scoring.ts - 评分算法（常修改）",
    "src/config/constants.ts - 常量配置（常修改）"
  ],
  "largeFiles": [
    "src/legacy/OldMain.tsx - 3500行（遗留代码，避免读取）"
  ],
  "quickLinks": {
    "评分规则": "src/utils/scoring.ts:calcScore",
    "主题配置": "src/config/theme.ts",
    "API密钥": "src/config/api.ts"
  }
}
```

---

## AI协作指令优化

### 📝 折衷方案：描述性需求（不需要记行号）

#### ✅ 推荐的指令方式

```
级别1（最佳）- 描述功能位置:
"修改评分算法中10分的计算逻辑"
"优化需求编辑表单的业务影响度选择器"

级别2（良好）- 指定文件:
"在 scoring.ts 中修改满分逻辑"
"在 EditModal 组件中添加验证"

级别3（可接受）- 宽泛描述:
"优化评分计算"
"修改表单验证"
```

#### ❌ 避免的指令方式

```
❌ 过于宽泛:
"优化一下代码"
"检查下有没有问题"

❌ 要求全局搜索:
"找找看哪里可以优化"
"帮我看看为什么慢"
```

### 🎯 高效协作模式

#### 模式1: 问题 → 定位 → 修复

```
User: "评分算法在某些情况下会出错"
AI: [读取 AI_CONTEXT.md] → "评分算法在 src/utils/scoring.ts"
AI: [使用 Grep 搜索 "calcScore"] → "定位到第45行"
AI: [读取 offset=40, limit=20] → "找到问题，建议修改..."
```

**Token消耗**: ~5K (只读必要部分)

#### 模式2: 功能 → 地图 → 实现

```
User: "添加新的评分维度"
AI: [读取 .claude/codemap.md] → "需要修改3个文件"
AI: [依次读取并修改] → "完成"
```

**Token消耗**: ~8K (有地图指引)

#### 对比: 传统无优化模式

```
User: "添加新的评分维度"
AI: [搜索所有文件找评分相关] → 15K tokens
AI: [读取多个大文件确认] → 20K tokens
AI: [反复验证] → 10K tokens
```

**Token消耗**: ~45K (效率低下)

---

## 文件组织规范

### 📏 文件大小限制

| 文件类型 | 最大行数 | 超过时操作 |
|---------|---------|-----------|
| UI组件 | 300行 | 拆分为子组件 |
| 页面组件 | 500行 | 拆分为sections |
| 工具函数 | 200行 | 按功能拆分文件 |
| 配置文件 | 150行 | 分类拆分 |
| 类型定义 | 300行 | 按模块拆分 |
| 状态管理 | 400行 | 按功能域拆分 |

### 📂 目录结构最佳实践

```
src/
├── components/          # 每个组件独立目录
│   ├── Button/
│   │   ├── index.tsx           (< 100行)
│   │   ├── Button.styles.ts    (< 50行)
│   │   ├── Button.test.ts
│   │   └── README.md           (组件说明)
│   └── ...
├── config/              # 配置中心
│   ├── index.ts                (索引文件)
│   ├── api.ts                  (< 100行)
│   ├── routes.ts               (< 150行)
│   └── README.md               (配置文档)
├── utils/               # 工具函数
│   ├── index.ts                (统一导出)
│   ├── date.ts                 (< 150行)
│   ├── format.ts               (< 150行)
│   └── README.md
└── types/               # 类型定义
    ├── index.ts                (统一导出)
    ├── models.ts               (< 200行)
    └── api.ts                  (< 200行)
```

### 🔍 索引文件模式

**每个目录都有索引**:

```typescript
// src/utils/index.ts
export * from './date';
export * from './format';
export * from './validation';

// src/config/index.ts
export { API_KEY, API_URL } from './api';
export { ROUTES } from './routes';
export { THEME } from './theme';
```

**好处**: AI只需读一个文件就能了解整个模块。

---

## 检查清单

### 🚀 项目启动时（第1天）

- [ ] 创建 `AI_CONTEXT.md` 或 `.claude/context.md`
- [ ] 创建 `ARCHITECTURE.md`
- [ ] 设置 `src/config/index.ts` 配置中心
- [ ] 创建 `src/types/index.ts` 类型索引
- [ ] 设置文件大小检查脚本

### 📈 项目成长时（每周检查）

- [ ] 检查是否有文件超过规定行数
- [ ] 更新 `AI_CONTEXT.md` 中的文件路径
- [ ] 更新 `.claude/codemap.md` 代码地图
- [ ] 检查是否需要拆分大组件
- [ ] 更新各目录的 README.md

### 🔧 重构时（发现问题立即）

- [ ] 文件超过300行 → 立即拆分
- [ ] AI重复读取同一文件 → 添加到索引
- [ ] 功能难以定位 → 更新代码地图
- [ ] 协作效率下降 → 检查文档完整性

### 📊 定期审查（每月）

- [ ] 统计最常修改的文件（考虑拆分）
- [ ] 检查文档与代码是否同步
- [ ] 评估AI协作效率（对话token消耗）
- [ ] 优化文件组织结构

---

## 实施指南

### 新项目如何使用

**1. 复制模板文件**:
```bash
# 创建基础文档
touch AI_CONTEXT.md
touch ARCHITECTURE.md
mkdir -p .claude
touch .claude/context.md
touch .claude/codemap.md
touch .claude/tips.md
```

**2. 第一次与AI对话时**:
```
"这是一个新项目，请先阅读 AI_CONTEXT.md 了解项目结构"
```

**3. 项目开发中**:
- 每次添加重要模块 → 更新 AI_CONTEXT.md
- 每周检查文件大小 → 超限及时拆分
- 发现AI重复搜索 → 添加到 codemap.md

### 现有项目如何改造

**阶段1: 建立索引**（1小时）
1. 创建 `AI_CONTEXT.md`
2. 列出核心文件（10-15个最重要的）
3. 创建配置索引 `src/config/index.ts`

**阶段2: 拆分大文件**（按需）
1. 找出>500行的文件
2. 优先拆分最常修改的
3. 逐步拆分，不着急

**阶段3: 完善文档**（持续）
1. 添加 `.claude/codemap.md`
2. 各目录添加 README.md
3. 保持文档与代码同步

---

## 成功案例

### 案例1: WSJF Sprint Planner

**优化前**:
- 主文件: 3500行
- 对话token: 80K-100K
- 效率: 低

**优化后**:
- 创建配置索引 (`src/config/index.ts`)
- 添加上下文文件 (`.claude/context.md`)
- 添加代码地图 (`.claude/codemap.md`)
- 对话token: 降低50%
- 效率: 显著提升

**关键优化**:
```
1. 配置集中管理（7个配置文件 → 1个索引入口）
2. 上下文文档（避免重复探索项目结构）
3. 代码地图（快速定位功能位置）
```

---

## 工具和脚本

### 文件大小检查

```bash
#!/bin/bash
# check-file-size.sh

echo "检查超过300行的组件文件..."
find src/components -name "*.tsx" -exec wc -l {} + | awk '$1 > 300 {print}'

echo "检查超过200行的工具文件..."
find src/utils -name "*.ts" -exec wc -l {} + | awk '$1 > 200 {print}'
```

### 索引更新提醒

添加到 `package.json`:
```json
{
  "scripts": {
    "check:size": "bash scripts/check-file-size.sh",
    "precommit": "npm run check:size"
  }
}
```

---

## 总结

### 核心要点

1. **预防胜于治疗** - 从第一天就建立索引
2. **小文件原则** - 严格控制文件大小
3. **文档同步** - 代码变化，文档同步
4. **描述性需求** - 告诉AI"做什么"，让AI定位"在哪里"

### 记住这句话

> **"让AI知道去哪里找，而不是让AI到处找"**

---

**版本历史**:
- v1.0 (2025-01-19): 初始版本，基于WSJF项目实践总结

**维护**: 定期更新，欢迎补充最佳实践

---

## 附录: 复制清单

### 新项目必备文件模板

```
1. AI_CONTEXT.md - 项目快速索引
2. ARCHITECTURE.md - 架构说明
3. .claude/context.md - AI上下文
4. .claude/codemap.md - 代码地图
5. .claude/tips.md - 优化提示
6. src/config/index.ts - 配置索引
7. src/types/index.ts - 类型索引
```

复制这个文件到新项目，根据实际情况调整内容。
