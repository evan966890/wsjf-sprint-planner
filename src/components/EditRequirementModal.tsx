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
import { X, Save, Info, Link as LinkIcon, Users, Store, Target, Sparkles, Loader, AlertCircle, CheckCircle, Settings, Upload, FileText, Trash2, Eye } from 'lucide-react';
import type { Requirement, BusinessImpactScore, ComplexityScore, AffectedMetric, Document, AIModelType, AIAnalysisResult, AIRequestBody } from '../types';
import type { ProductProgressStatus, TechProgressStatus } from '../types/techProgress';
import { useStore } from '../store/useStore';
import BusinessImpactScoreSelector from './BusinessImpactScoreSelector';
import MetricSelector from './MetricSelector';
import ScoringStandardsHandbook from './ScoringStandardsHandbook';
import { OPENAI_API_KEY, DEEPSEEK_API_KEY } from '../config/api';
import { formatAIPrompt, AI_SYSTEM_MESSAGE } from '../config/aiPrompts';
import {
  getStoreTypesByDomain,
  getSubDomainsByDomain,
  getRoleConfigsByDomain,
  REGIONS,
  STORE_COUNT_RANGES,
  TIME_CRITICALITY_DESCRIPTIONS
} from '../config/businessFields';
import { COMPLEXITY_STANDARDS } from '../config/complexityStandards';
import { getAllMetrics } from '../config/metrics';
import { parseFile, isSupportedFile, formatFileSize } from '../utils/fileParser';

interface EditRequirementModalProps {
  requirement: Requirement | null;
  onSave: (req: Requirement) => void;
  onClose: () => void;
  isNew?: boolean;
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
  const [isAISectionExpanded, setIsAISectionExpanded] = useState(false); // v1.3.1：AI打分区域折叠/展开

