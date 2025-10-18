/**
 * 批量AI评估Modal组件
 *
 * 功能说明：
 * - 显示所有需求列表，支持多选
 * - 一键批量调用AI评估业务影响度分数（1-10分）
 * - 高亮显示AI评分结果
 * - 对比用户已打分和AI评分的差异
 * - 支持一键应用AI评分或保留用户评分
 *
 * @version 1.2.2
 */

import React, { useState } from 'react';
import { X, CheckSquare, Square, Sparkles, AlertCircle, Check } from 'lucide-react';
import type { Requirement, BusinessImpactScore, AIModelType } from '../types';

interface Props {
  requirements: Requirement[];
  selectedAIModel: AIModelType;
  onClose: () => void;
  onApplyScores: (updates: Map<string, BusinessImpactScore>) => void;
  apiKey: string;
}

interface EvaluationResult {
  reqId: string;
  aiScore: BusinessImpactScore;
  userScore?: BusinessImpactScore;
  reasoning: string;
}

const BatchEvaluationModal: React.FC<Props> = ({
  requirements,
  selectedAIModel,
  onClose,
  onApplyScores,
  apiKey
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [results, setResults] = useState<Map<string, EvaluationResult>>(new Map());
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.size === requirements.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(requirements.map(r => r.id)));
    }
  };

  // 切换单个需求选择状态
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  /**
   * 调用AI评估单个需求
   */
  const evaluateRequirement = async (req: Requirement): Promise<EvaluationResult> => {
    const modelName = selectedAIModel === 'openai' ? 'OpenAI' : 'DeepSeek';

    // 构建评估提示词
    const prompt = `你是小米国际零售业务的需求评估专家。请基于WSJF-Lite方法论，为以下需求评估业务影响度分数（1-10分）。

需求信息：
- 需求名称：${req.name}
- 需求描述：${req.description || '（无详细描述）'}
- 提交方：${req.submitter}
- 业务团队：${req.businessTeam || '未指定'}
- 业务域：${req.businessDomain === '自定义' ? req.customBusinessDomain || '自定义' : req.businessDomain}
- 工作量：${req.effortDays}天
- 时间临界性：${req.timeCriticality || req.tc || '随时'}
- 强制DDL：${req.hardDeadline ? '是' : '否'}${req.deadlineDate ? ` (${req.deadlineDate})` : ''}
${req.impactScope ? `- 影响范围：
  * 门店类型：${req.impactScope.storeTypes?.join(', ') || '未指定'}
  * 区域：${req.impactScope.regions?.join(', ') || '未指定'}
  * 门店数量：${req.impactScope.storeCountRange || '未指定'}
  * 涉及角色：${req.impactScope.keyRoles?.map(r => r.roleName).join(', ') || '未指定'}` : ''}
${req.affectedMetrics && req.affectedMetrics.length > 0 ? `- 影响的指标：
${req.affectedMetrics.map(m => `  * ${m.displayName}: ${m.estimatedImpact}`).join('\n')}` : ''}

评分标准（1-10分）：
10分 - 致命缺陷：不修复将导致系统崩溃/业务停摆/法律风险，影响全球/全渠道
9分 - 严重阻塞：严重影响核心流程，影响多国/多渠道
8分 - 战略必需：战略级OKR关键路径，影响全球/多国
7分 - 显著影响：显著影响核心OKR，影响多国/单国全渠道
6分 - 重要改进：改善核心指标，影响单国多门店
5分 - 中等价值：改善过程指标，影响单国部分门店
4分 - 局部优化：局部流程优化，影响单一门店类型
3分 - 小幅提升：小幅改善体验，影响少量门店
2分 - 微小优化：微小改进，影响极少数场景
1分 - 可选优化：可有可无的优化

请返回JSON格式：{"score": 数字1-10, "reasoning": "评分理由（50字以内）"}

注意：
1. 综合考虑业务后果和影响范围
2. 影响范围越大（全球>多国>单国，全渠道>多渠道>单渠道），分数越高
3. 业务后果越严重（系统故障>流程阻塞>指标下降>体验不佳），分数越高
4. 只返回JSON，不要其他解释`;

    // 根据模型构建API请求
    let apiUrl: string;
    let requestBody: any;

    if (selectedAIModel === 'openai') {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      requestBody = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是小米国际零售业务的专业需求评估专家，擅长基于WSJF方法评估需求优先级。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      };
    } else {
      apiUrl = 'https://api.deepseek.com/v1/chat/completions';
      requestBody = {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是小米国际零售业务的专业需求评估专家，擅长基于WSJF方法评估需求优先级。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || response.statusText;
      throw new Error(`${modelName} API请求失败: ${errorMsg}`);
    }

    const result = await response.json();
    const aiText = result.choices[0]?.message?.content || '';

    // 提取JSON
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`AI返回格式错误: ${aiText.substring(0, 100)}`);
    }

    const aiResult = JSON.parse(jsonMatch[0]);
    const score = Math.max(1, Math.min(10, Number(aiResult.score))) as BusinessImpactScore;

    return {
      reqId: req.id,
      aiScore: score,
      userScore: req.businessImpactScore,
      reasoning: aiResult.reasoning || 'AI评估完成'
    };
  };

  /**
   * 批量评估
   */
  const handleBatchEvaluate = async () => {
    if (!apiKey) {
      alert('AI评估功能未配置。请联系管理员配置API Key。');
      return;
    }

    if (selectedIds.size === 0) {
      alert('请至少选择一个需求进行评估');
      return;
    }

    setIsEvaluating(true);
    setProgress({ current: 0, total: selectedIds.size });
    const newResults = new Map<string, EvaluationResult>();

    try {
      let current = 0;
      for (const reqId of selectedIds) {
        const req = requirements.find(r => r.id === reqId);
        if (!req) continue;

        try {
          const result = await evaluateRequirement(req);
          newResults.set(reqId, result);
          current++;
          setProgress({ current, total: selectedIds.size });
        } catch (error) {
          console.error(`评估需求 ${req.name} 失败:`, error);
          // 继续评估其他需求
        }
      }

      setResults(newResults);
      alert(`批量评估完成！成功评估 ${newResults.size} 个需求。`);
    } catch (error) {
      console.error('批量评估失败:', error);
      alert('批量评估失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsEvaluating(false);
    }
  };

  /**
   * 应用AI评分
   */
  const handleApplyScores = () => {
    if (results.size === 0) {
      alert('没有可应用的评分结果');
      return;
    }

    const updates = new Map<string, BusinessImpactScore>();
    results.forEach((result, reqId) => {
      updates.set(reqId, result.aiScore);
    });

    onApplyScores(updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="text-white" size={24} />
            <h2 className="text-xl font-bold text-white">AI批量评估 - 业务影响度打分</h2>
            <span className="text-xs text-white/80 bg-white/20 px-2 py-1 rounded">
              {selectedAIModel === 'deepseek' ? 'DeepSeek' : 'OpenAI'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* 操作栏 */}
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedIds.size === requirements.length ? (
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
                已选择 <strong className="text-gray-900">{selectedIds.size}</strong> 个需求
              </span>
            </div>
            <button
              onClick={handleBatchEvaluate}
              disabled={isEvaluating || selectedIds.size === 0 || !apiKey}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center gap-2 font-medium"
            >
              <Sparkles size={16} />
              {isEvaluating ? `评估中... ${progress.current}/${progress.total}` : '开始AI评估'}
            </button>
          </div>
        </div>

        {/* 需求列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {!apiKey && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>AI评估功能未配置。请联系管理员在代码中配置 {selectedAIModel === 'deepseek' ? 'DeepSeek' : 'OpenAI'} API Key。</span>
              </p>
            </div>
          )}

          <div className="space-y-3">
            {requirements.map(req => {
              const isSelected = selectedIds.has(req.id);
              const result = results.get(req.id);
              const hasDifference = result && result.userScore && result.aiScore !== result.userScore;

              return (
                <div
                  key={req.id}
                  className={`border rounded-lg p-4 transition ${
                    isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'
                  } ${result ? 'ring-2 ring-green-200' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* 复选框 */}
                    <button
                      onClick={() => toggleSelect(req.id)}
                      className="flex-shrink-0 mt-1"
                    >
                      {isSelected ? (
                        <CheckSquare size={20} className="text-purple-600" />
                      ) : (
                        <Square size={20} className="text-gray-400" />
                      )}
                    </button>

                    {/* 需求信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm mb-1">{req.name}</h3>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                            <span>业务域: {req.businessDomain === '自定义' ? req.customBusinessDomain : req.businessDomain}</span>
                            <span>•</span>
                            <span>提交方: {req.submitter}</span>
                            <span>•</span>
                            <span>工作量: {req.effortDays}天</span>
                            {req.businessImpactScore && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-blue-600">
                                  用户评分: {req.businessImpactScore}分
                                </span>
                              </>
                            )}
                          </div>
                          {req.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{req.description}</p>
                          )}
                        </div>

                        {/* AI评分结果 */}
                        {result && (
                          <div className="flex-shrink-0 bg-green-50 border border-green-200 rounded-lg px-3 py-2 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-1">
                              <Check size={14} className="text-green-600" />
                              <span className="text-xs font-semibold text-green-700">AI评分结果</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-green-600">{result.aiScore}</span>
                              <span className="text-xs text-gray-600">分</span>
                              {hasDifference && (
                                <span className="text-xs text-orange-600 font-semibold">
                                  (用户: {result.userScore}分)
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{result.reasoning}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50">
          <div className="text-sm text-gray-600">
            {results.size > 0 && (
              <span className="text-green-600 font-semibold">
                已完成 {results.size} 个需求的AI评估
              </span>
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
              onClick={handleApplyScores}
              disabled={results.size === 0}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg transition font-medium flex items-center gap-2"
            >
              <Check size={18} />
              应用AI评分 ({results.size}个)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchEvaluationModal;
