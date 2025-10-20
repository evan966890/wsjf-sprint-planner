# 调试决策树

**版本**: 1.5.0
**更新日期**: 2025-01-20
**适用场景**: React + TypeScript + Zustand 状态管理

本文档提供系统化的调试流程，帮助快速定位和解决问题。

---

## 📖 核心理念

**黄金法则**: 数据存在但UI不显示 = 90%是渲染逻辑问题，直接检查分组/筛选/map，而非数据层！

### 调试效率对比

| 调试方式 | 平均定位轮数 | 适用场景 |
|---------|------------|---------|
| 直觉猜测 | 15-20轮 | ❌ 容易走弯路 |
| 系统化决策树 | 3-5轮 | ✅ 快速精准定位 |

---

## 🎯 问题分类

### 类型A：数据问题

**特征**:
- 数据不存在（console.log 输出为空数组）
- Store 中无数据
- 网络请求失败

**诊断方向**: 数据层 → Storage → API → Store

### 类型B：视图问题

**特征**:
- 数据存在（console.log 有数据）
- UI不显示或显示不全
- 搜索/筛选后消失

**诊断方向**: 渲染逻辑 → 筛选条件 → 分组逻辑 → React Key

---

## 🌳 决策树：UI不显示数据

```
问题：数据应该显示但UI上看不到
│
├─ 第1步：数据层检查 ─────────────────────────┐
│   console.log('原始数据:', unscheduled)      │
│   console.log('数据长度:', unscheduled.length) │
│                                                 │
│   ❓ 数据是否存在？                           │
│   │                                             │
│   ├─ ❌ 无数据/空数组                          │
│   │   → 转到"数据层调试流程"                  │
│   │                                             │
│   └─ ✅ 有数据                                 │
│       → 继续第2步                              │
│                                                 │
├─ 第2步：筛选逻辑检查 ─────────────────────────┤
│   console.log('筛选后:', filteredReqs)       │
│   console.log('筛选前后对比:', {              │
│     before: unscheduled.length,                │
│     after: filteredReqs.length                 │
│   })                                            │
│                                                 │
│   ❓ 数据是否通过筛选？                       │
│   │                                             │
│   ├─ ❌ filteredReqs 为空                      │
│   │   → 检查筛选条件                          │
│   │   → 检查搜索框是否有残留文本              │
│   │   → 检查下拉筛选器是否误触                │
│   │                                             │
│   └─ ✅ filteredReqs 有数据                   │
│       → 继续第3步                              │
│                                                 │
├─ 第3步：分组逻辑检查 ─────────────────────────┤
│   console.log('分组结果:', {                  │
│     readyCount: readyReqs.length,              │
│     notReadyCount: notReadyReqs.length,        │
│     total: filteredReqs.length                 │
│   })                                            │
│                                                 │
│   🚨 关键检查：总数是否匹配？                 │
│   if (readyReqs.length + notReadyReqs.length   │
│       !== filteredReqs.length) {               │
│     console.error('分组逻辑有遗漏！')         │
│   }                                             │
│                                                 │
│   ❓ 总数是否匹配？                           │
│   │                                             │
│   ├─ ❌ 总数不匹配                             │
│   │   → 🎯 问题定位！                         │
│   │   → 分组条件遗漏了某些状态值              │
│   │   → 检查 if/else 是否穷举所有可能值       │
│   │   → 使用 debugger 断点查看遗漏的项        │
│   │                                             │
│   └─ ✅ 总数匹配                               │
│       → 继续第4步                              │
│                                                 │
├─ 第4步：渲染逻辑检查 ─────────────────────────┤
│   {readyReqs.map(req => {                      │
│     console.log('正在渲染:', req.id)          │
│     return <RequirementCard key={req.id} .../> │
│   })}                                           │
│                                                 │
│   ❓ .map() 是否执行？                        │
│   │                                             │
│   ├─ ❌ 未执行或执行次数不对                   │
│   │   → 检查条件渲染 {condition && ...}       │
│   │   → 检查数组是否意外变为undefined          │
│   │   → 检查React Key是否重复                 │
│   │                                             │
│   └─ ✅ 正常执行                               │
│       → 检查CSS display/visibility/opacity     │
│       → 检查容器高度/overflow                  │
└───────────────────────────────────────────────┘
```

---

## 🔍 具体案例：2025-01-20 BUG分析

### 问题描述

新增需求AAA后，总需求数+1，但待排期区不显示。

### 错误的调试路径（20轮）

