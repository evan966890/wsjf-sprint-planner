/**
 * AI 分析功能 Hook
 *
 * 功能：
 * - 调用 AI API 分析需求
 * - 解析文档内容
 * - AI 打分建议
 * - 结果采纳管理
 * - 进度和错误处理
 */

import { useState, useCallback } from 'react';
import type { Requirement, AIModelType, AIAnalysisResult, AffectedMetric, AIRequestBody } from '../../../types';
import { OPENAI_API_KEY, DEEPSEEK_API_KEY } from '../../../config/api';
import { formatAIPrompt, AI_SYSTEM_MESSAGE } from '../../../config/aiPrompts';
import { getAllMetrics } from '../../../config/metrics';
import type { UploadedFileInfo } from './useDocumentManager';

export type AIAdoptionStatus = 'pending' | 'adopted' | 'ignored' | 'partial';

interface AIAdoptedItems {
  score: boolean;
  okrMetrics: boolean;
  processMetrics: boolean;
}

/**
 * 验证并修复AI返回的指标数据
 * 确保所有 metricKey 都存在于系统定义中
 */
function validateAndFixMetrics(metrics: any[]): AffectedMetric[] {
  const allMetrics = getAllMetrics();
  const validMetricKeys = new Set(allMetrics.map(m => m.key));

  const validatedMetrics: AffectedMetric[] = [];

  for (const metric of metrics) {
    if (!metric.metricKey) {
      console.warn('AI返回的指标缺少 metricKey，已跳过:', metric);
      continue;
    }

    // 检查 metricKey 是否有效
    if (!validMetricKeys.has(metric.metricKey)) {
      console.warn(`AI返回的 metricKey "${metric.metricKey}" 不存在于系统定义中，已跳过`, metric);
      continue;
    }

    // 从系统定义中获取正确的指标信息
    const metricDef = allMetrics.find(m => m.key === metric.metricKey);
    if (!metricDef) continue;

    validatedMetrics.push({
      metricKey: metric.metricKey,
      metricName: metricDef.defaultName, // 使用系统定义的名称
      displayName: metricDef.defaultName,
      estimatedImpact: metric.estimatedImpact || '',
      category: metricDef.type // 使用系统定义的类型 (okr/process)
    });
  }

  return validatedMetrics;
}

