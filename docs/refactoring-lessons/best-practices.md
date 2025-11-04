# 最佳实践 (Best Practices)

本文档总结了WSJF项目开发中的最佳实践和经验教训。

---

## 🎯 代码组织最佳实践

### 1. 提前规划，避免重构债务

**经验教训**：2025-10-21的大规模重构（5000+行代码）本可以避免。

#### ❌ 错误做法
```
1. 快速实现功能 → 代码堆积到2000+行
2. "稍后重构" → 从未发生
3. 继续添加功能 → 3000+行
4. 难以维护 → 被迫大规模重构（耗时8+小时）
```

#### ✅ 正确做法
```
1. 开发前评估复杂度
2. 预估代码量（参考类似功能 × 1.5）
3. 提前规划文件结构
4. 增量式开发，保持文件在300行以内
5. 总耗时：正常开发时间 + 30分钟规划
```

**投入产出比**：
- 预防成本：30分钟规划
- 重构成本：8小时修复
- **比例：1:16**

---

### 2. 使用Hook分离业务逻辑

#### ❌ 反模式：逻辑混在组件中
```typescript
// EditModal.tsx (2000+ 行)
function EditModal() {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // 100行：数据验证逻辑
  const validateData = () => { ... };

  // 100行：数据提交逻辑
  const handleSubmit = async () => { ... };

  // 100行：AI分析逻辑
  const analyzeWithAI = async () => { ... };

  // 1500行：复杂的JSX
  return <div>...</div>;
}
```

#### ✅ 最佳实践：提取为Hook
```typescript
// EditModal.tsx (200 行)
function EditModal() {
  const { data, loading, errors, handleSubmit } = useEditModal();
  const { analyze, result } = useAIAnalysis();

  return <div>...</div>;
}

// hooks/useEditModal.ts (150 行)
export function useEditModal() {
  // 表单状态管理
  // 数据验证
  // 提交逻辑
  return { data, loading, errors, handleSubmit };
}

// hooks/useAIAnalysis.ts (120 行)
export function useAIAnalysis() {
  // AI分析逻辑
  return { analyze, result };
}
```

**收益**：
- 组件更清晰（仅关注UI）
- 逻辑可复用
- 单元测试更容易
- 文件大小可控

---

### 3. 拆分大组件为Section组件

#### ❌ 反模式：单一巨型组件
```typescript
function LargeModal() {
  return (
    <div className="modal">
      {/* 200行：基本信息表单 */}
      <div className="section-basic">
        <h3>基本信息</h3>
        <input name="name" ... />
        <input name="description" ... />
        {/* 更多字段... */}
      </div>

      {/* 200行：业务影响度选择 */}
      <div className="section-impact">
        {/* 复杂的选择逻辑... */}
      </div>

      {/* 300行：AI分析 */}
      <div className="section-ai">
        {/* AI相关UI... */}
      </div>
    </div>
  );
}
```

#### ✅ 最佳实践：Section组件
```typescript
// EditModal.tsx (150 行)
function EditModal({ requirement, onSave, onClose }) {
  return (
    <div className="modal">
      <BasicInfoSection data={requirement} onChange={handleChange} />
      <BusinessImpactSection data={requirement} onChange={handleChange} />
      <AIAnalysisSection requirement={requirement} />
    </div>
  );
}

// components/sections/BasicInfoSection.tsx (100 行)
export function BasicInfoSection({ data, onChange }) {
  return (
    <div className="section">
      <h3>基本信息</h3>
      {/* 基本信息字段 */}
    </div>
  );
}

// components/sections/BusinessImpactSection.tsx (150 行)
export function BusinessImpactSection({ data, onChange }) {
  return (
    <div className="section">
      <h3>业务影响度</h3>
      {/* 影响度选择UI */}
    </div>
  );
}

// components/sections/AIAnalysisSection.tsx (200 行)
export function AIAnalysisSection({ requirement }) {
  return (
    <div className="section">
      <h3>AI分析</h3>
      {/* AI相关UI */}
    </div>
  );
}
```

**收益**：
- 每个Section职责单一
- 更容易定位问题
- 团队协作更高效
- 重构风险更低

---

## 🔒 类型安全最佳实践

### 4. 穷举所有枚举值

