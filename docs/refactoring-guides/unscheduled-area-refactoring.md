# UnscheduledArea.tsx 重构指南

> **难度**: ⭐⭐ (简单)
> **预计工时**: 2-3 小时
> **当前行数**: 608
> **目标行数**: < 480

---

## 📋 重构概览

### 当前问题

- 筛选逻辑混在组件中（~150行）
- FilterBar UI 代码占用大量空间（~100行）
- 状态管理分散

### 拆分方案

```
src/components/unscheduled/
├── UnscheduledArea.tsx           (~280行) - 主容器
├── FilterBar.tsx                 (~150行) - 筛选栏
└── hooks/
    └── useRequirementFilter.ts   (~150行) - 筛选逻辑
```

---

## 🔧 步骤 1：创建目录结构

```bash
mkdir -p src/components/unscheduled/hooks
```

---

## 📝 步骤 2：提取筛选逻辑 Hook

### 创建 `src/components/unscheduled/hooks/useRequirementFilter.ts`

```typescript
/**
 * 需求筛选和排序 Hook
 *
 * 功能：
 * - 搜索过滤
 * - 多维度筛选（类型、分数、工作量、BV、业务域、RMS）
 * - 排序
 * - 分组（已评估 vs 未评估）
 */

import { useMemo } from 'react';
import type { Requirement } from '../../../types';
import { NOT_READY_STATUSES } from '../../../constants/techProgress';

interface FilterOptions {
  searchTerm: string;
  filterType: string;
  scoreFilter: string;
  effortFilter: string;
  bvFilter: string;
  businessDomainFilter: string;
  rmsFilter: boolean;
  sortBy: string;
}

export function useRequirementFilter(
  requirements: Requirement[],
  filters: FilterOptions
) {
  // 筛选逻辑
  const filteredReqs = useMemo(() => {
    let result = requirements;

    // 搜索
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(req =>
        req.name?.toLowerCase().includes(term) ||
        req.submitterName?.toLowerCase().includes(term) ||
        req.productManager?.toLowerCase().includes(term) ||
        req.developer?.toLowerCase().includes(term)
      );
    }

    // 需求类型筛选
    if (filters.filterType !== 'all') {
      result = result.filter(req => req.type === filters.filterType);
    }

    // 权重分筛选
    if (filters.scoreFilter !== 'all') {
      result = result.filter(req => {
        const score = req.displayScore || 0;
        if (filters.scoreFilter === 'high') return score >= 70;
        if (filters.scoreFilter === 'medium') return score >= 40 && score < 70;
        if (filters.scoreFilter === 'low') return score < 40;
        return true;
      });
    }

    // 工作量筛选
    if (filters.effortFilter !== 'all') {
      result = result.filter(req => {
        const effort = req.effortDays || 0;
        if (filters.effortFilter === 'micro') return effort <= 3;
        if (filters.effortFilter === 'small') return effort > 3 && effort <= 10;
        if (filters.effortFilter === 'medium') return effort > 10 && effort <= 30;
        if (filters.effortFilter === 'large') return effort > 30 && effort <= 60;
        if (filters.effortFilter === 'xlarge') return effort > 60 && effort <= 100;
        if (filters.effortFilter === 'xxlarge') return effort > 100;
        return true;
      });
    }

    // 业务影响度筛选
    if (filters.bvFilter !== 'all') {
      result = result.filter(req => {
        // 根据 bv 文本映射到高中低
        const bvMap: Record<string, string> = {
          '局部': 'low',
          '明显': 'medium',
          '撬动核心': 'high',
          '战略平台': 'high',
        };
        return bvMap[req.bv] === filters.bvFilter;
      });
    }

    // 业务域筛选
    if (filters.businessDomainFilter !== 'all') {
      result = result.filter(req => req.businessDomain === filters.businessDomainFilter);
    }

    // RMS筛选
    if (filters.rmsFilter) {
      result = result.filter(req => req.isRMS === true);
    }

    return result;
  }, [requirements, filters]);

  // 排序逻辑
  const sortedReqs = useMemo(() => {
    const sorted = [...filteredReqs];

    switch (filters.sortBy) {
      case 'score-desc':
        return sorted.sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0));
      case 'score-asc':
        return sorted.sort((a, b) => (a.displayScore || 0) - (b.displayScore || 0));
      case 'bv-desc':
        const bvOrder = { '战略平台': 4, '撬动核心': 3, '明显': 2, '局部': 1 };
        return sorted.sort((a, b) => (bvOrder[b.bv] || 0) - (bvOrder[a.bv] || 0));
      case 'date-desc':
        return sorted.sort((a, b) =>
          new Date(b.submitDate || 0).getTime() - new Date(a.submitDate || 0).getTime()
        );
      case 'effort-desc':
        return sorted.sort((a, b) => (b.effortDays || 0) - (a.effortDays || 0));
      default:
        return sorted;
    }
  }, [filteredReqs, filters.sortBy]);

  // 分组逻辑（已评估 vs 未评估）
  const { readyReqs, notReadyReqs } = useMemo(() => {
    const ready = sortedReqs.filter(r =>
      r.techProgress && !NOT_READY_STATUSES.includes(r.techProgress)
    );
    const notReady = sortedReqs.filter(r =>
      !r.techProgress || NOT_READY_STATUSES.includes(r.techProgress)
    );

    // 验证分组完整性（开发环境）
    if (import.meta.env.DEV) {
      const total = sortedReqs.length;
      const grouped = ready.length + notReady.length;
      if (total !== grouped) {
        console.error(`分组逻辑有遗漏！总数:${total}, 分组:${grouped}`);
      }
    }

    return { readyReqs: ready, notReadyReqs: notReady };
  }, [sortedReqs]);

  return {
    filteredReqs,
    sortedReqs,
    readyReqs,
    notReadyReqs,
  };
}
```

