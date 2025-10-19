# 新功能开发工作流程

> 本文档定义了添加新功能时的标准流程，确保代码质量和架构清晰。

## 🎯 开发前检查清单（Planning Phase）

### 1. 需求分析（5-10分钟）
- [ ] 明确功能需求和用户故事
- [ ] 列出需要的 UI 组件
- [ ] 列出需要的数据字段
- [ ] 列出需要的业务逻辑

### 2. 架构设计（10-15分钟）
```markdown
## 功能：[功能名称]

### 影响的文件（预估）
- [ ] 新建组件：components/xxx.tsx (~150 行)
- [ ] 新建 Hook：hooks/useXxx.ts (~80 行)
- [ ] 修改 Store：store/useStore.ts (+20 行)
- [ ] 新建常量：constants/xxx.ts (~40 行)

### 总预估代码量：~290 行

### 拆分策略
- UI 组件独立文件
- 业务逻辑提取为 Hook
- 常量配置独立文件
- 类型定义添加到 types/index.ts
```

### 3. 文件创建规划
```bash
# 示例：添加"批量评估"功能

# 第1步：创建必要的目录和文件
mkdir -p src/components/batch-evaluation
mkdir -p src/hooks/batch-evaluation
mkdir -p src/constants/batch-evaluation

# 第2步：创建文件占位符（防止遗忘）
touch src/components/batch-evaluation/BatchEvaluationModal.tsx
touch src/hooks/batch-evaluation/useBatchEvaluation.ts
touch src/constants/batch-evaluation/evaluationRules.ts
```

---

## 💻 开发中检查清单（Implementation Phase）

### 阶段 1：基础架构（第1小时）
- [ ] 创建空组件/函数框架
- [ ] 定义 TypeScript 接口
- [ ] 添加必要的导入语句
- [ ] 运行 `npm run dev` 确保编译通过

**💡 检查点 1：**
```bash
# 确保没有编译错误
npm run build

# 检查文件行数（应该都很小）
wc -l src/components/batch-evaluation/*
```

### 阶段 2：核心逻辑（第2-3小时）
- [ ] 实现主要业务逻辑
- [ ] 每完成一个函数立即添加注释
- [ ] 发现重复代码？立即提取为函数

**🚨 警告信号：**
- 文件超过 150 行？→ 考虑拆分
- 函数超过 50 行？→ 拆分为子函数
- 重复代码出现 2 次？→ 提取为工具函数

**💡 检查点 2：**
```bash
# 检查是否有重复代码
# 手动搜索相似模式，或使用工具：
npx jscpd src/

# 检查函数复杂度
npx eslint src/ --rule 'complexity: ["error", 10]'
```

### 阶段 3：UI 开发（第4-5小时）
- [ ] 实现 UI 组件
- [ ] 分离 UI 和逻辑（组件 vs Hook）
- [ ] 复用现有组件（检查 components/ 目录）

**示例：正确的组件结构**
```typescript
// ✅ 组件文件（仅负责 UI）
// src/components/BatchEvaluationModal.tsx (~120 行)
import { useBatchEvaluation } from '@/hooks/batch-evaluation/useBatchEvaluation';
import { EVALUATION_RULES } from '@/constants/batch-evaluation/evaluationRules';

export function BatchEvaluationModal({ onClose }: Props) {
  const {
    selectedItems,
    handleEvaluate,
    isLoading
  } = useBatchEvaluation();

  return (
    <Modal onClose={onClose}>
      {/* UI 代码 */}
    </Modal>
  );
}

// ✅ 业务逻辑文件（仅负责逻辑）
// src/hooks/batch-evaluation/useBatchEvaluation.ts (~100 行)
export function useBatchEvaluation() {
  const [selectedItems, setSelectedItems] = useState([]);

  const handleEvaluate = useCallback(() => {
    // 评估逻辑
  }, [selectedItems]);

  return { selectedItems, handleEvaluate, isLoading };
}

// ✅ 常量文件
// src/constants/batch-evaluation/evaluationRules.ts (~50 行)
export const EVALUATION_RULES = { ... };
```

### 阶段 4：集成测试（第6小时）
- [ ] 在开发环境测试功能
- [ ] 测试边界情况
- [ ] 检查浏览器控制台错误
- [ ] 测试性能（大数据量情况）

---

## 🔍 开发后检查清单（Review Phase）

### 自检（Self Review）
```bash
# 1. 运行完整构建
npm run build

# 2. 检查文件大小
npm run check-file-size

# 3. 检查类型定义
npx tsc --noEmit

# 4. 格式化代码
npm run format
```

### 代码质量检查
- [ ] **无 console.log**（除了错误处理）
- [ ] **无 any 类型**（必须使用明确类型）
- [ ] **无魔法数字**（提取为常量）
- [ ] **无超过 3 层的嵌套**（重构为函数）