```
怀疑数据丢失
  → 检查 Store 状态           ❌ 浪费5轮
  → 检查 localStorage         ❌ 浪费3轮
  → 检查清空按钮误触          ❌ 浪费4轮
  → 检查筛选逻辑              ❌ 浪费5轮
  → 检查搜索框                ❌ 浪费2轮
  → 最终发现渲染分组逻辑问题  ✅ 20轮后
```

### 正确的调试路径（3轮）

```
第1步：数据存在吗？
  console.log(unscheduled)  → 51条数据存在 ✅

第2步：筛选通过吗？
  console.log(filteredReqs) → 51条数据存在 ✅

第3步：分组完整吗？
  console.log({
    filtered: 51,
    ready: 50,      // ← 注意！
    notReady: 0     // ← 注意！
  })
  → 51 ≠ 50 + 0    ❌ 发现问题！

根因：techProgress='待评估' 不在任何分组条件中
  - readyReqs: techProgress === '已评估工作量' || === '已完成技术方案'
  - notReadyReqs: techProgress === '未评估'
  - '待评估' → 不匹配任何条件 → 不渲染！
```

### 修复方案

```typescript
// 修复前（有遗漏）
const readyReqs = sortedReqs.filter(r =>
  r.techProgress === '已评估工作量' ||
  r.techProgress === '已完成技术方案'
);
const notReadyReqs = sortedReqs.filter(r =>
  r.techProgress === '未评估'
);

// 修复后（穷举所有情况）
const notReadyStatuses = ['待评估', '未评估'];
const readyReqs = sortedReqs.filter(r =>
  r.techProgress && !notReadyStatuses.includes(r.techProgress)
);
const notReadyReqs = sortedReqs.filter(r =>
  !r.techProgress || notReadyStatuses.includes(r.techProgress)
);
```

---

## 🛠️ 调试工具箱

### 1. 快速验证代码片段

复制粘贴到浏览器控制台：

```javascript
// 检查分组完整性
const { unscheduled } = window.__debugStore();
const filtered = unscheduled; // 假设无筛选
const ready = filtered.filter(r => r.techProgress && !['待评估', '未评估'].includes(r.techProgress));
const notReady = filtered.filter(r => !r.techProgress || ['待评估', '未评估'].includes(r.techProgress));

console.table({
  筛选后: filtered.length,
  可排期: ready.length,
  不可排期: notReady.length,
  总和: ready.length + notReady.length,
  是否匹配: filtered.length === ready.length + notReady.length ? '✅' : '❌'
});

// 如果不匹配，找出遗漏的
if (filtered.length !== ready.length + notReady.length) {
  const readyIds = new Set(ready.map(r => r.id));
  const notReadyIds = new Set(notReady.map(r => r.id));
  const missing = filtered.filter(r => !readyIds.has(r.id) && !notReadyIds.has(r.id));
  console.log('遗漏的需求:', missing);
}
```

### 2. Chrome DevTools 断点技巧

**条件断点**：只在特定需求时暂停

```javascript
// 在 .map() 行设置条件断点
req.id === 'REQ-1760934821428'
```

**Logpoint**：不暂停执行，只输出日志

```javascript
console.log('渲染:', req.id, '状态:', req.techProgress, '是否在ready?', readyReqs.includes(req), '是否在notReady?', notReadyReqs.includes(req))
```

### 3. 使用项目内置工具

```typescript
import { debugRenderPipeline } from '@/utils/debugHelpers';
import { validateRenderGroups } from '@/utils/healthCheck';

// 方式1：追踪渲染管道
const readyReqs = debugRenderPipeline(unscheduled, [
  { name: '搜索筛选', fn: (items) => items.filter(matchesSearch) },
  { name: '状态筛选', fn: (items) => items.filter(isReady) },
  { name: '排序', fn: (items) => items.sort(sortFn) },
]);

// 方式2：验证分组完整性
validateRenderGroups(filteredReqs, readyReqs, notReadyReqs, 'UnscheduledArea');
// 如果有遗漏，会抛出错误并输出详细信息
```

---

## ⚡ 效率提升技巧

### 1. 二分法定位

当数据流转路径很长时，使用二分法快速定位：

```
数据入口 → [步骤1] → [步骤2] → [步骤3] → [步骤4] → UI输出

先检查中间点（步骤2）:
  - 数据正常？→ 问题在步骤3-4之间
  - 数据异常？→ 问题在步骤1-2之间
```

### 2. 排除法

如果有多个可疑点，逐个排除：

