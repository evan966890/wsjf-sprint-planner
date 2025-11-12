/**
 * 待排期区组件
 *
 * 功能说明：
 * - 展示所有未排期的需求列表
 * - 支持多维度筛选和搜索
 * - 支持自定义排序
 * - 支持拖拽需求到迭代池
 * - 支持气泡和列表两种视图模式
 *
 * 架构说明：
 * - 使用 useRequirementFilter Hook 处理筛选、排序、分组逻辑
 * - 使用 FilterBar 组件处理筛选UI
 * - 使用 ReadyRequirementsSection 显示已评估需求
 * - 使用 NotReadyRequirementsSection 显示未评估需求
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import type { Requirement } from '../types';
import { useRequirementFilter } from './unscheduled/hooks/useRequirementFilter';
import { FilterBar } from './unscheduled/FilterBar';
import { ReadyRequirementsSection } from './unscheduled/ReadyRequirementsSection';
import { NotReadyRequirementsSection } from './unscheduled/NotReadyRequirementsSection';
import { getSubDomainsByDomain } from '../config/businessFields';

interface UnscheduledAreaProps {
  unscheduled: Requirement[];
  onRequirementClick: (req: Requirement) => void;
  onRequirementDelete?: (reqId: string) => void;
  onDrop: () => void;
  isDragOver: boolean;
  onAddNew: () => void;
  onBatchEvaluate: () => void;
  compact: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterType: string;
  onFilterChange: (type: string) => void;
  scoreFilter: string;
  onScoreFilterChange: (filter: string) => void;
  effortFilter: string;
  onEffortFilterChange: (filter: string) => void;
  bvFilter: string;
  onBVFilterChange: (filter: string) => void;
  businessDomainFilter: string;
  onBusinessDomainFilterChange: (filter: string) => void;
  businessSubDomainFilter: string;
  onBusinessSubDomainFilterChange: (filter: string) => void;
  rmsFilter: boolean;
  onRMSFilterChange: (filter: boolean) => void;
  leftPanelWidth: number;
  onClearAll: () => void;
}

const UnscheduledArea = ({
  unscheduled,
  onRequirementClick,
  onRequirementDelete,
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
  businessSubDomainFilter,
  onBusinessSubDomainFilterChange,
  rmsFilter,
  onRMSFilterChange,
  leftPanelWidth,
  onClearAll
}: UnscheduledAreaProps) => {
  // ============================================================================
  // 组件状态
  // ============================================================================

  const [sortBy, setSortBy] = useState<'score' | 'bv' | 'submitDate' | 'effort'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'bubble' | 'list'>('bubble');
  const [clearConfirmStep, setClearConfirmStep] = useState<0 | 1>(0);
  const clearTimeoutRef = useRef<number | null>(null);

  // ============================================================================
  // 筛选和排序逻辑（使用自定义Hook）
  // ============================================================================

  const { readyReqs, notReadyReqs } = useRequirementFilter(unscheduled, {
    searchTerm,
    filterType,
    scoreFilter,
    effortFilter,
    bvFilter,
    businessDomainFilter,
    businessSubDomainFilter,
    rmsFilter,
    sortBy,
    sortOrder,
  });

  // ============================================================================
  // 根据选择的业务域获取可用的业务子域
  // ============================================================================

  const availableSubDomains = useMemo(() => {
    if (businessDomainFilter === 'all') {
      return [];
    }
    return getSubDomainsByDomain(businessDomainFilter);
  }, [businessDomainFilter]);

  // ============================================================================
  // 事件处理
  // ============================================================================

  /**
   * 组件卸载时清理倒计时
   */
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  /**
   * 处理清空按钮点击（二次确认机制）
   */
  const handleClearClick = () => {
    if (clearConfirmStep === 0) {
      setClearConfirmStep(1);
      clearTimeoutRef.current = setTimeout(() => {
        setClearConfirmStep(0);
      }, 5000) as unknown as number;
    } else {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
      setClearConfirmStep(0);
      onClearAll();
    }
  };

  /**
   * 处理拖拽悬停
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  /**
   * 处理拖拽放置
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop();
  };

  // ============================================================================
  // 渲染
  // ============================================================================

  return (
    <div style={{ width: `${leftPanelWidth}px` }} className="bg-white border-r border-gray-200 flex flex-col h-full">
      {/* 头部区域 */}
      <div className="flex-shrink-0 p-3 border-b border-gray-200 bg-gray-900 text-white">
        {/* 标题栏 + 视图切换 + 操作按钮 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">待排期区</h2>
            <div className="flex items-center bg-white/10 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('bubble')}
                className={`px-2 py-1 text-xs transition ${
                  viewMode === 'bubble'
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                气泡
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-2 py-1 text-xs transition ${
                  viewMode === 'list'
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                列表
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBatchEvaluate}
              className="text-white hover:bg-purple-600 bg-purple-500 rounded-lg px-2 py-1.5 transition flex items-center gap-1 text-xs font-medium"
              title="AI批量评估"
              data-testid="ai-batch-evaluate-btn"
            >
              <Sparkles size={14} />
              <span>AI评估</span>
            </button>
            <button
              type="button"
              onClick={onAddNew}
              className="text-white hover:bg-white/10 rounded-lg p-1.5 transition"
              title="新增需求"
              data-testid="add-requirement-btn"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* 筛选栏组件 */}
        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          businessDomainFilter={businessDomainFilter}
          onBusinessDomainFilterChange={onBusinessDomainFilterChange}
          businessSubDomainFilter={businessSubDomainFilter}
          onBusinessSubDomainFilterChange={onBusinessSubDomainFilterChange}
          availableSubDomains={availableSubDomains}
          rmsFilter={rmsFilter}
          onRMSFilterChange={onRMSFilterChange}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          filterType={filterType}
          onFilterChange={onFilterChange}
          scoreFilter={scoreFilter}
          onScoreFilterChange={onScoreFilterChange}
          effortFilter={effortFilter}
          onEffortFilterChange={onEffortFilterChange}
          bvFilter={bvFilter}
          onBVFilterChange={onBVFilterChange}
          filteredCount={readyReqs.length + notReadyReqs.length}
          notReadyCount={notReadyReqs.length}
        />
      </div>

      {/* 主内容区域 */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex-1 overflow-y-auto transition-all ${
          isDragOver ? 'bg-teal-50' : ''
        }`}
      >
        {/* 已评估需求区 */}
        <ReadyRequirementsSection
          requirements={readyReqs}
          viewMode={viewMode}
          compact={compact}
          onRequirementClick={onRequirementClick}
          onRequirementDelete={onRequirementDelete}
        />

        {/* 未评估需求区 */}
        <NotReadyRequirementsSection
          requirements={notReadyReqs}
          viewMode={viewMode}
          compact={compact}
          onRequirementClick={onRequirementClick}
          onRequirementDelete={onRequirementDelete}
        />
      </div>

      {/* 底部清空按钮 */}
      <div className="flex-shrink-0 border-t border-gray-200 p-3 bg-gray-50">
        <button
          type="button"
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
