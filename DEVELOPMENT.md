# WSJF Sprint Planner - 开发指南

本文档提供完整的开发指南，帮助开发者快速上手项目并遵循最佳实践。

---

## 📋 目录

- [快速开始](#快速开始)
- [开发环境搭建](#开发环境搭建)
- [项目架构](#项目架构)
- [核心功能说明](#核心功能说明)
- [常见开发任务](#常见开发任务)
- [配置说明](#配置说明)
- [调试技巧](#调试技巧)
- [性能优化](#性能优化)
- [故障排查](#故障排查)
- [发布部署](#发布部署)

---

## 🚀 快速开始

### 前置要求

- **Node.js**: >= 16.0.0（推荐 18.x 或 20.x）
- **npm**: >= 8.0.0
- **Git**: >= 2.0.0
- **编辑器**: VS Code（推荐，配置了 TypeScript 支持）

### 快速启动

```bash
# 1. 克隆项目
git clone https://github.com/your-org/wsjf-sprint-planner.git
cd wsjf-sprint-planner

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 浏览器访问
# 自动打开 http://localhost:5173
```

### 验证安装

启动后应该看到：

```
VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

## 🛠️ 开发环境搭建

### 1. VS Code 配置

**推荐扩展：**

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "visualstudioexptteam.vscodeintellicode"
  ]
}
```

**工作区设置：**

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### 2. Git Hooks（可选）

安装 Husky 实现提交前检查：

```bash
# 安装 husky
npm install --save-dev husky

# 初始化
npx husky init

# 添加 pre-commit hook
echo "npm run type-check" > .husky/pre-commit
```

### 3. 开发工具

```bash
# TypeScript 类型检查
npm run type-check

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

---

## 🏗️ 项目架构

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI 框架 |
| TypeScript | 5.6.2 | 类型系统 |
| Vite | 5.4.11 | 构建工具 |
| Tailwind CSS | 3.4.17 | 样式框架 |
| Lucide React | 0.468.0 | 图标库 |

### 目录结构

```
WSJF/
├── .claude/                      # Claude Code 配置
│   └── project-rules.md         # 项目规范（AI自动读取）
├── src/
│   ├── components/              # 可复用组件
│   │   ├── BatchEvaluationModal.tsx      # AI批量评估
│   │   ├── EditRequirementModal.tsx      # 需求编辑
│   │   └── BusinessImpactScoreSelector.tsx # 评分选择器
│   ├── config/                  # 配置文件
│   │   ├── aiPrompts.ts         # AI提示词配置
│   │   └── complexityStandards.ts # 复杂度标准
│   ├── constants/               # 常量定义
│   │   ├── ui-text.ts           # UI文案常量（待创建）
│   │   └── scoring-rules.ts     # 评分规则（待创建）
│   ├── types/                   # TypeScript 类型
│   │   └── index.ts             # 所有接口定义
│   ├── main.tsx                 # 应用入口
│   ├── index.css                # 全局样式
│   └── wsjf-sprint-planner.tsx  # 主组件
├── public/                      # 静态资源
├── dist/                        # 构建输出
├── index.html                   # HTML模板
├── package.json                 # 项目配置
├── vite.config.ts              # Vite配置
├── tsconfig.json               # TypeScript配置
├── tailwind.config.js          # Tailwind配置
├── README.md                   # 项目说明
├── DEVELOPMENT.md              # 开发指南（本文档）
├── REFACTOR_LOG.md             # 重构日志
└── CLAUDE.md                   # Claude Code指南
```

### 核心组件说明

#### 主组件 (`wsjf-sprint-planner.tsx`)

**职责：**
- 应用状态管理（需求列表、迭代池）
- 数据持久化（LocalStorage）
- 拖拽逻辑处理
- 评分计算和归一化

**关键函数：**

```typescript
// 评分计算
const calculateScores = (requirements: Requirement[]): Requirement[]

// 拖拽处理
const handleDragStart = (e: React.DragEvent, id: string, poolId?: string)
const handleDrop = (e: React.DragEvent, targetPoolId?: string)

// 数据持久化
useEffect(() => {
  localStorage.setItem('wsjf_requirements', JSON.stringify(requirements));
}, [requirements]);
```

#### 组件模块

**1. BatchEvaluationModal** - AI批量评估
- 支持 OpenAI / DeepSeek 模型
- 批量分析需求并推荐评分
- 显示评分理由和影响指标

**2. EditRequirementModal** - 需求编辑
- 完整的需求表单
- 实时评分预览
- 10分制业务影响度和技术复杂度

**3. BusinessImpactScoreSelector** - 评分选择器
- 1-10分制选择器
- 展示评分标准说明
- 支持快速选择和详细说明

---

## 💡 核心功能说明

### 1. WSJF 评分算法

**算法流程：**

```typescript
// 第一步：计算原始分（rawScore）
rawScore = businessImpactScore + complexityFactor + timeFactor + effortBonus

// 业务影响度：1-10分（直接使用）
businessImpactScore = requirement.businessImpactScore || 5

// 复杂度因子：复杂度越高，分数越低（反向）
complexityFactor = (11 - requirement.complexityScore) * 0.5

// 时间因子：时间窗口 + 强制DDL
timeFactor = TIME_CRITICALITY_MAP[timeCriticality] + (hardDeadline ? 5 : 0)

// 工作量奖励：优先小任务
effortBonus = getWorkloadScore(effortDays)

// 第二步：归一化到1-100（displayScore）
const minRaw = Math.min(...allRawScores)
const maxRaw = Math.max(...allRawScores)

if (maxRaw === minRaw) {
  displayScore = 60  // 所有需求相同时
} else {
  displayScore = 10 + 90 * (rawScore - minRaw) / (maxRaw - minRaw)
}

// 第三步：星级分档
if (displayScore >= 85) stars = 5      // ★★★★★
else if (displayScore >= 70) stars = 4  // ★★★★
else if (displayScore >= 55) stars = 3  // ★★★
else stars = 2                          // ★★
```

**关键参数：**

```typescript
// 时间窗口映射
TIME_CRITICALITY_MAP = {
  '随时': 0,
  '三月窗口': 3,
  '一月硬窗口': 5
}

// 工作量奖励（8档细分）
≤2天: +8分    // 极小任务，最高奖励
3-5天: +7分   // 小任务，高优先级
6-14天: +5分  // 常规任务，正常推进
15-30天: +3分 // 中等任务，需要规划
31-50天: +2分 // 大任务，建议切分
51-100天: +1分 // 超大任务，必须切分
101-150天: 0分 // 巨型任务，严重超标
>150天: 0分    // 不可接受，禁止入池
```

### 2. 10分制评分系统

**业务影响度（1-10分）：**

| 分数 | 级别 | 典型场景 |
|------|------|---------|
| 10 | 致命缺陷 | 系统崩溃、核心功能失效 |
| 9 | 严重阻塞 | 关键业务流程阻塞 |
| 8 | 战略必需 | CEO级项目、战略转型 |
| 7 | 显著影响 | 影响多个核心指标 |
| 6 | 战略加速 | 加速业务增长 |
| 5 | 重要优化 | 改善过程指标 |
| 4 | 有价值优化 | 小幅体验提升 |
| 3 | 常规功能 | 常规需求 |
| 2 | 小幅改进 | 锦上添花 |
| 1 | Nice-to-have | 可有可无 |

**技术复杂度（1-10分）：**

| 分数 | 级别 | 技术挑战 |
|------|------|---------|
| 10 | 全新技术平台 | 全新技术栈、架构重建 |
| 9 | 核心架构重构 | 核心系统重构 |
| 8 | 系统级改造 | 多系统集成、底层改造 |
| 7 | 复杂功能开发 | 复杂算法、高并发 |
| 6 | 跨系统集成 | 多系统对接 |
| 5 | 标准功能开发 | 常规CRUD+业务逻辑 |
| 4 | 简单集成 | 第三方SDK集成 |
| 3 | 页面开发 | 纯前端页面 |
| 2 | 配置调整 | 参数配置 |
| 1 | 简单修改 | 文案、样式调整 |

### 3. AI 智能评估

**支持的模型：**

- **OpenAI GPT-4** - 推荐用于复杂需求分析
- **DeepSeek** - 性价比高，适合批量处理

**评估流程：**

1. 用户选择需求（支持多选）
2. 选择 AI 模型
3. AI 分析需求文档/描述
4. 返回评分建议 + 理由 + 影响指标
5. 用户确认或调整

**配置文件：**

```typescript
// src/config/aiPrompts.ts
export const AI_BUSINESS_IMPACT_ANALYSIS_PROMPT = `...详细的提示词...`

// 可根据团队需求调整：
// - 评分标准描述
// - 指标分类
// - 分析维度
```

### 4. 数据持久化

**存储方案：** LocalStorage

**存储内容：**

```typescript
// 需求列表
localStorage.setItem('wsjf_requirements', JSON.stringify(requirements))

// 迭代池
localStorage.setItem('wsjf_sprint_pools', JSON.stringify(sprintPools))

// 用户信息
localStorage.setItem('wsjf_user', JSON.stringify(user))
```

**数据恢复：**

应用启动时自动从 LocalStorage 恢复数据。

---

## 🔧 常见开发任务

### 任务1: 添加新的评分维度

**场景：** 需要增加"用户满意度"维度

**步骤：**

1. **更新类型定义** (`src/types/index.ts`)

```typescript
export interface Requirement {
  // ...现有字段
  userSatisfactionScore?: number;  // 新增：用户满意度（1-10分）
}
```

2. **更新评分算法** (`src/wsjf-sprint-planner.tsx`)

```typescript
const calculateScores = (requirements: Requirement[]): Requirement[] => {
  // 修改 rawScore 计算
  const rawScore =
    (req.businessImpactScore || 5) +
    (req.userSatisfactionScore || 5) * 0.8 +  // 新增
    // ...其他因素
}
```

3. **更新编辑表单** (`src/components/EditRequirementModal.tsx`)

```tsx
{/* 新增用户满意度选择器 */}
<div>
  <label className="block text-sm font-medium mb-2">
    用户满意度 (1-10分)
  </label>
  <select
    value={formData.userSatisfactionScore || 5}
    onChange={(e) => setFormData({
      ...formData,
      userSatisfactionScore: Number(e.target.value)
    })}
    className="..."
  >
    {[1,2,3,4,5,6,7,8,9,10].map(score => (
      <option key={score} value={score}>{score}分</option>
    ))}
  </select>
</div>
```

4. **更新说明书**

如果遵循常量化规范，说明书会自动更新。

### 任务2: 修改UI文案

**❌ 错误方式：** 直接修改组件中的硬编码文字

```tsx
// ❌ 不推荐
<span>权重分</span>
```

**✅ 正确方式：** 使用常量

```typescript
// 1. 在 src/constants/ui-text.ts 中定义
export const UI_TEXT = {
  WEIGHT_SCORE: '权重分',
  // ...
} as const;

// 2. 在组件中使用
import { UI_TEXT } from '@/constants/ui-text';

<span>{UI_TEXT.WEIGHT_SCORE}</span>
```

### 任务3: 添加新的迭代池

**代码位置：** `src/wsjf-sprint-planner.tsx`

```typescript
const handleAddSprintPool = () => {
  const newPool: SprintPool = {
    id: `sprint-${Date.now()}`,
    name: `迭代${sprintPools.length + 1}`,
    startDate: '',
    endDate: '',
    totalDays: 0,
    bugReserve: 20,      // 默认预留20%给Bug
    refactorReserve: 10, // 默认预留10%给重构
    otherReserve: 5,     // 默认预留5%给其他
    requirements: []
  };

  setSprintPools([...sprintPools, newPool]);
};
```

### 任务4: 自定义AI提示词

**文件：** `src/config/aiPrompts.ts`

**示例：** 调整业务影响度评分标准

```typescript
export const AI_BUSINESS_IMPACT_ANALYSIS_PROMPT = `
你是一个专业的产品需求分析专家...

## 评分标准（1-10分制）

**10分 - 致命缺陷**
- 【修改这里】不解决直接导致...
- 影响所有用户的核心功能
- 示例：【添加你们团队的典型案例】

**9分 - 严重阻塞**
- 【根据团队实际情况调整】
...
`;
```

**注意：** 修改后需要重新测试AI评估功能。

### 任务5: 导出数据格式调整

**代码位置：** `src/wsjf-sprint-planner.tsx` - `handleExportExcel` 函数

**示例：** 添加新的导出列

```typescript
const handleExportExcel = () => {
  const data = allRequirements.map(req => ({
    '需求名称': req.name,
    '权重分': req.displayScore || 0,
    '星级': '★'.repeat(req.stars || 0),
    '业务影响度': req.businessImpactScore || '-',
    '技术复杂度': req.complexityScore || '-',
    // 新增列
    '用户满意度': req.userSatisfactionScore || '-',
    '优先级': req.displayScore >= 85 ? '高' :
              req.displayScore >= 70 ? '中' : '低',
    // ...
  }));

  // 生成Excel...
};
```

---

## ⚙️ 配置说明

### 1. AI 模型配置

**OpenAI 配置：**

```typescript
// 在组件中配置（未来可抽取到配置文件）
const openaiConfig = {
  apiKey: 'your-api-key',  // ⚠️ 不要提交到Git
  model: 'gpt-4-turbo-preview',
  temperature: 0.3,
  maxTokens: 2000
};
```

**DeepSeek 配置：**

```typescript
const deepseekConfig = {
  apiKey: 'your-api-key',
  model: 'deepseek-chat',
  baseURL: 'https://api.deepseek.com/v1'
};
```

**环境变量（推荐）：**

```bash
# .env.local（不提交到Git）
VITE_OPENAI_API_KEY=sk-...
VITE_DEEPSEEK_API_KEY=sk-...
```

### 2. 评分标准配置

**业务影响度标准：**

文件：`src/config/businessImpactStandards.ts`（待创建）

```typescript
export const BUSINESS_IMPACT_STANDARDS: ScoringStandard[] = [
  {
    score: 10,
    name: '致命缺陷',
    shortDescription: '系统崩溃、核心功能失效',
    businessConsequence: [
      '不解决直接导致系统崩溃',
      '影响所有用户的核心功能'
    ],
    impactScope: [
      '100%用户受影响',
      '核心业务无法运转'
    ],
    typicalCases: [
      '支付系统宕机',
      '数据安全漏洞'
    ],
    affectedOKRs: ['GMV', '用户留存', 'NPS']
  },
  // ...其他分数档位
];
```

**技术复杂度标准：**

文件：`src/config/complexityStandards.ts`（已存在）

当前已包含完整的10分制技术复杂度标准。

### 3. Vite 配置

**文件：** `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true  // 自动打开浏览器
  },
  build: {
    outDir: 'dist',
    sourcemap: false,  // 生产环境不生成sourcemap
    rollupOptions: {
      output: {
        manualChunks: {
          // 代码分割优化
          'react-vendor': ['react', 'react-dom'],
          'icons': ['lucide-react']
        }
      }
    }
  }
})
```

### 4. Tailwind 配置

**文件：** `tailwind.config.js`

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 自定义颜色（如需要）
        brand: {
          50: '#eff6ff',
          // ...
        }
      }
    },
  },
  plugins: [],
}
```

---

## 🐛 调试技巧

### 1. TypeScript 类型检查

```bash
# 检查类型错误（不生成文件）
npx tsc --noEmit

# 监听模式（实时检查）
npx tsc --noEmit --watch
```

### 2. React DevTools

**安装：**
- Chrome: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)

**使用：**
- Components 标签：查看组件树和 props/state
- Profiler 标签：性能分析

### 3. 调试WSJF计算

**在 `calculateScores` 函数中添加日志：**

```typescript
const calculateScores = (requirements: Requirement[]): Requirement[] => {
  console.group('WSJF 评分计算');

  const withRawScores = requirements.map(req => {
    const rawScore = /* 计算逻辑 */;
    console.log(`${req.name}: rawScore=${rawScore}`);
    return { ...req, rawScore };
  });

  console.log('归一化前:', withRawScores.map(r => r.rawScore));
  console.log('归一化后:', withScores.map(r => r.displayScore));
  console.groupEnd();

  return withScores;
};
```

### 4. LocalStorage 调试

**查看存储数据：**

```javascript
// 浏览器控制台
localStorage.getItem('wsjf_requirements')
localStorage.getItem('wsjf_sprint_pools')

// 清空数据
localStorage.clear()
```

### 5. 网络请求调试（AI调用）

**在浏览器 Network 标签：**
- 筛选 XHR/Fetch 请求
- 查看请求/响应内容
- 检查 API 错误

**添加请求日志：**

```typescript
const callAI = async (prompt: string) => {
  console.log('AI请求:', { model, prompt: prompt.substring(0, 100) });

  const response = await fetch(apiUrl, { /* ... */ });
  const data = await response.json();

  console.log('AI响应:', data);
  return data;
};
```

---

## ⚡ 性能优化

### 1. 列表渲染优化

**使用 React.memo 避免不必要的重渲染：**

```typescript
// RequirementCard 组件
export const RequirementCard = React.memo<RequirementCardProps>(
  ({ requirement, onEdit, onDelete }) => {
    return (/* JSX */);
  },
  (prevProps, nextProps) => {
    // 自定义比较逻辑
    return prevProps.requirement.id === nextProps.requirement.id &&
           prevProps.requirement.displayScore === nextProps.requirement.displayScore;
  }
);
```

### 2. 大列表虚拟化

**如果需求数量 > 100，考虑使用虚拟滚动：**

```bash
npm install react-window
```

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={requirements.length}
  itemSize={120}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <RequirementCard requirement={requirements[index]} />
    </div>
  )}
</FixedSizeList>
```

### 3. 计算优化

**使用 useMemo 缓存计算结果：**

```typescript
// 昂贵的计算
const sortedRequirements = useMemo(() => {
  return [...requirements]
    .sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0));
}, [requirements]);

// 筛选
const filteredRequirements = useMemo(() => {
  return requirements.filter(req => {
    if (searchTerm && !req.name.includes(searchTerm)) return false;
    if (typeFilter && req.type !== typeFilter) return false;
    return true;
  });
}, [requirements, searchTerm, typeFilter]);
```

### 4. 事件处理优化

**使用 useCallback 避免函数重建：**

```typescript
const handleEdit = useCallback((id: string) => {
  setEditingRequirement(requirements.find(r => r.id === id));
  setIsEditModalOpen(true);
}, [requirements]);
```

### 5. 图片和资源优化

**图标优化：**
- 使用 Lucide React（已采用）- 按需加载
- 避免使用大尺寸图标文件

**代码分割：**

```typescript
// 懒加载大型组件
const BatchEvaluationModal = lazy(() =>
  import('./components/BatchEvaluationModal')
);

// 使用时包裹 Suspense
<Suspense fallback={<Loading />}>
  {isModalOpen && <BatchEvaluationModal />}
</Suspense>
```

---

## 🔥 故障排查

### 问题1: 启动失败

**错误：** `Cannot find module 'xxx'`

**解决：**
```bash
# 删除 node_modules 和锁文件
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 问题2: TypeScript 报错

**错误：** `Property 'xxx' does not exist on type 'Requirement'`

**解决：**
1. 检查 `src/types/index.ts` 中是否定义了该属性
2. 如果是新增属性，确保类型定义已更新
3. 运行 `npx tsc --noEmit` 查看详细错误

### 问题3: 构建失败

**错误：** `Build failed with xxx errors`

**排查步骤：**
```bash
# 1. 清理缓存
rm -rf dist node_modules/.vite

# 2. 类型检查
npx tsc --noEmit

# 3. 重新构建
npm run build
```

### 问题4: AI 评估无响应

**可能原因：**
- API Key 未配置或无效
- 网络问题
- API 配额用完

**排查：**
1. 检查浏览器控制台的 Network 标签
2. 查看 API 响应状态码
3. 验证 API Key 有效性

### 问题5: 数据丢失

**原因：** LocalStorage 被清除

**解决：**
- 提醒用户定期导出数据
- 考虑添加数据备份功能

**未来改进：** 云端同步

---

## 🚀 发布部署

### 本地构建

```bash
# 1. 类型检查
npx tsc --noEmit

# 2. 构建
npm run build

# 3. 预览
npm run preview
```

### 部署到 Vercel

```bash
# 首次部署
npm install -g vercel
vercel login
vercel

# 后续部署
vercel --prod
```

**或使用 package.json 脚本：**

```bash
npm run deploy:vercel
```

### 部署到腾讯云

```bash
# 安装 CloudBase CLI
npm install -g @cloudbase/cli

# 登录
cloudbase login

# 部署
cloudbase hosting deploy dist -e your-env-id

# 或使用脚本
npm run deploy:tencent
```

### 发布检查清单

**⚠️ 发布前必须完成：**

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
- [ ] 验证线上功能正常

### 环境变量配置

**Vercel：**

在项目设置中添加环境变量：
- `VITE_OPENAI_API_KEY`
- `VITE_DEEPSEEK_API_KEY`

**腾讯云：**

在 CloudBase 控制台配置环境变量。

---

## 📚 参考资源

### 官方文档

- [React 文档](https://react.dev/)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Vite 指南](https://vitejs.dev/guide/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

### 内部文档

- [项目规范](./.claude/project-rules.md)
- [重构日志](./REFACTOR_LOG.md)
- [Claude Code 指南](./CLAUDE.md)

### 工具链

- [Lucide Icons](https://lucide.dev/)
- [VS Code TypeScript](https://code.visualstudio.com/docs/languages/typescript)

---

## 🤝 贡献指南

### 提交代码流程

1. 从 main 创建功能分支
2. 开发并测试
3. 提交代码（遵循 Commit 规范）
4. 推送到远程
5. 创建 Pull Request（如适用）

### Code Review 重点

- TypeScript 类型定义完整
- 术语使用规范
- 代码注释清晰（中文）
- 性能优化合理
- 错误处理完善

---

**最后更新**: 2025-01-19
**维护者**: 开发团队
**版本**: v1.0
