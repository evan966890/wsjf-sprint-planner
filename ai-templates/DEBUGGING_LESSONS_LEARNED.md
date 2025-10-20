# 调试经验教训

**文档类型**: 经验沉淀
**创建日期**: 2025-01-20
**最后更新**: 2025-01-20
**维护者**: Claude Code Team

本文档记录项目开发过程中的重要调试案例和经验教训，帮助未来的开发者避免类似问题。

---

## 📚 目录

1. [案例1: UI渲染遗漏问题 (2025-01-20)](#案例1-ui渲染遗漏问题)
2. [通用经验总结](#通用经验总结)
3. [预防措施清单](#预防措施清单)

---

## 案例1: UI渲染遗漏问题

### 📋 基本信息

| 项目 | 内容 |
|-----|------|
| **发现日期** | 2025-01-20 |
| **严重程度** | 🔴 高（核心功能失效） |
| **影响范围** | 新增/导入需求功能 |
| **修复耗时** | 20+ 轮调试 |
| **根本原因** | 渲染逻辑遗漏枚举值 |

### 🐛 问题描述

**用户报告**:
> "新增需求AAA后，总需求数+1，但待排期区看不到这个需求。用搜索框搜也搜不到，但筛选器显示有1条。刷新也不行。"

**具体表现**:
1. 点击"新增需求"按钮
2. 填写需求名称"AAA"，其他字段使用默认值
3. 保存后，顶部显示"总需求 51"（从50变为51）
4. 但待排期区只显示50个需求卡片
5. 搜索"AAA"时，筛选结果显示"1"，但仍看不到卡片
6. 清空搜索后，显示50个需求，AAA仍然消失

### 🔍 调试过程

#### 阶段1：怀疑数据丢失（5轮，❌ 错误方向）

**假设**: 数据被意外清空

**尝试**:
- 检查 Zustand Store 状态 → 数据存在 ✅
- 检查 localStorage → 数据正常 ✅
- 检查清空按钮是否误触 → 未触发 ✅
- 添加双击确认机制 → 问题依旧 ❌

**结论**: 数据层正常，问题不在这里

#### 阶段2：怀疑数据同步问题（3轮，❌ 错误方向）

**假设**: Zustand persist 和旧 storage.ts 冲突

**尝试**:
- 移除旧 storage.loadUserData() 调用 → 数据持久化改善 ✅
- 但新增需求仍不显示 ❌

**结论**: 解决了持久化问题，但核心bug未解决

#### 阶段3：怀疑筛选逻辑问题（5轮，❌ 错误方向）

**假设**: 筛选条件过滤掉了新需求

**尝试**:
- 添加筛选日志 → AAA 通过所有筛选条件 ✅
- 检查搜索框残留文本 → 用户清空后仍无效 ❌
- 检查其他筛选器状态 → 全部为"all"默认值 ✅

**关键发现**:
```javascript
console.log('[UnscheduledArea] 筛选后 filteredReqs:', filteredReqs.map(r => ({ id: r.id, name: r.name })));
// 输出：(51) [{id: "REQ-xxx", name: "需求1"}, ..., {id: "REQ-1760934821428", name: "AAA"}]
// ✅ AAA 在数组中！
```

**结论**: AAA 通过了筛选，在 filteredReqs 中，但为什么不渲染？

#### 阶段4：定位渲染逻辑问题（2轮，✅ 正确方向）

**关键日志**:
```javascript
console.log('分组结果:', {
  filteredTotal: filteredReqs.length,    // 51
  readyCount: readyReqs.length,          // 50  ← 注意！
  notReadyCount: notReadyReqs.length     // 0   ← 注意！
});

// 🚨 51 ≠ 50 + 0  → 有1个需求未被分配到任何组！
```

**定位代码**:
```typescript
// src/components/UnscheduledArea.tsx:292-293
const readyReqs = sortedReqs.filter(r =>
  r.techProgress === '已评估工作量' ||
  r.techProgress === '已完成技术方案'
);
const notReadyReqs = sortedReqs.filter(r =>
  r.techProgress === '未评估'
);
```

**问题发现**:
- AAA 的 `techProgress` 值是 `'待评估'`（新需求默认值）
- 但分组逻辑只处理了 `'已评估工作量'`、`'已完成技术方案'`、`'未评估'`
- `'待评估'` 不在任何条件中 → 不被分配到任何组 → 不渲染！

### ✅ 解决方案

**修复代码**:
```typescript
// 修复后：穷举所有未评估状态
const notReadyStatuses = ['待评估', '未评估'];
const readyReqs = sortedReqs.filter(r =>
  r.techProgress && !notReadyStatuses.includes(r.techProgress)
);
const notReadyReqs = sortedReqs.filter(r =>
  !r.techProgress || notReadyStatuses.includes(r.techProgress)
);
```

**修复文件**:
1. `src/components/UnscheduledArea.tsx:292-297`
2. `src/store/useStore.ts:384-388` (拖拽防护)
3. `src/wsjf-sprint-planner.tsx:1738` (未评估计数)

### 🎓 经验教训

#### 教训1：数据存在但不显示 = 90%是渲染问题

**错误思路**:
```
数据不显示 → 一定是数据丢失了
  → 检查 Store ❌
  → 检查 localStorage ❌
  → 检查同步机制 ❌
```

**正确思路**:
```
数据不显示 → 先确认数据是否存在
  ├─ 数据不存在 → 数据层问题
  └─ 数据存在 → 渲染层问题 ✅
      └─ 检查筛选 → 检查分组 → 检查渲染
```

**实践建议**:
1. 第一步必做：`console.log(原始数据)` 确认数据存在
2. 数据存在则直接跳到渲染逻辑检查
3. 使用决策树系统化排查（见 [docs/debugging-decision-tree.md](../docs/debugging-decision-tree.md)）

#### 教训2：分组逻辑必须穷举所有可能值

**问题根源**: 枚举类型使用 `string`，无法在编译时检查穷举性

**错误示例**:
```typescript
// ❌ 类型定义宽泛
interface Requirement {
  techProgress: string;  // 任何字符串都可以
}

// ❌ 分组逻辑有遗漏
const ready = items.filter(r => r.status === 'active');
const notReady = items.filter(r => r.status === 'pending');
// '待评估'、'已完成' 等状态会被遗漏！
```

**正确示例**:
```typescript
// ✅ 严格的联合类型
type TechProgress = '待评估' | '未评估' | '已评估工作量' | '已完成技术方案';

interface Requirement {
  techProgress: TechProgress;
}

// ✅ 使用分组常量
const NOT_READY = ['待评估', '未评估'] as const;
const ready = items.filter(r => r.techProgress && !NOT_READY.includes(r.techProgress));
const notReady = items.filter(r => !r.techProgress || NOT_READY.includes(r.techProgress));

// ✅ 验证分组完整性
debugAssert(
  items.length === ready.length + notReady.length,
  '分组逻辑有遗漏'
);
```

#### 教训3：运行时验证是必要的

**问题**: TypeScript 只能在编译时检查，运行时数据可能不符合类型

**来源**:
- localStorage 中的旧数据
- 用户手动修改
- API 返回的意外值
- 版本迁移遗留问题

**解决方案**:
```typescript
// 开发环境强制验证
if (import.meta.env.DEV) {
  validateTechProgress(requirement.techProgress, '需求编辑');
}

// 生产环境容错处理
requirement.techProgress = safeGetStatus(
  requirement.techProgress,
  '待评估'  // 默认值
);
```

#### 教训4：使用调试工具提升效率

**本次案例对比**:

| 调试方式 | 耗时 | 成功率 |
|---------|-----|--------|
| 凭直觉猜测 | 20轮 | ❌ 低 |
| 使用决策树 + 工具 | 3轮 | ✅ 高 |

**推荐工具**:
```typescript
// 1. 渲染管道追踪
import { debugRenderPipeline } from '@/utils/debugHelpers';
const readyReqs = debugRenderPipeline(unscheduled, [
  { name: '筛选', fn: applyFilters },
  { name: '分组', fn: groupByStatus },
  { name: '排序', fn: sortByScore },
]);

// 2. 分组完整性验证
import { validateRenderGroups } from '@/utils/healthCheck';
validateRenderGroups(filteredReqs, readyReqs, notReadyReqs, 'UnscheduledArea');

// 3. 自动健康检查
import { startHealthCheckMonitor } from '@/utils/healthCheck';
useEffect(() => {
  const stop = startHealthCheckMonitor();
  return stop;
}, []);
```

### 🛡️ 预防措施

基于本次案例，已实施以下预防措施：

#### 1. 类型系统强化 ✅

创建了严格的类型定义：
- `src/types/techProgress.ts` - 联合类型定义
- `src/constants/techProgress.ts` - 常量和辅助函数

#### 2. 运行时验证 ✅

创建了验证工具：
- `src/utils/validation.ts` - 开发环境断言
- `src/utils/healthCheck.ts` - 自动健康检查

#### 3. 调试工具 ✅

创建了系统化调试工具：
- `src/utils/debugHelpers.ts` - 渲染管道追踪
- `docs/debugging-decision-tree.md` - 调试决策树

#### 4. 代码审查规范 ✅

创建了检查清单：
- `docs/code-review-checklist.md` - PR 审查标准

#### 5. 单元测试 🔄 (进行中)

计划添加测试覆盖：
- UnscheduledArea 渲染逻辑测试
- 分组完整性测试
- 边界情况测试

---

## 通用经验总结

### 1. 数据流调试的黄金法则

```
症状: UI 不显示数据
  ↓
问: 数据存在吗？(console.log 原始数据)
  ├─ 不存在 → 数据层问题 (API/Store/Storage)
  └─ 存在 → 渲染层问题
      ↓
    问: 数据通过筛选了吗？(console.log 筛选后数据)
      ├─ 未通过 → 筛选条件问题
      └─ 通过了 → 分组/渲染问题
          ↓
        问: 分组完整吗？(total === sum of groups)
          ├─ 不完整 → 🎯 找到问题！
          └─ 完整 → 检查条件渲染/CSS
```

### 2. 枚举值处理的最佳实践

| 场景 | 错误做法 | 正确做法 |
|-----|---------|---------|
| 类型定义 | `status: string` | `status: 'pending' \| 'active'` |
| 常量定义 | 直接写字符串 | `const STATUS = { PENDING: 'pending' as const }` |
| 分组逻辑 | 硬编码 if/else | 使用常量数组 + includes() |
| 新增枚举值 | 只改类型定义 | 类型 + 常量 + 所有使用处 |
| 验证 | 不验证 | 开发环境断言 + 生产容错 |

### 3. React 渲染问题的调试步骤

```typescript
// 步骤1：确认数据存在
console.log('原始数据:', data);

// 步骤2：确认数据通过筛选
const filtered = data.filter(filterFn);
console.log('筛选后:', filtered.length);

// 步骤3：确认分组完整
const group1 = filtered.filter(condition1);
const group2 = filtered.filter(condition2);
console.assert(
  filtered.length === group1.length + group2.length,
  '分组有遗漏！'
);

// 步骤4：确认 .map() 执行
{group1.map(item => {
  console.log('渲染:', item.id);
  return <Component key={item.id} />
})}

// 步骤5：检查 React key 唯一性
const ids = new Set(group1.map(i => i.id));
console.assert(ids.size === group1.length, 'key 重复！');
```

### 4. 防御性编程原则

```typescript
// 原则1：永远验证输入
function processData(data: unknown) {
  if (!Array.isArray(data)) {
    console.error('期望数组，实际:', typeof data);
    return [];
  }
  // ...
}

// 原则2：分组必须穷举
const groups = [group1, group2, group3];
const total = groups.reduce((sum, g) => sum + g.length, 0);
if (total !== sourceData.length) {
  throw new Error('分组逻辑有遗漏');
}

// 原则3：使用工具而非手写检查
import { validateRenderGroups } from '@/utils/healthCheck';
validateRenderGroups(source, group1, group2);
```

---

## 预防措施清单

### 开发阶段

- [ ] 使用严格的联合类型而非 `string`
- [ ] 在常量文件中定义所有枚举值
- [ ] 添加运行时验证（开发环境）
- [ ] 使用调试工具追踪数据流
- [ ] 编写单元测试覆盖边界情况

### 代码审查阶段

- [ ] 检查分组逻辑是否穷举所有值
- [ ] 验证 `total = sum of groups`
- [ ] 确认 React key 唯一且稳定
- [ ] 检查条件渲染有无遗漏分支

### 测试阶段

- [ ] 测试所有枚举值的处理
- [ ] 测试边界情况（空数组、单元素、全满足/全不满足）
- [ ] 测试旧数据兼容性
- [ ] 测试意外输入的容错

### 上线前

- [ ] 运行健康检查
- [ ] 运行完整测试套件
- [ ] 检查文件大小是否超标
- [ ] Review 本文档的相关案例

---

## 📞 补充案例

**欢迎团队成员补充新的调试案例！**

格式参考：

```markdown
## 案例N: 标题

### 📋 基本信息
- 发现日期：
- 严重程度：
- 影响范围：
- 修复耗时：

### 🐛 问题描述

### 🔍 调试过程

### ✅ 解决方案

### 🎓 经验教训

### 🛡️ 预防措施
```

---

**最后更新**: 2025-01-20
**维护者**: Claude Code Team

本文档是活文档，请定期更新和完善！