**示例：重构嵌套代码**
```typescript
// ❌ 坏示例：深层嵌套
function processData(data) {
  if (data) {
    if (data.items) {
      if (data.items.length > 0) {
        data.items.forEach(item => {
          if (item.valid) {
            // 处理逻辑
          }
        });
      }
    }
  }
}

// ✅ 好示例：提前返回
function processData(data) {
  if (!data?.items?.length) return;

  const validItems = data.items.filter(item => item.valid);
  validItems.forEach(item => processItem(item));
}

function processItem(item) {
  // 处理逻辑
}
```

### 文档更新
- [ ] 更新 README.md（如果有新功能）
- [ ] 更新 CHANGELOG.md
- [ ] 添加代码注释（复杂逻辑必须注释）
- [ ] 更新 TypeScript 接口文档注释

---

## 📊 拆分决策树

```
文件当前行数？
│
├─ < 200 行 → ✅ 继续开发
│
├─ 200-300 行 → ⚠️ 评估是否拆分
│   │
│   ├─ 还要添加功能？ → 🔴 必须先拆分
│   └─ 功能已完成？ → 🟡 标记为"待重构"
│
├─ 300-500 行 → 🔴 必须拆分
│   │
│   └─ 拆分策略：
│       ├─ 提取常量 → constants/
│       ├─ 提取 Hook → hooks/
│       ├─ 提取子组件 → components/
│       └─ 提取工具函数 → utils/
│
└─ > 500 行 → 🚫 严重违规，立即停止开发
    └─ 必须先重构才能继续
```

---

## 🎨 组件拆分示例

### 场景：EditRequirementModal 太大了（800 行）

#### 步骤 1：分析结构
```typescript
// 当前结构（800 行）
EditRequirementModal
├── useState × 15
├── useEffect × 5
├── 表单验证逻辑（100 行）
├── 基础信息 UI（150 行）
├── 影响度评估 UI（200 行）
├── 技术信息 UI（150 行）
└── 按钮和提交逻辑（200 行）
```

#### 步骤 2：拆分计划
```
components/edit-requirement/
├── EditRequirementModal.tsx       (主容器，150 行)
├── sections/
│   ├── BasicInfoSection.tsx       (基础信息，120 行)
│   ├── ImpactSection.tsx          (影响度，150 行)
│   └── TechnicalSection.tsx       (技术信息，120 行)
├── hooks/
│   ├── useRequirementForm.ts      (表单状态，100 行)
│   └── useRequirementValidation.ts (验证逻辑，80 行)
└── utils/
    └── requirementHelpers.ts       (工具函数，50 行)
```

#### 步骤 3：执行拆分
```bash
# 创建目录结构
mkdir -p src/components/edit-requirement/{sections,hooks,utils}

# 创建文件（从最小的开始）
# 1. 先拆工具函数
# 2. 再拆 Hook
# 3. 再拆 UI Section
# 4. 最后重构主组件
```

---

## 🚀 快速开始模板

### 添加新功能：[功能名]

```bash
# 1. 创建分支
git checkout -b feature/[功能名]

# 2. 创建文件结构（根据复杂度选择）

# 简单功能（< 200 行）
touch src/components/[功能名].tsx

# 中等功能（200-500 行）
mkdir -p src/components/[功能名]
touch src/components/[功能名]/index.tsx
touch src/components/[功能名]/[功能名].tsx
touch src/hooks/use[功能名].ts

# 复杂功能（> 500 行）
mkdir -p src/components/[功能名]/{sections,hooks,utils}
# 创建多个文件...

# 3. 开发 + 持续检查
npm run dev
# 每完成一部分就检查文件大小

# 4. 完成后自检
npm run check-file-size
npm run build

# 5. 提交
git add .
git commit -m "feat: 添加[功能名]功能"
```

---

## 🔧 常见问题解决

### Q1: 我的组件已经 400 行了，怎么拆？
**A:** 按照这个顺序：
1. 提取所有常量到 `constants/`
2. 提取所有 Hook 逻辑到 `hooks/`
3. 将 UI 拆分为多个 Section 组件
4. 提取重复逻辑为工具函数

### Q2: 拆分后导入语句太多了，很丑？
**A:** 创建 barrel export：
```typescript
// components/edit-requirement/index.ts
export { EditRequirementModal } from './EditRequirementModal';
export { useRequirementForm } from './hooks/useRequirementForm';

// 使用时
import { EditRequirementModal, useRequirementForm } from '@/components/edit-requirement';
```

### Q3: 不确定该不该拆分？
**A:** 问自己 3 个问题：
1. 这个文件能在 1 分钟内看完吗？ → 否 → 拆分
2. 这个函数只做一件事吗？ → 否 → 拆分
3. 6 个月后我能快速理解这段代码吗？ → 否 → 拆分

---

## 📝 提交消息规范

```
feat(scope): 简短描述

详细描述（可选）

文件改动：
- 新建：src/components/xxx.tsx (150 行)
- 修改：src/store/useStore.ts (+20 行)
- 重构：拆分 EditRequirementModal (800 行 → 6 个文件，平均 120 行)
```

---

**记住：**
> "The best time to refactor was yesterday. The second best time is now."

每次发现文件过大，不要等，立即拆分。技术债会像滚雪球一样越滚越大。
