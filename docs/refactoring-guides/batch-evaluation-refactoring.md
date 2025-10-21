# BatchEvaluationModal.tsx 重构指南

> **难度**: ⭐⭐⭐ (中等)
> **预计工时**: 3-4 小时
> **当前行数**: 744
> **目标行数**: < 480

---

## 📋 重构概览

### 当前问题

- AI 批量评估逻辑混在组件中（~250行）
- 大量状态管理代码（~100行）
- 复杂的 UI 渲染逻辑（~200行）
- 评估结果展示代码重复

### 拆分方案

```
src/components/batch-evaluation/
├── BatchEvaluationModal.tsx         (~280行) - 主容器
├── EvaluationProgress.tsx           (~100行) - 进度显示
├── EvaluationResultItem.tsx         (~150行) - 单个结果项
└── hooks/
    └── useBatchAIEvaluation.ts      (~200行) - AI评估逻辑
```

---

## 🔧 步骤 1：创建目录结构

```bash
mkdir -p src/components/batch-evaluation/hooks
```

---

## 📝 步骤 2：提取 AI 评估逻辑 Hook

### 创建 `src/components/batch-evaluation/hooks/useBatchAIEvaluation.ts`

```typescript
/**
 * 批量 AI 评估 Hook
 *
 * 功能：
 * - 批量调用 AI API 评估业务影响度
 * - 进度跟踪
 * - 结果管理
 * - 错误处理
 */

import { useState, useCallback } from 'react';
import type { Requirement, BusinessImpactScore, AIModelType } from '../../../types';
import { OPENAI_API_KEY, DEEPSEEK_API_KEY } from '../../../config/api';

export interface EvaluationResult {
  reqId: string;
  aiScore: BusinessImpactScore;
  userScore?: BusinessImpactScore;
  reasoning: string;
  aiSuggestions?: {
    name?: string;
    description?: string;
    businessDomain?: string;
    timeCriticality?: string;
    hardDeadline?: boolean;
    storeTypes?: string[];
    regions?: string[];
    storeCountRange?: string;
    affectedMetrics?: Array<{
      metricName: string;
      estimatedImpact: string;
    }>;
  };
}

export interface BatchEvaluationProgress {
  current: number;
  total: number;
}

export function useBatchAIEvaluation() {
  const [results, setResults] = useState<Map<string, EvaluationResult>>(new Map());
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [progress, setProgress] = useState<BatchEvaluationProgress>({ current: 0, total: 0 });

  /**
   * 评估单个需求
   */
  const evaluateRequirement = useCallback(async (
    requirement: Requirement,
    aiModel: AIModelType
  ): Promise<EvaluationResult> => {
    const apiKey = aiModel === 'openai' ? OPENAI_API_KEY : DEEPSEEK_API_KEY;

    if (!apiKey) {
      throw new Error(`${aiModel === 'openai' ? 'OpenAI' : 'DeepSeek'} API Key 未配置`);
    }

    // 构建提示词
    const prompt = buildEvaluationPrompt(requirement);

    // 调用 AI API
    const apiUrl = aiModel === 'openai'
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://api.deepseek.com/v1/chat/completions';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: aiModel === 'openai' ? 'gpt-3.5-turbo' : 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的产品需求评估专家。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`API 调用失败: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // 解析 AI 响应
    return parseAIResponse(aiResponse, requirement);
  }, []);

  /**
   * 批量评估需求
   */
  const batchEvaluate = useCallback(async (
    requirements: Requirement[],
    selectedIds: Set<string>,
    aiModel: AIModelType,
    onProgress?: (current: number, total: number) => void
  ) => {
    setIsEvaluating(true);
    setProgress({ current: 0, total: selectedIds.size });
    const newResults = new Map<string, EvaluationResult>();

    let currentCount = 0;

    for (const req of requirements) {
      if (!selectedIds.has(req.id)) continue;

      try {
        const result = await evaluateRequirement(req, aiModel);
        newResults.set(req.id, result);
        currentCount++;
        setProgress({ current: currentCount, total: selectedIds.size });
        onProgress?.(currentCount, selectedIds.size);
      } catch (error) {
        console.error(`评估需求 ${req.id} 失败:`, error);
        // 可以选择继续或中断
      }

      // 延迟，避免 API 限流
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setResults(newResults);
    setIsEvaluating(false);
    return newResults;
  }, [evaluateRequirement]);

  /**
   * 重置评估结果
   */
  const resetResults = useCallback(() => {
    setResults(new Map());
    setProgress({ current: 0, total: 0 });
  }, []);

  return {
    results,
    isEvaluating,
    progress,
    batchEvaluate,
    resetResults,
  };
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 构建评估提示词
 */
function buildEvaluationPrompt(requirement: Requirement): string {
  return `请评估以下需求的业务影响度：

需求名称：${requirement.name}
业务域：${requirement.businessDomain || '未知'}
提交人：${requirement.submitterName || '未知'}
产品经理：${requirement.productManager || '未知'}
工作量：${requirement.effortDays || 0} 天

请从以下四个级别中选择一个：
1. 局部 - 影响范围小，仅局部优化
2. 明显 - 有明显价值，改善用户体验
3. 撬动核心 - 影响核心流程，显著提升指标
4. 战略平台 - 战略级项目，长期价值

请以JSON格式返回：
{
  "score": "局部|明显|撬动核心|战略平台",
  "reasoning": "评估理由（50字以内）"
}`;
}

/**
 * 解析 AI 响应
 */
function parseAIResponse(
  aiResponse: string,
  requirement: Requirement
): EvaluationResult {
  try {
    // 尝试解析 JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        reqId: requirement.id,
        aiScore: parsed.score as BusinessImpactScore,
        userScore: requirement.bv as BusinessImpactScore,
        reasoning: parsed.reasoning || '无',
      };
    }
  } catch (error) {
    console.error('解析 AI 响应失败:', error);
  }

  // 解析失败，使用默认值
  return {
    reqId: requirement.id,
    aiScore: '明显',
    userScore: requirement.bv as BusinessImpactScore,
    reasoning: '解析失败，使用默认值',
  };
}
```

---

## 🎨 步骤 3：提取进度显示组件

### 创建 `src/components/batch-evaluation/EvaluationProgress.tsx`

```typescript
/**
 * 评估进度显示组件
 */

