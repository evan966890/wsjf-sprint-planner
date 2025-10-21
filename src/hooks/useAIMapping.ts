/**
 * AI字段映射 Hook
 *
 * 功能：
 * - 使用AI自动映射Excel字段到系统字段
 * - 支持OpenAI和DeepSeek模型
 */

import { OPENAI_API_KEY, DEEPSEEK_API_KEY } from '../config/api';
import type { AIModelType } from '../types';

interface UseAIMappingOptions {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  setIsAIMappingLoading: (loading: boolean) => void;
  setImportMapping: (mapping: Record<string, string>) => void;
}

export function useAIMapping({
  showToast,
  setIsAIMappingLoading,
  setImportMapping,
}: UseAIMappingOptions) {
  /**
   * 使用AI映射字段
   */
  const handleAIMapping = async (
    importData: any[],
    selectedAIModel: AIModelType
  ) => {
    // 根据选择的模型获取对应的API Key
    const apiKey = selectedAIModel === 'openai' ? OPENAI_API_KEY : DEEPSEEK_API_KEY;
    const modelName = selectedAIModel === 'openai' ? 'OpenAI' : 'DeepSeek';

    if (!apiKey) {
      setTimeout(() => {
        showToast(`AI映射功能未配置。请联系管理员在代码中配置 ${modelName} API Key。`, 'error');
      }, 0);
      return;
    }

    // 延迟设置 loading 状态，避免立即触发重渲染导致跳转
    await new Promise(resolve => setTimeout(resolve, 0));

    setIsAIMappingLoading(true);
    showToast(`正在调用 ${modelName} API 分析字段映射，请稍候...`, 'info');

    try {
      const sampleRow = importData[0];
      const fileFields = Object.keys(sampleRow);
      const systemFields = {
        name: '需求名称（必填）',
        submitterName: '提交人姓名',
        productManager: '产品经理',
        developer: '开发人员',
        effortDays: '工作量（天数）',
        bv: '业务影响度（局部/明显/撬动核心/战略平台）',
        tc: '时间临界（随时/三月窗口/一月硬窗口）',
        hardDeadline: '是否有强制截止日期（true/false）',
        techProgress: '技术进展（未评估/已评估工作量/已完成技术方案）',
        productProgress: '产品进展（未评估/设计中/开发中/已完成）',
        type: '需求类型（功能开发/技术债/Bug修复）',
        submitDate: '提交日期',
        submitter: '提交方（产品/技术/运营/业务）',
        isRMS: '是否RMS需求（true/false）'
      };

      const prompt = `你是一个数据映射专家。请将Excel文件的列名映射到系统字段。

系统字段（目标）：
${Object.entries(systemFields).map(([key, desc]) => `- ${key}: ${desc}`).join('\n')}

Excel文件列名（来源）：
${fileFields.map((field, index) => `${index + 1}. ${field}`).join('\n')}

示例数据（第一行）：
${JSON.stringify(sampleRow, null, 2)}

请分析列名和示例数据，返回最合理的映射关系。只返回JSON格式，不要其他解释：
{"systemField1": "excelColumn1", "systemField2": "excelColumn2", ...}

注意：
1. 如果某个Excel列无法映射到任何系统字段，不要包含在结果中
2. 确保name字段必须被映射（这是必填字段）
3. 对于布尔值字段（hardDeadline、isRMS），尝试识别"是/否"、"有/无"、"true/false"等表示`;

      // 根据选择的模型构建不同的API请求
      let apiUrl: string;
      let requestBody: any;

      if (selectedAIModel === 'openai') {
        // OpenAI API配置
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        requestBody = {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的数据映射专家，擅长分析Excel列名和系统字段的对应关系。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        };
      } else {
        // DeepSeek API配置
        apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        requestBody = {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的数据映射专家，擅长分析Excel列名和系统字段的对应关系。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
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
        throw new Error(`${modelName} API请求失败 (${response.status}): ${errorMsg}\n\n可能原因：\n1. API Key无效或已过期\n2. API Key权限不足\n3. 超出API配额限制\n4. 网络连接问题\n\n请检查API Key配置`);
      }

      const result = await response.json();

      // 检查API返回的结果
      if (!result.choices || result.choices.length === 0) {
        throw new Error('API返回数据格式异常：没有返回结果');
      }

      const aiText = result.choices[0]?.message?.content || '';

      if (!aiText) {
        throw new Error('API返回数据为空');
      }

      // 从AI返回的文本中提取JSON
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiMapping = JSON.parse(jsonMatch[0]);
        setImportMapping(aiMapping);
        showToast(`${modelName} AI映射完成！请检查映射结果`, 'success');
      } else {
        throw new Error(`无法解析AI返回的映射结果。AI返回内容：\n${aiText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.error('AI映射失败:', error);
      let errorMessage = 'AI映射失败：';

      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage += '网络连接失败，请检查网络连接或防火墙设置';
      } else if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += '未知错误';
      }

      showToast(errorMessage, 'error');
    } finally {
      setIsAIMappingLoading(false);
    }
  };

  return {
    handleAIMapping,
  };
}
