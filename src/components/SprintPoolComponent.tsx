import React, { useState, useMemo } from 'react';
import { Edit2, X, Filter } from 'lucide-react';
import type { SprintPool, Requirement } from '../types';
import { roundNumber } from '../utils/scoring';
import RequirementCard from './RequirementCard';

// ============================================================================
// UI组件 - 迭代池 (Sprint Pool Component)
// ============================================================================

/**
 * 迭代池组件
 *
 * 功能说明：
 * - 展示单个迭代池的完整信息
 * - 支持拖拽放置需求（HTML5 Drag & Drop API）
 * - 实时计算资源使用情况和超载警告
 * - 显示已排期需求列表
 *
 * 资源计算：
 * - 净可用 = 总人天 - 预留人天
 * - 已用 = 所有需求工作量之和
 * - 使用率 = 已用 / 净可用 × 100%
 *
 * 视觉反馈：
 * - 使用率 ≥100%: 红色边框（超载）
 * - 使用率 ≥90%: 黄色边框（接近满载）
 * - 拖拽悬停: 青色高亮
 *
 * @param pool - 迭代池对象
 * @param onRequirementClick - 需求点击回调
 * @param onDrop - 拖拽放置回调
 * @param isDragOver - 是否正在拖拽悬停
 * @param onEdit - 编辑迭代池回调
 * @param onDelete - 删除迭代池回调
 * @param compact - 紧凑模式
 */
