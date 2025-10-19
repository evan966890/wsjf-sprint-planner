# 架构指导原则

> 本文档定义了 WSJF Sprint Planner 项目的架构规范，防止代码文件过度膨胀，保持代码可维护性。

## 📏 文件大小限制（硬性规定）

### 强制规则
- ❌ **任何单个文件不得超过 500 行**
- ⚠️ **超过 300 行时必须评估拆分**
- ✅ **推荐单个文件保持在 200-300 行以内**

### 检查方法
```bash
# 检查所有 TypeScript 文件行数
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -n

# 查找超过 300 行的文件
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | awk '$1 > 300 {print $0}'
```

### 违规处理
当文件超过限制时，**必须立即**进行以下操作之一：
1. 拆分组件到独立文件
2. 提取常量/配置到独立文件
3. 提取工具函数到 utils 目录
4. 提取类型定义到 types 目录

---

## 🏗️ 项目目录结构规范

```
src/
├── components/          # UI 组件（每个文件 < 300 行）
│   ├── modals/         # 弹窗组件
│   ├── cards/          # 卡片类组件
│   └── forms/          # 表单组件
│
├── constants/          # 常量定义
│   ├── fieldNames.ts   # 字段名映射
│   ├── messages.ts     # 提示消息
│   └── ...
│
├── config/             # 配置文件
│   ├── api.ts          # API 配置
│   ├── scoringStandards.ts
│   └── ...
│
├── data/               # 数据生成和模拟数据
│   └── sampleData.ts
│
├── utils/              # 工具函数
│   ├── scoring.ts      # 评分计算
│   ├── validation.ts   # 数据校验
│   └── formatters.ts   # 格式化工具
│
├── hooks/              # 自定义 React Hooks
│   ├── useRequirements.ts
│   └── useSprintPools.ts
│
├── store/              # 状态管理（Zustand）
│   ├── useStore.ts     # 主 store
│   └── slices/         # store 切片
│
├── types/              # TypeScript 类型定义
│   └── index.ts
│
├── services/           # 业务逻辑服务层
│   ├── import.ts       # 导入功能
│   ├── export.ts       # 导出功能
│   └── ai.ts           # AI 相关
│
└── main.tsx            # 应用入口
```

---

## 🔍 代码拆分判断标准

### 何时必须拆分

#### 1. 组件超过 200 行
**拆分策略：**
```typescript
// ❌ 坏示例：一个文件包含所有内容
export function EditRequirementModal() {
  // 300+ 行代码
  const [form, setForm] = useState(...);
  const validateForm = () => { ... };
  const handleSubmit = () => { ... };
  // ... 大量逻辑和 UI
}

// ✅ 好示例：拆分为多个文件
// EditRequirementModal.tsx (主组件，< 150 行)
import { useRequirementForm } from './hooks/useRequirementForm';
import { BasicInfoSection } from './sections/BasicInfoSection';
import { ImpactSection } from './sections/ImpactSection';

export function EditRequirementModal() {
  const { form, handleSubmit, validate } = useRequirementForm();
  return (
    <Modal>
      <BasicInfoSection form={form} />
      <ImpactSection form={form} />
    </Modal>
  );
}

// hooks/useRequirementForm.ts (业务逻辑)
// sections/BasicInfoSection.tsx (UI 部分)
// sections/ImpactSection.tsx (UI 部分)
```

#### 2. 常量/配置超过 50 行
**必须提取到独立文件：**
```typescript
// ❌ 坏示例：写在组件文件顶部
const FIELD_NAME_MAP = { ... }; // 60 行
const SCORING_STANDARDS = { ... }; // 100 行

export function MyComponent() { ... }

// ✅ 好示例：提取到 constants/
// constants/fieldNames.ts
export const FIELD_NAME_MAP = { ... };

// constants/scoringStandards.ts
export const SCORING_STANDARDS = { ... };
```