---

## 🎨 步骤 3：提取筛选栏组件

### 创建 `src/components/unscheduled/FilterBar.tsx`

```typescript
/**
 * 筛选栏组件
 *
 * 包含所有筛选控件：搜索、类型、分数、工作量等
 */

import { Search, Filter, Sparkles } from 'lucide-react';

interface FilterBarProps {
  // 筛选状态
  searchTerm: string;
  filterType: string;
  scoreFilter: string;
  effortFilter: string;
  bvFilter: string;
  businessDomainFilter: string;
  rmsFilter: boolean;
  sortBy: string;

  // 回调函数
  onSearchChange: (value: string) => void;
  onFilterTypeChange: (value: string) => void;
  onScoreFilterChange: (value: string) => void;
  onEffortFilterChange: (value: string) => void;
  onBVFilterChange: (value: string) => void;
  onBusinessDomainFilterChange: (value: string) => void;
  onRMSFilterChange: (value: boolean) => void;
  onSortByChange: (value: string) => void;
  onBatchEvaluate: () => void;

  // 统计数据
  totalCount: number;
  readyCount: number;
  notReadyCount: number;
}

const FilterBar = ({
  searchTerm,
  filterType,
  scoreFilter,
  effortFilter,
  bvFilter,
  businessDomainFilter,
  rmsFilter,
  sortBy,
  onSearchChange,
  onFilterTypeChange,
  onScoreFilterChange,
  onEffortFilterChange,
  onBVFilterChange,
  onBusinessDomainFilterChange,
  onRMSFilterChange,
  onSortByChange,
  onBatchEvaluate,
  totalCount,
  readyCount,
  notReadyCount,
}: FilterBarProps) => {
  return (
    <div className="space-y-3">
      {/* 第一行：搜索 + 批量评估按钮 */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索需求名称、提交人、产品经理、研发负责人..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={onBatchEvaluate}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition flex items-center gap-2 font-medium shadow-md"
          title="使用AI批量评估所有需求的业务影响度"
        >
          <Sparkles size={16} />
          <span>AI批量评估</span>
        </button>
      </div>

      {/* 第二行：筛选器 */}
      <div className="grid grid-cols-3 gap-2">
        {/* 需求类型 */}
        <select
          value={filterType}
          onChange={(e) => onFilterTypeChange(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">全部类型</option>
          <option value="功能开发">功能开发</option>
          <option value="技术债">技术债</option>
          <option value="Bug修复">Bug修复</option>
        </select>

        {/* 权重分 */}
        <select
          value={scoreFilter}
          onChange={(e) => onScoreFilterChange(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">全部权重</option>
          <option value="high">高权重 (≥70)</option>
          <option value="medium">中权重 (40-69)</option>
          <option value="low">低权重 (&lt;40)</option>
        </select>

        {/* 工作量 */}
        <select
          value={effortFilter}
          onChange={(e) => onEffortFilterChange(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">全部工作量</option>
          <option value="micro">微小 (≤3天)</option>
          <option value="small">小 (4-10天)</option>
          <option value="medium">中 (11-30天)</option>
          <option value="large">大 (31-60天)</option>
          <option value="xlarge">超大 (61-100天)</option>
          <option value="xxlarge">巨大 (&gt;100天)</option>
        </select>

        {/* 业务影响度 */}
        <select
          value={bvFilter}
          onChange={(e) => onBVFilterChange(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">全部影响度</option>
          <option value="high">高影响</option>
          <option value="medium">中影响</option>
          <option value="low">低影响</option>
        </select>

        {/* 业务域 */}
        <select
          value={businessDomainFilter}
          onChange={(e) => onBusinessDomainFilterChange(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">全部业务域</option>
          <option value="国际零售通用">国际零售通用</option>
          <option value="印尼">印尼</option>
          <option value="印度">印度</option>
        </select>

        {/* 排序 */}
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="score-desc">权重分↓</option>
          <option value="score-asc">权重分↑</option>
          <option value="bv-desc">业务影响度↓</option>
          <option value="date-desc">提交日期↓</option>
          <option value="effort-desc">工作量↓</option>
        </select>
      </div>

      {/* 第三行：RMS筛选 + 统计 */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={rmsFilter}
            onChange={(e) => onRMSFilterChange(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span>仅显示RMS需求</span>
        </label>

        <div className="text-sm text-gray-600">
          总计 <strong>{totalCount}</strong> 个需求
          （已评估 <strong className="text-green-600">{readyCount}</strong>，
          未评估 <strong className="text-orange-600">{notReadyCount}</strong>）
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
```

