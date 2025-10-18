/**
 * WSJF Sprint Planner - AI文档分析组件
 *
 * v1.2.0: AI智能填写功能
 *
 * 功能：
 * - 支持从PRD文档URL提取需求信息
 * - 使用OpenAI或DeepSeek分析文档内容
 * - 自动填充业务影响度、影响范围等字段
 */

import { useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import type { Requirement, AIModelType } from '../types';
import { OPENAI_API_KEY, DEEPSEEK_API_KEY } from '../config/api';

interface AIDocumentAnalyzerProps {
  /** AI分析完成后的回调 */
  onAnalysisComplete: (data: Partial<Requirement>) => void;

  /** 当前选择的AI模型 */
  selectedModel: AIModelType;

  /** 切换AI模型的回调 */
  onModelChange: (model: AIModelType) => void;
}

/**
 * AI文档分析组件
 */
const AIDocumentAnalyzer = ({
  onAnalysisComplete,
  selectedModel,
  onModelChange
}: AIDocumentAnalyzerProps) => {
  const [documentUrl, setDocumentUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * 分析文档
   */
  const handleAnalyze = async () => {
    if (!documentUrl.trim()) {
      setError('请输入文档链接');
      return;
    }

    const apiKey = selectedModel === 'openai' ? OPENAI_API_KEY : DEEPSEEK_API_KEY;
    const modelName = selectedModel === 'openai' ? 'OpenAI' : 'DeepSeek';

    if (!apiKey) {
      setError(`${modelName} API Key未配置。请联系管理员配置环境变量。`);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setSuccess(false);

    try {
      // 提示词
      const prompt = `请分析以下PRD文档链接的内容，提取需求的关键信息：

文档链接：${documentUrl}

请尽可能提取以下信息（如果文档中没有某项信息，该字段留空）：

1. 需求名称：简洁明了的需求标题
2. 需求描述：背景、目标、预期效果（100-200字）
3. 业务影响度（1-10分）：根据影响范围和重要性评估
4. 影响的门店类型：新零售-直营店、新零售-授权店、新零售-专卖店、渠道零售门店、与门店无关
5. 影响的区域：南亚、东南亚、欧洲等
6. 涉及的关键角色：店长、区域经理、GTM等
7. 涉及门店数量范围：<10家、10-50家、50-200家等
8. 上线时间窗口：随时、三月窗口、一月硬窗口
9. 是否有强制截止日期：是/否
10. 截止日期：YYYY-MM-DD格式
11. 业务团队：开店团队、门店销售团队等

请以JSON格式返回结果，格式如下：
{
  "name": "需求名称",
  "description": "需求描述",
  "businessImpactScore": 5,
  "storeTypes": ["新零售-直营店"],
  "regions": ["南亚"],
  "keyRoles": ["店长", "区域经理"],
  "storeCountRange": "50-200家",
  "timeCriticality": "三月窗口",
  "hardDeadline": false,
  "deadlineDate": "2025-12-31",
  "businessTeam": "门店销售团队"
}

注意：只返回JSON，不要其他解释。如果无法访问文档内容，请基于URL和常识做合理推测。`;

      // 构建API请求
      let apiUrl: string;
      let requestBody: any;

      if (selectedModel === 'openai') {
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        requestBody = {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的产品需求分析专家，擅长从PRD文档中提取关键信息。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1500
        };
      } else {
        apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        requestBody = {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的产品需求分析专家，擅长从PRD文档中提取关键信息。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1500
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
        throw new Error(`${modelName} API请求失败 (${response.status}): ${errorMsg}`);
      }

      const result = await response.json();
      const aiText = result.choices?.[0]?.message?.content || '';

      if (!aiText) {
        throw new Error('AI返回数据为空');
      }

      // 提取JSON
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析AI返回的数据格式');
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      // 转换为Requirement格式
      const requirementData: Partial<Requirement> = {
        name: parsedData.name || '',
        description: parsedData.description || '',
        businessImpactScore: parsedData.businessImpactScore || 5,
        impactScope: {
          storeTypes: parsedData.storeTypes || [],
          regions: parsedData.regions || [],
          keyRoles: (parsedData.keyRoles || []).map((role: string) => ({
            category: 'hq-common' as any,
            roleName: role,
            isCustom: false
          })),
          storeCountRange: parsedData.storeCountRange
        },
        timeCriticality: parsedData.timeCriticality || '随时',
        hardDeadline: parsedData.hardDeadline || false,
        deadlineDate: parsedData.deadlineDate,
        businessTeam: parsedData.businessTeam,
        documents: [
          {
            id: `DOC-${Date.now()}`,
            fileName: 'PRD文档',
            fileType: 'link',
            fileSize: 0,
            uploadedAt: new Date().toISOString(),
            url: documentUrl
          }
        ]
      };

      onAnalysisComplete(requirementData);
      setSuccess(true);
      setDocumentUrl('');

      // 3秒后清除成功提示
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('AI分析失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={18} className="text-purple-600" />
        <h4 className="font-semibold text-gray-900">AI智能填写</h4>
        <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Beta</span>
      </div>

      <p className="text-sm text-gray-600 mb-3">
        输入PRD文档链接，AI将自动分析并填充需求信息
      </p>

      {/* AI模型选择 */}
      <div className="flex items-center gap-2 mb-3">
        <label className="text-xs font-medium text-gray-700">AI模型：</label>
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value as AIModelType)}
          disabled={isAnalyzing}
          className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
        >
          <option value="deepseek">DeepSeek（推荐国内）</option>
          <option value="openai">OpenAI（推荐海外）</option>
        </select>
      </div>

      {/* 文档URL输入 */}
      <div className="flex gap-2 mb-3">
        <input
          type="url"
          placeholder="输入PRD文档链接（如飞书文档、Google Docs等）"
          value={documentUrl}
          onChange={(e) => setDocumentUrl(e.target.value)}
          disabled={isAnalyzing}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzing || !documentUrl.trim()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader size={16} className="animate-spin" />
              分析中...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              智能分析
            </>
          )}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium mb-1">分析失败</div>
            <div className="text-xs">{error}</div>
          </div>
        </div>
      )}

      {/* 成功提示 */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle size={16} />
          <span className="font-medium">AI分析完成！已自动填充表单</span>
        </div>
      )}

      {/* 使用提示 */}
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
        <div className="font-medium mb-1">💡 使用提示：</div>
        <ul className="space-y-0.5 ml-4 list-disc">
          <li>支持飞书文档、Google Docs、Notion等在线文档</li>
          <li>AI将尝试提取需求的关键信息并自动填充</li>
          <li>分析后请检查并调整AI填写的内容</li>
          <li>如果文档无法访问，AI会基于URL做合理推测</li>
        </ul>
      </div>
    </div>
  );
};

export default AIDocumentAnalyzer;
