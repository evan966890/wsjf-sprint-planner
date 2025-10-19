# 09 - UX视觉一致性优化

**需求编号**: REQ-009
**版本**: v1.3.0
**创建日期**: 2025-01-19
**最后更新**: 2025-01-20
**状态**: ✅ 已实现

---

## 📋 需求概述

### 业务价值
- 提升用户体验的视觉一致性
- 降低用户认知成本
- 确保10分制评分系统与4档可视化完美融合

### 目标用户
- 所有产品经理和需求管理人员
- 使用筛选功能查找需求的用户
- 阅读评分说明书的新用户

### 优先级
🔴 高 - 影响用户体验和系统可用性

---

## 🎯 功能描述

### 核心功能

优化WSJF Sprint Planner的视觉呈现和交互一致性，确保10分制评分系统在各处展示保持统一。

### 用户故事

**Story 1**: 需求卡片颜色映射优化
```
作为 产品经理
我希望 需求卡片的颜色深浅能够直观反映业务影响度
这样 我可以快速识别高优先级需求
```

**Story 2**: 筛选框视觉增强
```
作为 需求管理员
我希望 筛选下拉框能显示实际的颜色图例
这样 我可以更直观地选择筛选条件
```

**Story 3**: 评分说明书一致性
```
作为 新用户
我希望 说明书中的分值显示与筛选框一致
这样 我可以更容易理解10分制如何映射到4档
```

### 使用场景

1. **浏览需求列表**：用户通过卡片颜色快速识别业务影响度
2. **筛选需求**：用户在筛选框中看到颜色图例，直观选择
3. **学习评分系统**：用户查看说明书，理解分值区间映射

---

## 📐 详细需求

### 1. 需求卡片4档蓝色映射

**位置**: `src/components/RequirementCard.tsx`

#### 实现逻辑

```typescript
// 10分制映射到4档蓝色
if (req.businessImpactScore) {
  const score = req.businessImpactScore;
  if (score === 10) tier = '战略平台';       // blue-800/900
  else if (score >= 8) tier = '撬动核心';    // blue-600/700
  else if (score >= 5) tier = '明显';        // blue-400/500
  else tier = '局部';                        // blue-100/200 (深色文字)
}

const gradients = {
  '局部': 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
  '明显': 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
  '撬动核心': 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
  '战略平台': 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)'
};
```

#### 验收标准
- ✅ 10分的需求显示极深蓝色（战略平台）
- ✅ 8-9分的需求显示深蓝色（撬动核心）
- ✅ 5-7分的需求显示中蓝色（明显）
- ✅ 1-4分的需求显示浅蓝色（局部，深色文字）
- ✅ 强制DDL需求优先显示红色渐变
- ✅ 向后兼容旧的bv字段

---

### 2. 筛选框颜色图例

**位置**: `src/components/UnscheduledArea.tsx`

#### 实现方案

```tsx
<select value={bvFilter} onChange={...}>
  <option value="all">全部业务影响度</option>
  <option value="战略平台" className="bg-blue-900 text-white font-medium">
    ■ 战略平台 (10分)
  </option>
  <option value="撬动核心" className="bg-blue-700 text-white font-medium">
    ■ 撬动核心 (8-9分)
  </option>
  <option value="明显" className="bg-blue-500 text-white font-medium">
    ■ 明显 (5-7分)
  </option>
  <option value="局部" className="bg-blue-200 text-gray-800 font-medium">
    ■ 局部 (1-4分)
  </option>
</select>
```

#### 验收标准
- ✅ 每个选项都有对应的背景颜色
- ✅ 颜色与需求卡片颜色系统一致
- ✅ 使用方块符号(■)代替emoji
- ✅ 浅蓝色选项使用深色文字（可读性）

---

### 3. 需求类型筛选健壮性

**位置**: `src/components/UnscheduledArea.tsx`

#### 问题描述
用户选择"功能开发"筛选时，无法筛选出对应需求

#### 根因分析
- 部分需求的type字段可能为空或包含空格
- 筛选逻辑未处理undefined/null/空字符串情况

#### 解决方案

```typescript
// 增强健壮性：处理空格和undefined，默认为功能开发
const reqType = req?.type?.trim() || '功能开发';
const matchesType = filterType === 'all' || reqType === filterType;
```

