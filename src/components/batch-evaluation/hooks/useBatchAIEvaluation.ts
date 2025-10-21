/**
 * 批量 AI 评估 Hook
 *
 * 功能：
 * - 批量调用 AI API 评估业务影响度
 * - 进度跟踪
 * - 结果管理
 * - 错误处理
 * - 支持 OpenAI 和 DeepSeek 两种模型
 */

import { useState, useCallback } from 'react';
import type { Requirement, BusinessImpactScore, AIModelType, AIRequestBody } from '../../../types';
import { OPENAI_API_KEY, DEEPSEEK_API_KEY } from '../../../config/api';

export interface EvaluationResult {
  reqId: string;
  aiScore: BusinessImpactScore;
  userScore?: BusinessImpactScore;
  reasoning: string;
  aiSuggestions?: {
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
   * 构建评估提示词
   */
  const buildEvaluationPrompt = useCallback((req: Requirement): string => {
    return `你是小米国际零售业务的需求评估专家。请基于WSJF-Lite方法论，为以下需求评估业务影响度分数（1-10分），并分析影响范围和关键指标。

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
  }, []);

  /**
   * 评估单个需求
   */
  const evaluateRequirement = useCallback(async (
    req: Requirement,
    aiModel: AIModelType
  ): Promise<EvaluationResult> => {
    const apiKey = aiModel === 'openai' ? OPENAI_API_KEY : DEEPSEEK_API_KEY;
    const modelName = aiModel === 'openai' ? 'OpenAI' : 'DeepSeek';

    if (!apiKey) {
      throw new Error(`${modelName} API Key 未配置`);
    }

    // 构建提示词
    const prompt = buildEvaluationPrompt(req);

    // 根据模型构建API请求
    let apiUrl: string;
    let requestBody: AIRequestBody;

    if (aiModel === 'openai') {
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
  }, [buildEvaluationPrompt]);

  /**
   * 批量评估需求
   */
  const batchEvaluate = useCallback(async (
    requirements: Requirement[],
    selectedIds: Set<string>,
    aiModel: AIModelType
  ): Promise<Map<string, EvaluationResult>> => {
    const apiKey = aiModel === 'openai' ? OPENAI_API_KEY : DEEPSEEK_API_KEY;
    const modelName = aiModel === 'openai' ? 'OpenAI' : 'DeepSeek';

    if (!apiKey) {
      throw new Error(`AI评估功能未配置。请配置 ${modelName} API Key。\n\n在项目根目录创建 .env.local 文件，添加：\n${aiModel === 'openai' ? 'VITE_OPENAI_API_KEY' : 'VITE_DEEPSEEK_API_KEY'}=你的API-Key`);
    }

    if (selectedIds.size === 0) {
      throw new Error('请至少选择一个需求进行评估');
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
          const result = await evaluateRequirement(req, aiModel);
          newResults.set(reqId, result);
          current++;
          setProgress({ current, total: selectedIds.size });
        } catch (error) {
          console.error(`评估需求 ${req.name} 失败:`, error);
          // 继续评估其他需求
        }
      }

      setResults(newResults);
      return newResults;
    } finally {
      setIsEvaluating(false);
    }
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
