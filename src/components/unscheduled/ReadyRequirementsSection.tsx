/**
 * 已评估需求展示区组件
 *
 * 功能：
 * - 展示已完成技术评估的可排期需求
 * - 支持气泡和列表两种视图模式
 * - 支持拖拽需求到迭代池
 */

import type { Requirement } from '../../types';
import RequirementCard from '../RequirementCard';
import { roundNumber } from '../../utils/scoring';
import { Trash2 } from 'lucide-react';

interface ReadyRequirementsSectionProps {
  requirements: Requirement[];
  viewMode: 'bubble' | 'list';
  compact: boolean;
  onRequirementClick: (req: Requirement) => void;
  onRequirementDelete?: (reqId: string) => void;
}

export function ReadyRequirementsSection({
  requirements,
  viewMode,
  compact,
  onRequirementClick,
  onRequirementDelete,
}: ReadyRequirementsSectionProps) {
  if (viewMode === 'bubble') {
    return (
      <div className="p-3 pb-2" style={{ display: 'block' }}>
        <div className="flex flex-wrap gap-2" style={{ alignContent: 'start', alignItems: 'start' }}>
          {requirements.map(req => (
            <RequirementCard
              key={req.id}
              requirement={req}
              compact={compact}
              onDragStart={(e) => {
                e.dataTransfer.setData('requirementId', req.id);
                e.dataTransfer.setData('sourcePoolId', 'unscheduled');
              }}
              onClick={() => onRequirementClick(req)}
              onDelete={onRequirementDelete}
            />
          ))}
        </div>
      </div>
    );
  }

  // 列表视图
  return (
    <div className="p-3">
      <div className="border border-gray-200 rounded-lg">
        <table className="text-xs border-collapse w-full">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">需求名称</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">权重分</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">星级</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">业务影响</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">技术复杂度</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">业务域</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">业务子域</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">迫切程度</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">强制截止</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">工作量</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">提交方</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">RMS</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">技术评估</th>
              {onRequirementDelete && (
                <th className="border border-gray-300 px-2 py-1.5 text-center font-semibold whitespace-nowrap">操作</th>
              )}
            </tr>
          </thead>
          <tbody>
            {requirements.map(req => (
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
                  <span className="text-yellow-500" style={{ letterSpacing: '0.1em' }}>{'★'.repeat(req.stars || 0)}</span>
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-center">{req.businessImpactScore || '-'}</td>
                <td className="border border-gray-300 px-2 py-1.5 text-center">
                  {req.complexityScore && req.complexityScore > 0 ? (
                    <span className={`font-medium ${req.complexityScore >= 8 ? 'text-red-600' : req.complexityScore >= 5 ? 'text-orange-600' : 'text-green-600'}`}>
                      {req.complexityScore}
                    </span>
                  ) : '-'}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.businessDomain || '国际零售通用'}</td>
                <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.businessSubDomain || '-'}</td>
                <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.tc}</td>
                <td className="border border-gray-300 px-2 py-1.5 text-center">{req.hardDeadline ? '有' : '无'}</td>
                <td className="border border-gray-300 px-2 py-1.5 text-right whitespace-nowrap">{roundNumber(req.effortDays, 1)}天</td>
                <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.submitter || '-'}</td>
                <td className="border border-gray-300 px-2 py-1.5 text-center">
                  {req.isRMS ? <span className="text-purple-600 font-semibold">✓</span> : '-'}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.techProgress}</td>
                {onRequirementDelete && (
                  <td className="border border-gray-300 px-2 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`确定要删除需求"${req.name}"吗？`)) {
                          onRequirementDelete(req.id);
                        }
                      }}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                      title="删除需求"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