#### 验收标准
- ✅ "功能开发"筛选正常工作
- ✅ 处理type字段为空的情况（默认为功能开发）
- ✅ 去除首尾空格避免匹配失败
- ✅ 向后兼容旧数据

---

### 4. 评分说明书区间显示

**位置**: `src/components/HandbookModal.tsx`

#### 实现方案

```typescript
const scoreRangeMap: Record<string, string> = {
  '战略平台': '10分档',
  '撬动核心': '8-9分档',
  '明显': '5-7分档',
  '局部': '1-4分档',
};

// 在卡片中显示
<p>分值：{scoreRangeMap[key]}</p>
```

#### 验收标准
- ✅ 说明书中显示分值区间而非单个数字
- ✅ 与筛选框中的显示一致
- ✅ 清晰展示10分制如何映射到4档

---

### 5. 评分标准文档优化

**位置**: `src/config/scoringStandards.ts`

#### 实现方案

为SCORING_STANDARDS中的每个标准添加分档标注：

```typescript
{
  score: 10,
  name: '致命缺陷',
  shortDescription: '【10分档-战略平台】业务停摆或重大合规风险',
  ...
},
{
  score: 9,
  name: '严重阻塞',
  shortDescription: '【8-9分档-撬动核心】关键流程严重受阻...',
  ...
}
```

#### 验收标准
- ✅ 所有10个标准都添加了分档标注
- ✅ 标注格式统一：【X-Y分档-档位名称】
- ✅ 与4档映射关系保持一致

---

## 🔧 技术实现

### 代码位置

| 文件 | 修改行 | 说明 |
|------|--------|------|
| `src/components/RequirementCard.tsx` | 135-177 | 重写getColor函数，支持10分制映射 |
| `src/components/UnscheduledArea.tsx` | 129-131 | 增强type筛选健壮性 |
| `src/components/UnscheduledArea.tsx` | 376-380 | 添加筛选框颜色图例 |
| `src/components/HandbookModal.tsx` | 30-36, 84 | 添加分值区间映射 |
| `src/config/scoringStandards.ts` | 全文 | 更新shortDescription显示区间 |

### 技术决策

1. **颜色系统**：使用Tailwind CSS blue系列（100-900）
2. **向后兼容**：保留对旧bv字段的支持
3. **默认值策略**：type为空时默认为"功能开发"
4. **渐变方案**：使用linear-gradient确保视觉层次清晰

---

## ✅ 验收标准

### 功能验收

- [x] 需求卡片颜色正确映射4档蓝色
- [x] 筛选框显示实际颜色图例
- [x] 需求类型筛选正常工作
- [x] 说明书显示分值区间
- [x] 评分标准文档显示分档标注
- [x] 向后兼容旧数据格式

### 视觉验收

- [x] 4档蓝色深浅度明显可辨
- [x] 浅蓝色卡片使用深色文字
- [x] 筛选框颜色与卡片颜色一致
- [x] 说明书与筛选框描述一致

### 性能要求

- [x] 无TypeScript编译错误
- [x] 无运行时错误
- [x] HMR正常更新
- [x] 构建大小无明显增加

---

## 📊 变更历史

### v1.3.0 (2025-01-20)

**新增功能**:
- ✅ 需求卡片4档蓝色映射
- ✅ 筛选框颜色图例
- ✅ 需求类型筛选健壮性增强
- ✅ 说明书区间显示
- ✅ 评分标准文档区间标注

**问题修复**:
- ✅ 修复"功能开发"筛选无效的BUG
- ✅ 修复type字段为空导致的筛选问题

**用户反馈**:
> "筛选框的功能已经验证OK，颜色有了区分，筛选也能出来了。说明书的图例也显示正确的数值区间了。" - 用户测试反馈

---

## 🔗 相关文档

- [01-WSJF评分系统](./01-wsjf-scoring-system.md)
- [03-需求管理](./03-requirement-management.md)
- [07-UI交互设计](./07-ui-interaction-design.md)
- [项目规范](../../.claude/project-rules.md)

---

**维护者**: 开发团队
**审核者**: 产品团队
**状态**: ✅ 已上线 v1.3.0