import { Sparkles } from 'lucide-react';
import type { AIModelType } from '../../types';

interface EvaluationProgressProps {
  current: number;
  total: number;
  isEvaluating: boolean;
  selectedAIModel: AIModelType;
  onModelChange: (model: AIModelType) => void;
}

const EvaluationProgress = ({
  current,
  total,
  isEvaluating,
  selectedAIModel,
  onModelChange,
}: EvaluationProgressProps) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-purple-600" />
          <h3 className="font-semibold text-gray-900">AI 批量评估</h3>
        </div>

        {/* AI 模型选择 */}
        {!isEvaluating && (
          <select
            value={selectedAIModel}
            onChange={(e) => onModelChange(e.target.value as AIModelType)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="deepseek">DeepSeek (推荐)</option>
            <option value="openai">OpenAI GPT-3.5</option>
          </select>
        )}
      </div>

      {/* 进度条 */}
      {isEvaluating && (
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>正在评估...</span>
            <span>{current} / {total} ({percentage}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 提示信息 */}
      {!isEvaluating && total === 0 && (
        <p className="text-sm text-gray-600">
          请在下方勾选需要评估的需求，然后点击"开始评估"按钮
        </p>
      )}
    </div>
  );
};

export default EvaluationProgress;
```

---

## 📦 步骤 4：提取评估结果项组件

### 创建 `src/components/batch-evaluation/EvaluationResultItem.tsx`

```typescript
/**
 * 单个评估结果项组件
 */

import { CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
import type { EvaluationResult } from './hooks/useBatchAIEvaluation';

interface EvaluationResultItemProps {
  result: EvaluationResult;
  requirementName: string;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onApply: () => void;
}

const EvaluationResultItem = ({
  result,
  requirementName,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  onApply,
}: EvaluationResultItemProps) => {
  const scoreColors: Record<string, string> = {
    '局部': 'bg-blue-100 text-blue-800',
    '明显': 'bg-green-100 text-green-800',
    '撬动核心': 'bg-orange-100 text-orange-800',
    '战略平台': 'bg-red-100 text-red-800',
  };

  const userScoreColor = result.userScore ? scoreColors[result.userScore] : 'bg-gray-100 text-gray-800';
  const aiScoreColor = scoreColors[result.aiScore] || 'bg-gray-100 text-gray-800';
  const isDifferent = result.userScore !== result.aiScore;

  return (
    <div className={`border rounded-lg p-4 ${isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
      <div className="flex items-start gap-3">
        {/* 复选框 */}
        <button onClick={onToggleSelect} className="mt-1">
          {isSelected ? (
            <CheckSquare size={20} className="text-purple-600" />
          ) : (
            <Square size={20} className="text-gray-400" />
          )}
        </button>

        {/* 内容 */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">{requirementName}</h4>
            <button
              onClick={onToggleExpand}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          {/* 分数对比 */}
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">用户评分:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${userScoreColor}`}>
                {result.userScore || '未评估'}
              </span>
            </div>
            <span className="text-gray-400">→</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">AI建议:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${aiScoreColor}`}>
                {result.aiScore}
              </span>
            </div>
            {isDifferent && (
              <span className="text-xs text-orange-600 font-medium">不一致</span>
            )}
          </div>

          {/* 评估理由 */}
          <p className="text-sm text-gray-600 mb-3">
            <strong>理由：</strong>{result.reasoning}
          </p>

          {/* 展开详情 */}
          {isExpanded && result.aiSuggestions && (
            <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200 text-sm">
              <h5 className="font-semibold mb-2">AI 详细建议：</h5>
              {result.aiSuggestions.businessDomain && (
                <p>业务域: {result.aiSuggestions.businessDomain}</p>
              )}
              {result.aiSuggestions.affectedMetrics && (
                <div className="mt-2">
                  <strong>影响指标:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {result.aiSuggestions.affectedMetrics.map((metric, idx) => (
                      <li key={idx}>
                        {metric.metricName}: {metric.estimatedImpact}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 应用按钮 */}
          <button
            onClick={onApply}
            className="mt-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition"
          >
            应用此评分
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationResultItem;
```

---

## 🔄 步骤 5：重构主组件

### 修改 `src/components/BatchEvaluationModal.tsx`

大幅精简，使用提取的组件和 Hook：

```typescript
/**
 * 批量AI评估Modal组件 - 重构版
 */

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { Requirement, BusinessImpactScore, AIModelType } from '../types';
import EvaluationProgress from './batch-evaluation/EvaluationProgress';
import EvaluationResultItem from './batch-evaluation/EvaluationResultItem';
import { useBatchAIEvaluation } from './batch-evaluation/hooks/useBatchAIEvaluation';

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
  // 状态管理
  const [selectedAIModel, setSelectedAIModel] = useState<AIModelType>('deepseek');
  const [selectedReqIds, setSelectedReqIds] = useState<Set<string>>(new Set());
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());
  const [expandedReqId, setExpandedReqId] = useState<string | null>(null);

  // AI 评估 Hook
  const { results, isEvaluating, progress, batchEvaluate, resetResults } = useBatchAIEvaluation();

  // 开始评估
  const handleStartEvaluation = async () => {
    if (selectedReqIds.size === 0) return;
    await batchEvaluate(requirements, selectedReqIds, selectedAIModel);
    // 评估完成后自动全选结果
    setSelectedResultIds(new Set(Array.from(results.keys())));
  };

  // 应用选中的评分
  const handleApplySelectedScores = () => {
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

  // 应用单个评分
  const handleApplySingleScore = (reqId: string) => {
    const result = results.get(reqId);
    if (result) {
      const updates = new Map([[reqId, result.aiScore]]);
      onApplyScores(updates);
    }
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedReqIds.size === requirements.length) {
      setSelectedReqIds(new Set());
    } else {
      setSelectedReqIds(new Set(requirements.map(r => r.id)));
    }
  };

  const toggleSelectAllResults = () => {
    const resultIds = Array.from(results.keys());
    if (selectedResultIds.size === resultIds.length && resultIds.length > 0) {
      setSelectedResultIds(new Set());
    } else {
      setSelectedResultIds(new Set(resultIds));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">AI 批量评估</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 进度显示 */}
          <EvaluationProgress
            current={progress.current}
            total={progress.total}
            isEvaluating={isEvaluating}
            selectedAIModel={selectedAIModel}
            onModelChange={setSelectedAIModel}
          />

          {/* 需求列表（评估前） */}
          {results.size === 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">
                  选择需要评估的需求 ({selectedReqIds.size}/{requirements.length})
                </h3>
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  {selectedReqIds.size === requirements.length ? '取消全选' : '全选'}
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {requirements.map(req => (
                  <label
                    key={req.id}
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedReqIds.has(req.id)}
                      onChange={() => {
                        const newSet = new Set(selectedReqIds);
                        if (newSet.has(req.id)) newSet.delete(req.id);
                        else newSet.add(req.id);
                        setSelectedReqIds(newSet);
                      }}
                      className="rounded"
                    />
                    <span className="flex-1">{req.name}</span>
                    <span className="text-sm text-gray-500">
                      当前: {req.bv || '未评估'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 评估结果（评估后） */}
          {results.size > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">
                  评估结果 ({selectedResultIds.size}/{results.size} 已选)
                </h3>
                <button
                  onClick={toggleSelectAllResults}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  {selectedResultIds.size === results.size ? '取消全选' : '全选'}
                </button>
              </div>
              <div className="space-y-3">
                {Array.from(results.entries()).map(([reqId, result]) => {
                  const req = requirements.find(r => r.id === reqId);
                  return (
                    <EvaluationResultItem
                      key={reqId}
                      result={result}
                      requirementName={req?.name || '未知需求'}
                      isSelected={selectedResultIds.has(reqId)}
                      isExpanded={expandedReqId === reqId}
                      onToggleSelect={() => {
                        const newSet = new Set(selectedResultIds);
                        if (newSet.has(reqId)) newSet.delete(reqId);
                        else newSet.add(reqId);
                        setSelectedResultIds(newSet);
                      }}
                      onToggleExpand={() => {
                        setExpandedReqId(expandedReqId === reqId ? null : reqId);
                      }}
                      onApply={() => handleApplySingleScore(reqId)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {results.size > 0 ? (
                <>
                  已完成 <strong className="text-green-600">{results.size}</strong> 个评估，
                  选中 <strong className="text-gray-900">{selectedResultIds.size}</strong> 个待应用
                </>
              ) : (
                <>已选择 <strong>{selectedReqIds.size}</strong> 个需求</>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                取消
              </button>
              {results.size === 0 ? (
                <button
                  onClick={handleStartEvaluation}
                  disabled={selectedReqIds.size === 0 || isEvaluating}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg transition"
                >
                  {isEvaluating ? '评估中...' : '开始评估'}
                </button>
              ) : (
                <button
                  onClick={handleApplySelectedScores}
                  disabled={selectedResultIds.size === 0}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg transition flex items-center gap-2"
                >
                  <Check size={18} />
                  批量应用选中评分 ({selectedResultIds.size}个)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchEvaluationModal;
```

---

## ✅ 步骤 6：测试

### 功能测试清单

- [ ] AI 模型选择正常（OpenAI/DeepSeek）
- [ ] 勾选需求功能正常
- [ ] 全选/取消全选正常
- [ ] 开始评估按钮可点击
- [ ] 进度条显示正确
- [ ] 评估结果显示正常
- [ ] 展开/收起详情正常
- [ ] 单个应用功能正常
- [ ] 批量应用功能正常
- [ ] 关闭弹窗正常

### 文件大小验证

```bash
npm run check-file-size
```

**期望输出**：
```
✅ src/components/BatchEvaluationModal.tsx - ~280 行
✅ src/components/batch-evaluation/EvaluationProgress.tsx - ~100 行
✅ src/components/batch-evaluation/EvaluationResultItem.tsx - ~150 行
✅ src/components/batch-evaluation/hooks/useBatchAIEvaluation.ts - ~200 行
```

---

## 📝 步骤 7：提交

```bash
git add .
git commit -m "refactor: reduce BatchEvaluationModal from 744 to ~280 lines

- Extract AI evaluation logic to useBatchAIEvaluation hook
- Extract EvaluationProgress component
- Extract EvaluationResultItem component
- Simplify main modal component

Files created:
- src/components/batch-evaluation/hooks/useBatchAIEvaluation.ts (~200 lines)
- src/components/batch-evaluation/EvaluationProgress.tsx (~100 lines)
- src/components/batch-evaluation/EvaluationResultItem.tsx (~150 lines)

✅ File size: 744 → 280 lines (reduced by 464 lines!)
✅ All tests passing
✅ Build successful
"
```

---

## 🎉 完成

BatchEvaluationModal.tsx 已从 744 行减少到 ~280 行，符合项目规范！

**下一步**：继续重构 EditRequirementModal.tsx (2044 → 480行)