**背景**：v1.5.0修复了"待评估"状态丢失的bug。

#### ❌ 错误：部分穷举
```typescript
// 问题：遗漏了"待评估"状态
const notReadyReqs = reqs.filter(r => r.techProgress === '未评估');
const readyReqs = reqs.filter(r => r.techProgress === '已评估工作量');
```

**结果**：
- "待评估"状态的需求既不在ready也不在notReady
- 数据丢失，用户困惑

#### ✅ 正确：完全穷举
```typescript
// constants/techProgress.ts
export const NOT_READY_STATUSES = [
  '待评估',
  '未评估'
] as const;

export const READY_STATUSES = [
  '已评估工作量',
  '已完成技术方案'
] as const;

// 使用
const notReadyReqs = reqs.filter(r =>
  !r.techProgress || NOT_READY_STATUSES.includes(r.techProgress)
);

const readyReqs = reqs.filter(r =>
  r.techProgress && READY_STATUSES.includes(r.techProgress)
);

// 验证完整性
if (import.meta.env.DEV) {
  console.assert(
    reqs.length === notReadyReqs.length + readyReqs.length,
    '分组逻辑有遗漏'
  );
}
```

---

### 5. 使用联合类型+常量，杜绝硬编码

#### ❌ 反模式：字符串硬编码
```typescript
// 容易拼写错误
if (req.techProgress === '待评估') { ... }
if (req.techProgress === '代评估') { ... } // Bug！拼写错误

// 维护困难：修改枚举值需要全局搜索替换
```

#### ✅ 最佳实践：联合类型+常量
```typescript
// 1. 定义类型
// src/types/techProgress.ts
export type TechProgressStatus =
  | '待评估'
  | '未评估'
  | '已评估工作量'
  | '已完成技术方案';

// 2. 定义常量
// src/constants/techProgress.ts
export const TECH_PROGRESS = {
  PENDING: '待评估' as const,
  NOT_EVALUATED: '未评估' as const,
  EFFORT_EVALUATED: '已评估工作量' as const,
  SOLUTION_COMPLETED: '已完成技术方案' as const,
} as const;

// 3. 使用常量
import { TECH_PROGRESS } from '@/constants/techProgress';

if (req.techProgress === TECH_PROGRESS.PENDING) { ... }
// 拼写错误会被编辑器立即提示
```

**收益**：
- 编译时类型检查
- 编辑器自动补全
- 重命名安全（IDE支持）
- 中心化管理

---

## 🎨 UI/UX最佳实践

### 6. 重构前必须截图

**经验教训**：多次重构后发现样式丢失。

#### ❌ 错误流程
```
1. 直接开始重构
2. 重构完成后对比 → 发现样式变了
3. 回忆原样式 → 不确定
4. 反复调整 → 浪费时间
```

#### ✅ 正确流程
```bash
# 1. 运行开发服务器
npm run dev

# 2. 使用准备脚本
bash scripts/prepare-refactor.sh ComponentName

# 脚本会：
# - 提示你打开浏览器
# - 引导你截图所有状态
# - 保存到 docs/screenshots/before-refactor/
# - 创建样式快照文件

# 3. 开始重构（有了对比基准）

# 4. 重构后验证
# - 对比截图
# - 检查所有交互状态
# - 用户确认
```

**关键截图**：
- 默认状态
- 悬停状态
- 焦点状态
- 禁用状态
- 错误状态
- 加载状态

---

### 7. 保持渐变色和type="button"

#### 常见遗漏

**问题1：渐变色丢失**
```typescript
// ❌ 重构后
<div className="bg-blue-500">

// ✅ 重构前（保持）
<div className="bg-gradient-to-br from-blue-500 to-blue-600">
```

**问题2：button缺少type属性**
```typescript
// ❌ 危险：会导致表单意外提交
<button onClick={handleClick}>按钮</button>

// ✅ 安全
<button type="button" onClick={handleClick}>按钮</button>
```

---

## ⚡ 性能最佳实践

### 8. 避免不必要的重渲染

#### ❌ 反模式：每次父组件更新都重渲染
```typescript
function ParentComponent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>+1</button>
      {/* ExpensiveChild每次都重渲染 */}
      <ExpensiveChild data={largeData} />
    </div>
  );
}
```

