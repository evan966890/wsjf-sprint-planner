# common-tasks-guide

## Description
常见开发任务快速指南。提供修改评分规则、添加筛选维度、修改样式、调整容量计算等常见任务的具体操作步骤。

## Trigger Keywords
- 怎么修改
- 如何添加
- 怎么改
- how to
- 修改样式
- 添加功能
- 调整

## Instructions

### 常见开发任务

#### 1. 修改评分规则

**目标文件**：`src/utils/scoring.ts`

**修改步骤**：
```typescript
// 找到 calculateScores 函数
export function calculateScores(requirements: Requirement[]): Requirement[] {
  return requirements.map(req => {
    // 1. 修改原始分计算公式
    const rawScore = bvScore + tcScore + ddlScore + workloadScore;

    // 2. 调整各维度分值
    // 例如：修改业务影响度分数
    const bvScore = req.businessValue === '战略平台' ? 12 : // 原来是10
                   req.businessValue === '撬动核心' ? 9 :  // 原来是8
                   req.businessValue === '明显改善' ? 6 : 3;

    // 3. 修改归一化算法（可选）
    const displayScore = 10 + 90 * (rawScore - minRaw) / (maxRaw - minRaw);

    return { ...req, weightScore: displayScore };
  });
}
```

**注意事项**：
- 修改后需要重新计算所有需求的分数
- 确保修改后的分数范围合理
- 建议先在测试数据上验证

#### 2. 添加新的筛选维度

**目标文件**：`src/components/UnscheduledArea.tsx`

**修改步骤**：
```typescript
// 1. 添加新的 state
const [newFilter, setNewFilter] = useState<string>('all');

// 2. 添加筛选 UI
<select
  value={newFilter}
  onChange={(e) => setNewFilter(e.target.value)}
  className="border rounded px-2 py-1"
>
  <option value="all">全部</option>
  <option value="option1">选项1</option>
  <option value="option2">选项2</option>
</select>

// 3. 在 filteredReqs 计算中添加筛选逻辑
const filteredReqs = unscheduled.filter(req => {
  // 现有筛选条件
  if (filter !== 'all' && req.someField !== filter) return false;

  // 新增筛选条件
  if (newFilter !== 'all' && req.newField !== newFilter) return false;

  return true;
});
```

**常见筛选维度**：
- 需求来源（产品/技术/运营）
- 负责人
- 紧急程度
- 需求类型（新功能/优化/修复）

#### 3. 修改卡片样式

**目标文件**：`src/components/RequirementCard.tsx`

**修改步骤**：

```typescript
// 1. 修改颜色映射函数
const getColor = (bv: number) => {
  if (bv >= 10) return 'bg-gradient-to-r from-purple-500 to-pink-600'; // 改为紫粉渐变
  if (bv >= 8) return 'bg-gradient-to-r from-purple-400 to-pink-500';
  if (bv >= 6) return 'bg-gradient-to-r from-purple-300 to-pink-400';
  return 'bg-gradient-to-r from-purple-200 to-pink-300';
};

// 2. 修改卡片布局 className
<div className={`
  p-4 rounded-lg shadow-md          // 基础样式
  hover:shadow-xl transition-shadow  // 交互效果
  ${getColor(requirement.businessValue)} // 背景色
  border-2 border-gray-200          // 边框（新增）
`}>
  {/* 卡片内容 */}
</div>

// 3. 修改星级显示样式
<div className="flex items-center gap-1">
  <span className="text-yellow-500 text-xl">★</span> // 改为金色大星星
  <span className="text-lg font-bold">{displayScore}</span>
</div>
```

**Tailwind 常用颜色系**：
- 蓝色：`blue-100` ~ `blue-900`
- 紫色：`purple-100` ~ `purple-900`
- 绿色：`green-100` ~ `green-900`
- 红色：`red-100` ~ `red-900`
- 渐变：`bg-gradient-to-r from-X to-Y`

#### 4. 调整迭代池容量计算

**目标文件**：`src/components/SprintPoolComponent.tsx`

**修改步骤**：

```typescript
// 1. 修改资源计算逻辑
const totalWorkload = scheduledReqs.reduce((sum, req) =>
  sum + (req.workload || 0), 0
);

// 2. 修改净可用人天（考虑请假、会议等）
const netAvailable = pool.capacity * 0.8; // 原来可能是 * 1.0
// 0.8 表示扣除 20% 的非开发时间

// 3. 修改容量百分比计算
const percentage = Math.round((totalWorkload / netAvailable) * 100);

// 4. 修改容量预警阈值
const getCapacityColor = (pct: number) => {
  if (pct > 110) return 'text-red-600 font-bold';    // 严重超载（原来是100）
  if (pct > 90) return 'text-orange-500';            // 接近满载（原来是80）
  if (pct > 70) return 'text-yellow-600';            // 合理范围（新增）
  return 'text-green-600';                           // 资源充足
};
```

