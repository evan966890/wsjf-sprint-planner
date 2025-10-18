import React from 'react';
import { Edit2, X } from 'lucide-react';
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
  onDrop,
  isDragOver,
  onEdit,
  onDelete,
  compact
}: {
  pool: SprintPool;
  onRequirementClick: (req: Requirement) => void;
  onDrop: (poolId: string) => void;
  isDragOver: boolean;
  onEdit: () => void;
  onDelete: () => void;
  compact: boolean;
}) => {
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
  const usedDays = requirements.reduce((sum, req) => sum + (Number(req?.effortDays) || 0), 0);

  // 计算使用率百分比（健壮性：避免除以0）
  const percentage = netAvailable > 0 ? Math.round((usedDays / netAvailable) * 100) : 0;

  // 计算总价值（所有需求的展示分之和）
  const totalValue = requirements.reduce((sum, req) => sum + (Number(req?.displayScore) || 0), 0);

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
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {pool.name} <span className="text-sm font-normal text-gray-300">总人日{roundNumber(pool.totalDays, 1)}（可用{roundNumber(netAvailable, 1)}+不可用{roundNumber(reservedDays, 1)}）</span>
            </h3>
            <p className="text-sm text-gray-300 mt-0.5">{pool.startDate} ~ {pool.endDate}</p>
          </div>
          <div className="flex gap-1">
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

        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-lg font-bold text-white">{roundNumber(usedDays, 1)}/{roundNumber(netAvailable, 1)}人日</span>
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
          不可用: {roundNumber(reservedDays, 1)}人日 (Bug {pool.bugReserve}% · 重构 {pool.refactorReserve}% · 其他 {pool.otherReserve}%)
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className={`p-3 h-full border-2 border-dashed rounded-lg m-2 transition-all ${
          isDragOver ? 'border-teal-400 bg-teal-50' : pool.requirements.length === 0 ? 'border-gray-200 bg-gray-50' : 'border-transparent'
        }`}>
          {pool.requirements.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 py-8">
              <div className="text-3xl mb-2">📥</div>
              <div className="text-sm font-medium">拖拽需求到这里</div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 content-start justify-center">
              {pool.requirements.map((req) => (
                <RequirementCard
                  key={req.id}
                  requirement={req}
                  compact={compact}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('requirementId', req.id);
                    e.dataTransfer.setData('sourcePoolId', pool.id);
                  }}
                  onClick={() => onRequirementClick(req)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">已排期 <span className="font-semibold text-gray-900">{pool.requirements.length}</span></span>
          <span className="text-gray-600">总权重分 <span className="font-semibold text-gray-900">{Math.round(totalValue)}</span></span>
        </div>
      </div>
    </div>
  );
};

export default SprintPoolComponent;