const SprintPoolComponent = ({
  pool,
  onRequirementClick,
  onRequirementDelete,
  onDrop,
  isDragOver,
  onEdit,
  onDelete,
  compact
}: {
  pool: SprintPool;
  onRequirementClick: (req: Requirement) => void;
  onRequirementDelete?: (reqId: string) => void;
  onDrop: (poolId: string) => void;
  isDragOver: boolean;
  onEdit: () => void;
  onDelete: () => void;
  compact: boolean;
}) => {
  // 筛选状态
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [effortFilter, setEffortFilter] = useState<string>('all');
  const [bvFilter, setBvFilter] = useState<string>('all');
  const [businessDomainFilter, setBusinessDomainFilter] = useState<string>('all');
  const [rmsFilter, setRmsFilter] = useState<boolean>(false);

  // 健壮性检查：确保所有百分比和数值有效
  const bugReserve = Math.max(0, Number(pool.bugReserve) || 0);
  const refactorReserve = Math.max(0, Number(pool.refactorReserve) || 0);
  const otherReserve = Math.max(0, Number(pool.otherReserve) || 0);
  const totalDays = Math.max(0, Number(pool.totalDays) || 0);

  // 计算资源分配
  const totalReserve = bugReserve + refactorReserve + otherReserve;
  const reservedDays = Math.round(totalDays * totalReserve / 100);
  const netAvailable = totalDays - reservedDays;

  // 计算已用人天（健壮性：确保requirements是数组）
  const requirements = Array.isArray(pool.requirements) ? pool.requirements : [];

  // 提取所有自定义业务域（用于动态显示筛选选项）
  // v1.3.2：兼容旧数据，businessDomain可能包含任意值
  const customBusinessDomains = useMemo(() => {
    const domains = new Set<string>();
    const presetDomains = ['新零售', '渠道零售', '国际零售通用', '自定义', 'all'];

    requirements.forEach(req => {
      if (req.businessDomain === '自定义' && req.customBusinessDomain) {
        // 新数据：自定义业务域
        domains.add(req.customBusinessDomain);
      } else if (req.businessDomain && !presetDomains.includes(req.businessDomain)) {
        // 旧数据：businessDomain直接包含具体值
        domains.add(req.businessDomain);
      }
    });
    return Array.from(domains).sort();
  }, [requirements]);

  // 多维度筛选逻辑
  const filteredReqs = requirements.filter(req => {
    // 类型匹配
    const reqType = req?.type?.trim() || '功能开发';
    const matchesType = filterType === 'all' || reqType === filterType;

    // 权重分匹配
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

    // 业务影响度匹配
    let matchesBV = true;
    if (bvFilter !== 'all') {
      const score = req?.businessImpactScore;
      if (score) {
        if (bvFilter === '战略平台') matchesBV = score === 10;
        else if (bvFilter === '撬动核心') matchesBV = score >= 8 && score <= 9;
        else if (bvFilter === '明显') matchesBV = score >= 5 && score <= 7;
        else if (bvFilter === '局部') matchesBV = score >= 1 && score <= 4;
      } else {
        matchesBV = req?.bv === bvFilter;
      }
    }

    // 业务域匹配（国际零售通用 = 新零售 + 渠道零售 + 空业务域）
    // v1.3.2：兼容旧数据，businessDomain可能包含任意值或为空
    let matchesBusinessDomain = true;
    if (businessDomainFilter !== 'all') {
      const reqDomain = req?.businessDomain || '';
      const reqCustomDomain = req?.customBusinessDomain || '';

      if (businessDomainFilter === '国际零售通用') {
        // 选择"国际零售通用"时，匹配"新零售"、"渠道零售"、"国际零售通用"或空业务域（默认）
        matchesBusinessDomain = reqDomain === '新零售' ||
                                reqDomain === '渠道零售' ||
                                reqDomain === '国际零售通用' ||
                                (!reqDomain && !reqCustomDomain); // 空业务域默认归为"国际零售通用"
      } else if (['新零售', '渠道零售'].includes(businessDomainFilter)) {
        matchesBusinessDomain = reqDomain === businessDomainFilter;
      } else {
        // 选择自定义业务域时：
        // 1. 新数据：businessDomain='自定义' && customBusinessDomain匹配
        // 2. 旧数据：businessDomain直接匹配（兼容性）
        matchesBusinessDomain = (reqDomain === '自定义' && reqCustomDomain === businessDomainFilter) ||
                                (reqDomain === businessDomainFilter);
      }
    }

    // RMS筛选匹配
    const matchesRMS = !rmsFilter || req?.isRMS;

    return matchesType && matchesScore && matchesEffort && matchesBV && matchesBusinessDomain && matchesRMS;
  });

  const usedDays = filteredReqs.reduce((sum, req) => sum + (Number(req?.effortDays) || 0), 0);

  // 计算使用率百分比（健壮性：避免除以0）
  const percentage = netAvailable > 0 ? Math.round((usedDays / netAvailable) * 100) : 0;

  // 计算总价值（所有需求的展示分之和）
  const totalValue = filteredReqs.reduce((sum, req) => sum + (Number(req?.displayScore) || 0), 0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(pool.id);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`w-full h-full bg-white rounded-xl border transition-all flex flex-col ${
        isDragOver ? 'border-teal-500 bg-teal-50/50 shadow-xl' : 'border-gray-200 shadow-sm'
      } ${percentage >= 100 ? 'ring-2 ring-red-500' : percentage >= 90 ? 'ring-2 ring-amber-400' : ''}`}
    >
      <div className="flex-shrink-0 p-3 border-b border-gray-200 bg-gray-900 text-white rounded-t-xl">
        <div className="mb-2">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-lg flex-1 min-w-0">
              {pool.name} <span className="text-sm font-normal text-gray-300">(总{roundNumber(pool.totalDays, 1)}天)</span>
            </h3>
            <div className="flex gap-1 flex-shrink-0 ml-2">
              <button
                onClick={onEdit}
                className="text-gray-300 hover:text-white hover:bg-white/10 rounded-lg p-2 transition"
                title="编辑迭代池"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={onDelete}
                className="text-gray-300 hover:text-red-400 hover:bg-white/10 rounded-lg p-2 transition"
                title="删除迭代池"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm text-gray-300">
              📅 {pool.startDate} ~ {pool.endDate}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={businessDomainFilter}
                onChange={(e) => setBusinessDomainFilter(e.target.value)}
                className="px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:bg-white/20 focus:border-white/40 transition whitespace-nowrap"
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
                  onChange={(e) => setRmsFilter(e.target.checked)}
                  className="w-3.5 h-3.5 rounded cursor-pointer"
                />
                <span className="text-xs text-white">RMS</span>
              </label>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex-shrink-0 px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition"
                title="筛选条件"
              >
                <Filter size={14} />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="space-y-1.5 mb-2 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-300 flex-shrink-0" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
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
              onChange={(e) => setScoreFilter(e.target.value)}
              className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:bg-white/20 focus:border-white/40 transition"
            >
              <option value="all" className="bg-gray-800 text-white">全部权重</option>
              <option value="high" className="bg-gray-800 text-white">高权重 (≥70)</option>
              <option value="medium" className="bg-gray-800 text-white">中权重 (40-69)</option>
              <option value="low" className="bg-gray-800 text-white">低权重 (&lt;40)</option>
            </select>

            <select
              value={effortFilter}
              onChange={(e) => setEffortFilter(e.target.value)}
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
              onChange={(e) => setBvFilter(e.target.value)}
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

        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-sm font-medium text-white">已用 <span className="text-lg font-bold">{roundNumber(usedDays, 1)}</span> / 可用 <span className="text-lg font-bold">{roundNumber(netAvailable, 1)}</span> 天</span>
            <span className={`text-base font-bold ${percentage >= 100 ? 'text-red-400' : percentage >= 90 ? 'text-amber-400' : 'text-teal-400'}`}>
              {percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                percentage >= 100 ? 'bg-red-500' :
                percentage >= 90 ? 'bg-amber-500' :
                'bg-teal-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-1.5 text-xs text-gray-400 bg-white/5 rounded-lg px-2 py-1">
          不可用: {roundNumber(reservedDays, 1)}天 (Bug {pool.bugReserve}% · 重构 {pool.refactorReserve}% · 其他 {pool.otherReserve}%)
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className={`p-3 h-full border-2 border-dashed rounded-lg m-2 transition-all ${
          isDragOver ? 'border-teal-400 bg-teal-50' : filteredReqs.length === 0 ? 'border-gray-200 bg-gray-50' : 'border-transparent'
        }`}>
          {filteredReqs.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 py-8">
              <div className="text-3xl mb-2">📥</div>
              <div className="text-sm font-medium">
                {requirements.length === 0 ? '拖拽需求到这里' : '没有匹配的需求'}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 content-start justify-center">
              {filteredReqs.map((req) => (
                <RequirementCard
                  key={req.id}
                  requirement={req}
                  compact={compact}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('requirementId', req.id);
                    e.dataTransfer.setData('sourcePoolId', pool.id);
                  }}
                  onClick={() => onRequirementClick(req)}
                  onDelete={onRequirementDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            已排期 <span className="font-semibold text-gray-900">{requirements.length}</span>
            {filteredReqs.length !== requirements.length && (
              <span className="text-gray-500"> (筛选后 {filteredReqs.length})</span>
            )}
          </span>
          <span className="text-gray-600">总权重分 <span className="font-semibold text-gray-900">{Math.round(totalValue)}</span></span>
        </div>
      </div>
    </div>
  );
};

export default SprintPoolComponent;