#### ✅ 最佳实践：使用React.memo
```typescript
// ExpensiveChild.tsx
export const ExpensiveChild = React.memo(({ data }) => {
  // 只有data变化时才重渲染
  return <div>...</div>;
});

// 或使用 useMemo 缓存计算结果
function ParentComponent() {
  const sortedData = useMemo(
    () => data.sort((a, b) => b.score - a.score),
    [data] // 只有data变化时才重新排序
  );

  return <ExpensiveChild data={sortedData} />;
}
```

---

### 9. 使用防抖/节流优化搜索

#### ❌ 反模式：每次输入都触发搜索
```typescript
function SearchBox() {
  const handleSearch = (e) => {
    // 每输入一个字符都发送API请求
    searchAPI(e.target.value);
  };

  return <input onChange={handleSearch} />;
}
```

#### ✅ 最佳实践：使用防抖
```typescript
import { useMemo } from 'react';

function SearchBox() {
  // 防抖：用户停止输入300ms后才搜索
  const debouncedSearch = useMemo(() => {
    let timeout;
    return (value: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        searchAPI(value);
      }, 300);
    };
  }, []);

  return <input onChange={(e) => debouncedSearch(e.target.value)} />;
}
```

---

## 🛡️ 安全最佳实践

### 10. CSRF防护：OAuth必须验证state

#### ❌ 危险代码
```typescript
// 没有验证state参数
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
  // 直接使用code，容易被CSRF攻击
  exchangeCodeForToken(code);
}
```

#### ✅ 安全实践
```typescript
// 1. 发起OAuth时生成随机state
const state = generateRandomString(32);
sessionStorage.setItem('oauth_state', state);

const authUrl = `https://oauth.com/authorize?` +
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${REDIRECT_URI}&` +
  `state=${state}`;

window.location.href = authUrl;

// 2. 回调时验证state
const urlParams = new URLSearchParams(window.location.search);
const receivedState = urlParams.get('state');
const savedState = sessionStorage.getItem('oauth_state');

if (receivedState !== savedState) {
  // state不匹配，可能是CSRF攻击
  throw new Error('Invalid state parameter');
}

// 3. 验证通过后才继续
const code = urlParams.get('code');
exchangeCodeForToken(code);
sessionStorage.removeItem('oauth_state');
```

参考：[安全规范](../standards/security-standards.md)

---

### 11. 清理定时器和事件监听器

#### ❌ 内存泄漏
```typescript
function Component() {
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('tick');
    }, 1000);

    window.addEventListener('resize', handleResize);

    // 没有清理！组件卸载后仍在运行
  }, []);
}
```

#### ✅ 正确清理
```typescript
function Component() {
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('tick');
    }, 1000);

    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
}
```

参考：[资源管理规范](../standards/resource-management.md)

---

## 🧪 测试最佳实践

### 12. 测试核心业务逻辑

#### 优先级排序
```
1. ⭐⭐⭐ 核心算法（如WSJF计算）
2. ⭐⭐⭐ 数据验证和转换
3. ⭐⭐ 复杂的业务逻辑
4. ⭐⭐ API调用和错误处理
5. ⭐ UI交互（集成测试）
```

#### 示例：测试WSJF计算
```typescript
// utils/scoring.test.ts
import { calculateRawScore, normalizeScore } from './scoring';

describe('WSJF Scoring', () => {
  it('应该正确计算原始分数', () => {
    // 业务影响度10 + 时间窗口5 + DDL5 + 工作量8 = 28
    expect(calculateRawScore(10, 5, 5, 8)).toBe(28);
  });

  it('应该正确归一化分数', () => {
    // 最小值3，最大值28，当前值28
    // 应该归一化为100
    expect(normalizeScore(28, 3, 28)).toBe(100);
  });

  it('当所有分数相同时应返回60', () => {
    expect(normalizeScore(15, 15, 15)).toBe(60);
  });
});
```

---

### 13. 边界条件测试

