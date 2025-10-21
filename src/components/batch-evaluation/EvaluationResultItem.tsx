/**
 * 单个评估结果项组件
 *
 * 功能：
 * - 显示需求基本信息
 * - 显示AI评分结果
 * - 对比用户评分和AI评分
 * - 应用单个评分
 */

import { CheckSquare, Square, Check } from 'lucide-react';
import type { Requirement } from '../../types';
import type { EvaluationResult } from './hooks/useBatchAIEvaluation';

interface EvaluationResultItemProps {
  requirement: Requirement;
  result?: EvaluationResult;
  isSelected: boolean;
  isResultSelected: boolean;
  onToggleSelect: () => void;
  onToggleResultSelect: () => void;
  onApplyScore: () => void;
  isEvaluating: boolean;
}

export function EvaluationResultItem({
  requirement,
  result,
  isSelected,
  isResultSelected,
  onToggleSelect,
  onToggleResultSelect,
  onApplyScore,
  isEvaluating,
}: EvaluationResultItemProps) {
  const req = requirement;
  const hasResult = !!result;
  const hasDifference = result && result.userScore && result.aiScore !== result.userScore;

  return (
    <div
      className={`border rounded-lg transition ${
        isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'
      } ${result ? 'ring-2 ring-green-200' : ''}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* 复选框（选择是否评估） */}
          <button
            onClick={onToggleSelect}
            className="flex-shrink-0 mt-1"
            disabled={isEvaluating}
          >
            {isSelected ? (
              <CheckSquare size={20} className="text-purple-600" />
            ) : (
              <Square size={20} className="text-gray-400" />
            )}
          </button>

          {/* 需求信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1">
                {/* 标题 + 业务域 */}
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-bold text-gray-900 text-base">{req.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {req.businessDomain === '自定义'
                      ? (req.customBusinessDomain || '自定义业务域')
                      : (req.businessDomain || '国际零售通用')}
                  </span>
                </div>

                {/* 权重分 + 星级 */}
                {req.displayScore && (
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-blue-600">
                      权重分 {req.displayScore}
                    </span>
                    <span className="text-yellow-500 text-base">
                      {'★'.repeat(req.stars || 0)}{'☆'.repeat(5 - (req.stars || 0))}
                    </span>
                  </div>
                )}

                {/* 小字信息 */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600 mb-2">
                  <span>提交人: {req.submitterName || '未填写'}</span>
                  <span>•</span>
                  <span>部门: {req.submitter}</span>
                  <span>•</span>
                  <span>产品经理: {req.productManager || '未分配'}</span>
                  <span>•</span>
                  <span>工作量: {req.effortDays || '-'}天</span>
                </div>

                {/* 评分和关键信息 */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg px-4 py-2.5 border border-blue-200">
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                    {/* 业务影响度评分 */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">业务影响度:</span>
                      <span className="text-lg font-bold text-blue-600">{req.businessImpactScore || '-'}</span>
                      <span className="text-gray-500">/ 10分</span>
                    </div>

                    {/* 复杂度评分 */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">技术复杂度:</span>
                      <span className="text-lg font-bold text-orange-600">{req.complexityScore || '-'}</span>
                      <span className="text-gray-500">/ 10分</span>
                    </div>

                    {/* 时间窗口 */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">时间窗口:</span>
                      <span className="font-semibold text-gray-900">{req.timeCriticality || req.tc || '随时'}</span>
                    </div>

                    {/* 强制DDL */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">强制DDL:</span>
                      {req.hardDeadline ? (
                        <span className="font-semibold text-red-600">{req.deadlineDate || '是'}</span>
                      ) : (
                        <span className="text-gray-500">无</span>
                      )}
                    </div>

                    {/* RMS重构 */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">RMS重构:</span>
                      {req.isRMS ? (
                        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded font-medium">是</span>
                      ) : (
                        <span className="text-gray-500">否</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI评分结果 */}
              {result && (
                <div className="flex-shrink-0 flex items-start gap-2">
                  {hasResult && (
                    <button
                      onClick={onToggleResultSelect}
                      className="flex-shrink-0"
                    >
                      {isResultSelected ? (
                        <CheckSquare size={18} className="text-green-600" />
                      ) : (
                        <Square size={18} className="text-gray-400" />
                      )}
                    </button>
                  )}
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 min-w-[280px] max-w-[400px]">
                    <div className="flex items-center gap-2 mb-1">
                      <Check size={14} className="text-green-600" />
                      <span className="text-xs font-semibold text-green-700">AI评分结果</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-green-600">{result.aiScore}</span>
                      <span className="text-xs text-gray-600">分</span>
                      {hasDifference && (
                        <span className="text-xs text-orange-600 font-semibold">
                          (vs 用户: {result.userScore}分)
                        </span>
                      )}
                    </div>

                    {/* AI评估理由 */}
                    <p className="text-xs text-gray-600 mb-2 leading-relaxed">{result.reasoning}</p>

                    {/* AI建议的影响范围 */}
                    {result.aiSuggestions && (
                      <div className="space-y-1 mb-2 pt-2 border-t border-green-300">
                        {result.aiSuggestions.storeTypes && result.aiSuggestions.storeTypes.length > 0 && (
                          <div className="text-xs text-gray-700">
                            <span className="font-medium">AI建议门店类型：</span>
                            <span className="text-gray-600">{result.aiSuggestions.storeTypes.join(', ')}</span>
                          </div>
                        )}
                        {result.aiSuggestions.regions && result.aiSuggestions.regions.length > 0 && (
                          <div className="text-xs text-gray-700">
                            <span className="font-medium">AI建议影响地区：</span>
                            <span className="text-gray-600">{result.aiSuggestions.regions.join(', ')}</span>
                          </div>
                        )}
                        {result.aiSuggestions.storeCountRange && (
                          <div className="text-xs text-gray-700">
                            <span className="font-medium">AI预估门店数：</span>
                            <span className="text-gray-600">{result.aiSuggestions.storeCountRange}</span>
                          </div>
                        )}
                        {result.aiSuggestions.affectedMetrics && result.aiSuggestions.affectedMetrics.length > 0 && (
                          <div className="text-xs text-gray-700 mt-1">
                            <div className="font-medium mb-1">AI预估影响指标：</div>
                            <div className="ml-2 space-y-0.5">
                              {result.aiSuggestions.affectedMetrics.map((metric, idx) => (
                                <div key={idx} className="text-gray-600">
                                  • {metric.metricName}: {metric.estimatedImpact}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={onApplyScore}
                      className="mt-2 w-full px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition"
                    >
                      应用此评分
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