**容量计算公式**：
```
净可用人天 = 总人天 × 效率系数
效率系数建议：0.7 ~ 0.8（考虑会议、请假、杂事）

容量百分比 = (已排期工作量 / 净可用人天) × 100%

预警阈值：
- < 70%：资源充足（绿色）
- 70-90%：合理范围（黄色）
- 90-110%：接近满载（橙色）
- > 110%：严重超载（红色）
```

#### 5. 添加新的需求字段

**步骤概览**：
1. 在 `types/requirement.ts` 中添加类型定义
2. 在 `EditRequirementModal` 中添加表单字段
3. 在 `RequirementCard` 中显示新字段
4. 更新数据生成和导入逻辑
5. 添加筛选/排序支持（可选）

**示例**：添加"需求来源"字段

```typescript
// 1. types/requirement.ts
export interface Requirement {
  // ... 现有字段
  source?: '产品' | '技术' | '运营' | '用户反馈'; // 新增
}

// 2. EditRequirementModal.tsx
<div>
  <label>需求来源</label>
  <select
    value={formData.source || '产品'}
    onChange={(e) => setFormData({...formData, source: e.target.value})}
  >
    <option value="产品">产品</option>
    <option value="技术">技术</option>
    <option value="运营">运营</option>
    <option value="用户反馈">用户反馈</option>
  </select>
</div>

// 3. RequirementCard.tsx
<div className="text-sm text-gray-600">
  来源：{requirement.source || '未知'}
</div>
```

#### 6. 修改拖拽行为

**目标文件**：需求卡片所在组件

**修改步骤**：

```typescript
// 1. 修改拖拽数据传递
onDragStart={(e) => {
  e.dataTransfer.setData('requirementId', req.id);
  e.dataTransfer.setData('sourcePoolId', poolId);
  e.dataTransfer.setData('dragType', 'requirement'); // 新增：区分拖拽类型

  // 设置拖拽视觉效果
  e.dataTransfer.effectAllowed = 'move';
}}

// 2. 修改放置区域判断
onDragOver={(e) => {
  e.preventDefault();

  // 自定义允许放置的条件
  const dragType = e.dataTransfer.types.includes('dragtype');
  if (!dragType || someCondition) {
    e.dataTransfer.dropEffect = 'none'; // 禁止放置
    return;
  }

  e.dataTransfer.dropEffect = 'move'; // 允许放置
}}

// 3. 修改放置处理逻辑
onDrop={(e) => {
  e.preventDefault();
  const reqId = e.dataTransfer.getData('requirementId');

  // 添加业务规则校验
  if (someBusinessRule) {
    alert('不满足排期条件');
    return;
  }

  // 执行移动逻辑
  moveRequirement(reqId, targetPoolId);
}}
```

### 开发前检查

**所有修改前必须执行**：

```bash
# 1. 检查文件大小
npm run check-file-size

# 2. 启动开发服务器
npm run dev

# 3. 打开浏览器验证
# http://localhost:3000
```

**修改后必须验证**：

```bash
# 1. TypeScript 检查
npx tsc --noEmit

# 2. 生产构建
npm run build

# 3. 功能测试
# 手动测试所有受影响的功能
```

### 相关文档位置

- **项目结构**：`CLAUDE.md` 中的 Architecture 章节
- **代码模板**：`docs/templates/`
- **重构指南**：`docs/refactoring-guides/`
- **开发流程**：`docs/new-feature-workflow.md`

### 快速参考

| 任务类型 | 目标文件 | 关键函数/组件 |
|---------|----------|-------------|
| 评分算法 | `utils/scoring.ts` | `calculateScores` |
| 筛选功能 | `components/UnscheduledArea.tsx` | `filteredReqs` |
| 卡片样式 | `components/RequirementCard.tsx` | `getColor`, className |
| 容量计算 | `components/SprintPoolComponent.tsx` | 资源计算逻辑 |
| 拖拽行为 | 各组件 | `onDragStart/Over/Drop` |
| 类型定义 | `types/requirement.ts` | `Requirement` interface |

### 最佳实践

1. **小步快跑**：一次只改一个功能，立即测试
2. **备份代码**：重大修改前先提交 Git
3. **参考现有代码**：找类似功能的实现方式
4. **渐进式重构**：不要一次性大改，分步骤进行
5. **保持一致性**：新代码要符合项目规范

### 需要帮助？

如果遇到复杂任务，可以调用其他 skills：
- 重构需求 → `refactoring-assistant`
- 文件大小问题 → `file-size-checker`
- 代码质量检查 → `code-quality-enforcer`
- WSJF 算法问题 → `wsjf-domain-expert`
