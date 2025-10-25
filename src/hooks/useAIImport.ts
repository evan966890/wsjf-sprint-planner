/**
 * useAIImport Hook
 *
 * AI智能导入功能集合：
 * - buildImportAIPrompt: 构建AI分析Prompt
 * - analyzeRequirementWithAI: 调用AI API分析单条需求
 * - handleAISmartFill: 批量AI智能填充
 *
 * @module hooks/useAIImport
 */

import { useStore } from '../store/useStore';
import { useToast } from './useToast';
import type { AIModelType } from '../types';

// 导入配置
import { OPENAI_API_KEY, DEEPSEEK_API_KEY } from '../config/api';
import { SCORING_STANDARDS } from '../config/scoringStandards';
import { COMPLEXITY_STANDARDS } from '../config/complexityStandards';
import { OKR_METRICS, PROCESS_METRICS } from '../config/metrics';
import {
  BUSINESS_DOMAINS,
  REQUIREMENT_TYPES,
  REGIONS,
  STORE_TYPES,
  TIME_CRITICALITY
} from '../config/businessFields';

// 导入常量
import { TECH_PROGRESS, PRODUCT_PROGRESS } from '../constants/techProgress';
import { buildAIImportPromptTemplate } from '../constants/aiImportPromptTemplate';