export function useAIAnalysis() {
  const [selectedAIModel, setSelectedAIModel] = useState<AIModelType>('deepseek');
  const [lastAnalyzedModel, setLastAnalyzedModel] = useState<AIModelType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adoptionStatus, setAdoptionStatus] = useState<AIAdoptionStatus>('pending');
  const [adoptedItems, setAdoptedItems] = useState<AIAdoptedItems>({
    score: false,
    okrMetrics: false,
    processMetrics: false
  });
  const [adoptedAt, setAdoptedAt] = useState<string | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  /**
   * 切换 AI 模型（带确认）
   */
  const changeModel = useCallback((newModel: AIModelType) => {
    if (lastAnalyzedModel && lastAnalyzedModel !== newModel && analysisResult) {
      const confirmed = window.confirm(
        `切换AI模型将覆盖之前${lastAnalyzedModel === 'openai' ? 'OpenAI' : 'DeepSeek'}的分析结果，是否继续？`
      );
      if (!confirmed) return;
      setAnalysisResult(null);
    }
    setSelectedAIModel(newModel);
  }, [lastAnalyzedModel, analysisResult]);

  /**
   * 内容充足性检查
   */
  const checkContentSufficiency = useCallback((
    description: string,
    uploadedFiles: UploadedFileInfo[],
    documents: any[],
    newDocUrl: string
  ) => {
    const descLength = (description || '').trim().length;
    const hasUploadedFiles = uploadedFiles.filter(f =>
      f.parseStatus === 'success' && (f.parsedWordCount || 0) > 0
    ).length > 0;
    const hasDocLinks = (documents || []).length > 0 || newDocUrl.trim().length > 0;
    const hasFiles = hasUploadedFiles || hasDocLinks;

    return {
      isDescSufficient: descLength >= 50,
      hasFiles,
      canStartAI: descLength >= 50 || hasFiles,
      descLength,
      filesCount: uploadedFiles.length + (documents || []).length
    };
  }, []);

  /**
   * 执行 AI 分析
   */
  const analyze = useCallback(async (
    requirement: Requirement,
    uploadedFiles: UploadedFileInfo[],
    newDocUrl: string,
    newDocTitle: string,
    onAddDocument?: () => void
  ) => {
    // 检查内容充足性
    const sufficiency = checkContentSufficiency(
      requirement.description || '',
      uploadedFiles,
      requirement.documents || [],
      newDocUrl
    );

    if (!sufficiency.canStartAI) {
      setError('内容不足：请补充描述(至少50字)或上传文档');
      return;
    }

    const documentUrl = newDocUrl.trim() ||
      (requirement.documents && requirement.documents.length > 0 ?
        requirement.documents[requirement.documents.length - 1].url || '' : '');
    const reqDescription = requirement.description?.trim() || '';

    // 准备分析内容（包含上传文件的解析结果）
    const filesText = uploadedFiles
      .filter(f => f.parseStatus === 'success' && (f.parsedWordCount || 0) > 0)
      .map(f => `文件名：${f.name}\n内容：${f.parsedContent}`)
      .join('\n\n');

    const apiKey = selectedAIModel === 'openai' ? OPENAI_API_KEY : DEEPSEEK_API_KEY;
    const modelName = selectedAIModel === 'openai' ? 'OpenAI' : 'DeepSeek';

    if (!apiKey) {
      setError(`${modelName} API Key未配置。请在项目根目录的 .env.local 文件中配置 ${selectedAIModel === 'openai' ? 'VITE_OPENAI_API_KEY' : 'VITE_DEEPSEEK_API_KEY'}。`);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setAnalysisProgress(0);
    setAnalysisStep('初始化分析...');

    // 在外部声明timeout引用，以便在finally块中清理
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      // 阶段1：读取文档/需求描述
      setAnalysisProgress(20);
      setAnalysisStep('已读取需求信息');
      await new Promise(resolve => setTimeout(resolve, 300));

      // 阶段2：准备AI分析
      setAnalysisProgress(40);
      setAnalysisStep('正在进行业务影响度分析...');

      // 准备完整的分析内容
      const fullContent = `
需求名称：${requirement.name || '未填写'}

需求描述：
${reqDescription}

${documentUrl ? `文档链接：${documentUrl}\n` : ''}
${filesText ? `上传的文档内容：\n${filesText}` : ''}
      `.trim();

      const prompt = formatAIPrompt(documentUrl, fullContent, requirement.name || '未填写');

      let apiUrl: string;
      let requestBody: AIRequestBody;

      if (selectedAIModel === 'openai') {
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        requestBody = {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: AI_SYSTEM_MESSAGE },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 2000
        };
      } else {
        apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        requestBody = {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: AI_SYSTEM_MESSAGE },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 2000
        };
      }

      // 阶段3：调用AI API（带超时控制）
      setAnalysisProgress(60);
      setAnalysisStep('AI模型分析中...');

      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000);

      let response: Response | undefined;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error?.message || response.statusText;
          throw new Error(`${modelName} API请求失败 (${response.status}): ${errorMsg}`);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          throw new Error(`${modelName} API请求超时（30秒）。请检查网络连接或稍后重试。`);
        }

        if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
          throw new Error(`网络连接失败，无法访问${modelName} API。请检查网络或代理设置。`);
        }

        throw fetchError;
      }

      if (!response) {
        throw new Error('API请求失败，未获取到响应');
      }

      // 阶段4：解析结果
      setAnalysisProgress(80);
      setAnalysisStep('解析分析结果...');

      const result = await response.json();
      const aiText = result.choices?.[0]?.message?.content || '';

      if (!aiText) {
        throw new Error('AI返回数据为空');
      }

      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析AI返回的数据格式');
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      // 提取AI建议的标题
      let suggestedTitle = '';
      if (parsedData.basicInfo?.name && parsedData.basicInfo.name !== '未填写') {
        suggestedTitle = parsedData.basicInfo.name;
      } else if (uploadedFiles.length > 0) {
        const firstFile = uploadedFiles[0];
        suggestedTitle = firstFile.name.replace(/\.(pdf|xlsx|xls|txt)$/i, '');
      } else if (parsedData.reasoning && parsedData.reasoning.length > 0) {
        const firstReason = parsedData.reasoning[0];
        const match = firstReason.match(/(.{10,30})/);
        suggestedTitle = match ? match[1].trim() : '需求标题（待补充）';
      }

      // 构建AI分析结果（使用验证函数确保指标有效）
      const validatedOKRMetrics = validateAndFixMetrics(parsedData.suggestedOKRMetrics || []);
      const validatedProcessMetrics = validateAndFixMetrics(parsedData.suggestedProcessMetrics || []);

      // 如果AI返回了无效的指标，记录警告
      const originalOKRCount = (parsedData.suggestedOKRMetrics || []).length;
      const originalProcessCount = (parsedData.suggestedProcessMetrics || []).length;
      if (validatedOKRMetrics.length < originalOKRCount) {
        console.warn(`AI返回了 ${originalOKRCount} 个OKR指标，但只有 ${validatedOKRMetrics.length} 个有效`);
      }
      if (validatedProcessMetrics.length < originalProcessCount) {
        console.warn(`AI返回了 ${originalProcessCount} 个过程指标，但只有 ${validatedProcessMetrics.length} 个有效`);
      }

      const analysis: AIAnalysisResult = {
        suggestedScore: parsedData.suggestedScore || 5,
        reasoning: parsedData.reasoning || [],
        suggestedOKRMetrics: validatedOKRMetrics,
        suggestedProcessMetrics: validatedProcessMetrics,
        currentScore: requirement.businessImpactScore,
        confidence: 0.8,
        suggestedTitle: suggestedTitle || undefined
      };

      // 如果使用的是新输入的URL且未保存，先保存它
      if (newDocUrl.trim() && newDocTitle.trim() && onAddDocument) {
        onAddDocument();
      }

      // 存储AI分析结果
      setAnalysisResult(analysis);
      setLastAnalyzedModel(selectedAIModel);

      // 重置AI状态为待处理
      setAdoptionStatus('pending');
      setAdoptedItems({ score: false, okrMetrics: false, processMetrics: false });
      setAdoptedAt(null);
      setIsPanelCollapsed(false);

      // 阶段5：完成
      setAnalysisProgress(100);
      setAnalysisStep('分析完成');
      await new Promise(resolve => setTimeout(resolve, 500));

      setAnalysisProgress(0);
      setAnalysisStep('');
    } catch (err) {
      console.error('AI分析失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
      setAnalysisProgress(0);
      setAnalysisStep('');
    } finally {
      // 清理超时定时器
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsAnalyzing(false);
    }
  }, [selectedAIModel, checkContentSufficiency]);

  /**
   * 采纳全部 AI 建议
   */
  const adoptAll = useCallback((
    currentForm: Requirement,
    onUpdate: (updates: Partial<Requirement>) => void
  ) => {
    if (!analysisResult) return;

    const updates: Partial<Requirement> = {
      businessImpactScore: analysisResult.suggestedScore,
      affectedMetrics: [
        ...analysisResult.suggestedOKRMetrics,
        ...analysisResult.suggestedProcessMetrics
      ]
    };

    // 如果当前标题为空且AI有建议标题，自动填充
    if (!currentForm.name.trim() && analysisResult.suggestedTitle) {
      updates.name = analysisResult.suggestedTitle;
    }

    onUpdate(updates);

    setAdoptionStatus('adopted');
    setAdoptedItems({ score: true, okrMetrics: true, processMetrics: true });
    setAdoptedAt(new Date().toISOString());
    setIsPanelCollapsed(true);

    // 滚动到顶部显示标题（如果自动填充了）
    if (!currentForm.name.trim() && analysisResult.suggestedTitle) {
      setTimeout(() => {
        const titleInput = document.querySelector('input[placeholder*="需求名称"]') as HTMLInputElement;
        if (titleInput) {
          titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          titleInput.focus();
          setTimeout(() => titleInput.blur(), 2000);
        }
      }, 800);
    }
  }, [analysisResult]);

  /**
   * 仅采纳评分
   */
  const adoptScoreOnly = useCallback((onUpdate: (updates: Partial<Requirement>) => void) => {
    if (!analysisResult) return;

    onUpdate({ businessImpactScore: analysisResult.suggestedScore });

    const newAdoptedItems = { ...adoptedItems, score: true };
    const allAdopted = newAdoptedItems.score && newAdoptedItems.okrMetrics && newAdoptedItems.processMetrics;

    setAdoptedItems(newAdoptedItems);
    setAdoptionStatus(allAdopted ? 'adopted' : 'partial');
    setAdoptedAt(new Date().toISOString());
    setIsPanelCollapsed(false);
  }, [analysisResult, adoptedItems]);

  /**
   * 仅采纳 OKR 指标
   */
  const adoptOKRMetrics = useCallback((
    currentMetrics: AffectedMetric[],
    onUpdate: (updates: Partial<Requirement>) => void
  ) => {
    if (!analysisResult) return;

    onUpdate({
      affectedMetrics: [
        ...(currentMetrics || []).filter(m => m.category !== 'okr'),
        ...analysisResult.suggestedOKRMetrics
      ]
    });

    const newAdoptedItems = { ...adoptedItems, okrMetrics: true };
    const allAdopted = newAdoptedItems.score && newAdoptedItems.okrMetrics && newAdoptedItems.processMetrics;

    setAdoptedItems(newAdoptedItems);
    setAdoptionStatus(allAdopted ? 'adopted' : 'partial');
    setAdoptedAt(new Date().toISOString());
    setIsPanelCollapsed(false);
  }, [analysisResult, adoptedItems]);

  /**
   * 仅采纳过程指标
   */
  const adoptProcessMetrics = useCallback((
    currentMetrics: AffectedMetric[],
    onUpdate: (updates: Partial<Requirement>) => void
  ) => {
    if (!analysisResult) return;

    onUpdate({
      affectedMetrics: [
        ...(currentMetrics || []).filter(m => m.category !== 'process'),
        ...analysisResult.suggestedProcessMetrics
      ]
    });

    const newAdoptedItems = { ...adoptedItems, processMetrics: true };
    const allAdopted = newAdoptedItems.score && newAdoptedItems.okrMetrics && newAdoptedItems.processMetrics;

    setAdoptedItems(newAdoptedItems);
    setAdoptionStatus(allAdopted ? 'adopted' : 'partial');
    setAdoptedAt(new Date().toISOString());
    setIsPanelCollapsed(false);
  }, [analysisResult, adoptedItems]);

  /**
   * 忽略 AI 建议
   */
  const ignore = useCallback(() => {
    const confirmed = window.confirm('确定忽略AI建议吗？建议将被折叠但保留，可随时查看。');
    if (!confirmed) return;

    setAdoptionStatus('ignored');
    setIsPanelCollapsed(true);
  }, []);

  /**
   * 重新分析
   */
  const reanalyze = useCallback((
    requirement: Requirement,
    uploadedFiles: UploadedFileInfo[],
    newDocUrl: string,
    newDocTitle: string,
    onAddDocument?: () => void
  ) => {
    const confirmed = window.confirm('重新分析将覆盖当前AI建议，是否继续？');
    if (!confirmed) return;

    setAnalysisResult(null);
    setAdoptionStatus('pending');
    setAdoptedItems({ score: false, okrMetrics: false, processMetrics: false });
    setAdoptedAt(null);
    setIsPanelCollapsed(false);

    analyze(requirement, uploadedFiles, newDocUrl, newDocTitle, onAddDocument);
  }, [analyze]);

  /**
   * 重置分析
   */
  const reset = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
    setAnalysisProgress(0);
    setAnalysisStep('');
    setAdoptionStatus('pending');
    setAdoptedItems({ score: false, okrMetrics: false, processMetrics: false });
    setAdoptedAt(null);
    setIsPanelCollapsed(false);
  }, []);

  return {
    // 状态
    selectedAIModel,
    lastAnalyzedModel,
    isAnalyzing,
    analysisProgress,
    analysisStep,
    analysisResult,
    error,
    adoptionStatus,
    adoptedItems,
    adoptedAt,
    isPanelCollapsed,

    // 操作
    changeModel,
    analyze,
    adoptAll,
    adoptScoreOnly,
    adoptOKRMetrics,
    adoptProcessMetrics,
    ignore,
    reanalyze,
    reset,
    setIsPanelCollapsed,
  };
}