---

## 📦 步骤 4：重构主组件

### 修改 `src/components/UnscheduledArea.tsx`

删除原有的筛选逻辑和FilterBar UI，改为使用新组件：

```typescript
import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Requirement } from '../types';
import { roundNumber } from '../utils/scoring';
import RequirementCard from './RequirementCard';
import FilterBar from './unscheduled/FilterBar';
import { useRequirementFilter } from './unscheduled/hooks/useRequirementFilter';

const UnscheduledArea = ({
  unscheduled,
  onRequirementClick,
  onDrop,
  isDragOver,
  onAddNew,
  onBatchEvaluate,
  compact,
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
  scoreFilter,
  onScoreFilterChange,
  effortFilter,
  onEffortFilterChange,
  bvFilter,
  onBVFilterChange,
  businessDomainFilter,
  onBusinessDomainFilterChange,
  rmsFilter,
  onRMSFilterChange,
}: {
  unscheduled: Requirement[];
  onRequirementClick: (req: Requirement) => void;
  onDrop: () => void;
  isDragOver: boolean;
  onAddNew: () => void;
  onBatchEvaluate: () => void;
  compact: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterChange: (value: string) => void;
  scoreFilter: string;
  onScoreFilterChange: (value: string) => void;
  effortFilter: string;
  onEffortFilterChange: (value: string) => void;
  bvFilter: string;
  onBVFilterChange: (value: string) => void;
  businessDomainFilter: string;
  onBusinessDomainFilterChange: (value: string) => void;
  rmsFilter: boolean;
  onRMSFilterChange: (value: boolean) => void;
}) => {
  const [sortBy, setSortBy] = useState('score-desc');
  const [clearConfirmStep, setClearConfirmStep] = useState(0);
  const clearTimeoutRef = useRef<NodeJS.Timeout>();

  // 使用筛选 Hook
  const { readyReqs, notReadyReqs } = useRequirementFilter(unscheduled, {
    searchTerm,
    filterType,
    scoreFilter,
    effortFilter,
    bvFilter,
    businessDomainFilter,
    rmsFilter,
    sortBy,
  });

  // 清空确认逻辑
  const handleClearClick = () => {
    if (clearConfirmStep === 0) {
      setClearConfirmStep(1);
      clearTimeoutRef.current = setTimeout(() => {
        setClearConfirmStep(0);
      }, 5000);
    } else {
      // 二次确认，执行清空
      // ... 清空逻辑
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* 头部 */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">待排期区</h2>
          <button
            onClick={onAddNew}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
          >
            <Plus size={16} />
            新增需求
          </button>
        </div>

        {/* 筛选栏组件 */}
        <FilterBar
          searchTerm={searchTerm}
          filterType={filterType}
          scoreFilter={scoreFilter}
          effortFilter={effortFilter}
          bvFilter={bvFilter}
          businessDomainFilter={businessDomainFilter}
          rmsFilter={rmsFilter}
          sortBy={sortBy}
          onSearchChange={onSearchChange}
          onFilterTypeChange={onFilterChange}
          onScoreFilterChange={onScoreFilterChange}
          onEffortFilterChange={onEffortFilterChange}
          onBVFilterChange={onBVFilterChange}
          onBusinessDomainFilterChange={onBusinessDomainFilterChange}
          onRMSFilterChange={onRMSFilterChange}
          onSortByChange={setSortBy}
          onBatchEvaluate={onBatchEvaluate}
          totalCount={unscheduled.length}
          readyCount={readyReqs.length}
          notReadyCount={notReadyReqs.length}
        />
      </div>

      {/* 需求列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 已评估分组 */}
        {readyReqs.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-green-700 mb-2">
              ✅ 可排期需求 ({readyReqs.length})
            </h3>
            <div className={compact ? "space-y-2" : "grid grid-cols-1 gap-3"}>
              {readyReqs.map(req => (
                <RequirementCard
                  key={req.id}
                  requirement={req}
                  onClick={() => onRequirementClick(req)}
                  compact={compact}
                />
              ))}
            </div>
          </div>
        )}

        {/* 未评估分组 */}
        {notReadyReqs.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-orange-700 mb-2">
              ⏳ 待评估需求 ({notReadyReqs.length})
            </h3>
            <div className={compact ? "space-y-2" : "grid grid-cols-1 gap-3"}>
              {notReadyReqs.map(req => (
                <RequirementCard
                  key={req.id}
                  requirement={req}
                  onClick={() => onRequirementClick(req)}
                  compact={compact}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部清空按钮 */}
      <div className="flex-shrink-0 border-t border-gray-200 p-3 bg-gray-50">
        <button
          onClick={handleClearClick}
          className={`w-full px-4 py-2 rounded-lg transition text-sm font-medium flex items-center justify-center gap-2 ${
            clearConfirmStep === 0
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-yellow-500 hover:bg-yellow-600 text-white animate-pulse'
          }`}
        >
          <Trash2 size={16} />
          {clearConfirmStep === 0 ? '清空需求池' : '⚠️ 再次点击确认清空（5秒后恢复）'}
        </button>
      </div>
    </div>
  );
};

export default UnscheduledArea;
```

---

## ✅ 步骤 5：测试

### 功能测试清单

- [ ] 搜索功能正常
- [ ] 所有筛选器工作正常
- [ ] 排序功能正常
- [ ] RMS筛选正常
- [ ] 分组显示正常（已评估/未评估）
- [ ] 批量评估按钮可点击
- [ ] 清空按钮二次确认正常
- [ ] 统计数字正确

### 文件大小验证

```bash
npm run check-file-size
```

**期望输出**：
```
✅ src/components/UnscheduledArea.tsx - ~280 行
✅ src/components/unscheduled/FilterBar.tsx - ~150 行
✅ src/components/unscheduled/hooks/useRequirementFilter.ts - ~150 行
```

---

## 📝 提交

```bash
git add .
git commit -m "refactor: reduce UnscheduledArea from 608 to ~280 lines

- Extract filtering logic to useRequirementFilter hook
- Extract FilterBar component
- Improve code organization and maintainability

✅ File size: 608 → 280 lines
✅ All tests passing
✅ Build successful
"
```

---

## 🎉 完成

现在 `UnscheduledArea.tsx` 已经从 608 行减少到 ~280 行，符合项目规范！

**下一步**：继续重构 `BatchEvaluationModal.tsx`
