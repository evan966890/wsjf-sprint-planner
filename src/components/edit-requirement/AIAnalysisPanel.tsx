/**
 * AI 分析结果面板组件
 */

import { X } from 'lucide-react';
import type { AIAnalysisResult, Requirement, AffectedMetric } from '../../types';
import type { AIAdoptionStatus } from './hooks/useAIAnalysis';

interface AIAnalysisPanelProps {
  analysisResult: AIAnalysisResult;
  adoptionStatus: AIAdoptionStatus;
  adoptedItems: { score: boolean; okrMetrics: boolean; processMetrics: boolean };
  currentForm: Requirement;
  onAdoptAll: (form: Requirement, onUpdate: (updates: Partial<Requirement>) => void) => void;
  onAdoptScoreOnly: (onUpdate: (updates: Partial<Requirement>) => void) => void;
  onAdoptOKRMetrics: (currentMetrics: AffectedMetric[], onUpdate: (updates: Partial<Requirement>) => void) => void;
  onAdoptProcessMetrics: (currentMetrics: AffectedMetric[], onUpdate: (updates: Partial<Requirement>) => void) => void;
  onIgnore: () => void;
  onReanalyze: () => void;
  onClose: () => void;
  onUpdateFields: (updates: Partial<Requirement>) => void;
}

export const AIAnalysisPanel = ({
  analysisResult,
  adoptionStatus,
  adoptedItems,
  currentForm,
  onAdoptAll,
  onAdoptScoreOnly,
  onAdoptOKRMetrics,
  onAdoptProcessMetrics,
  onIgnore,
  onReanalyze,
  onClose,
  onUpdateFields
}: AIAnalysisPanelProps) => {
  return (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h5 className="font-semibold text-gray-800">AI 建议</h5>
        <div className="flex items-center gap-2">
          {adoptionStatus === 'adopted' && (
            <span className="text-xs text-green-600 font-medium">✓ 已采纳</span>
          )}
          {adoptionStatus === 'partial' && (
            <span className="text-xs text-blue-600 font-medium">部分采纳</span>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">建议评分：</span>
          <span className="ml-2">{analysisResult.suggestedScore}</span>
          {!adoptedItems.score && (
            <button
              onClick={() => onAdoptScoreOnly(onUpdateFields)}
              className="ml-3 text-blue-600 hover:text-blue-700 text-xs"
            >
              采纳
            </button>
          )}
        </div>

        {analysisResult.suggestedOKRMetrics.length > 0 && (
          <div>
            <span className="font-medium">OKR指标：</span>
            <span className="ml-2">{analysisResult.suggestedOKRMetrics.map(m => m.metricName).join(', ')}</span>
            {!adoptedItems.okrMetrics && (
              <button
                onClick={() => onAdoptOKRMetrics(currentForm.affectedMetrics || [], onUpdateFields)}
                className="ml-3 text-blue-600 hover:text-blue-700 text-xs"
              >
                采纳
              </button>
            )}
          </div>
        )}

        {analysisResult.suggestedProcessMetrics.length > 0 && (
          <div>
            <span className="font-medium">过程指标：</span>
            <span className="ml-2">{analysisResult.suggestedProcessMetrics.map(m => m.metricName).join(', ')}</span>
            {!adoptedItems.processMetrics && (
              <button
                onClick={() => onAdoptProcessMetrics(currentForm.affectedMetrics || [], onUpdateFields)}
                className="ml-3 text-blue-600 hover:text-blue-700 text-xs"
              >
                采纳
              </button>
            )}
          </div>
        )}

        {analysisResult.reasoning.length > 0 && (
          <div className="mt-2 pt-2 border-t border-purple-300">
            <span className="font-medium">分析理由：</span>
            <ul className="mt-1 space-y-1 ml-4 list-disc">
              {analysisResult.reasoning.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-purple-300">
        <button
          onClick={() => onAdoptAll(currentForm, onUpdateFields)}
          disabled={adoptionStatus === 'adopted'}
          className="flex-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm"
        >
          采纳全部
        </button>
        <button
          onClick={onIgnore}
          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
        >
          忽略
        </button>
        <button
          onClick={onReanalyze}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
        >
          重新分析
        </button>
      </div>
    </div>
  );
};
