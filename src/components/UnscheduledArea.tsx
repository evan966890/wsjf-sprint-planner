import { useState, useMemo } from 'react';
import { Plus, Search, Filter, Trash2, ArrowUpDown, Sparkles } from 'lucide-react';
import type { Requirement } from '../types';
import { roundNumber } from '../utils/scoring';
import RequirementCard from './RequirementCard';

// ============================================================================
// UI组件 - 待排期区 (Unscheduled Area Component)
// ============================================================================

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
 * 筛选维度：
 * - 搜索：需求名称、提交人、产品经理、研发负责人
 * - 需求类型：功能开发、Bug修复、技术债务等
 * - 热度分：高(≥70)、中(40-69)、低(<40)
 * - 工作量：微小(≤3)、小(4-10)、中(11-30)、大(31-60)、超大(61-100)、巨大(>100)
 * - 业务价值：局部、明显、撬动核心、战略平台
 * - RMS重构：是/否
 *
 * 排序方式：
 * - 热度分（默认降序）
 * - 业务价值
 * - 提交日期
 * - 工作量
 */
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
  leftPanelWidth,
  onClearAll
}: {
  unscheduled: Requirement[];
  onRequirementClick: (req: Requirement) => void;
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
  rmsFilter: boolean;
  onRMSFilterChange: (filter: boolean) => void;
  leftPanelWidth: number;
  onClearAll: () => void;
}) => {
  // 组件状态
  const [showFilters, setShowFilters] = useState(false);                              // 是否展开筛选器
  const [sortBy, setSortBy] = useState<'score' | 'bv' | 'submitDate' | 'effort'>('score'); // 排序字段
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');                // 排序方向（默认降序）
  const [viewMode, setViewMode] = useState<'bubble' | 'list'>('bubble');             // 视图模式：气泡或列表

  /**
   * 提取所有自定义业务域（用于动态显示筛选选项）
   */
  const customBusinessDomains = useMemo(() => {
    const domains = new Set<string>();
    unscheduled.forEach(req => {
      if (req.businessDomain === '自定义' && req.customBusinessDomain) {
        domains.add(req.customBusinessDomain);
      }
    });
    return Array.from(domains).sort();
  }, [unscheduled]);

  /**
   * 处理拖拽悬停事件
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  /**
   * 处理拖拽放置事件
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop();
  };

  /**
   * 多维度筛选逻辑
   * 健壮性：使用可选链和默认值确保不会因为空值报错
   */
  const filteredReqs = (Array.isArray(unscheduled) ? unscheduled : []).filter(req => {
    // 搜索匹配：需求名称、提交人、产品经理、研发负责人
    const matchesSearch = (req?.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (req?.submitterName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (req?.productManager || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (req?.developer || '').toLowerCase().includes((searchTerm || '').toLowerCase());

    // 类型匹配
    const matchesType = filterType === 'all' || req?.type === filterType;

    // 热度分匹配
    let matchesScore = true;
    const displayScore = Number(req?.displayScore) || 0;
    if (scoreFilter === 'high') matchesScore = displayScore >= 70;
    else if (scoreFilter === 'medium') matchesScore = displayScore >= 40 && displayScore < 70;
    else if (scoreFilter === 'low') matchesScore = displayScore < 40;

    // 工作量匹配
    let matchesEffort = true;
    const effortDays = Number(req?.effortDays) || 0;
    if (effortFilter === 'tiny') matchesEffort = effortDays <= 3;
    else if (effortFilter === 'small') matchesEffort = effortDays >= 4 && effortDays <= 10;
    else if (effortFilter === 'medium') matchesEffort = effortDays >= 11 && effortDays <= 30;
    else if (effortFilter === 'large') matchesEffort = effortDays >= 31 && effortDays <= 60;
    else if (effortFilter === 'xlarge') matchesEffort = effortDays >= 61 && effortDays <= 100;
    else if (effortFilter === 'huge') matchesEffort = effortDays > 100;

    // 业务价值匹配
    const matchesBV = bvFilter === 'all' || req?.bv === bvFilter;

    // 业务域匹配（国际零售通用 = 新零售 + 渠道零售）
    let matchesBusinessDomain = true;
    if (businessDomainFilter !== 'all') {
      if (businessDomainFilter === '国际零售通用') {
        // 选择"国际零售通用"时，匹配"新零售"、"渠道零售"或"国际零售通用"
        matchesBusinessDomain = req?.businessDomain === '新零售' ||
                                req?.businessDomain === '渠道零售' ||
                                req?.businessDomain === '国际零售通用';
      } else if (['新零售', '渠道零售'].includes(businessDomainFilter)) {
        // 选择预设业务域时，精确匹配businessDomain字段
        matchesBusinessDomain = req?.businessDomain === businessDomainFilter;
      } else {
        // 选择自定义业务域时，匹配customBusinessDomain字段
        matchesBusinessDomain = req?.businessDomain === '自定义' && req?.customBusinessDomain === businessDomainFilter;
      }
    }

    // RMS筛选匹配（如果rmsFilter为true，只显示RMS项目）
    const matchesRMS = !rmsFilter || req?.isRMS;

    return matchesSearch && matchesType && matchesScore && matchesEffort && matchesBV && matchesBusinessDomain && matchesRMS;
  });

  // 应用排序
  const sortedReqs = [...filteredReqs].sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'score') {
      comparison = (b.displayScore || 0) - (a.displayScore || 0);
    } else if (sortBy === 'bv') {
      const bvOrder: Record<string, number> = { '战略平台': 4, '撬动核心': 3, '明显': 2, '局部': 1 };
      comparison = (bvOrder[b.bv || '明显'] || 0) - (bvOrder[a.bv || '明显'] || 0);
    } else if (sortBy === 'submitDate') {
      comparison = new Date(b.submitDate).getTime() - new Date(a.submitDate).getTime();
    } else if (sortBy === 'effort') {
      comparison = b.effortDays - a.effortDays;
    }

    // 根据 sortOrder 决定是否反转结果
    return sortOrder === 'desc' ? comparison : -comparison;
  });

  const readyReqs = sortedReqs.filter(r => r.techProgress === '已评估工作量' || r.techProgress === '已完成技术方案');
  const notReadyReqs = sortedReqs.filter(r => r.techProgress === '未评估');

  return (
    <div style={{ width: `${leftPanelWidth}px` }} className="bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="flex-shrink-0 p-3 border-b border-gray-200 bg-gray-900 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">待排期区</h2>
            <div className="flex items-center bg-white/10 rounded-lg overflow-hidden">
              <button
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
              onClick={onBatchEvaluate}
              className="text-white hover:bg-purple-600 bg-purple-500 rounded-lg px-2 py-1.5 transition flex items-center gap-1 text-xs font-medium"
              title="AI批量评估"
            >
              <Sparkles size={14} />
              <span>AI评估</span>
            </button>
            <button
              onClick={onAddNew}
              className="text-white hover:bg-white/10 rounded-lg p-1.5 transition"
              title="新增需求"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

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

        <div className="flex items-center gap-1.5 mb-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-1 px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:bg-white/20 focus:border-white/40 transition"
          >
            <option value="score" className="bg-gray-800 text-white">按权重分</option>
            <option value="bv" className="bg-gray-800 text-white">按业务价值</option>
            <option value="submitDate" className="bg-gray-800 text-white">按提交时间</option>
            <option value="effort" className="bg-gray-800 text-white">按工作量</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
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
            <option value="all" className="bg-gray-800 text-white">全部业务价值</option>
            <option value="局部" className="bg-gray-800 text-white">局部优化</option>
            <option value="明显" className="bg-gray-800 text-white">明显改善</option>
            <option value="撬动核心" className="bg-gray-800 text-white">撬动核心</option>
            <option value="战略平台" className="bg-gray-800 text-white">战略平台</option>
          </select>
          </div>
        )}

        <div className="mt-2 bg-white/10 rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between">
          <div>
            <span className="text-gray-300">筛选结果: </span>
            <span className="font-semibold text-white">{filteredReqs.length}</span>
          </div>
          <div>
            <span className="text-gray-300">未评估: </span>
            <span className="font-semibold text-red-300">{notReadyReqs.length}</span>
          </div>
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex-1 ${viewMode === 'bubble' ? 'overflow-y-auto' : 'overflow-hidden'} transition-all ${
          isDragOver ? 'bg-teal-50' : ''
        }`}
      >
        {viewMode === 'bubble' ? (
          <>
            {/* 气泡视图 - 可排期区 */}
            <div className="p-3 pb-2">
              <div className="flex flex-wrap gap-2 justify-start">
                {readyReqs.map(req => (
                  <RequirementCard
                    key={req.id}
                    requirement={req}
                    compact={compact}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('requirementId', req.id);
                      e.dataTransfer.setData('sourcePoolId', 'unscheduled');
                    }}
                    onClick={() => onRequirementClick(req)}
                  />
                ))}
              </div>
            </div>

            {/* 分割线 + 未评估区 */}
            {notReadyReqs.length > 0 && (
              <>
                <div className="px-3 py-2">
                  <div className="border-t border-gray-300 relative">
                    <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 text-xs text-gray-500 rounded-full border border-gray-300 whitespace-nowrap">
                      未完成技术评估（不可排期）
                    </div>
                  </div>
                </div>
                <div className="px-3 pb-3 bg-gray-100">
                  <div className="flex flex-wrap gap-2 justify-start opacity-60 pt-1.5">
                    {notReadyReqs.map(req => (
                      <RequirementCard
                        key={req.id}
                        requirement={req}
                        compact={compact}
                        onClick={() => onRequirementClick(req)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* 列表视图 - 可排期区 */}
            <div className="p-3 h-full flex flex-col">
              <div className="overflow-auto border border-gray-200 rounded-lg flex-1">
                <table className="text-xs border-collapse w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">需求名称</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">权重分</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">星级</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">业务价值</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">迫切程度</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">强制截止</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">工作量</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">提交人</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">RMS</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">技术评估</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readyReqs.map(req => (
                      <tr
                        key={req.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('requirementId', req.id);
                          e.dataTransfer.setData('sourcePoolId', 'unscheduled');
                        }}
                        onClick={() => onRequirementClick(req)}
                        className="hover:bg-gray-50 cursor-pointer transition"
                      >
                        <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.name}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center">
                          <span className="font-semibold text-teal-700">{Math.round(req.displayScore || 0)}</span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center">
                          <span className="text-yellow-500">{req.stars}</span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.bv}</td>
                        <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.tc}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center">{req.hardDeadline ? '有' : '无'}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-right whitespace-nowrap">{roundNumber(req.effortDays, 1)}天</td>
                        <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.submitter || '-'}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center">
                          {req.isRMS ? <span className="text-purple-600 font-semibold">✓</span> : '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.techProgress}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 未评估区 - 列表视图 */}
            {notReadyReqs.length > 0 && (
              <>
                <div className="px-3 py-2">
                  <div className="border-t border-gray-300 relative">
                    <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 text-xs text-gray-500 rounded-full border border-gray-300 whitespace-nowrap">
                      未完成技术评估（不可排期）
                    </div>
                  </div>
                </div>
                <div className="px-3 pb-3 bg-gray-100">
                  <div className="overflow-auto border border-gray-200 rounded-lg opacity-60" style={{ maxHeight: '300px' }}>
                    <table className="text-xs border-collapse w-full">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">需求名称</th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">权重分</th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">星级</th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">业务价值</th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">迫切程度</th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">强制截止</th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">工作量</th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">提交人</th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">RMS</th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">技术评估</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notReadyReqs.map(req => (
                          <tr
                            key={req.id}
                            onClick={() => onRequirementClick(req)}
                            className="hover:bg-gray-50 cursor-pointer transition"
                          >
                            <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.name}</td>
                            <td className="border border-gray-300 px-2 py-1.5 text-center">
                              <span className="font-semibold text-teal-700">{Math.round(req.displayScore || 0)}</span>
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5 text-center">
                              <span className="text-yellow-500">{req.stars}</span>
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.bv}</td>
                            <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.tc}</td>
                            <td className="border border-gray-300 px-2 py-1.5 text-center">{req.hardDeadline ? '有' : '无'}</td>
                            <td className="border border-gray-300 px-2 py-1.5 text-right whitespace-nowrap">{roundNumber(req.effortDays, 1)}天</td>
                            <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.submitter || '-'}</td>
                            <td className="border border-gray-300 px-2 py-1.5 text-center">
                              {req.isRMS ? <span className="text-purple-600 font-semibold">✓</span> : '-'}
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.techProgress}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* 底部清空按钮 */}
      <div className="flex-shrink-0 border-t border-gray-200 p-3 bg-gray-50">
        <button
          onClick={() => {
            if (confirm('确定要清空所有需求吗？此操作不可撤销！')) {
              onClearAll();
            }
          }}
          className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
        >
          <Trash2 size={16} />
          清空需求池
        </button>
      </div>
    </div>
  );
};

export default UnscheduledArea;