  // AI分析状态（v1.2.1增强 + v1.3.1升级）
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiAnalysisProgress, setAIAnalysisProgress] = useState(0); // 分析进度 0-100
  const [aiAnalysisStep, setAIAnalysisStep] = useState(''); // 当前分析步骤描述
  const [aiAnalysisResult, setAIAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [aiError, setAIError] = useState<string | null>(null);

  // v1.3.1新增：AI建议状态管理
  type AIAdoptionStatus = 'pending' | 'adopted' | 'ignored' | 'partial';
  const [aiAdoptionStatus, setAIAdoptionStatus] = useState<AIAdoptionStatus>('pending');
  const [aiAdoptedItems, setAIAdoptedItems] = useState({
    score: false,
    okrMetrics: false,
    processMetrics: false
  });
  const [aiAdoptedAt, setAIAdoptedAt] = useState<string | null>(null);
  const [isAIPanelCollapsed, setIsAIPanelCollapsed] = useState(false);

  // 文档管理状态
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');

  // v1.3.1新增：文件上传状态
  interface UploadedFileInfo {
    id: string;
    file: File;
    name: string;
    size: number;
    type: 'pdf' | 'excel';
    uploadedAt: string;
    parseStatus: 'parsing' | 'success' | 'error';
    parsedContent?: string;
    parsedWordCount?: number;
    pageCount?: number;
    sheetCount?: number;
    errorMessage?: string;
  }
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([]);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null); // 预览文档内容的文件ID

  // 表单状态 - 修复：保留原始业务域，不使用默认值覆盖
  const [form, setForm] = useState<Requirement>(() => {
    // 辅助函数：验证日期格式是否为 YYYY-MM-DD
    const isValidDateFormat = (dateStr: string | undefined): boolean => {
      if (!dateStr) return false;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      return dateRegex.test(dateStr);
    };

    if (requirement) {
      // 编辑现有需求：保留所有原始字段，但修复日期格式错误
      const fixedSubmitDate = isValidDateFormat(requirement.submitDate)
        ? requirement.submitDate
        : new Date().toISOString().split('T')[0];

      const fixedDeadlineDate = requirement.deadlineDate && isValidDateFormat(requirement.deadlineDate)
        ? requirement.deadlineDate
        : undefined;

      return {
        ...requirement,
        submitDate: fixedSubmitDate,
        deadlineDate: fixedDeadlineDate
      };
    }
    // 新建需求：使用默认值
    return {
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
    complexityScore: undefined,  // v1.3.0：技术复杂度评分（无默认值，需手动评估）
    isRMS: false,
    bv: '明显',
    tc: '随时'
  };
  });

  // 根据业务域更新可选项
  const availableStoreTypes = useMemo(() =>
    getStoreTypesByDomain(form.businessDomain),
    [form.businessDomain]
  );

  // 根据业务域获取可选的业务子域
  const availableSubDomains = useMemo(() =>
    getSubDomainsByDomain(form.businessDomain),
    [form.businessDomain]
  );

  const availableRoleConfigs = useMemo(() =>
    getRoleConfigsByDomain(form.businessDomain),
    [form.businessDomain]
  );

  // v1.3.1：仅获取总部角色（用于基础信息区域的业务团队选择）
  // 去重处理，避免不同业务域有相同角色导致React key警告
  const hqRolesOnly = useMemo(() => {
    const roles = availableRoleConfigs
      .filter(config => config.category.startsWith('hq-'))
      .flatMap(config => config.roles);
    return Array.from(new Set(roles)); // 去重
  }, [availableRoleConfigs]);

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

  /**
   * v1.3.1新增：从URL中提取文件名
   */
  const extractFileNameFromUrl = (url: string): string => {
    try {
      // 尝试从URL中提取文件名
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // 从路径中获取最后一段作为文件名
      const segments = pathname.split('/').filter(s => s.length > 0);
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        // 移除文件扩展名（可选）
        return decodeURIComponent(lastSegment);
      }

      // 如果无法提取，使用主机名
      return urlObj.hostname || '文档链接';
    } catch {
      // URL解析失败，尝试从路径中提取
      const parts = url.split('/').filter(p => p.trim().length > 0);
      if (parts.length > 0) {
        return parts[parts.length - 1].substring(0, 50); // 限制长度
      }
      return '文档链接';
    }
  };

  /**
   * v1.3.1优化：URL变化时自动提取标题
   */
  const handleUrlChange = (url: string) => {
    setNewDocUrl(url);

    // 如果用户还没有输入标题，自动从URL提取
    if (!newDocTitle.trim() && url.trim()) {
      const extractedTitle = extractFileNameFromUrl(url);
      setNewDocTitle(extractedTitle);
    }
  };

  /**
   * 添加文档（v1.3.1优化：标题可选）
   */
  const handleAddDocument = () => {
    if (!newDocUrl.trim()) return;

    // 如果没有标题，自动从URL提取
    const finalTitle = newDocTitle.trim() || extractFileNameFromUrl(newDocUrl);

    const newDoc: Document = {
      id: `DOC-${Date.now()}`,
      fileName: finalTitle,
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
   * 处理文件上传
   * v1.3.1新增：支持PDF和Excel文件上传
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // 目前只支持单文件上传

    // 检查文件类型
    if (!isSupportedFile(file)) {
      alert('不支持的文件类型。请上传 PDF 或 Excel 文件（.pdf, .xlsx, .xls）');
      return;
    }

    // 检查文件大小（限制10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('文件过大。请上传小于 10MB 的文件');
      return;
    }

    // 创建文件信息对象
    const fileInfo: UploadedFileInfo = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'excel',
      uploadedAt: new Date().toISOString(),
      parseStatus: 'parsing'
    };

    // 添加到列表（设置为解析中）
    setUploadedFiles(prev => [...prev, fileInfo]);

    // 异步解析文件
    try {
      const parsedContent = await parseFile(file);
      const wordCount = parsedContent.trim().length;

      // 检查解析内容是否为空或太少
      let statusMessage = '';
      if (wordCount === 0) {
        statusMessage = '⚠️ 未提取到文本内容（可能是扫描版PDF或图片）';
      } else if (wordCount < 50) {
        statusMessage = `⚠️ 提取内容较少（${wordCount}字），可能影响AI分析效果`;
      }

      // 更新为成功状态
      setUploadedFiles(prev => prev.map(f =>
        f.id === fileInfo.id
          ? {
              ...f,
              parseStatus: 'success' as const,
              parsedContent,
              parsedWordCount: wordCount,
              errorMessage: statusMessage || undefined // 使用errorMessage字段显示警告
            }
          : f
      ));

      // 如果内容为空，弹出提示
      if (wordCount === 0) {
        setTimeout(() => {
          alert('文件上传成功，但未能提取到文本内容。\n\n可能原因：\n1. 扫描版PDF（图片格式）\n2. PDF文件已加密\n3. 文件格式不支持\n\n建议：使用可复制文本的PDF文件，或手动输入需求描述。');
        }, 100);
      }
    } catch (error) {
      // 更新为错误状态
      setUploadedFiles(prev => prev.map(f =>
        f.id === fileInfo.id
          ? {
              ...f,
              parseStatus: 'error' as const,
              errorMessage: error instanceof Error ? error.message : '解析失败'
            }
          : f
      ));
    }

    // 清空input，允许重复上传同一文件
    event.target.value = '';
  };

  /**
   * 删除已上传的文件
   */
  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
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
   * v1.3.1新增：内容充足性检查
   * 规则：描述≥50字 OR 已上传文件（且有内容）OR 有文档链接
   */
  const checkContentSufficiency = () => {
    const descLength = (form.description || '').trim().length;
    // 修改：只有解析成功且有实际内容（>0字符）的文件才算有效
    const hasUploadedFiles = uploadedFiles.filter(f =>
      f.parseStatus === 'success' && (f.parsedWordCount || 0) > 0
    ).length > 0;
    const hasDocLinks = (form.documents || []).length > 0 || newDocUrl.trim().length > 0;
    const hasFiles = hasUploadedFiles || hasDocLinks;

    return {
      isDescSufficient: descLength >= 50,
      hasFiles,
      canStartAI: descLength >= 50 || hasFiles,
      descLength,
      filesCount: uploadedFiles.length + (form.documents || []).length
    };
  };

  /**
   * AI分析文档（v1.2.1增强版 + v1.3.1升级）
   * v1.3.1改进：
   * - 增强内容充足性验证（至少50字或有文件）
   * - 支持PDF和Excel文件上传并解析
   * - 包含进度跟踪、详细结果展示、多种采纳选项
   */
  const handleAIAnalyze = async () => {
    // v1.3.1：检查内容充足性
    const sufficiency = checkContentSufficiency();
    if (!sufficiency.canStartAI) {
      setAIError('内容不足：请补充描述(至少50字)或上传文档');
      return;
    }

    const documentUrl = newDocUrl.trim() || (form.documents && form.documents.length > 0 ? form.documents[form.documents.length - 1].url || '' : '');
    const reqDescription = form.description?.trim() || '';

    // 准备分析内容（包含上传文件的解析结果）
    // v1.3.1修改：只包含有实际内容的文件（字符数 > 0）
    const filesText = uploadedFiles
      .filter(f => f.parseStatus === 'success' && (f.parsedWordCount || 0) > 0)
      .map(f => `文件名：${f.name}\n内容：${f.parsedContent}`)
      .join('\n\n');

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

      // v1.3.1：准备完整的分析内容（包含文档链接和上传文件）
      const fullContent = `
需求名称：${form.name || '未填写'}

需求描述：
${reqDescription}

${documentUrl ? `文档链接：${documentUrl}\n` : ''}
${filesText ? `上传的文档内容：\n${filesText}` : ''}
      `.trim();

      // 使用配置文件中的提示词模板
      const prompt = formatAIPrompt(documentUrl, fullContent, form.name || '未填写');

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

      // 提取AI建议的标题（优先从basicInfo，否则从文件名或生成简要标题）
      let suggestedTitle = '';
      if (parsedData.basicInfo?.name && parsedData.basicInfo.name !== '未填写') {
        suggestedTitle = parsedData.basicInfo.name;
      } else if (uploadedFiles.length > 0) {
        // 使用第一个文件名（去掉扩展名）
        const firstFile = uploadedFiles[0];
        suggestedTitle = firstFile.name.replace(/\.(pdf|xlsx|xls|txt)$/i, '');
      } else if (parsedData.reasoning && parsedData.reasoning.length > 0) {
        // 从分析理由中提取关键词作为标题
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
        currentScore: form.businessImpactScore,
        confidence: 0.8,
        suggestedTitle: suggestedTitle || undefined
      };

      // 如果使用的是新输入的URL且未保存，先保存它
      if (newDocUrl.trim() && newDocTitle.trim()) {
        handleAddDocument();
      }

      // 存储AI分析结果
      setAIAnalysisResult(analysis);
      setLastAnalyzedModel(selectedAIModel);
      setNewDocUrl('');

      // v1.3.1：重置AI状态为待处理
      setAIAdoptionStatus('pending');
      setAIAdoptedItems({ score: false, okrMetrics: false, processMetrics: false });
      setAIAdoptedAt(null);
      setIsAIPanelCollapsed(false); // 展开显示新结果

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
   * 采纳AI建议 - 全部采纳（v1.3.1升级）
   * v1.3.1改进：保留AI建议，更新状态，自动折叠
   * v1.3.2：自动填充标题（如果标题为空）
   */
  const handleAdoptAll = () => {
    if (!aiAnalysisResult) return;

    setForm(prev => {
      const updates: Partial<Requirement> = {
        businessImpactScore: aiAnalysisResult.suggestedScore,
        affectedMetrics: [
          ...aiAnalysisResult.suggestedOKRMetrics,
          ...aiAnalysisResult.suggestedProcessMetrics
        ]
      };

      // 如果当前标题为空且AI有建议标题，自动填充
      if (!prev.name.trim() && aiAnalysisResult.suggestedTitle) {
        updates.name = aiAnalysisResult.suggestedTitle;
      }

      return { ...prev, ...updates };
    });

    // v1.3.1：更新状态，不清空AI结果
    setAIAdoptionStatus('adopted');
    setAIAdoptedItems({ score: true, okrMetrics: true, processMetrics: true });
    setAIAdoptedAt(new Date().toISOString());
    setIsAIPanelCollapsed(true); // 自动折叠

    // v1.3.2：滚动到顶部显示标题（如果自动填充了）
    if (!form.name.trim() && aiAnalysisResult.suggestedTitle) {
      setTimeout(() => {
        const titleInput = document.querySelector('input[placeholder*="需求名称"]') as HTMLInputElement;
        if (titleInput) {
          titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          titleInput.focus();
          // 2秒后失焦
          setTimeout(() => titleInput.blur(), 2000);
        }
      }, 800);
    }
  };

  /**
   * 采纳AI建议 - 仅采纳评分（v1.3.1升级）
   * v1.3.1改进：保留AI建议，更新状态，保持展开
   */
  const handleAdoptScoreOnly = () => {
    if (!aiAnalysisResult) return;

    setForm(prev => ({
      ...prev,
      businessImpactScore: aiAnalysisResult.suggestedScore
    }));

    // v1.3.1：更新状态，保持展开以便继续采纳其他项
    const newAdoptedItems = { ...aiAdoptedItems, score: true };
    const allAdopted = newAdoptedItems.score && newAdoptedItems.okrMetrics && newAdoptedItems.processMetrics;

    setAIAdoptedItems(newAdoptedItems);
    setAIAdoptionStatus(allAdopted ? 'adopted' : 'partial');
    setAIAdoptedAt(new Date().toISOString());
    setIsAIPanelCollapsed(false); // 保持展开
  };

  /**
   * 采纳AI建议 - 仅采纳OKR指标（v1.3.1升级）
   * v1.3.1改进：保留AI建议，更新状态，保持展开
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

    // v1.3.1：更新状态，保持展开以便继续采纳其他项
    const newAdoptedItems = { ...aiAdoptedItems, okrMetrics: true };
    const allAdopted = newAdoptedItems.score && newAdoptedItems.okrMetrics && newAdoptedItems.processMetrics;

    setAIAdoptedItems(newAdoptedItems);
    setAIAdoptionStatus(allAdopted ? 'adopted' : 'partial');
    setAIAdoptedAt(new Date().toISOString());
    setIsAIPanelCollapsed(false); // 保持展开
  };

  /**
   * 采纳AI建议 - 仅采纳过程指标（v1.3.1升级）
   * v1.3.1改进：保留AI建议，更新状态，保持展开
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

    // v1.3.1：更新状态，保持展开以便继续采纳其他项
    const newAdoptedItems = { ...aiAdoptedItems, processMetrics: true };
    const allAdopted = newAdoptedItems.score && newAdoptedItems.okrMetrics && newAdoptedItems.processMetrics;

    setAIAdoptedItems(newAdoptedItems);
    setAIAdoptionStatus(allAdopted ? 'adopted' : 'partial');
    setAIAdoptedAt(new Date().toISOString());
    setIsAIPanelCollapsed(false); // 保持展开
  };

  /**
   * v1.3.1新增：忽略AI建议
   */
  const handleIgnoreAI = () => {
    const confirmed = window.confirm('确定忽略AI建议吗？建议将被折叠但保留，可随时查看。');
    if (!confirmed) return;

    setAIAdoptionStatus('ignored');
    setIsAIPanelCollapsed(true); // 折叠面板
  };

  /**
   * v1.3.1新增：重新分析
   */
  const handleReanalyze = () => {
    const confirmed = window.confirm('重新分析将覆盖当前AI建议，是否继续？');
    if (!confirmed) return;

    // 重置AI状态
    setAIAnalysisResult(null);
    setAIAdoptionStatus('pending');
    setAIAdoptedItems({ score: false, okrMetrics: false, processMetrics: false });
    setAIAdoptedAt(null);
    setIsAIPanelCollapsed(false);

    // 调用AI分析
    handleAIAnalyze();
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

          {/* Main Content - Single Column v1.3.1：重新组织布局 */}
          <div className="p-6 space-y-6">
            {/* 1. 基础信息 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-gray-900 text-sm">基础信息</h4>

              {/* 需求名称 */}
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

              {/* 提交信息（两行布局，4列自适应） */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">提交日期</label>
                  <input
                    type="date"
                    value={form.submitDate}
                    onChange={(e) => setForm({ ...form, submitDate: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">业务域</label>
                  <select
                    value={form.businessDomain || '国际零售通用'}
                    onChange={(e) => setForm({
                      ...form,
                      businessDomain: e.target.value,
                      businessSubDomain: '' // 切换业务域时清空业务子域
                    })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="新零售">新零售</option>
                    <option value="渠道零售">渠道零售</option>
                    <option value="国际零售通用">国际零售通用</option>
                  </select>
                </div>

                {/* 业务子域 - 根据业务域动态显示 */}
                {availableSubDomains.length > 0 ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">业务子域</label>
                    <select
                      value={form.businessSubDomain || ''}
                      onChange={(e) => setForm({ ...form, businessSubDomain: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择</option>
                      {availableSubDomains.map(subDomain => (
                        <option key={subDomain} value={subDomain}>{subDomain}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div></div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">业务团队（总部）</label>
                  <select
                    value={form.businessTeam || ''}
                    onChange={(e) => setForm({ ...form, businessTeam: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择</option>
                    {hqRolesOnly.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">需求提交部门</label>
                  <select
                    value={form.submitter}
                    onChange={(e) => setForm({ ...form, submitter: e.target.value as '业务' | '产品' | '技术' })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="产品">产品</option>
                    <option value="研发">研发</option>
                    <option value="业务">业务</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">提交人</label>
                  <input
                    type="text"
                    value={form.submitterName}
                    onChange={(e) => setForm({ ...form, submitterName: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="提交人姓名"
                  />
                </div>
              </div>
            </div>

            {/* 2. 业务影响度评分 */}
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

            {/* 3. AI智能打分 */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg">
              {/* 折叠标题栏 */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-purple-100/50 transition rounded-t-lg"
                onClick={() => setIsAISectionExpanded(!isAISectionExpanded)}
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-600" />
                  <h4 className="font-semibold text-gray-900">AI智能打分</h4>
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">可选</span>
                </div>
                <span className="text-sm text-gray-500">
                  {isAISectionExpanded ? '收起 ▲' : '展开 ▼'}
                </span>
              </div>

              {/* 展开的内容 */}
              {isAISectionExpanded && (
                <div className="p-4 pt-0 space-y-3">
                  <div className="text-xs text-gray-600 bg-white/60 p-2 rounded border border-purple-200">
                    💡 AI分析需要满足以下条件之一：需求描述≥50字 或 已添加文档链接
                  </div>

                  {/* 需求描述（移到这里） */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                      <span>需求描述</span>
                      <span className={`text-xs ${checkContentSufficiency().isDescSufficient ? 'text-green-600' : 'text-gray-400'}`}>
                        已输入 {checkContentSufficiency().descLength}/50字
                        {checkContentSufficiency().isDescSufficient && ' ✓'}
                      </span>
                    </label>
                    <textarea
                      value={form.description || ''}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                      placeholder="简要描述需求背景、目标和预期效果（AI分析至少需要50字）"
                    />
                  </div>

                  {/* AI模型选择 */}
                  <div className="flex items-center gap-2">
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
                    <div className="space-y-2">
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

                  {/* 文件上传区域（v1.3.1新增） */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">上传文档（PDF、Excel）：</div>

                    {/* 文件上传按钮 */}
                    <div>
                      <input
                        type="file"
                        id="ai-file-upload"
                        accept=".pdf,.xlsx,.xls"
                        onChange={handleFileUpload}
                        disabled={isAIAnalyzing}
                        className="hidden"
                      />
                      <label
                        htmlFor="ai-file-upload"
                        className={`
                          flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition
                          ${isAIAnalyzing
                            ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                            : 'border-purple-300 bg-purple-50 hover:bg-purple-100 hover:border-purple-400'
                          }
                        `}
                      >
                        <Upload size={16} className={isAIAnalyzing ? 'text-gray-400' : 'text-purple-600'} />
                        <span className={`text-sm ${isAIAnalyzing ? 'text-gray-400' : 'text-purple-700'}`}>
                          点击上传 PDF 或 Excel 文件
                        </span>
                      </label>
                      <div className="text-xs text-gray-500 mt-1 ml-1">
                        支持 .pdf, .xlsx, .xls 格式，最大 10MB
                      </div>
                    </div>

                    {/* 已上传文件列表 */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        {uploadedFiles.map((file) => {
                          const hasWarning = file.parseStatus === 'success' && file.errorMessage;
                          const hasContent = file.parseStatus === 'success' && (file.parsedWordCount || 0) > 0;

                          return (
                            <div
                              key={file.id}
                              className={`
                                flex items-center gap-2 p-2 rounded border
                                ${file.parseStatus === 'success' && !hasWarning ? 'bg-green-50 border-green-200' : ''}
                                ${file.parseStatus === 'success' && hasWarning ? 'bg-yellow-50 border-yellow-300' : ''}
                                ${file.parseStatus === 'parsing' ? 'bg-blue-50 border-blue-200' : ''}
                                ${file.parseStatus === 'error' ? 'bg-red-50 border-red-200' : ''}
                              `}
                            >
                              <FileText
                                size={16}
                                className={`flex-shrink-0 ${
                                  file.parseStatus === 'success' && !hasWarning ? 'text-green-600' :
                                  file.parseStatus === 'success' && hasWarning ? 'text-yellow-600' :
                                  file.parseStatus === 'parsing' ? 'text-blue-600' :
                                  'text-red-600'
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {file.name}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {file.parseStatus === 'success' && (
                                    <>
                                      <div>{formatFileSize(file.size)} · 已解析 {file.parsedWordCount?.toLocaleString()} 字符</div>
                                      {hasWarning && (
                                        <div className="text-yellow-700 mt-0.5">{file.errorMessage}</div>
                                      )}
                                    </>
                                  )}
                                  {file.parseStatus === 'parsing' && (
                                    <span className="text-blue-600">解析中...</span>
                                  )}
                                  {file.parseStatus === 'error' && (
                                    <span className="text-red-600">{file.errorMessage || '解析失败'}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {/* 查看内容按钮 */}
                                {hasContent && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewFileId(file.id)}
                                    className="text-blue-500 hover:text-blue-700 transition p-1"
                                    title="查看解析内容"
                                  >
                                    <Eye size={16} />
                                  </button>
                                )}
                                {/* 删除按钮 */}
                                {file.parseStatus !== 'parsing' && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFile(file.id)}
                                    className="text-gray-400 hover:text-red-600 transition p-1"
                                    title="删除文件"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                                {/* 加载动画 */}
                                {file.parseStatus === 'parsing' && (
                                  <Loader size={16} className="text-blue-600 animate-spin" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 添加新文档 */}
                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="📎 文档链接（如飞书文档、Google Docs等）"
                      value={newDocUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      disabled={isAIAnalyzing}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="📝 文档标题（可选，留空则自动从链接提取）"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      disabled={isAIAnalyzing}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-purple-500 bg-gray-50"
                    />

                    {/* 内容充足性实时提示 */}
                    {(() => {
                      const sufficiency = checkContentSufficiency();
                      if (!sufficiency.canStartAI) {
                        return (
                          <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                            <span>内容不足：请补充描述(至少50字)或上传文档</span>
                          </div>
                        );
                      } else if (sufficiency.isDescSufficient && sufficiency.hasFiles) {
                        return (
                          <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                            <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
                            <span>描述和文档齐全，AI分析效果更好</span>
                          </div>
                        );
                      } else if (sufficiency.isDescSufficient) {
                        return (
                          <div className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                            <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
                            <span>描述充足，可启动AI分析</span>
                          </div>
                        );
                      } else if (sufficiency.hasFiles) {
                        return (
                          <div className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                            <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
                            <span>已上传文档，可启动AI分析</span>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddDocument}
                        disabled={!newDocUrl.trim() || isAIAnalyzing}
                        className="flex-1 px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                      >
                        <LinkIcon size={14} className="inline mr-1" />
                        添加文档
                      </button>
                      <button
                        type="button"
                        onClick={handleAIAnalyze}
                        disabled={isAIAnalyzing || !checkContentSufficiency().canStartAI}
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
                    <div className={`space-y-3 p-4 rounded-lg border-2 ${
                      aiAdoptionStatus === 'adopted' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' :
                      aiAdoptionStatus === 'partial' ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300' :
                      aiAdoptionStatus === 'ignored' ? 'bg-gray-50 border-gray-300' :
                      'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300'
                    }`}>
                      {/* 标题栏 - 可点击折叠/展开 */}
                      <div
                        className="flex items-center gap-2 mb-2 cursor-pointer hover:opacity-80 transition"
                        onClick={() => setIsAIPanelCollapsed(!isAIPanelCollapsed)}
                      >
                        {aiAdoptionStatus === 'adopted' && <CheckCircle size={18} className="text-green-600" />}
                        {aiAdoptionStatus === 'partial' && <Sparkles size={18} className="text-blue-600" />}
                        {aiAdoptionStatus === 'ignored' && <X size={18} className="text-gray-600" />}
                        {aiAdoptionStatus === 'pending' && <Sparkles size={18} className="text-purple-600" />}

                        <h5 className={`font-semibold flex-1 ${
                          aiAdoptionStatus === 'adopted' ? 'text-green-900' :
                          aiAdoptionStatus === 'partial' ? 'text-blue-900' :
                          aiAdoptionStatus === 'ignored' ? 'text-gray-700' :
                          'text-purple-900'
                        }`}>
                          AI建议: {aiAnalysisResult.suggestedScore}分
                          {aiAdoptionStatus === 'adopted' && ' [✓ 已采纳]'}
                          {aiAdoptionStatus === 'partial' && ' [⚡ 部分采纳]'}
                          {aiAdoptionStatus === 'ignored' && ' [⊗ 已忽略]'}
                          {aiAdoptionStatus === 'pending' && ' [待处理]'}
                        </h5>

                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          aiAdoptionStatus === 'adopted' ? 'text-green-700 bg-green-100' :
                          aiAdoptionStatus === 'partial' ? 'text-blue-700 bg-blue-100' :
                          aiAdoptionStatus === 'ignored' ? 'text-gray-600 bg-gray-100' :
                          'text-purple-700 bg-purple-100'
                        }`}>
                          {lastAnalyzedModel === 'openai' ? 'OpenAI' : 'DeepSeek'}
                        </span>

                        <span className="text-xs text-gray-500">
                          {isAIPanelCollapsed ? '展开 ▼' : '收起 ▲'}
                        </span>
                      </div>

                      {/* 采纳状态摘要（折叠时显示） */}
                      {isAIPanelCollapsed && aiAdoptedAt && (
                        <div className="text-xs text-gray-600">
                          {aiAdoptionStatus === 'adopted' && '已全部采纳 '}
                          {aiAdoptionStatus === 'partial' && `已采纳: ${aiAdoptedItems.score ? '✓评分 ' : ''}${aiAdoptedItems.okrMetrics ? '✓OKR ' : ''}${aiAdoptedItems.processMetrics ? '✓过程指标' : ''}`}
                          {aiAdoptionStatus === 'ignored' && '已忽略，可随时查看'}
                          · 时间: {new Date(aiAdoptedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}

                      {/* 展开的详细内容 */}
                      {!isAIPanelCollapsed && (<>
                        {/* 建议标题（如果有） */}
                        {aiAnalysisResult.suggestedTitle && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div className="text-sm font-medium text-gray-700 mb-2">建议标题</div>
                            <div className="flex items-start gap-2">
                              <span className="text-blue-600 mt-0.5">📝</span>
                              <div className="flex-1">
                                <div className="text-sm text-gray-900 font-medium">{aiAnalysisResult.suggestedTitle}</div>
                                {!form.name.trim() && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    💡 标题为空时，采纳建议将自动填充此标题
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

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
                        <div className="pt-2 border-t border-gray-200">
                          {aiAdoptionStatus === 'pending' && (
                            <>
                              <div className="text-xs text-gray-600 mb-2">选择采纳方式：</div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={handleAdoptAll}
                                  className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition font-medium"
                                >
                                  ✨ 全部采纳
                                </button>
                                <button
                                  type="button"
                                  onClick={handleAdoptScoreOnly}
                                  className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                                >
                                  📊 仅采纳评分
                                </button>
                                {aiAnalysisResult.suggestedOKRMetrics && aiAnalysisResult.suggestedOKRMetrics.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={handleAdoptOKRMetrics}
                                    className="px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition"
                                  >
                                    🎯 仅采纳OKR指标
                                  </button>
                                )}
                                {aiAnalysisResult.suggestedProcessMetrics && aiAnalysisResult.suggestedProcessMetrics.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={handleAdoptProcessMetrics}
                                    className="px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded transition"
                                  >
                                    📈 仅采纳过程指标
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={handleIgnoreAI}
                                  className="px-3 py-2 text-sm bg-gray-400 hover:bg-gray-500 text-white rounded transition"
                                >
                                  ❌ 忽略建议
                                </button>
                                <button
                                  type="button"
                                  onClick={handleReanalyze}
                                  className="px-3 py-2 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded transition"
                                >
                                  🔄 重新分析
                                </button>
                              </div>
                            </>
                          )}

                          {aiAdoptionStatus === 'partial' && (
                            <>
                              <div className="text-xs text-gray-600 mb-2">
                                已采纳: {aiAdoptedItems.score && '✓ 评分 '}{aiAdoptedItems.okrMetrics && '✓ OKR指标 '}{aiAdoptedItems.processMetrics && '✓ 过程指标'}
                                · 继续采纳其他项：
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {!aiAdoptedItems.score && (
                                  <button
                                    type="button"
                                    onClick={handleAdoptScoreOnly}
                                    className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                                  >
                                    📊 采纳评分
                                  </button>
                                )}
                                {!aiAdoptedItems.okrMetrics && aiAnalysisResult.suggestedOKRMetrics && aiAnalysisResult.suggestedOKRMetrics.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={handleAdoptOKRMetrics}
                                    className="px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition"
                                  >
                                    🎯 采纳OKR指标
                                  </button>
                                )}
                                {!aiAdoptedItems.processMetrics && aiAnalysisResult.suggestedProcessMetrics && aiAnalysisResult.suggestedProcessMetrics.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={handleAdoptProcessMetrics}
                                    className="px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded transition"
                                  >
                                    📈 采纳过程指标
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={handleReanalyze}
                                  className="px-3 py-2 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded transition"
                                >
                                  🔄 重新分析
                                </button>
                              </div>
                            </>
                          )}

                          {(aiAdoptionStatus === 'adopted' || aiAdoptionStatus === 'ignored') && (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={handleReanalyze}
                                className="px-3 py-2 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded transition"
                              >
                                🔄 重新分析
                              </button>
                              {aiAdoptionStatus === 'ignored' && (
                                <button
                                  type="button"
                                  onClick={() => setIsAIPanelCollapsed(false)}
                                  className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition"
                                >
                                  👁️ 查看建议
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </>)}
                    </div>
                  )}

                  {/* 使用提示 */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    <div className="font-medium mb-1">💡 使用提示：</div>
                    <ul className="space-y-0.5 ml-4 list-disc">
                      <li>输入文档链接后，标题会自动提取，您也可以手动修改</li>
                      <li>需求描述至少50字，或者添加文档链接，才能启动AI分析</li>
                      <li>点击"AI智能分析"会综合分析需求描述和文档内容</li>
                      <li>AI建议可以全部采纳、分项采纳，采纳后可随时查看</li>
                      <li>点击AI建议标题栏可以折叠/展开，节省屏幕空间</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* 4. 上线时间窗口 */}
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

            {/* 5. 需求相关性（可选） */}
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
                  {/* 该业务主要为谁服务？v1.3.1优化：改用checkbox网格 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Users size={14} />
                      该业务主要为谁服务？（多选）
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      可选角色根据所选业务域自动筛选
                    </p>
                    <div className="space-y-3">
                      {availableRoleConfigs.map(config => (
                        <div key={config.category}>
                          <div className="text-xs font-medium text-gray-600 mb-1.5">{config.categoryName}</div>
                          <div className="grid grid-cols-3 gap-2">
                            {config.roles.map(role => {
                              const isSelected = (form.impactScope?.keyRoles || []).some(kr => kr.roleName === role);
                              return (
                                <label
                                  key={`${config.category}-${role}`}
                                  className="flex items-center gap-2 cursor-pointer text-sm p-2 border border-gray-200 rounded hover:bg-gray-50 transition"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const keyRoles = e.target.checked
                                        ? [
                                            ...(form.impactScope?.keyRoles || []),
                                            {
                                              category: config.category as any,
                                              roleName: role,
                                              isCustom: false
                                            }
                                          ]
                                        : (form.impactScope?.keyRoles || []).filter(kr => kr.roleName !== role);

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
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <span>{role}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
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

                  {/* 涉及门店数量 v1.3.1优化：改用单选按钮卡片 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      涉及门店数量
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {STORE_COUNT_RANGES.map(range => {
                        const isSelected = form.impactScope?.storeCountRange === range;
                        return (
                          <label
                            key={range}
                            className={`flex items-center justify-center cursor-pointer text-sm p-3 border-2 rounded-lg transition ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="storeCountRange"
                              checked={isSelected}
                              onChange={() => setForm({
                                ...form,
                                impactScope: {
                                  storeTypes: form.impactScope?.storeTypes || [],
                                  regions: form.impactScope?.regions || [],
                                  keyRoles: form.impactScope?.keyRoles || [],
                                  storeCountRange: range
                                }
                              })}
                              className="sr-only"
                            />
                            <span>{range}</span>
                          </label>
                        );
                      })}
                    </div>
                    {form.impactScope?.storeCountRange && (
                      <button
                        type="button"
                        onClick={() => setForm({
                          ...form,
                          impactScope: {
                            storeTypes: form.impactScope?.storeTypes || [],
                            regions: form.impactScope?.regions || [],
                            keyRoles: form.impactScope?.keyRoles || [],
                            storeCountRange: undefined
                          }
                        })}
                        className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
                      >
                        清除选择
                      </button>
                    )}
                  </div>

                  {/* 与哪些地区有关？v1.3.1优化：改用checkbox网格 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      与哪些地区有关？（多选）
                    </label>
                    <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                      {regionOptions.map(region => {
                        const isSelected = (form.impactScope?.regions || []).includes(region);
                        return (
                          <label
                            key={region}
                            className="flex items-center gap-2 cursor-pointer text-sm p-2 border border-gray-200 rounded hover:bg-white transition bg-white"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const regions = e.target.checked
                                  ? [...(form.impactScope?.regions || []), region]
                                  : (form.impactScope?.regions || []).filter(r => r !== region);

                                setForm({
                                  ...form,
                                  impactScope: {
                                    storeTypes: form.impactScope?.storeTypes || [],
                                    regions,
                                    keyRoles: form.impactScope?.keyRoles || [],
                                    storeCountRange: form.impactScope?.storeCountRange
                                  }
                                });
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="truncate">{region}</span>
                          </label>
                        );
                      })}
                    </div>
                    {(form.impactScope?.regions || []).length > 0 && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                          已选择 {form.impactScope?.regions?.length} 个地区
                        </span>
                        <button
                          type="button"
                          onClick={() => setForm({
                            ...form,
                            impactScope: {
                              storeTypes: form.impactScope?.storeTypes || [],
                              regions: [],
                              keyRoles: form.impactScope?.keyRoles || [],
                              storeCountRange: form.impactScope?.storeCountRange
                            }
                          })}
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          清除全部
                        </button>
                      </div>
                    )}
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

            {/* 6. 影响的指标 */}
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
                <div className="space-y-2">
                  {/* 统计摘要 */}
                  <div className="text-sm text-gray-700">
                    已选择 <span className="font-semibold text-purple-700">{form.affectedMetrics!.length}</span> 个指标
                    <span className="text-gray-500 ml-2">
                      (OKR: {form.affectedMetrics!.filter(m => m.category === 'okr').length} |
                      过程: {form.affectedMetrics!.filter(m => m.category === 'process').length})
                    </span>
                  </div>

                  {/* 指标标签列表 */}
                  <div className="flex flex-wrap gap-2">
                    {form.affectedMetrics!.slice(0, 15).map((metric, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                          metric.category === 'okr'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-purple-100 text-purple-800 border border-purple-300'
                        }`}
                        title={metric.estimatedImpact ? `预估影响: ${metric.estimatedImpact}` : undefined}
                      >
                        {metric.category === 'okr' ? '🎯' : '📊'} {metric.displayName}
                        {metric.estimatedImpact && (
                          <span className="ml-1 text-xs opacity-75">({metric.estimatedImpact})</span>
                        )}
                      </span>
                    ))}
                    {form.affectedMetrics!.length > 15 && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
                        +{form.affectedMetrics!.length - 15} 个
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 7. 产研填写 */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-300 flex items-center gap-2">
                <Info size={18} className="text-gray-600" />
                产研填写
              </h4>

              <div className="space-y-4">
                {/* 第一行：项目、产品领域、需求类型、RMS */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">项目</label>
                    <input
                      type="text"
                      value={form.project || ''}
                      onChange={(e) => setForm({ ...form, project: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="项目名称"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">产品领域</label>
                    <select
                      value={form.productArea || ''}
                      onChange={(e) => setForm({ ...form, productArea: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择</option>
                      <option value="管店/固资/物 @张普">管店/固资/物 @张普</option>
                      <option value="toC卖货/导购/AI/培训/营销 @杜玥">toC卖货/导购/AI/培训/营销 @杜玥</option>
                      <option value="管人/SO上报/考勤 @胡馨然">管人/SO上报/考勤 @胡馨然</option>
                      <option value="toB进货/交易/返利 @李建国">toB进货/交易/返利 @李建国</option>
                    </select>
                  </div>

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

                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer mt-6">
                      <input
                        type="checkbox"
                        checked={form.isRMS}
                        onChange={(e) => setForm({ ...form, isRMS: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">RMS重构</span>
                    </label>
                  </div>
                </div>

                {/* 第二行：产品经理、后端、前端、测试 */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">产品经理</label>
                    <input
                      type="text"
                      value={form.productManager}
                      onChange={(e) => setForm({ ...form, productManager: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="产品经理"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">后端研发</label>
                    <input
                      type="text"
                      value={form.backendDeveloper || ''}
                      onChange={(e) => setForm({ ...form, backendDeveloper: e.target.value, developer: e.target.value || form.frontendDeveloper || form.tester || '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="后端"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">前端研发</label>
                    <input
                      type="text"
                      value={form.frontendDeveloper || ''}
                      onChange={(e) => setForm({ ...form, frontendDeveloper: e.target.value, developer: form.backendDeveloper || e.target.value || form.tester || '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="前端"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">测试</label>
                    <input
                      type="text"
                      value={form.tester || ''}
                      onChange={(e) => setForm({ ...form, tester: e.target.value, developer: form.backendDeveloper || form.frontendDeveloper || e.target.value || '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="测试"
                    />
                  </div>
                </div>

                {/* 第三行：产品进展、技术进展 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">产品进展</label>
                    <select
                      value={form.productProgress}
                      onChange={(e) => setForm({ ...form, productProgress: e.target.value as ProductProgressStatus })}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">技术进展</label>
                    <select
                      value={form.techProgress}
                      onChange={(e) => setForm({ ...form, techProgress: e.target.value as TechProgressStatus })}
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
                </div>

                {/* 开发工作量 */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    开发工作量（天）
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
                    value={form.complexityScore || ''}
                    onChange={(e) => setForm({ ...form, complexityScore: e.target.value ? parseInt(e.target.value) as ComplexityScore : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择...</option>
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
                      const selectedStandard = form.complexityScore ? COMPLEXITY_STANDARDS.find(s => s.score === form.complexityScore) : null;
                      if (!selectedStandard) return <div className="text-gray-400">请先选择技术复杂度</div>;
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

                {/* 产研备注/进展说明 */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">产研备注/进展说明</label>
                  <textarea
                    value={form.rdNotes || ''}
                    onChange={(e) => setForm({ ...form, rdNotes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="填写产研进展、技术方案要点、风险提示等..."
                  />
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

      {/* File Content Preview Modal */}
      {previewFileId && (() => {
        const previewFile = uploadedFiles.find(f => f.id === previewFileId);
        if (!previewFile) return null;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col shadow-2xl">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">文档内容预览</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{previewFile.name}</p>
                </div>
                <button
                  onClick={() => setPreviewFileId(null)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto px-6 py-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-300">
                    <div className="text-sm text-gray-600">
                      解析字符数：<span className="font-semibold text-gray-900">{previewFile.parsedWordCount?.toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      文件大小：<span className="font-semibold text-gray-900">{formatFileSize(previewFile.size)}</span>
                    </div>
                  </div>

                  {previewFile.parsedContent && previewFile.parsedContent.trim() ? (
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                      {previewFile.parsedContent}
                    </pre>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText size={48} className="mx-auto mb-3 text-gray-400" />
                      <p>未提取到文本内容</p>
                      <p className="text-xs mt-1">可能是扫描版PDF或图片格式</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setPreviewFileId(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};

export default EditRequirementModal;