export function useAIImport() {
  // 获取 store 状态和 actions
  const importData = useStore((state) => state.importData);
  const selectedAIModel = useStore((state) => state.selectedAIModel);

  // Toast 通知系统
  const { showToast, dismissToast, terminationToastIdRef } = useToast();

  /**
   * 构建导入AI智能填充的Prompt
   *
   * @param rawRow - Excel原始行数据
   * @param config - 所有配置数据（枚举选项、评分标准等）
   * @returns 完整的AI prompt字符串
   */
  const buildImportAIPrompt = (
    rawRow: Record<string, any>,
    config: {
      okrMetrics: typeof OKR_METRICS;
      processMetrics: typeof PROCESS_METRICS;
      scoringStandards: typeof SCORING_STANDARDS;
      complexityStandards: typeof COMPLEXITY_STANDARDS;
      businessDomains: string[];
      requirementTypes: string[];
      regions: string[];
      storeTypes: string[];
      productAreas: string[];
      timeCriticalityOptions: string[];
    }
  ): string => {
    // 格式化原始数据
    const rawDataStr = JSON.stringify(rawRow, null, 2);
    return buildAIImportPromptTemplate(rawDataStr, config);
  };

  /**
   * 调用AI分析单条需求
   *
   * @param rawRow - Excel原始行数据
   * @param config - 配置数据
   * @param selectedModel - 选择的AI模型
   * @returns AI填充后的需求对象
   */
  const analyzeRequirementWithAI = async (
    rawRow: Record<string, any>,
    config: Parameters<typeof buildImportAIPrompt>[1],
    selectedModel: AIModelType
  ): Promise<any> => {
    const { addAIAnalysisLog } = useStore.getState();

    const apiKey = selectedModel === 'openai' ? OPENAI_API_KEY : DEEPSEEK_API_KEY;
    const modelName = selectedModel === 'openai' ? 'OpenAI' : 'DeepSeek';

    if (!apiKey) {
      throw new Error(`${modelName} API Key未配置`);
    }

    addAIAnalysisLog(`📡 正在调用 ${modelName} API...`);

    // 构建prompt
    const prompt = buildImportAIPrompt(rawRow, config);
    addAIAnalysisLog(`📝 Prompt已生成，长度: ${prompt.length} 字符`);

    // 根据选择的模型构建API请求
    let apiUrl: string;
    let requestBody: any;

    if (selectedModel === 'openai') {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      requestBody = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是WSJF需求管理系统的数据分析助手，擅长从Excel数据中智能推导需求字段。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // 降低temperature提高准确性
        max_tokens: 3000  // 增加token限制以支持30+字段
      };
    } else {
      // DeepSeek
      apiUrl = 'https://api.deepseek.com/v1/chat/completions';
      requestBody = {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是WSJF需求管理系统的数据分析助手，擅长从Excel数据中智能推导需求字段。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 3000
      };
    }

    // 调用AI API
    addAIAnalysisLog(`⏳ 等待 ${modelName} 响应...`);
    const startTime = Date.now();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);
    addAIAnalysisLog(`✅ ${modelName} 响应成功 (耗时 ${responseTime}秒)`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || response.statusText;
      addAIAnalysisLog(`❌ API请求失败: ${errorMsg}`);
      throw new Error(`${modelName} API请求失败 (${response.status}): ${errorMsg}`);
    }

    const result = await response.json();

    if (!result.choices || result.choices.length === 0) {
      addAIAnalysisLog(`❌ API返回数据格式异常`);
      throw new Error('API返回数据格式异常');
    }

    const aiText = result.choices[0]?.message?.content || '';

    if (!aiText) {
      addAIAnalysisLog(`❌ API返回数据为空`);
      throw new Error('API返回数据为空');
    }

    addAIAnalysisLog(`📥 收到AI响应，长度: ${aiText.length} 字符`);

    // 从AI返回的文本中提取JSON
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      addAIAnalysisLog(`❌ 无法解析JSON，原始内容: ${aiText.substring(0, 100)}...`);
      throw new Error(`无法解析AI返回的JSON。返回内容：${aiText.substring(0, 200)}...`);
    }

    const aiFilledData = JSON.parse(jsonMatch[0]);

    // 记录推导的字段
    const filledFields = aiFilledData._aiFilledFields || [];
    addAIAnalysisLog(`🎯 成功推导 ${filledFields.length} 个字段`);

    // 记录关键字段的推导结果
    if (aiFilledData.businessImpactScore) {
      addAIAnalysisLog(`  └─ 业务影响度: ${aiFilledData.businessImpactScore}分`);
    }
    if (aiFilledData.complexityScore) {
      addAIAnalysisLog(`  └─ 技术复杂度: ${aiFilledData.complexityScore}分`);
    }
    if (aiFilledData.productArea) {
      addAIAnalysisLog(`  └─ 产品领域: ${aiFilledData.productArea}`);
    }
    if (aiFilledData.affectedMetrics && aiFilledData.affectedMetrics.length > 0) {
      addAIAnalysisLog(`  └─ 影响指标: ${aiFilledData.affectedMetrics.map((m: any) => m.displayName).join(', ')}`);
    }

    // 生成唯一ID
    const uniqueId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    aiFilledData.id = uniqueId;

    // 设置默认选中状态
    aiFilledData._isSelected = true;
    aiFilledData._aiAnalysisStatus = 'success';

    return aiFilledData;
  };

  /**
   * 批量AI智能填充
   * 遍历所有导入数据，逐条调用AI分析
   */
  const handleAISmartFill = async () => {
    const {
      setIsAIFillingLoading,
      setAIFillingProgress,
      setAIFillingCurrentIndex,
      setAIFillingCurrentName,
      setAIFilledData,
      setAIFillingCancelled,
      clearAIAnalysisLogs,
      addAIAnalysisLog
    } = useStore.getState();

    // 检查是否有导入数据
    if (!importData || importData.length === 0) {
      setTimeout(() => showToast('请先导入Excel文件', 'error'), 0);
      return;
    }

    // 检查API Key
    const apiKey = selectedAIModel === 'openai' ? OPENAI_API_KEY : DEEPSEEK_API_KEY;
    const modelName = selectedAIModel === 'openai' ? 'OpenAI' : 'DeepSeek';

    if (!apiKey) {
      setTimeout(() => showToast(`AI智能填充功能未配置。请联系管理员在代码中配置 ${modelName} API Key。`, 'error'), 0);
      return;
    }

    // 延迟所有 state 更新，避免立即触发重渲染导致跳转
    await new Promise(resolve => setTimeout(resolve, 0));

    // 重置取消标志和日志
    setAIFillingCancelled(false);
    clearAIAnalysisLogs();
    addAIAnalysisLog(`🚀 开始AI智能填充，共 ${importData.length} 条需求`);
    addAIAnalysisLog(`✨ 使用模型: ${selectedAIModel === 'deepseek' ? 'DeepSeek' : 'OpenAI GPT'}`);
    addAIAnalysisLog(`⏱️ 预计耗时: ${Math.ceil(importData.length * 3 / 60)}分${importData.length * 3 % 60}秒`);
    showToast(`开始AI智能填充，使用 ${modelName} 分析 ${importData.length} 条需求...`, 'info');

    // 准备配置数据
    const productAreas = [
      '管店/固资/物 @张普',
      'toC卖货/导购/AI/培训/营销 @杜玥',
      '管人/SO上报/考勤 @胡馨然',
      'toB进货/交易/返利 @李建国'
    ];

    // 扁平化regions数组
    const flatRegions: string[] = [];
    REGIONS.forEach(region => {
      flatRegions.push(region.name);
      if (region.subRegions) {
        flatRegions.push(...region.subRegions);
      }
      if (region.countries) {
        flatRegions.push(...region.countries);
      }
    });

    const config = {
      okrMetrics: OKR_METRICS,
      processMetrics: PROCESS_METRICS,
      scoringStandards: SCORING_STANDARDS,
      complexityStandards: COMPLEXITY_STANDARDS,
      businessDomains: Array.from(BUSINESS_DOMAINS),
      requirementTypes: Array.from(REQUIREMENT_TYPES),
      regions: flatRegions,
      storeTypes: Array.from(STORE_TYPES),
      productAreas,
      timeCriticalityOptions: Array.from(TIME_CRITICALITY)
    };

    // 开始分析
    setIsAIFillingLoading(true);
    setAIFillingProgress(0);
    const totalCount = importData.length;
    const filledResults: any[] = [];

    try {
      for (let i = 0; i < totalCount; i++) {
        // 检查是否被取消
        const { aiFillingCancelled, addAIAnalysisLog: log } = useStore.getState();
        if (aiFillingCancelled) {
          log(`⏹️ 用户手动终止分析`);

          // 移除持久的"正在终止"提示
          if (terminationToastIdRef.current !== null) {
            dismissToast(terminationToastIdRef.current);
            terminationToastIdRef.current = null;
          }

          // 显示终止详情，使用更长的显示时间（6秒）
          showToast(`⚠️ AI分析已终止！已完成：${i}条，未完成：${totalCount - i}条。已分析的数据已保存，您可以查看结果。`, 'info', { duration: 6000 });
          break;
        }

        const rawRow = importData[i];

        // 提取需求名称用于显示进度
        let requirementName = rawRow['需求名称'] || rawRow['name'] || rawRow['需求'] || `需求${i + 1}`;
        if (typeof requirementName !== 'string') {
          requirementName = String(requirementName);
        }

        // 更新进度
        setAIFillingCurrentIndex(i);
        setAIFillingCurrentName(requirementName);
        setAIFillingProgress(Math.round(((i) / totalCount) * 100));

        log(`\n━━━━━ 第 ${i + 1}/${totalCount} 条 ━━━━━`);
        log(`📋 需求名称: ${requirementName}`);

        try {
          // 调用AI分析
          const filledData = await analyzeRequirementWithAI(rawRow, config, selectedAIModel);
          filledResults.push(filledData);
          log(`✅ 分析完成`);
        } catch (error) {
          console.error(`分析需求 "${requirementName}" 失败:`, error);
          log(`❌ 分析失败: ${error instanceof Error ? error.message : '未知错误'}`);

          // 创建失败记录，保留原始数据
          const failedData: any = {
            id: `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: requirementName,
            description: JSON.stringify(rawRow),
            submitterName: '',
            submitDate: new Date().toISOString().split('T')[0],
            submitter: '产品',
            businessTeam: '',
            businessDomain: '新零售',
            type: '功能开发',
            effortDays: 5,
            productManager: '',
            developer: '',
            productProgress: PRODUCT_PROGRESS.PENDING,
            techProgress: TECH_PROGRESS.NOT_EVALUATED,
            hardDeadline: false,
            isRMS: false,
            _aiAnalysisStatus: 'failed',
            _aiErrorMessage: error instanceof Error ? error.message : '未知错误',
            _isSelected: false
          };

          filledResults.push(failedData);
        }

        // 每条之间延迟100ms，避免API限流
        if (i < totalCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // 分析完成
      setAIFilledData(filledResults);
      setAIFillingProgress(100);

      const successCount = filledResults.filter(r => r._aiAnalysisStatus === 'success').length;
      const failedCount = filledResults.filter(r => r._aiAnalysisStatus === 'failed').length;

      // 移除持久的"正在终止"提示（如果还存在）
      if (terminationToastIdRef.current !== null) {
        dismissToast(terminationToastIdRef.current);
        terminationToastIdRef.current = null;
      }

      // 显示完成总结，使用更长的显示时间（6秒）
      showToast(`AI智能填充完成！✅ 成功: ${successCount} 条，❌ 失败: ${failedCount} 条。请在预览表格中检查结果。`, 'success', { duration: 6000 });
    } catch (error) {
      console.error('AI智能填充过程中发生错误:', error);
      showToast(`AI智能填充失败：${error instanceof Error ? error.message : '未知错误'}`, 'error');
    } finally {
      setIsAIFillingLoading(false);
    }
  };

  return {
    buildImportAIPrompt,
    analyzeRequirementWithAI,
    handleAISmartFill,
  };
}