```typescript
// 怀疑：筛选条件A、B、C之一有问题

// 排除A
const withoutA = items.filter(matchB).filter(matchC);
console.log('去掉条件A:', withoutA.length);

// 排除B
const withoutB = items.filter(matchA).filter(matchC);
console.log('去掉条件B:', withoutB.length);

// 排除C
const withoutC = items.filter(matchA).filter(matchB);
console.log('去掉条件C:', withoutC.length);

// 对比哪个差异最大
```

### 3. 对照实验

创建简化版本，逐步添加复杂度：

```typescript
// 第1步：最简单版本（应该能工作）
const allReqs = sortedReqs; // 不分组
{allReqs.map(req => <Card key={req.id} req={req} />)}

// 第2步：添加简单分组
const ready = sortedReqs.filter(r => r.techProgress);
const notReady = sortedReqs.filter(r => !r.techProgress);

// 第3步：添加复杂条件
const ready = sortedReqs.filter(r => r.techProgress && isValid(r.techProgress));
```

---

## 📋 调试检查清单

复制此清单到新建Issue/Bug报告中：

```markdown
## 调试检查清单

- [ ] **第1步：数据层**
  - [ ] console.log 原始数据（Store/Props）
  - [ ] 确认数据非空、非undefined
  - [ ] 确认数据结构正确

- [ ] **第2步：筛选层**
  - [ ] 检查搜索框是否有文本残留
  - [ ] 检查筛选下拉框是否误触
  - [ ] console.log 筛选前后的数据量
  - [ ] 逐个筛选条件测试（排除法）

- [ ] **第3步：分组层**
  - [ ] console.log 各分组的数量
  - [ ] 验证：total = group1 + group2 + ... + groupN
  - [ ] 找出未分配到任何组的数据
  - [ ] 检查 if/else 是否穷举所有可能值

- [ ] **第4步：渲染层**
  - [ ] .map() 中添加 console.log
  - [ ] 检查 React key 是否唯一
  - [ ] 检查条件渲染 {condition && ...}
  - [ ] 检查 CSS: display, visibility, overflow

- [ ] **第5步：性能层**
  - [ ] 检查是否过度渲染（React DevTools Profiler）
  - [ ] 检查是否死循环
  - [ ] 检查是否内存泄漏
```

---

## 🎓 经验总结

### 常见误区

| 误区 | 正确做法 |
|-----|---------|
| 一上来就怀疑数据丢失 | 先用 console.log 验证数据是否存在 |
| 到处添加 console.log | 使用调试决策树，有针对性地添加日志 |
| 凭感觉改代码试试 | 先定位问题，再有目的地修复 |
| 忽略警告信息 | React 警告往往指向真正的问题 |

### 最佳实践

1. **先复现、再调试**
   - 确保能稳定复现问题
   - 记录复现步骤

2. **先隔离、再修复**
   - 创建最小化复现Demo
   - 逐步排除无关因素

3. **先理解、再动手**
   - 理解数据流转路径
   - 理解渲染条件逻辑

4. **改一处、测一次**
   - 不要同时改多处
   - 每次改动后立即验证

### 工具推荐

- **Chrome DevTools**: 断点、Logpoint、React DevTools
- **Redux DevTools** / **Zustand DevTools**: 状态追踪
- **Why Did You Render**: 诊断不必要的渲染
- **Bundle Analyzer**: 分析包大小

---

## 📞 求助指南

如果按照决策树仍无法解决，请在Issue中提供：

1. **问题描述**: 期望 vs 实际
2. **复现步骤**: 详细的操作流程
3. **调试日志**: console.log 输出（截图或文本）
4. **环境信息**: 浏览器、版本、操作系统
5. **已尝试方案**: 列出已经试过的方法

**示例**：

```
问题：新增需求后不显示

期望：新增需求AAA后，应该出现在待排期区
实际：总需求数+1，但待排期区看不到

复现步骤：
1. 点击"新增需求"按钮
2. 填写需求名称"AAA"
3. 保存

调试日志：
- unscheduled.length: 51 ✅
- filteredReqs.length: 51 ✅
- readyReqs.length: 50 ❌
- notReadyReqs.length: 0 ❌
- AAA.techProgress: '待评估'

环境：Chrome 120, Windows 11

已尝试：
- 清空搜索框 ✅
- 重置筛选条件 ✅
- 刷新页面 ✅
```

---

**最后更新**: 2025-01-20
**维护者**: Claude Code Team

有任何改进建议，欢迎提交 PR 或 Issue！