#### 3. 重复代码出现 3 次以上
**必须提取为工具函数：**
```typescript
// ❌ 坏示例：重复逻辑
function ComponentA() {
  const score = calculateScore(bv, tc, effort); // 重复
}
function ComponentB() {
  const score = calculateScore(bv, tc, effort); // 重复
}
function ComponentC() {
  const score = calculateScore(bv, tc, effort); // 重复
}

// ✅ 好示例：提取到 utils/
// utils/scoring.ts
export function calculateScore(bv, tc, effort) { ... }
```

#### 4. useState 超过 10 个
**必须使用 Zustand 或提取 Hook：**
```typescript
// ❌ 坏示例：组件内大量状态
function MyComponent() {
  const [state1, setState1] = useState();
  const [state2, setState2] = useState();
  // ... 15 个 useState
}

// ✅ 好示例：使用 Zustand Store
// store/useMyStore.ts
export const useMyStore = create((set) => ({
  state1: initialValue,
  state2: initialValue,
  // ...
}));

// 或者提取自定义 Hook
// hooks/useMyFeature.ts
export function useMyFeature() {
  const [state1, setState1] = useState();
  const [state2, setState2] = useState();
  return { state1, state2, ... };
}
```

---

## 📋 新功能开发检查清单

### 开发前（Planning）
- [ ] 评估功能复杂度，预估代码行数
- [ ] 如果预计 > 200 行，提前规划拆分方案
- [ ] 确定需要创建哪些新文件/目录
- [ ] 检查是否可以复用现有工具函数/组件

### 开发中（Implementation）
- [ ] 每完成一个子功能，检查文件行数
- [ ] 发现重复代码立即提取
- [ ] 新增常量超过 10 行，考虑独立文件
- [ ] UI 和逻辑分离（组件 vs Hook）

### 开发后（Review）
- [ ] 运行 `npm run check-file-size`（见下方脚本）
- [ ] 确保所有文件 < 500 行
- [ ] 确保没有重复代码
- [ ] 更新相关文档

---

## 🛠️ 自动化检查工具

### 添加到 package.json
```json
{
  "scripts": {
    "check-file-size": "node scripts/check-file-size.js",
    "pre-commit": "npm run check-file-size && npm run build"
  }
}
```

### 创建检查脚本（scripts/check-file-size.js）
```javascript
const fs = require('fs');
const path = require('path');

const MAX_LINES = 500;
const WARN_LINES = 300;

function checkFileSize(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let hasError = false;

  files.forEach(file => {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory() && !file.name.startsWith('.')) {
      checkFileSize(filePath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').length;

      if (lines > MAX_LINES) {
        console.error(`❌ ERROR: ${filePath} has ${lines} lines (max: ${MAX_LINES})`);
        hasError = true;
      } else if (lines > WARN_LINES) {
        console.warn(`⚠️  WARNING: ${filePath} has ${lines} lines (consider splitting)`);
      }
    }
  });

  return hasError;
}

const hasError = checkFileSize('./src');
if (hasError) {
  process.exit(1);
}
```

---

## 🎯 重构优先级

当发现需要重构时，按以下优先级处理：

### P0（立即处理）
- 文件超过 500 行
- 严重的重复代码（相同逻辑 5+ 次）
- 性能问题（用户可感知）

### P1（本周内处理）
- 文件超过 300 行
- 一般重复代码（3-4 次）
- 复杂度过高的函数（圈复杂度 > 10）

### P2（下个迭代处理）
- 文件超过 200 行但 < 300 行
- 代码风格不一致
- 缺少类型定义

---

## 📚 推荐阅读

- [Clean Code 原则](https://github.com/ryanmcdermott/clean-code-javascript)
- [React 组件设计模式](https://www.patterns.dev/posts/react-component-patterns)
- [单一职责原则](https://en.wikipedia.org/wiki/Single-responsibility_principle)

---

## 🔄 定期审计

**每个迭代结束后：**
1. 运行 `npm run check-file-size`
2. Review 最大的 5 个文件
3. 制定下个迭代的重构计划
4. 更新架构文档

**记住：**
> "Code is read more often than it is written."
> 保持代码简洁不是为了炫技，而是为了 6 个月后的自己和团队成员。
