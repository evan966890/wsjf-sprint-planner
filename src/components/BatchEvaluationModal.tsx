/**
 * 批量AI评估Modal组件 - 重构版
 *
 * 功能说明：
 * - 显示所有需求的完整信息（评估前后）
 * - 支持选择AI模型（OpenAI / DeepSeek）
 * - 一键批量调用AI评估业务影响度分数
 * - 对比用户评分和AI评分的差异
 * - 支持单个应用或批量应用评估结果
 *
 * 架构说明：
 * - 使用 useBatchAIEvaluation Hook 处理AI评估逻辑
 * - 使用 EvaluationProgress 组件显示进度
 * - 使用 EvaluationResultItem 组件显示单个结果
 *
 * @version 2.1.0 (重构版)
 */

import React, { useState } from 'react';
import { X, CheckSquare, Square, Sparkles, Check } from 'lucide-react';
import type { Requirement, BusinessImpactScore, AIModelType } from '../types';
import { OPENAI_API_KEY, DEEPSEEK_API_KEY } from '../config/api';
import { useBatchAIEvaluation } from './batch-evaluation/hooks/useBatchAIEvaluation';
import { EvaluationProgress } from './batch-evaluation/EvaluationProgress';
import { EvaluationResultItem } from './batch-evaluation/EvaluationResultItem';

interface Props {
  requirements: Requirement[];
  onClose: () => void;
  onApplyScores: (updates: Map<string, BusinessImpactScore>) => void;
}

const BatchEvaluationModal: React.FC<Props> = ({
  requirements,
  onClose,
  onApplyScores
}) => {
  // ============================================================================
  // 组件状态
  // ============================================================================

  const [selectedAIModel, setSelectedAIModel] = useState<AIModelType>('deepseek');
  const [selectedReqIds, setSelectedReqIds] = useState<Set<string>>(new Set());
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());

  // ============================================================================
  // 使用AI评估Hook
  // ============================================================================

  const { results, isEvaluating, progress, batchEvaluate } = useBatchAIEvaluation();

  // ============================================================================
  // API配置
  // ============================================================================

  const apiKey = selectedAIModel === 'openai' ? OPENAI_API_KEY : DEEPSEEK_API_KEY;

  // ============================================================================
  // 事件处理 - 选择需求
  // ============================================================================

  /**
   * 全选/取消全选待评估需求
   */
  const toggleSelectAll = () => {
    if (selectedReqIds.size === requirements.length) {
      setSelectedReqIds(new Set());
    } else {
      setSelectedReqIds(new Set(requirements.map(r => r.id)));
    }
  };

  /**
   * 切换单个需求选择
   */
  const toggleSelectReq = (id: string) => {
    const newSet = new Set(selectedReqIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedReqIds(newSet);
  };

  // ============================================================================
  // 事件处理 - 选择评估结果
  // ============================================================================

  /**
   * 全选/取消全选评估结果
   */
  const toggleSelectAllResults = () => {
    const resultIds = Array.from(results.keys());
    if (selectedResultIds.size === resultIds.length && resultIds.length > 0) {
      setSelectedResultIds(new Set());
    } else {
      setSelectedResultIds(new Set(resultIds));
    }
  };

  /**
   * 切换单个结果选择
   */
  const toggleSelectResult = (id: string) => {
    const newSet = new Set(selectedResultIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedResultIds(newSet);
  };

  // ============================================================================
  // 事件处理 - AI评估
  // ============================================================================

  /**
   * 批量评估
   */
  const handleBatchEvaluate = async () => {
    try {
      const newResults = await batchEvaluate(requirements, selectedReqIds, selectedAIModel);
      // 默认全选所有结果
      setSelectedResultIds(new Set(newResults.keys()));
      alert(`批量评估完成！成功评估 ${newResults.size} 个需求。`);
    } catch (error) {
      alert('批量评估失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  /**
   * 应用选中的AI评分
   */
  const handleApplySelectedScores = () => {
    if (selectedResultIds.size === 0) {
      alert('请至少选择一个评估结果进行应用');
      return;
    }

    const updates = new Map<string, BusinessImpactScore>();
    selectedResultIds.forEach(reqId => {
      const result = results.get(reqId);
      if (result) {
        updates.set(reqId, result.aiScore);
      }
    });

    onApplyScores(updates);
    onClose();
  };

  /**
   * 应用单个AI评分
   */
  const handleApplySingleScore = (reqId: string) => {
    const result = results.get(reqId);
    if (!result) return;

    const updates = new Map<string, BusinessImpactScore>();
    updates.set(reqId, result.aiScore);
    onApplyScores(updates);

    // 从选中结果中移除
    const newSelected = new Set(selectedResultIds);
    newSelected.delete(reqId);
    setSelectedResultIds(newSelected);

    alert(`已应用需求"${requirements.find(r => r.id === reqId)?.name}"的AI评分`);
  };

  // ============================================================================
  // 渲染
  // ============================================================================

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="text-white" size={24} />
            <h2 className="text-xl font-bold text-white">AI批量评估 - 业务影响度打分</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* AI模型选择和操作栏 */}
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedReqIds.size === requirements.length ? (
                  <>
                    <CheckSquare size={18} />
                    取消全选
                  </>
                ) : (
                  <>
                    <Square size={18} />
                    全选 ({requirements.length})
                  </>
                )}
              </button>
              <span className="text-sm text-gray-600">
                已选择 <strong className="text-gray-900">{selectedReqIds.size}</strong> 个需求
              </span>
            </div>
            <button
              onClick={handleBatchEvaluate}
              disabled={isEvaluating || selectedReqIds.size === 0 || !apiKey}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center gap-2 font-medium"
            >
              <Sparkles size={16} />
              {isEvaluating ? `评估中... ${progress.current}/${progress.total}` : '开始AI评估'}
            </button>
          </div>
        </div>

        {/* 进度显示组件 */}
        <EvaluationProgress
          current={progress.current}
          total={progress.total}
          isEvaluating={isEvaluating}
          selectedAIModel={selectedAIModel}
          onModelChange={setSelectedAIModel}
          apiKey={apiKey}
        />

        {/* 需求列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {requirements.map(req => {
              const isSelected = selectedReqIds.has(req.id);
              const result = results.get(req.id);
              const isResultSelected = selectedResultIds.has(req.id);

              return (
                <EvaluationResultItem
                  key={req.id}
                  requirement={req}
                  result={result}
                  isSelected={isSelected}
                  isResultSelected={isResultSelected}
                  onToggleSelect={() => toggleSelectReq(req.id)}
                  onToggleResultSelect={() => toggleSelectResult(req.id)}
                  onApplyScore={() => handleApplySingleScore(req.id)}
                  isEvaluating={isEvaluating}
                />
              );
            })}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-4">
            {results.size > 0 && (
              <>
                <button
                  onClick={toggleSelectAllResults}
                  className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  {selectedResultIds.size === results.size && results.size > 0 ? (
                    <>
                      <CheckSquare size={18} />
                      取消全选结果
                    </>
                  ) : (
                    <>
                      <Square size={18} />
                      全选结果
                    </>
                  )}
                </button>
                <span className="text-sm text-gray-600">
                  已完成 <strong className="text-green-600">{results.size}</strong> 个评估，
                  选中 <strong className="text-gray-900">{selectedResultIds.size}</strong> 个待应用
                </span>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
            >
              取消
            </button>
            <button
              onClick={handleApplySelectedScores}
              disabled={selectedResultIds.size === 0}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg transition font-medium flex items-center gap-2"
            >
              <Check size={18} />
              批量应用选中评分 ({selectedResultIds.size}个)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchEvaluationModal;
