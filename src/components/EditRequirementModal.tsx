/**
 * WSJF Sprint Planner - 编辑需求弹窗组件 (v1.2.1 - 重构版)
 *
 * v1.2.1 核心改进：
 * - 单列布局，更清晰简洁
 * - 文档管理与AI分析整合
 * - 改进指标选择器交互
 * - 优化整体宽度和间距
 */

import { useState, useMemo, useEffect } from 'react';
import { X, Save, Info, Link as LinkIcon, Users, Store, Target, Sparkles, Loader, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import type { Requirement, BusinessImpactScore, ComplexityScore, AffectedMetric, Document, AIModelType, AIAnalysisResult } from '../types';
import { useStore } from '../store/useStore';
import BusinessImpactScoreSelector from './BusinessImpactScoreSelector';
import MetricSelector from './MetricSelector';
import ScoringStandardsHandbook from './ScoringStandardsHandbook';
import { OPENAI_API_KEY, DEEPSEEK_API_KEY } from '../config/api';
import { formatAIPrompt, AI_SYSTEM_MESSAGE } from '../config/aiPrompts';
import {
  getStoreTypesByDomain,
  getRoleConfigsByDomain,
  REGIONS,
  STORE_COUNT_RANGES,
  TIME_CRITICALITY_DESCRIPTIONS
} from '../config/businessFields';
import { COMPLEXITY_STANDARDS } from '../config/complexityStandards';

interface EditRequirementModalProps {
  requirement: Requirement | null;
  onSave: (req: Requirement) => void;
  onClose: () => void;
  isNew?: boolean;
}

const EditRequirementModal = ({
  requirement,
  onSave,
  onClose,
  isNew = false
}: EditRequirementModalProps) => {
  const { scoringStandards, okrMetrics, processMetrics } = useStore();

  const [isHandbookOpen, setIsHandbookOpen] = useState(false);
  const [selectedAIModel, setSelectedAIModel] = useState<AIModelType>('deepseek');
  const [lastAnalyzedModel, setLastAnalyzedModel] = useState<AIModelType | null>(null); // v1.2.1：记录上次使用的AI模型
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
  const [isRelevanceExpanded, setIsRelevanceExpanded] = useState(false);

  // AI分析状态（v1.2.1增强）
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiAnalysisProgress, setAIAnalysisProgress] = useState(0); // 分析进度 0-100
  const [aiAnalysisStep, setAIAnalysisStep] = useState(''); // 当前分析步骤描述
  const [aiAnalysisResult, setAIAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [aiError, setAIError] = useState<string | null>(null);

  // 文档管理状态
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');

  // 表单状态
  const [form, setForm] = useState<Requirement>(requirement || {
    id: `REQ-${Date.now()}`,
    name: '',
    description: '',
    submitterName: '',
    productManager: '',
    developer: '',
    submitDate: new Date().toISOString().split('T')[0],
    submitter: '业务',
    type: '功能开发',
    businessDomain: '国际零售通用',
    businessTeam: '',
    businessImpactScore: 5 as BusinessImpactScore,
    affectedMetrics: [] as AffectedMetric[],
    impactScope: {
      storeTypes: [],
      regions: [],
      keyRoles: [],
      storeCountRange: undefined
    },
    timeCriticality: '随时' as '随时' | '三月窗口' | '一月硬窗口',
    hardDeadline: false,
    deadlineDate: undefined,
    documents: [] as Document[],
    productProgress: '待评估',
    techProgress: '待评估',
    effortDays: 0,
    complexityScore: 5 as ComplexityScore,  // v1.3.0新增：技术复杂度评分
    isRMS: false,
    bv: '明显',
    tc: '随时'
  });

  // 根据业务域更新可选项
  const availableStoreTypes = useMemo(() =>
    getStoreTypesByDomain(form.businessDomain),
    [form.businessDomain]
  );

  const availableRoleConfigs = useMemo(() =>
    getRoleConfigsByDomain(form.businessDomain),
    [form.businessDomain]
  );

  // 当业务域变化时，清理不合法的选项
  useEffect(() => {
    const validStoreTypes = (form.impactScope?.storeTypes || []).filter(
      type => availableStoreTypes.includes(type)
    );

    const availableRoles = availableRoleConfigs.flatMap(c => c.roles);
    const validKeyRoles = (form.impactScope?.keyRoles || []).filter(
      kr => availableRoles.includes(kr.roleName)
    );

    if (validStoreTypes.length !== (form.impactScope?.storeTypes || []).length ||
        validKeyRoles.length !== (form.impactScope?.keyRoles || []).length) {
      setForm(prev => ({
        ...prev,
        impactScope: {
          storeTypes: validStoreTypes,
          regions: prev.impactScope?.regions || [],
          keyRoles: validKeyRoles,
          storeCountRange: prev.impactScope?.storeCountRange
        }
      }));
    }
  }, [form.businessDomain, availableStoreTypes, availableRoleConfigs]);

  // 实时计算预览分数
  const previewScore = useMemo(() => {
    const BV_MAP: Record<string, number> = { '局部': 3, '明显': 6, '撬动核心': 8, '战略平台': 10 };
    const TC_MAP: Record<string, number> = { '随时': 0, '三月窗口': 3, '一月硬窗口': 5 };

    const getWL = (d: number) => {
      const validDays = Math.max(0, Number(d) || 0);
      if (validDays <= 2) return 8;
      if (validDays <= 5) return 7;
      if (validDays <= 14) return 5;
      if (validDays <= 30) return 3;
      if (validDays <= 50) return 2;
      if (validDays <= 100) return 1;
      return 0;
    };

    const raw = (BV_MAP[form.bv || '明显'] || 3) + (TC_MAP[form.tc || '随时'] || 0) + (form.hardDeadline ? 5 : 0) + getWL(form.effortDays);
    const display = Math.round(10 + 90 * (raw - 3) / (28 - 3));

    return { raw, display };
  }, [form.bv, form.tc, form.hardDeadline, form.effortDays]);

  const canEditEffort = form.techProgress === '已评估工作量' || form.techProgress === '已完成技术方案';

  // 添加文档
  const handleAddDocument = () => {
    if (!newDocTitle.trim() || !newDocUrl.trim()) return;

    const newDoc: Document = {
      id: `DOC-${Date.now()}`,
      fileName: newDocTitle,
      fileType: 'link',
      fileSize: 0,  // 链接文档没有实际大小
      uploadedAt: new Date().toISOString(),
      url: newDocUrl
    };

    setForm({
      ...form,
      documents: [...(form.documents || []), newDoc]
    });

    setNewDocTitle('');
    setNewDocUrl('');
  };

  // 删除文档
  const handleRemoveDocument = (index: number) => {
    setForm({
      ...form,
      documents: (form.documents || []).filter((_, i) => i !== index)
    });
  };

  /**
   * 处理AI模型切换
   * v1.2.1：如果之前有AI分析结果，提示用户切换会覆盖
   */
  const handleAIModelChange = (newModel: AIModelType) => {
    // 如果有上次分析的模型且不同于当前选择的模型，提示用户
    if (lastAnalyzedModel && lastAnalyzedModel !== newModel && aiAnalysisResult) {
      const confirmed = window.confirm(
        `切换AI模型将覆盖之前${lastAnalyzedModel === 'openai' ? 'OpenAI' : 'DeepSeek'}的分析结果，是否继续？`
      );

      if (!confirmed) {
        return; // 用户取消切换
      }

      // 用户确认切换，清空之前的分析结果
      setAIAnalysisResult(null);
    }

    setSelectedAIModel(newModel);
  };

  /**
   * AI分析文档（v1.2.1增强版）
   * 包含进度跟踪、详细结果展示、多种采纳选项
   */
  const handleAIAnalyze = async () => {
    const documentUrl = newDocUrl.trim() || (form.documents && form.documents.length > 0 ? form.documents[form.documents.length - 1].url || '' : '');
    const reqDescription = form.description?.trim() || '';

    if (!documentUrl && !reqDescription) {
      setAIError('请先添加文档或填写需求描述');
      return;
    }

    const apiKey = selectedAIModel === 'openai' ? OPENAI_API_KEY : DEEPSEEK_API_KEY;
    const modelName = selectedAIModel === 'openai' ? 'OpenAI' : 'DeepSeek';

    if (!apiKey) {
      setAIError(`${modelName} API Key未配置。请在项目根目录的 .env.local 文件中配置 ${selectedAIModel === 'openai' ? 'VITE_OPENAI_API_KEY' : 'VITE_DEEPSEEK_API_KEY'}。`);
      return;
    }

    setIsAIAnalyzing(true);
    setAIError(null);
    setAIAnalysisResult(null);
    setAIAnalysisProgress(0);
    setAIAnalysisStep('初始化分析...');

    try {
      // 阶段1：读取文档/需求描述
      setAIAnalysisProgress(20);
      setAIAnalysisStep('已读取需求信息');
      await new Promise(resolve => setTimeout(resolve, 300));

      // 阶段2：准备AI分析
      setAIAnalysisProgress(40);
      setAIAnalysisStep('正在进行业务影响度分析...');

      // 使用配置文件中的提示词模板
      const prompt = formatAIPrompt(documentUrl, reqDescription, form.name || '未填写');

      let apiUrl: string;
      let requestBody: any;

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
      setAIAnalysisProgress(60);
      setAIAnalysisStep('AI模型分析中...');

      // 创建超时控制器
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

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

        clearTimeout(timeoutId); // 清除超时定时器

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error?.message || response.statusText;
          throw new Error(`${modelName} API请求失败 (${response.status}): ${errorMsg}`);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId); // 确保清除超时定时器

        // 判断是否为超时错误
        if (fetchError.name === 'AbortError') {
          throw new Error(`${modelName} API请求超时（30秒）。请检查网络连接或稍后重试。`);
        }

        // 网络错误
        if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
          throw new Error(`网络连接失败，无法访问${modelName} API。请检查网络或代理设置。`);
        }

        // 其他错误
        throw fetchError;
      }

      // 确保response存在
      if (!response) {
        throw new Error('API请求失败，未获取到响应');
      }

      // 阶段4：解析结果
      setAIAnalysisProgress(80);
      setAIAnalysisStep('解析分析结果...');

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

      // 构建AI分析结果
      const analysis: AIAnalysisResult = {
        suggestedScore: parsedData.suggestedScore || 5,
        reasoning: parsedData.reasoning || [],
        suggestedOKRMetrics: (parsedData.suggestedOKRMetrics || []).map((m: any) => ({
          ...m,
          displayName: m.metricName
        })),
        suggestedProcessMetrics: (parsedData.suggestedProcessMetrics || []).map((m: any) => ({
          ...m,
          displayName: m.metricName
        })),
        currentScore: form.businessImpactScore,
        confidence: 0.8
      };

      // 如果使用的是新输入的URL且未保存，先保存它
      if (newDocUrl.trim() && newDocTitle.trim()) {
        handleAddDocument();
      }

      // 存储AI分析结果
      setAIAnalysisResult(analysis);
      setLastAnalyzedModel(selectedAIModel);
      setNewDocUrl('');

      // 阶段5：完成
      setAIAnalysisProgress(100);
      setAIAnalysisStep('分析完成');
      await new Promise(resolve => setTimeout(resolve, 500));

      // 显示结果
      setAIAnalysisProgress(0);
      setAIAnalysisStep('');
    } catch (err) {
      console.error('AI分析失败:', err);
      setAIError(err instanceof Error ? err.message : '未知错误');
      setAIAnalysisProgress(0);
      setAIAnalysisStep('');
    } finally {
      setIsAIAnalyzing(false);
    }
  };

  /**
   * 采纳AI建议 - 全部采纳
   */
  const handleAdoptAll = () => {
    if (!aiAnalysisResult) return;

    setForm(prev => ({
      ...prev,
      businessImpactScore: aiAnalysisResult.suggestedScore,
      affectedMetrics: [
        ...aiAnalysisResult.suggestedOKRMetrics,
        ...aiAnalysisResult.suggestedProcessMetrics
      ]
    }));

    setAIAnalysisResult(null);
  };

  /**
   * 采纳AI建议 - 仅采纳评分
   */
  const handleAdoptScoreOnly = () => {
    if (!aiAnalysisResult) return;

    setForm(prev => ({
      ...prev,
      businessImpactScore: aiAnalysisResult.suggestedScore
    }));

    setAIAnalysisResult(null);
  };

  /**
   * 采纳AI建议 - 仅采纳OKR指标
   */
  const handleAdoptOKRMetrics = () => {
    if (!aiAnalysisResult) return;

    setForm(prev => ({
      ...prev,
      affectedMetrics: [
        ...(prev.affectedMetrics || []).filter(m => m.category !== 'okr'),
        ...aiAnalysisResult.suggestedOKRMetrics
      ]
    }));

    setAIAnalysisResult(null);
  };

  /**
   * 采纳AI建议 - 仅采纳过程指标
   */
  const handleAdoptProcessMetrics = () => {
    if (!aiAnalysisResult) return;

    setForm(prev => ({
      ...prev,
      affectedMetrics: [
        ...(prev.affectedMetrics || []).filter(m => m.category !== 'process'),
        ...aiAnalysisResult.suggestedProcessMetrics
      ]
    }));

    setAIAnalysisResult(null);
  };

  // 展开所有区域的国家列表
  const getAllRegionOptions = () => {
    const options: string[] = [];
    REGIONS.forEach(region => {
      options.push(region.name);
      if (region.countries) {
        region.countries.forEach(country => {
          options.push(`${region.name} - ${country}`);
        });
      }
      if (region.subRegions) {
        region.subRegions.forEach(subRegion => {
          options.push(`${region.name} - ${subRegion}`);
        });
      }
    });
    return options;
  };

  const regionOptions = getAllRegionOptions();

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold">{isNew ? '新增需求' : '编辑需求'}</h3>
              {form.name && (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                  <span className="text-xs">权重分:</span>
                  <span className="text-lg font-bold">{previewScore.display}</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Main Content - Single Column */}
          <div className="p-6 space-y-6">
            {/* 1. 需求名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                需求名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="输入需求名称（必填）"
              />
            </div>

            {/* 2. 需求描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                需求描述
              </label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                placeholder="简要描述需求背景、目标和预期效果"
              />
            </div>

            {/* 3. 提交信息（三列布局） */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">提交日期</label>
                <input
                  type="date"
                  value={form.submitDate}
                  onChange={(e) => setForm({ ...form, submitDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">需求提交部门</label>
                <select
                  value={form.submitter}
                  onChange={(e) => setForm({ ...form, submitter: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="产品">产品</option>
                  <option value="研发">研发</option>
                  <option value="业务">业务</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">提交人</label>
                <input
                  type="text"
                  value={form.submitterName}
                  onChange={(e) => setForm({ ...form, submitterName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="提交人姓名"
                />
              </div>
            </div>

            {/* 4. 业务影响度评分 */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Target size={18} className="text-blue-600" />
                业务影响度评分
                <span className="text-xs text-gray-500">(v1.2.0)</span>
              </h4>
              <BusinessImpactScoreSelector
                value={form.businessImpactScore || 5}
                onChange={(score) => setForm({ ...form, businessImpactScore: score })}
                scoringStandards={scoringStandards}
                onViewHandbook={() => setIsHandbookOpen(true)}
              />
            </div>

            {/* 5. 上线时间窗口 */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Info size={18} className="text-orange-600" />
                上线时间窗口
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">时间窗口</label>
                  <select
                    value={form.timeCriticality || '随时'}
                    onChange={(e) => setForm({
                      ...form,
                      timeCriticality: e.target.value as any,
                      tc: e.target.value as any
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="随时">随时可做</option>
                    <option value="三月窗口">三个月内完成</option>
                    <option value="一月硬窗口">一个月内完成</option>
                  </select>
                  {form.timeCriticality && (
                    <p className="text-xs text-gray-500 mt-1">
                      {TIME_CRITICALITY_DESCRIPTIONS[form.timeCriticality]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.hardDeadline}
                      onChange={(e) => setForm({ ...form, hardDeadline: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">强制截止日期(DDL)</span>
                  </label>
                </div>

                {form.hardDeadline && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">截止日期</label>
                    <input
                      type="date"
                      value={form.deadlineDate || ''}
                      onChange={(e) => setForm({ ...form, deadlineDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 6. AI智能打分及填写需求明细 */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-purple-600" />
                <h4 className="font-semibold text-gray-900">AI智能打分及填写需求明细</h4>
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Beta</span>
              </div>

              {/* AI模型选择 */}
              <div className="flex items-center gap-2 mb-3">
                <label className="text-xs font-medium text-gray-700">AI模型：</label>
                <select
                  value={selectedAIModel}
                  onChange={(e) => handleAIModelChange(e.target.value as AIModelType)}
                  disabled={isAIAnalyzing}
                  className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                >
                  <option value="deepseek">DeepSeek（推荐国内）</option>
                  <option value="openai">OpenAI（推荐海外）</option>
                </select>
              </div>

              {/* 已添加的文档列表 */}
              {(form.documents || []).length > 0 && (
                <div className="space-y-2 mb-3">
                  <div className="text-sm font-medium text-gray-700">已添加文档：</div>
                  {form.documents!.map((doc, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                      <LinkIcon size={14} className="text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline truncate block"
                        >
                          {doc.url}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(index)}
                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 添加新文档 */}
              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  placeholder="文档标题（如：PRD-用户登录优化）"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  disabled={isAIAnalyzing}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="url"
                  placeholder="文档链接（如飞书文档、Google Docs等）"
                  value={newDocUrl}
                  onChange={(e) => setNewDocUrl(e.target.value)}
                  disabled={isAIAnalyzing}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddDocument}
                    disabled={!newDocTitle.trim() || !newDocUrl.trim() || isAIAnalyzing}
                    className="flex-1 px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    <LinkIcon size={14} className="inline mr-1" />
                    添加文档
                  </button>
                  <button
                    type="button"
                    onClick={handleAIAnalyze}
                    disabled={isAIAnalyzing || (!newDocUrl.trim() && (!form.documents || form.documents.length === 0))}
                    className="flex-1 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {isAIAnalyzing ? (
                      <>
                        <Loader size={14} className="animate-spin" />
                        分析中...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        AI智能分析
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* AI分析进度 */}
              {isAIAnalyzing && aiAnalysisProgress > 0 && (
                <div className="space-y-2 p-3 bg-purple-50 border border-purple-200 rounded">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-purple-900 font-medium">{aiAnalysisStep}</span>
                    <span className="text-purple-700">{aiAnalysisProgress}%</span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${aiAnalysisProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* AI分析错误提示 */}
              {aiError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">分析失败</div>
                    <div className="text-xs">{aiError}</div>
                  </div>
                </div>
              )}

              {/* AI分析结果展示 */}
              {aiAnalysisResult && (
                <div className="space-y-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={18} className="text-green-600" />
                    <h5 className="font-semibold text-green-900">AI分析完成</h5>
                    <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      {lastAnalyzedModel === 'openai' ? 'OpenAI' : 'DeepSeek'}
                    </span>
                  </div>

                  {/* 建议评分 */}
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">建议评分</div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white font-bold text-xl">
                        {aiAnalysisResult.suggestedScore}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">
                          {aiAnalysisResult.currentScore && aiAnalysisResult.currentScore !== aiAnalysisResult.suggestedScore && (
                            <span>当前评分: {aiAnalysisResult.currentScore}分</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 分析理由 */}
                  {aiAnalysisResult.reasoning && aiAnalysisResult.reasoning.length > 0 && (
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="text-sm font-medium text-gray-700 mb-2">分析理由</div>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {aiAnalysisResult.reasoning.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 建议的OKR指标 */}
                  {aiAnalysisResult.suggestedOKRMetrics && aiAnalysisResult.suggestedOKRMetrics.length > 0 && (
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="text-sm font-medium text-gray-700 mb-2">建议的核心OKR指标</div>
                      <div className="space-y-2">
                        {aiAnalysisResult.suggestedOKRMetrics.map((metric, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{metric.metricName}</span>
                            <span className="text-green-600 font-medium">{metric.estimatedImpact}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 建议的过程指标 */}
                  {aiAnalysisResult.suggestedProcessMetrics && aiAnalysisResult.suggestedProcessMetrics.length > 0 && (
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="text-sm font-medium text-gray-700 mb-2">建议的过程指标</div>
                      <div className="space-y-2">
                        {aiAnalysisResult.suggestedProcessMetrics.map((metric, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{metric.metricName}</span>
                            <span className="text-green-600 font-medium">{metric.estimatedImpact}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 采纳选项 */}
                  <div className="pt-2 border-t border-green-200">
                    <div className="text-xs text-gray-600 mb-2">选择采纳方式：</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleAdoptAll}
                        className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition"
                      >
                        全部采纳
                      </button>
                      <button
                        type="button"
                        onClick={handleAdoptScoreOnly}
                        className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                      >
                        仅采纳评分
                      </button>
                      {aiAnalysisResult.suggestedOKRMetrics && aiAnalysisResult.suggestedOKRMetrics.length > 0 && (
                        <button
                          type="button"
                          onClick={handleAdoptOKRMetrics}
                          className="px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition"
                        >
                          仅采纳OKR指标
                        </button>
                      )}
                      {aiAnalysisResult.suggestedProcessMetrics && aiAnalysisResult.suggestedProcessMetrics.length > 0 && (
                        <button
                          type="button"
                          onClick={handleAdoptProcessMetrics}
                          className="px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded transition"
                        >
                          仅采纳过程指标
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setAIAnalysisResult(null)}
                        className="px-3 py-2 text-sm bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition"
                      >
                        暂不采纳
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 使用提示 */}
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                <div className="font-medium mb-1">💡 使用提示：</div>
                <ul className="space-y-0.5 ml-4 list-disc">
                  <li>输入文档标题和链接后，可以点击"添加文档"保存</li>
                  <li>点击"AI智能分析"会分析最后添加的文档或当前输入的链接</li>
                  <li>AI将尝试提取需求信息并自动填充下方表单</li>
                  <li>分析后请检查并调整AI填写的内容</li>
                </ul>
              </div>
            </div>

            {/* 7. 业务域 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">业务域</label>
              <select
                value={form.businessDomain}
                onChange={(e) => setForm({
                  ...form,
                  businessDomain: e.target.value,
                  customBusinessDomain: e.target.value === '自定义' ? form.customBusinessDomain : ''
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="新零售">新零售</option>
                <option value="渠道零售">渠道零售</option>
                <option value="国际零售通用">国际零售通用</option>
                <option value="自定义">自定义</option>
              </select>
            </div>

            {form.businessDomain === '自定义' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">自定义业务域名称</label>
                <input
                  type="text"
                  value={form.customBusinessDomain || ''}
                  onChange={(e) => setForm({ ...form, customBusinessDomain: e.target.value })}
                  placeholder="请输入自定义业务域名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* 8. RMS重构项目 */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRMS}
                  onChange={(e) => setForm({ ...form, isRMS: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">RMS重构项目</span>
              </label>
            </div>

            {/* 9. 需求相关性（可选） */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <button
                type="button"
                onClick={() => setIsRelevanceExpanded(!isRelevanceExpanded)}
                className="w-full flex items-center justify-between mb-3"
              >
                <div className="flex items-center gap-2">
                  <Store size={18} className="text-green-600" />
                  <h4 className="font-semibold text-gray-900">需求相关性</h4>
                  <span className="text-xs text-gray-500">(可选)</span>
                </div>
                <div className={`transform transition-transform ${isRelevanceExpanded ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isRelevanceExpanded && (
                <div className="space-y-4">
                  {/* 业务团队（关键角色） */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Users size={14} />
                      业务团队（关键角色，多选）
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      按住Ctrl(Windows)或Cmd(Mac)多选。可选角色根据所选业务域自动筛选。
                    </p>
                    <select
                      multiple
                      value={(form.impactScope?.keyRoles || []).map(kr => kr.roleName)}
                      onChange={(e) => {
                        const selectedRoleNames = Array.from(e.target.selectedOptions, option => option.value)
                          .filter(v => !v.startsWith('['));

                        const keyRoles = selectedRoleNames.map(roleName => {
                          const config = availableRoleConfigs.find(c => c.roles.includes(roleName));
                          return {
                            category: config?.category || 'hq-common' as any,
                            roleName,
                            isCustom: false
                          };
                        });

                        setForm({
                          ...form,
                          impactScope: {
                            storeTypes: form.impactScope?.storeTypes || [],
                            regions: form.impactScope?.regions || [],
                            keyRoles,
                            storeCountRange: form.impactScope?.storeCountRange
                          }
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32 text-sm"
                    >
                      {availableRoleConfigs.map(config => (
                        <optgroup key={config.category} label={config.categoryName}>
                          {config.roles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* 与哪类门店有关？ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Store size={14} />
                      与哪类门店有关？
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      可选门店类型根据所选业务域自动筛选
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {availableStoreTypes.map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer text-sm p-2 border border-gray-200 rounded hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={form.impactScope?.storeTypes?.includes(type)}
                            onChange={(e) => {
                              const storeTypes = e.target.checked
                                ? [...(form.impactScope?.storeTypes || []), type]
                                : (form.impactScope?.storeTypes || []).filter(t => t !== type);
                              setForm({
                                ...form,
                                impactScope: {
                                  storeTypes,
                                  regions: form.impactScope?.regions || [],
                                  keyRoles: form.impactScope?.keyRoles || [],
                                  storeCountRange: form.impactScope?.storeCountRange
                                }
                              });
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 涉及门店数量 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      涉及门店数量
                    </label>
                    <select
                      value={form.impactScope?.storeCountRange || ''}
                      onChange={(e) => setForm({
                        ...form,
                        impactScope: {
                          storeTypes: form.impactScope?.storeTypes || [],
                          regions: form.impactScope?.regions || [],
                          keyRoles: form.impactScope?.keyRoles || [],
                          storeCountRange: e.target.value || undefined
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择</option>
                      {STORE_COUNT_RANGES.map(range => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                  </div>

                  {/* 与哪些地区有关？ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      与哪些地区有关？（多选）
                    </label>
                    <select
                      multiple
                      value={form.impactScope?.regions || []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setForm({
                          ...form,
                          impactScope: {
                            storeTypes: form.impactScope?.storeTypes || [],
                            regions: selected,
                            keyRoles: form.impactScope?.keyRoles || [],
                            storeCountRange: form.impactScope?.storeCountRange
                          }
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32 text-sm"
                    >
                      {regionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">按住Ctrl(Windows)或Cmd(Mac)多选</p>
                  </div>
                </div>
              )}

              {!isRelevanceExpanded && (
                <div className="text-sm text-green-700">
                  {(() => {
                    const filledCount = [
                      (form.impactScope?.keyRoles || []).length > 0,
                      (form.impactScope?.storeTypes || []).length > 0,
                      form.impactScope?.storeCountRange,
                      (form.impactScope?.regions || []).length > 0
                    ].filter(Boolean).length;
                    return filledCount > 0 ? `已填写 ${filledCount}/4 项` : '点击展开填写';
                  })()}
                </div>
              )}
            </div>

            {/* 10. 影响的指标 */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
              <button
                type="button"
                onClick={() => setIsMetricsExpanded(!isMetricsExpanded)}
                className="w-full flex items-center justify-between mb-3"
              >
                <div className="flex items-center gap-2">
                  <Target size={18} className="text-purple-600" />
                  <h4 className="font-semibold text-gray-900">影响的指标</h4>
                  <span className="text-xs text-gray-500">(可选，建议填写)</span>
                </div>
                <div className={`transform transition-transform ${isMetricsExpanded ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isMetricsExpanded && (
                <MetricSelector
                  value={form.affectedMetrics || []}
                  onChange={(metrics) => setForm({ ...form, affectedMetrics: metrics })}
                  okrMetrics={okrMetrics}
                  processMetrics={processMetrics}
                />
              )}

              {!isMetricsExpanded && (form.affectedMetrics || []).length > 0 && (
                <div className="text-sm text-purple-700">
                  已选择 {form.affectedMetrics!.length} 个指标
                </div>
              )}
            </div>

            {/* 11. 产研填写 */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-300 flex items-center gap-2">
                <Info size={18} className="text-gray-600" />
                产研填写
              </h4>

              <div className="grid grid-cols-2 gap-4">
                {/* 需求类型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">需求类型</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="功能开发">功能开发</option>
                    <option value="技术债">技术债</option>
                    <option value="Bug修复">Bug修复</option>
                  </select>
                </div>

                {/* 产品经理 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">产品经理</label>
                  <input
                    type="text"
                    value={form.productManager}
                    onChange={(e) => setForm({ ...form, productManager: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="产品经理姓名"
                  />
                </div>

                {/* 研发同学 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">研发同学</label>
                  <input
                    type="text"
                    value={form.developer}
                    onChange={(e) => setForm({ ...form, developer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="研发同学姓名"
                  />
                </div>

                {/* 产品进展 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">产品进展</label>
                  <select
                    value={form.productProgress}
                    onChange={(e) => setForm({ ...form, productProgress: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="待评估">待评估</option>
                    <option value="需求分析中">需求分析中</option>
                    <option value="设计中">设计中</option>
                    <option value="待评审">待评审</option>
                    <option value="已完成设计">已完成设计</option>
                    <option value="开发中">开发中</option>
                  </select>
                </div>

                {/* 技术进展 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">技术进展</label>
                  <select
                    value={form.techProgress}
                    onChange={(e) => setForm({ ...form, techProgress: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="待评估">待评估</option>
                    <option value="已评估工作量">已评估工作量</option>
                    <option value="技术方案设计中">技术方案设计中</option>
                    <option value="开发中">开发中</option>
                    <option value="联调测试中">联调测试中</option>
                    <option value="已上线">已上线</option>
                  </select>
                </div>

                {/* 开发工作量 */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    开发工作量（人日）
                    {!canEditEffort && <span className="text-xs text-red-600 ml-2">需先完成技术评估</span>}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.effortDays}
                    onChange={(e) => setForm({ ...form, effortDays: Math.max(1, parseInt(e.target.value) || 1) })}
                    disabled={!canEditEffort}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {canEditEffort && (
                    <div className="text-xs text-gray-500 mt-1">
                      工作量加分: {form.effortDays <= 2 ? '+8分' : form.effortDays <= 5 ? '+7分' : form.effortDays <= 14 ? '+5分' : form.effortDays <= 30 ? '+3分' : form.effortDays <= 50 ? '+2分' : form.effortDays <= 100 ? '+1分' : '不加分'}
                    </div>
                  )}
                </div>

                {/* 技术复杂度评分 (v1.3.0新增) */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                    <Settings size={16} className="text-gray-600" />
                    技术复杂度评分（1-10分）
                    <span className="text-xs text-gray-500">(v1.3.0)</span>
                  </label>
                  <select
                    value={form.complexityScore || 5}
                    onChange={(e) => setForm({ ...form, complexityScore: parseInt(e.target.value) as ComplexityScore })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {COMPLEXITY_STANDARDS.sort((a, b) => b.score - a.score).map((standard) => {
                      // 生成悬浮提示
                      const tooltipText = `【${standard.score}分 - ${standard.name}】\n${standard.shortDescription}\n\n典型案例：${standard.typicalCases.slice(0, 1).join('；')}`;

                      return (
                        <option
                          key={standard.score}
                          value={standard.score}
                          title={tooltipText}
                        >
                          {standard.score}分 - {standard.name} ({standard.shortDescription})
                        </option>
                      );
                    })}
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    {(() => {
                      const selectedStandard = COMPLEXITY_STANDARDS.find(s => s.score === (form.complexityScore || 5));
                      if (!selectedStandard) return null;
                      return (
                        <div>
                          <div className="font-medium text-gray-700 mb-1">
                            {selectedStandard.name}：{selectedStandard.shortDescription}
                          </div>
                          <div className="text-gray-600">
                            参考工作量：{selectedStandard.estimatedEffort}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3 z-10">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              取消
            </button>
            <button
              onClick={() => {
                if (!form.name.trim()) {
                  alert('需求名称不能为空');
                  return;
                }
                onSave(form);
                onClose();
              }}
              disabled={!form.name.trim()}
              className={`px-6 py-2.5 rounded-lg transition font-medium flex items-center gap-2 ${
                form.name.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save size={18} />
              保存
            </button>
          </div>
        </div>
      </div>

      {/* Scoring Standards Handbook Modal */}
      <ScoringStandardsHandbook
        isOpen={isHandbookOpen}
        onClose={() => setIsHandbookOpen(false)}
        scoringStandards={scoringStandards}
      />
    </>
  );
};

export default EditRequirementModal;
