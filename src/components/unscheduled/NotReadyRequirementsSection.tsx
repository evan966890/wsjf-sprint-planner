/**
 * 未评估需求展示区组件
 *
 * 功能：
 * - 展示未完成技术评估的不可排期需求
 * - 支持气泡和列表两种视图模式
 * - 显示"未完成技术评估"分割线标题
 */

import type { Requirement } from '../../types';
import RequirementCard from '../RequirementCard';
import { Trash2 } from 'lucide-react';

interface NotReadyRequirementsSectionProps{
  requirements: Requirement[];
  viewMode: 'bubble' | 'list';
  compact: boolean;
  onRequirementClick: (req: Requirement) => void;
  onRequirementDelete?: (reqId: string) => void;
}

export function NotReadyRequirementsSection({
  requirements,
  viewMode,
  compact,
  onRequirementClick,
  onRequirementDelete,
}: NotReadyRequirementsSectionProps) {
  if (requirements.length === 0) {
    return null;
  }

  if (viewMode === 'bubble') {
    return (
      <>
        {/* 分割线 */}
        <div className="px-3 py-2">
          <div className="border-t border-gray-300 relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 text-xs text-gray-500 rounded-full border border-gray-300 whitespace-nowrap">
              未完成技术评估（不可排期）
            </div>
          </div>
        </div>

        {/* 气泡视图 */}
        <div className="px-3 pb-3 bg-gray-100" style={{ display: 'block' }}>
          <div className="flex flex-wrap gap-2 opacity-60 pt-1.5" style={{ alignContent: 'start', alignItems: 'start' }}>
            {requirements.map(req => (
              <RequirementCard
                key={req.id}
                requirement={req}
                compact={compact}
                onClick={() => onRequirementClick(req)}
                onDelete={onRequirementDelete}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  // 列表视图
  return (
    <>
      {/* 分割线 */}
      <div className="px-3 py-2">
        <div className="border-t border-gray-300 relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 text-xs text-gray-500 rounded-full border border-gray-300 whitespace-nowrap">
            未完成技术评估（不可排期）
          </div>
        </div>
      </div>

      {/* 列表视图 */}
      <div className="px-3 pb-3 bg-gray-100">
        <div className="overflow-auto border border-gray-200 rounded-lg opacity-60" style={{ maxHeight: '300px' }}>
          <table className="text-xs border-collapse w-full">
            <thead className="bg-gray-200 sticky top-0 z-10">
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
                  onClick={() => onRequirementClick(req)}
                  className="hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.name}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">
                    <span className="text-gray-400">-</span>
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">
                    <span className="text-gray-400">-</span>
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
                  <td className="border border-gray-300 px-2 py-1.5 text-right whitespace-nowrap">未评估</td>
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
    </>
  );
}
