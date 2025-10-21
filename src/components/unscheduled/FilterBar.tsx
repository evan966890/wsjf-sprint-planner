/**
 * 待排期区筛选栏组件
 *
 * 功能：
 * - 搜索框（需求名称、提交人、PM、研发负责人）
 * - 业务域筛选（支持自定义业务域）
 * - RMS筛选复选框
 * - 排序控件（权重分、业务影响度、提交时间、工作量）
 * - 升序/降序切换
 * - 筛选器折叠展开（类型、权重分、工作量、业务影响度）
 * - 筛选结果统计（总数、未评估数）
 */

import { useState } from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface FilterBarProps {
  // 搜索相关
  searchTerm: string;
  onSearchChange: (term: string) => void;

  // 业务域筛选
  businessDomainFilter: string;
  onBusinessDomainFilterChange: (domain: string) => void;
  customBusinessDomains: string[];

  // RMS筛选
  rmsFilter: boolean;
  onRMSFilterChange: (filter: boolean) => void;

  // 排序相关
  sortBy: 'score' | 'bv' | 'submitDate' | 'effort';
  onSortByChange: (sortBy: 'score' | 'bv' | 'submitDate' | 'effort') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;

  // 筛选器
  filterType: string;
  onFilterChange: (type: string) => void;
  scoreFilter: string;
  onScoreFilterChange: (filter: string) => void;
  effortFilter: string;
  onEffortFilterChange: (filter: string) => void;
  bvFilter: string;
  onBVFilterChange: (filter: string) => void;

  // 统计信息
  filteredCount: number;
  notReadyCount: number;
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  businessDomainFilter,
  onBusinessDomainFilterChange,
  customBusinessDomains,
  rmsFilter,
  onRMSFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  filterType,
  onFilterChange,
  scoreFilter,
  onScoreFilterChange,
  effortFilter,
  onEffortFilterChange,
  bvFilter,
  onBVFilterChange,
  filteredCount,
  notReadyCount,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <>
      {/* 搜索栏 + 业务域 + RMS */}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="搜索需求..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:bg-white/20 focus:border-white/40 transition text-xs"
          />
        </div>
        <select
          value={businessDomainFilter}
          onChange={(e) => onBusinessDomainFilterChange(e.target.value)}
          className="px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:bg-white/20 focus:border-white/40 transition whitespace-nowrap"
        >
          <option value="all" className="text-gray-900">全部业务域</option>
          <option value="新零售" className="text-gray-900">新零售</option>
          <option value="渠道零售" className="text-gray-900">渠道零售</option>
          <option value="国际零售通用" className="text-gray-900">国际零售通用</option>
          {customBusinessDomains.map(domain => (
            <option key={domain} value={domain} className="text-gray-900">{domain}</option>
          ))}
        </select>
        <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={rmsFilter}
            onChange={(e) => onRMSFilterChange(e.target.checked)}
            className="w-3.5 h-3.5 rounded cursor-pointer"
          />
          <span className="text-xs text-white">RMS</span>
        </label>
      </div>

      {/* 排序控件 */}
      <div className="flex items-center gap-1.5 mb-2">
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as any)}
          className="flex-1 px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:bg-white/20 focus:border-white/40 transition"
        >
          <option value="score" className="bg-gray-800 text-white">按权重分</option>
          <option value="bv" className="bg-gray-800 text-white">按业务影响度</option>
          <option value="submitDate" className="bg-gray-800 text-white">按提交时间</option>
          <option value="effort" className="bg-gray-800 text-white">按工作量</option>
        </select>
        <button
          onClick={() => onSortOrderChange(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="flex-shrink-0 px-2 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition"
          title={sortOrder === 'desc' ? '降序' : '升序'}
        >
          <ArrowUpDown size={14} />
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex-shrink-0 px-2 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition"
          title="筛选条件"
        >
          <Filter size={14} />
        </button>
      </div>

      {/* 折叠筛选器 */}
      {showFilters && (
        <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-300 flex-shrink-0" />
            <select
              value={filterType}
              onChange={(e) => onFilterChange(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:bg-white/20 focus:border-white/40 transition"
            >
              <option value="all" className="bg-gray-800 text-white">全部类型</option>
              <option value="功能开发" className="bg-gray-800 text-white">功能开发</option>
              <option value="技术债" className="bg-gray-800 text-white">技术债</option>
              <option value="Bug修复" className="bg-gray-800 text-white">Bug修复</option>
            </select>
          </div>

          <select
            value={scoreFilter}
            onChange={(e) => onScoreFilterChange(e.target.value)}
            className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:bg-white/20 focus:border-white/40 transition"
          >
            <option value="all" className="bg-gray-800 text-white">全部权重</option>
            <option value="high" className="bg-gray-800 text-white">高权重 (≥70)</option>
            <option value="medium" className="bg-gray-800 text-white">中权重 (40-69)</option>
            <option value="low" className="bg-gray-800 text-white">低权重 (&lt;40)</option>
          </select>

          <select
            value={effortFilter}
            onChange={(e) => onEffortFilterChange(e.target.value)}
            className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:bg-white/20 focus:border-white/40 transition"
          >
            <option value="all" className="bg-gray-800 text-white">全部工作量</option>
            <option value="tiny" className="bg-gray-800 text-white">微小 (≤3天)</option>
            <option value="small" className="bg-gray-800 text-white">小 (4-10天)</option>
            <option value="medium" className="bg-gray-800 text-white">中 (11-30天)</option>
            <option value="large" className="bg-gray-800 text-white">大 (31-60天)</option>
            <option value="xlarge" className="bg-gray-800 text-white">超大 (61-100天)</option>
            <option value="huge" className="bg-gray-800 text-white">巨型 (&gt;100天)</option>
          </select>

          <select
            value={bvFilter}
            onChange={(e) => onBVFilterChange(e.target.value)}
            className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:bg-white/20 focus:border-white/40 transition"
          >
            <option value="all" className="bg-gray-800 text-white">全部业务影响度</option>
            <option value="战略平台" className="bg-blue-900 text-white font-medium">■ 战略平台 (10分)</option>
            <option value="撬动核心" className="bg-blue-700 text-white font-medium">■ 撬动核心 (8-9分)</option>
            <option value="明显" className="bg-blue-500 text-white font-medium">■ 明显 (5-7分)</option>
            <option value="局部" className="bg-blue-200 text-gray-800 font-medium">■ 局部 (1-4分)</option>
          </select>
        </div>
      )}

      {/* 筛选结果统计 */}
      <div className="mt-2 bg-white/10 rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between">
        <div>
          <span className="text-gray-300">筛选结果: </span>
          <span className="font-semibold text-white">{filteredCount}</span>
        </div>
        <div>
          <span className="text-gray-300">未评估: </span>
          <span className="font-semibold text-red-300">{notReadyCount}</span>
        </div>
      </div>
    </>
  );
}
