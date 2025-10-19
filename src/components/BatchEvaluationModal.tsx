/**
 * 批量AI评估Modal组件 - v2.0
 *
 * 功能说明：
 * - 显示所有需求的完整信息（评估前后）
 * - 支持选择AI模型（OpenAI / DeepSeek）
 * - 一键批量调用AI评估业务影响度分数
 * - 展示所有需求字段详情
 * - 对比用户评分和AI评分的差异
 * - 支持单个应用或批量应用评估结果
 *
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { X, CheckSquare, Square, Sparkles, AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { Requirement, BusinessImpactScore, AIModelType } from '../types';
import { OPENAI_API_KEY, DEEPSEEK_API_KEY } from '../config/api';

interface Props {
  requirements: Requirement[];
  onClose: () => void;
  onApplyScores: (updates: Map<string, BusinessImpactScore>) => void;
}

interface EvaluationResult {
  reqId: string;
  aiScore: BusinessImpactScore;
  userScore?: BusinessImpactScore;
  reasoning: string;
  // AI建议的完整需求信息
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

const BatchEvaluationModal: React.FC<Props> = ({
  requirements,
  onClose,
  onApplyScores
}) => {
  const [selectedAIModel, setSelectedAIModel] = useState<AIModelType>('deepseek');
  const [selectedReqIds, setSelectedReqIds] = useState<Set<string>>(new Set());
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [results, setResults] = useState<Map<string, EvaluationResult>>(new Map());
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [expandedReqId, setExpandedReqId] = useState<string | null>(null);
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());

  // API Key
  const apiKey = selectedAIModel === 'openai' ? OPENAI_API_KEY : DEEPSEEK_API_KEY;
  const modelName = selectedAIModel === 'openai' ? 'OpenAI' : 'DeepSeek';

  // 全选/取消全选待评估需求
  const toggleSelectAll = () => {
    if (selectedReqIds.size === requirements.length) {
      setSelectedReqIds(new Set());
    } else {
      setSelectedReqIds(new Set(requirements.map(r => r.id)));
    }
  };

  // 切换单个需求选择
  const toggleSelectReq = (id: string) => {
    const newSet = new Set(selectedReqIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedReqIds(newSet);
  };

  // 全选/取消全选评估结果
  const toggleSelectAllResults = () => {
    const resultIds = Array.from(results.keys());
    if (selectedResultIds.size === resultIds.length && resultIds.length > 0) {
      setSelectedResultIds(new Set());
    } else {
      setSelectedResultIds(new Set(resultIds));
    }
  };

  // 切换单个结果选择
  const toggleSelectResult = (id: string) => {
    const newSet = new Set(selectedResultIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedResultIds(newSet);
  };

  /**
   * 调用AI评估单个需求
   */
  const evaluateRequirement = async (req: Requirement): Promise<EvaluationResult> => {
    // 构建评估提示词
    const prompt = `你是小米国际零售业务的需求评估专家。请基于WSJF-Lite方法论，为以下需求评估业务影响度分数（1-10分），并分析影响范围和关键指标。

需求信息：
- 需求名称：${req.name}
- 需求描述：${req.description || '（无详细描述）'}
- 提交方：${req.submitter}
- 提交人：${req.submitterName || '未指定'}
- 提交日期：${req.submitDate}
- 业务团队：${req.businessTeam || '未指定'}
- 业务域：${req.businessDomain === '自定义' ? req.customBusinessDomain || '自定义' : req.businessDomain}
- 工作量：${req.effortDays}天
- 时间窗口：${req.timeCriticality || req.tc || '随时'}
- 强制DDL：${req.hardDeadline ? '是' : '否'}${req.deadlineDate ? ` (${req.deadlineDate})` : ''}
- RMS重构项目：${req.isRMS ? '是' : '否'}
${req.impactScope ? `- 用户已填写影响范围：
  * 门店类型：${req.impactScope.storeTypes?.join(', ') || '未指定'}
  * 区域：${req.impactScope.regions?.join(', ') || '未指定'}
  * 门店数量：${req.impactScope.storeCountRange || '未指定'}
  * 涉及角色：${req.impactScope.keyRoles?.map(r => r.roleName).join(', ') || '未指定'}` : ''}
${req.affectedMetrics && req.affectedMetrics.length > 0 ? `- 用户已填写影响指标：
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

请返回JSON格式：
{
  "score": 数字1-10,
  "reasoning": "评分理由（50字以内）",
  "storeTypes": ["门店类型1", "门店类型2"],
  "regions": ["地区1", "地区2"],
  "storeCountRange": "门店数量范围（如：50-100家）",
  "affectedMetrics": [
    {"metricName": "指标名称", "estimatedImpact": "预估影响"}
  ]
}

说明：
1. storeTypes: 从以下选择适用的门店类型：新零售-直营店、新零售-授权店、传统零售-授权店、电商、其他。如果用户已填写，可参考但需基于需求描述独立判断。
2. regions: 从以下选择适用的地区：东南亚、南亚、中东非洲、拉美、欧洲、全球。如果用户已填写，可参考但需基于需求描述独立判断。
3. storeCountRange: 预估影响的门店数量范围，如"10-20家"、"50-100家"、"100+家"等
4. affectedMetrics: 列出最多3个关键影响指标，从OKR指标（GMV、门店数、NPS等）或过程指标（转化率、效率等）中选择
5. 综合考虑业务后果和影响范围，影响范围越大、业务后果越严重，分数越高
6. 只返回JSON，不要其他解释`;

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
            content: '你是小米国际零售业务的专业需求评估专家，擅长基于WSJF方法评估需求优先级和影响范围分析。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      };
    } else {
      apiUrl = 'https://api.deepseek.com/v1/chat/completions';
      requestBody = {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是小米国际零售业务的专业需求评估专家，擅长基于WSJF方法评估需求优先级和影响范围分析。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
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
      reasoning: aiResult.reasoning || 'AI评估完成',
      aiSuggestions: {
        storeTypes: aiResult.storeTypes || [],
        regions: aiResult.regions || [],
        storeCountRange: aiResult.storeCountRange || '',
        affectedMetrics: aiResult.affectedMetrics || []
      }
    };
  };

  /**
   * 批量评估
   */
  const handleBatchEvaluate = async () => {
    if (!apiKey) {
      alert(`AI评估功能未配置。请配置 ${modelName} API Key。\n\n在项目根目录创建 .env.local 文件，添加：\n${selectedAIModel === 'openai' ? 'VITE_OPENAI_API_KEY' : 'VITE_DEEPSEEK_API_KEY'}=你的API-Key`);
      return;
    }

    if (selectedReqIds.size === 0) {
      alert('请至少选择一个需求进行评估');
      return;
    }

    setIsEvaluating(true);
    setProgress({ current: 0, total: selectedReqIds.size });
    const newResults = new Map<string, EvaluationResult>();

    try {
      let current = 0;
      for (const reqId of selectedReqIds) {
        const req = requirements.find(r => r.id === reqId);
        if (!req) continue;

        try {
          const result = await evaluateRequirement(req);
          newResults.set(reqId, result);
          current++;
          setProgress({ current, total: selectedReqIds.size });
        } catch (error) {
          console.error(`评估需求 ${req.name} 失败:`, error);
          // 继续评估其他需求
        }
      }

      setResults(newResults);
      // 默认全选所有结果
      setSelectedResultIds(new Set(newResults.keys()));
      alert(`批量评估完成！成功评估 ${newResults.size} 个需求。`);
    } catch (error) {
      console.error('批量评估失败:', error);
      alert('批量评估失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsEvaluating(false);
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

    // 从results中移除已应用的
    const newResults = new Map(results);
    newResults.delete(reqId);
    setResults(newResults);

    // 从选中结果中移除
    const newSelected = new Set(selectedResultIds);
    newSelected.delete(reqId);
    setSelectedResultIds(newSelected);

    alert(`已应用需求"${requirements.find(r => r.id === reqId)?.name}"的AI评分`);
  };

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
              {/* AI模型选择 */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">AI模型：</label>
                <select
                  value={selectedAIModel}
                  onChange={(e) => setSelectedAIModel(e.target.value as AIModelType)}
                  disabled={isEvaluating}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="deepseek">DeepSeek（推荐国内）</option>
                  <option value="openai">OpenAI（推荐海外）</option>
                </select>
              </div>

              <div className="h-6 w-px bg-gray-300"></div>

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

          {!apiKey && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>AI评估功能未配置。请在项目根目录创建 .env.local 文件，配置 {selectedAIModel === 'openai' ? 'VITE_OPENAI_API_KEY' : 'VITE_DEEPSEEK_API_KEY'}</span>
              </p>
            </div>
          )}
        </div>

        {/* 需求列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {requirements.map(req => {
              const isSelected = selectedReqIds.has(req.id);
              const result = results.get(req.id);
              const hasResult = !!result;
              const hasDifference = result && result.userScore && result.aiScore !== result.userScore;
              const isExpanded = expandedReqId === req.id;
              const isResultSelected = selectedResultIds.has(req.id);

              return (
                <div
                  key={req.id}
                  className={`border rounded-lg transition ${
                    isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'
                  } ${result ? 'ring-2 ring-green-200' : ''}`}
                >
                  {/* 需求基本信息 */}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* 复选框 */}
                      <button
                        onClick={() => toggleSelectReq(req.id)}
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
                            {/* 第一行：标题 + 业务域标签 */}
                            <div className="flex items-center gap-2 mb-1.5">
                              <h3 className="font-bold text-gray-900 text-base">{req.name}</h3>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                {req.businessDomain === '自定义'
                                  ? (req.customBusinessDomain || '自定义业务域')
                                  : (req.businessDomain || '国际零售通用')}
                              </span>
                            </div>

                            {/* 第二行：权重分 + 星级 */}
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

                            {/* 第三行：小字信息 */}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600 mb-2">
                              <span>提交人: {req.submitterName || '未填写'}</span>
                              <span>•</span>
                              <span>部门: {req.submitter}</span>
                              <span>•</span>
                              <span>产品经理: {req.productManager || '未分配'}</span>
                              <span>•</span>
                              <span>研发负责人: {req.developer || '未分配'}</span>
                              <span>•</span>
                              <span>技术进展: {req.techProgress}</span>
                              <span>•</span>
                              <span>提交日期: {req.submitDate}</span>
                            </div>

                            {/* 第四行：带底色的评分和关键信息版块 */}
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

                                {/* 工作量 */}
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-700">工作量:</span>
                                  <span className="text-lg font-bold text-gray-900">{req.effortDays || '-'}</span>
                                  <span className="text-gray-500">天</span>
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
                                  onClick={() => toggleSelectResult(req.id)}
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
                                  onClick={() => handleApplySingleScore(req.id)}
                                  className="mt-2 w-full px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition"
                                >
                                  应用此评分
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 展开/收起详情按钮 */}
                        <button
                          onClick={() => setExpandedReqId(isExpanded ? null : req.id)}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp size={16} />
                              收起详情
                            </>
                          ) : (
                            <>
                              <ChevronDown size={16} />
                              展开详情
                            </>
                          )}
                        </button>

                        {/* 详细信息（展开时显示需求相关性和影响指标） */}
                        {isExpanded && (
                          <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm space-y-4">
                            {/* 需求相关性 */}
                            <div>
                              <div className="font-medium mb-3 text-gray-700 flex items-center gap-2">
                                <span>🎯 需求相关性</span>
                              </div>
                              <div className="bg-blue-50 rounded-lg px-4 py-3 border border-blue-200">
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  {/* 业务团队 */}
                                  <div>
                                    <div className="font-medium text-gray-700 mb-1.5">业务团队</div>
                                    <div className="text-gray-900">
                                      {req.businessTeam || <span className="text-gray-400">未填写</span>}
                                    </div>
                                  </div>

                                  {/* 门店类型 */}
                                  <div>
                                    <div className="font-medium text-gray-700 mb-1.5">门店类型</div>
                                    {req.impactScope && req.impactScope.storeTypes.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {req.impactScope.storeTypes.map((type, idx) => (
                                          <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                            {type}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">未填写</span>
                                    )}
                                  </div>

                                  {/* 门店数量 */}
                                  <div>
                                    <div className="font-medium text-gray-700 mb-1.5">门店数量</div>
                                    <div className="text-blue-900 font-semibold">
                                      {req.impactScope?.storeCountRange || <span className="text-gray-400 font-normal">未填写</span>}
                                    </div>
                                  </div>

                                  {/* 影响地区 */}
                                  <div>
                                    <div className="font-medium text-gray-700 mb-1.5">影响地区</div>
                                    {req.impactScope && req.impactScope.regions.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {req.impactScope.regions.map((region, idx) => (
                                          <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                            {region}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">未填写</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 影响的指标 */}
                            <div>
                              <div className="font-medium mb-3 text-gray-700 flex items-center gap-2">
                                <span>📊 影响的指标</span>
                                {req.affectedMetrics && req.affectedMetrics.length > 0 && (
                                  <span className="text-xs font-normal text-gray-500">（{req.affectedMetrics.length}个指标）</span>
                                )}
                              </div>
                              {req.affectedMetrics && req.affectedMetrics.length > 0 ? (
                                <div className="space-y-3">
                                  {/* 核心OKR指标 */}
                                  {req.affectedMetrics.filter(m => m.category === 'okr').length > 0 && (
                                    <div>
                                      <div className="text-xs font-semibold text-purple-800 mb-2">核心OKR指标</div>
                                      <div className="grid grid-cols-2 gap-3">
                                        {req.affectedMetrics.filter(m => m.category === 'okr').map((metric, idx) => (
                                          <div key={idx} className="text-xs bg-purple-50 rounded px-3 py-2 border border-purple-200">
                                            <div className="font-medium text-gray-900">{metric.displayName}</div>
                                            <div className="text-purple-700 mt-0.5 font-semibold">预估影响: {metric.estimatedImpact}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* 过程指标 */}
                                  {req.affectedMetrics.filter(m => m.category === 'process').length > 0 && (
                                    <div>
                                      <div className="text-xs font-semibold text-blue-800 mb-2">过程指标</div>
                                      <div className="grid grid-cols-2 gap-3">
                                        {req.affectedMetrics.filter(m => m.category === 'process').map((metric, idx) => (
                                          <div key={idx} className="text-xs bg-blue-50 rounded px-3 py-2 border border-blue-200">
                                            <div className="font-medium text-gray-900">{metric.displayName}</div>
                                            <div className="text-blue-700 mt-0.5 font-semibold">预估影响: {metric.estimatedImpact}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400 bg-white rounded px-4 py-3 border border-gray-200">
                                  未填写影响的指标
                                </div>
                              )}
                            </div>
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