```typescript
describe('calculateRawScore - 边界条件', () => {
  it('最小值：所有参数为0', () => {
    expect(calculateRawScore(0, 0, 0, 0)).toBe(0);
  });

  it('最大值：所有参数为最大值', () => {
    expect(calculateRawScore(10, 5, 5, 8)).toBe(28);
  });

  it('负数应抛出错误', () => {
    expect(() => calculateRawScore(-1, 0, 0, 0)).toThrow();
  });

  it('null/undefined应使用默认值', () => {
    expect(calculateRawScore(null, undefined, 0, 0)).toBe(0);
  });
});
```

---

## 🚀 部署最佳实践

### 14. 部署前检查清单

```bash
# 1. 运行所有检查
npm run check-file-size  # 文件大小
npm run verify-ocr       # OCR集成（如适用）
npm test                 # 单元测试
npm run build            # 构建

# 2. 预览生产构建
npm run preview

# 3. 在预览中测试
- 所有功能正常
- 无控制台错误
- 性能可接受

# 4. 部署
npm run deploy:vercel  # 或 deploy:tencent
```

---

### 15. 环境变量管理

#### ❌ 错误：硬编码敏感信息
```typescript
const API_KEY = 'sk-1234567890abcdef';
```

#### ✅ 正确：使用环境变量
```typescript
// .env.example
VITE_OPENAI_API_KEY=your_api_key_here
VITE_API_BASE_URL=https://api.example.com

// config/api.ts
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 验证必需的环境变量
if (import.meta.env.PROD && !OPENAI_API_KEY) {
  throw new Error('VITE_OPENAI_API_KEY is required in production');
}
```

---

## 📊 调试最佳实践

### 16. 系统化调试方法

参考：[调试决策树](../debugging-decision-tree.md)

```
1. 复现问题
   - 记录复现步骤
   - 确定影响范围

2. 定位问题
   - 检查控制台错误
   - 使用调试工具（DevTools/Chrome MCP）
   - 添加日志

3. 分析原因
   - 数据流追踪
   - 状态检查
   - 类型验证

4. 修复验证
   - 单元测试
   - 手动测试
   - 回归测试

5. 预防复发
   - 添加验证
   - 更新文档
   - 分享经验
```

---

## 📝 文档最佳实践

### 17. 保持文档同步

```
代码修改 → 必须同时更新：
  □ JSDoc注释
  □ README.md（如影响使用）
  □ 架构文档（如架构变更）
  □ API文档（如接口变更）
  □ 最佳实践（如有新经验）
```

---

### 18. 写清晰的Commit Message

#### ❌ 糟糕的commit
```
fix bug
update code
refactor
```

#### ✅ 清晰的commit
```
fix: 修复"待评估"状态需求丢失问题 (#123)

- 将NOT_READY_STATUSES改为数组，包含"待评估"和"未评估"
- 修复批量评估模态框中的分组逻辑
- 添加开发环境的分组完整性断言

Fixes #123
```

**格式**：
```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型**：
- feat: 新功能
- fix: Bug修复
- refactor: 重构
- docs: 文档更新
- style: 代码格式
- test: 测试
- chore: 构建/工具

---

## 🎓 学习和成长

### 19. 从错误中学习

每次遇到重大问题时：

```
1. 记录问题
   - 什么出错了？
   - 为什么出错？
   - 影响是什么？

2. 分析根因
   - 直接原因
   - 深层原因
   - 系统性问题

3. 制定解决方案
   - 短期修复
   - 长期预防
   - 流程改进

4. 分享经验
   - 更新best-practices.md
   - 团队分享会
   - 改进规范和工具
```

参考：[调试经验教训](../../ai-templates/DEBUGGING_LESSONS_LEARNED.md)

---

### 20. 定期代码审查

```
每周/每sprint：
  □ 回顾代码质量
  □ 检查技术债
  □ 分享最佳实践
  □ 更新规范文档
  □ 改进开发工具
```

---

## 🎯 总结

### 核心原则

1. **预防 > 修复**
   - 30分钟规划 vs 8小时重构

2. **自动化 > 人工**
   - Git hooks、ESLint、CI/CD

3. **类型安全 > 运行时检查**
   - 联合类型、常量、穷举

4. **文档同步 > 过期文档**
   - 代码和文档一起更新

5. **小步迭代 > 大规模重构**
   - 保持文件300行以内

6. **分享经验 > 重复犯错**
   - 更新best-practices

---

**记住**：最佳实践来自实践中的反思和总结！
