/**
 * ImportPreviewModal - 导入预览与字段映射弹窗
 *
 * 功能说明：
 * 1. 显示导入数据预览
 * 2. 支持字段映射配置（手动映射）
 * 3. 支持AI智能映射（方式一：快速映射列名）
 * 4. 支持AI智能填充（方式二：深度分析内容填充30+字段）
 * 5. 显示AI分析进度和日志
 * 6. 支持选择性导入和预览AI填充结果
 *
 * Props说明：
 * - isOpen: 是否显示Modal
 * - importData: 导入的原始Excel数据
 * - importMapping: 字段映射关系
 * - clearBeforeImport: 是否清空已有数据
 * - selectedAIModel: 选择的AI模型（OpenAI/DeepSeek）
 * - isAIMappingLoading: AI映射是否加载中
 * - onClose: 关闭回调
 * - onImportMappingChange: 映射关系改变回调
 * - onClearBeforeImportChange: 清空选项改变回调
 * - onSelectedAIModelChange: AI模型选择改变回调
 * - onAIMappingClick: AI智能映射点击回调
 * - onAISmartFillClick: AI智能填充点击回调
 * - onConfirmImport: 确认导入回调
 * - onTerminateAI: 终止AI分析回调
 */

import React from 'react';
import {
  FileSpreadsheet,
  X,
  Sparkles,
  ArrowUpDown,
  AlertCircle,
  Save
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { FIELD_NAME_MAP } from '../../constants/fieldNames';
import type { AIModelType } from '../../types';

interface ImportPreviewModalProps {
  isOpen: boolean;
  importData: any[];
  importMapping: Record<string, string>;
  clearBeforeImport: boolean;
  selectedAIModel: AIModelType;
  isAIMappingLoading: boolean;
  onClose: () => void;
  onImportMappingChange: (mapping: Record<string, string>) => void;
  onClearBeforeImportChange: (value: boolean) => void;
  onSelectedAIModelChange: (model: AIModelType) => void;
  onAIMappingClick: () => void;
  onAISmartFillClick: () => void;
  onConfirmImport: () => void;
  onTerminateAI: () => void;
}

export default function ImportPreviewModal({
  isOpen,
  importData,
  importMapping,
  clearBeforeImport,
  selectedAIModel,
  isAIMappingLoading,
  onClose,
  onImportMappingChange,
  onClearBeforeImportChange,
  onSelectedAIModelChange,
  onAIMappingClick,
  onAISmartFillClick,
  onConfirmImport,
  onTerminateAI,
}: ImportPreviewModalProps) {
  if (!isOpen || importData.length === 0) return null;

  // 从Store获取AI填充相关状态和滚动位置
  const {
    isAIFillingLoading,
    aiFillingProgress,
    aiFillingCurrentIndex,
    aiFillingCurrentName,
    aiFilledData,
    selectedRequirementIndex,
    setSelectedRequirementIndex,
    aiAnalysisLogs,
    importModalScrollTop,
    setImportModalScrollTop,
    isRestoringImportModalScroll,
    setIsRestoringImportModalScroll,
    setAIFilledData,
  } = useStore();

  const sampleRow = importData[0];
  const fileFields = Object.keys(sampleRow);

  // 滚动位置管理
  const modalContentRef = React.useRef<HTMLDivElement>(null);
  const aiProgressBoxRef = React.useRef<HTMLDivElement>(null);
  const logContainerRef = React.useRef<HTMLDivElement>(null);
  const fieldMappingRef = React.useRef<HTMLDivElement>(null);
  const hasAutoScrolled = React.useRef<boolean>(false);

  // 终止分析确认对话框状态
  const [showTerminateConfirm, setShowTerminateConfirm] = React.useState(false);

  // 滚动到AI进度框
  const scrollToAIProgress = () => {
    if (aiProgressBoxRef.current && modalContentRef.current) {
      const boxTop = aiProgressBoxRef.current.offsetTop;
      const scrollTop = boxTop - 100;
      setImportModalScrollTop(scrollTop);
      modalContentRef.current.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  };

  // 监听滚动事件，实时保存滚动位置到全局状态
  React.useEffect(() => {
    const elem = modalContentRef.current;
    if (!elem) return;

    const saveScroll = () => {
      const { isRestoringImportModalScroll: restoring, importModalScrollTop: currentPos, setImportModalScrollTop } = useStore.getState();

      if (restoring) {
        return;
      }

      const newScroll = elem.scrollTop;
      if (Math.abs(newScroll - currentPos) > 5) {
        setImportModalScrollTop(newScroll);
      }
    };

    elem.addEventListener('scroll', saveScroll, { passive: true });

    return () => {
      elem.removeEventListener('scroll', saveScroll);
    };
  }, []);

  // 关键修复：使用 useLayoutEffect 在浏览器绘制之前同步恢复滚动位置
  React.useLayoutEffect(() => {
    const elem = modalContentRef.current;
    if (!elem) return;

    const currentScroll = elem.scrollTop;
    const targetScroll = importModalScrollTop;

    if (targetScroll > 0 && currentScroll !== targetScroll && !isRestoringImportModalScroll) {
      setIsRestoringImportModalScroll(true);

      elem.scrollTop = targetScroll;

      requestAnimationFrame(() => {
        if (elem && elem.scrollTop !== targetScroll) {
          elem.scrollTop = targetScroll;
        }

        setTimeout(() => {
          setIsRestoringImportModalScroll(false);
        }, 100);
      });
    }
  }, [importModalScrollTop]);

  // 日志更新时，仅在日志容器内部滚动到底部，不影响页面
  React.useEffect(() => {
    if (logContainerRef.current && aiAnalysisLogs.length > 0) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [aiAnalysisLogs]);

  // AI智能填充开始时，自动滚动到进度框（只滚动一次）
  React.useEffect(() => {
    if (isAIFillingLoading && aiProgressBoxRef.current && !hasAutoScrolled.current) {
      hasAutoScrolled.current = true;
      setTimeout(() => scrollToAIProgress(), 100);
    }
    if (!isAIFillingLoading) {
      hasAutoScrolled.current = false;
    }
  }, [isAIFillingLoading]);

  // 系统字段选项
  const systemFieldOptions = [
    { value: '', label: '-- 不映射 --' },
    { value: 'name', label: '需求名称 *' },
    { value: 'submitterName', label: '提交人姓名' },
    { value: 'productManager', label: '产品经理' },
    { value: 'developer', label: '开发人员' },
    { value: 'effortDays', label: '工作量(天数)' },
    { value: 'bv', label: '业务影响度' },
    { value: 'tc', label: '时间临界' },
    { value: 'hardDeadline', label: '强制截止' },
    { value: 'techProgress', label: '技术进展' },
    { value: 'productProgress', label: '产品进展' },
    { value: 'type', label: '需求类型' },
    { value: 'submitDate', label: '提交日期' },
    { value: 'submitter', label: '提交方' },
    { value: 'isRMS', label: '是否RMS' },
  ];

  // 检查是否所有必填字段都已映射
  const hasRequiredFields = Object.values(importMapping).length > 0 && importMapping.name;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="text-white" size={24} />
            <h2 className="text-xl font-bold text-white">导入预览与字段映射</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* 内容区域 */}
        <div
          key="import-modal-content-stable"
          ref={modalContentRef}
          className="flex-1 overflow-y-auto p-6"
          style={{ overscrollBehavior: 'contain' }}
          onScroll={(e) => {
            e.stopPropagation();
          }}
        >
          {/* 统计信息 + AI模型选择 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    检测到 {importData.length} 条记录，共 {fileFields.length} 个字段
                  </p>
                  <p className="text-xs text-gray-600">请选择AI模型和导入方式</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="text-purple-600" size={16} />
                <select
                  value={selectedAIModel}
                  onChange={(e) => onSelectedAIModelChange(e.target.value as AIModelType)}
                  className="px-3 py-2 border-2 border-purple-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  disabled={isAIMappingLoading || isAIFillingLoading}
                >
                  <option value="deepseek">🇨🇳 DeepSeek</option>
                  <option value="openai">🌍 OpenAI</option>
                </select>
              </div>
            </div>
          </div>

          {/* 两种AI功能对比卡片 */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            {/* 方式一：AI智能映射（快速） */}
            <div className="border-2 border-purple-200 rounded-xl p-5 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-shadow relative overflow-hidden">
              {Object.values(importMapping).some(v => v !== '') && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-md">
                  🔥 推荐
                </div>
              )}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ArrowUpDown className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">方式一：AI智能映射</h3>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                    ⚡ 快速 | 💰 省钱
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">📌 功能说明：</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    只分析Excel<span className="font-semibold text-purple-600">列名</span>，自动匹配到系统字段
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">✅ 适用场景：</p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li className="flex items-start gap-1">
                      <span className="text-purple-500 mt-0.5">•</span>
                      <span>Excel列名<span className="font-semibold">规范清晰</span></span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-purple-500 mt-0.5">•</span>
                      <span>只需要映射<span className="font-semibold">基础字段</span>（名称、人员、日期等）</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-purple-500 mt-0.5">•</span>
                      <span>数据量大，希望<span className="font-semibold">快速导入</span></span>
                    </li>
                  </ul>
                </div>

                <div className="bg-purple-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-purple-800 mb-1">📊 举例：</p>
                  <div className="text-xs text-purple-700 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-white px-2 py-0.5 rounded">Excel列："需求名称"</span>
                      <span>→</span>
                      <span className="font-mono bg-purple-200 px-2 py-0.5 rounded">系统字段：name</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-white px-2 py-0.5 rounded">Excel列："工作量"</span>
                      <span>→</span>
                      <span className="font-mono bg-purple-200 px-2 py-0.5 rounded">系统字段：effortDays</span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                  <p className="text-xs text-yellow-800">
                    ⚠️ <span className="font-semibold">不支持</span>智能推导复杂字段（如业务影响度评分、影响的指标等）
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (modalContentRef.current) {
                    const scroll = modalContentRef.current.scrollTop;
                    setImportModalScrollTop(scroll);
                  }
                  onAIMappingClick();
                }}
                disabled={isAIMappingLoading || isAIFillingLoading}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center justify-center gap-2 font-medium shadow-md"
              >
                {isAIMappingLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>映射中...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpDown size={18} />
                    <span>开始智能映射（1秒完成）</span>
                  </>
                )}
              </button>
            </div>

            {/* 方式二：AI智能填充（深度） */}
            <div className="border-2 border-blue-300 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-white hover:shadow-xl transition-shadow relative overflow-hidden">
              {!Object.values(importMapping).some(v => v !== '') && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-md">
                  🔥 推荐
                </div>
              )}

              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                  <Sparkles className="text-white animate-pulse" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">方式二：AI智能填充</h3>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    🧠 智能 | 🎯 精准
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">📌 功能说明：</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    深度分析<span className="font-semibold text-blue-600">每条需求内容</span>，智能推导<span className="font-semibold text-blue-600">30+复杂字段</span>
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">✅ 适用场景：</p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li className="flex items-start gap-1">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>Excel数据<span className="font-semibold">混乱不规范</span>（如单列包含多信息）</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>需要AI<span className="font-semibold">智能评分</span>（业务影响度、技术复杂度）</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>需要推导<span className="font-semibold">影响的指标、区域、门店类型</span>等</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-800 mb-1">📊 举例：</p>
                  <div className="text-xs text-blue-700 space-y-1.5">
                    <div className="bg-white rounded p-2">
                      <p className="font-mono mb-1">Excel内容："门店收银系统崩溃 @杜玥 紧急 印度直营店"</p>
                      <p className="text-blue-600">↓ AI智能推导 ↓</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="bg-blue-200 px-2 py-1 rounded">产品领域：toC卖货 @杜玥</div>
                      <div className="bg-blue-200 px-2 py-1 rounded">业务影响度：10分（致命）</div>
                      <div className="bg-blue-200 px-2 py-1 rounded">区域：南亚</div>
                      <div className="bg-blue-200 px-2 py-1 rounded">门店类型：新零售-直营店</div>
                      <div className="bg-blue-200 px-2 py-1 rounded">时间窗口：一月硬窗口</div>
                      <div className="bg-blue-200 px-2 py-1 rounded">影响指标：GMV/营收</div>
                    </div>
                    <p className="text-blue-600 font-semibold">...等30+字段</p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                  <p className="text-xs text-green-800">
                    💡 <span className="font-semibold">推荐</span>：数据复杂时使用，让AI帮您完成繁琐的字段填写
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (modalContentRef.current) {
                    const scroll = modalContentRef.current.scrollTop;
                    setImportModalScrollTop(scroll);
                  }
                  onAISmartFillClick();
                }}
                disabled={isAIMappingLoading || isAIFillingLoading}
                title="☕ 用一次这个功能，记得请 Evan 喝一杯咖啡哦~ (tianyuan8@xiaomi.com)"
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg transition flex items-center justify-center gap-2 font-medium shadow-lg"
              >
                {isAIFillingLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>深度分析中...{aiFillingProgress}%</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} className="animate-pulse" />
                    <span>开始智能填充（预计{Math.ceil(importData.length * 3 / 60)}分{importData.length * 3 % 60}秒）</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI填充进度显示 */}
          {isAIFillingLoading && (
            <div ref={aiProgressBoxRef} className="mb-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-400 rounded-xl p-6 shadow-2xl">
              {/* 标题栏 + 统计信息 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                      <Sparkles className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Sparkles className="text-purple-600" size={20} />
                        AI深度分析中
                      </h3>
                      <p className="text-xs text-gray-600">正在智能推导30+字段，请稍候...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* 紧凑统计 */}
                    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200">
                      <span className="text-xs text-gray-600">总数</span>
                      <span className="text-sm font-bold text-gray-900">{importData.length}</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-xs text-green-700">已完成</span>
                      <span className="text-sm font-bold text-green-600">{aiFillingCurrentIndex}</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-xs text-orange-700">剩余</span>
                      <span className="text-sm font-bold text-orange-600">{importData.length - aiFillingCurrentIndex}</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-xs text-purple-700">预计</span>
                      <span className="text-sm font-bold text-purple-600">
                        {Math.ceil((importData.length - aiFillingCurrentIndex) * 3 / 60)}分钟
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (modalContentRef.current) {
                          setImportModalScrollTop(modalContentRef.current.scrollTop);
                        }
                        setShowTerminateConfirm(true);
                      }}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center gap-2 font-medium shadow-md"
                    >
                      <X size={16} />
                      <span>终止分析</span>
                    </button>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden shadow-inner relative">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 h-full transition-all duration-500 flex items-center justify-end pr-2 relative"
                    style={{ width: `${aiFillingProgress}%` }}
                  >
                    {aiFillingProgress > 10 && (
                      <span className="text-white text-xs font-bold drop-shadow">{aiFillingProgress}%</span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              </div>

              {/* 当前分析的需求名称 */}
              <div className="bg-blue-100 rounded-lg p-3 border-l-4 border-blue-600 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center animate-bounce">
                    <span className="text-white font-bold text-xs">#{aiFillingCurrentIndex + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-blue-700 mb-0.5">🔍 正在深度分析</p>
                    <p className="text-sm font-bold text-blue-900 truncate">{aiFillingCurrentName}</p>
                  </div>
                </div>
              </div>

              {/* AI分析详细日志 */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <h4 className="text-sm font-bold text-green-400">🔍 AI推导过程实时日志</h4>
                  </div>
                  <span className="text-xs text-gray-500">
                    显示最近 {Math.min(aiAnalysisLogs.length, 20)} 条
                  </span>
                </div>
                <div ref={logContainerRef} className="bg-black rounded p-3 h-64 overflow-y-auto font-mono text-xs space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                  {aiAnalysisLogs.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">暂无日志...</p>
                  ) : (
                    aiAnalysisLogs.slice(-20).map((log, index) => (
                      <div key={index} className={`
                        ${log.includes('❌') ? 'text-red-400' : ''}
                        ${log.includes('✅') || log.includes('成功') ? 'text-green-400' : ''}
                        ${log.includes('⏳') || log.includes('等待') ? 'text-yellow-400' : ''}
                        ${log.includes('📋') || log.includes('━━━') ? 'text-blue-400 font-bold' : ''}
                        ${log.includes('  └─') ? 'text-purple-300 pl-4' : ''}
                        ${!log.includes('❌') && !log.includes('✅') && !log.includes('⏳') && !log.includes('📋') && !log.includes('━━━') && !log.includes('└─') ? 'text-gray-300' : ''}
                      `}>
                        <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span> {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 提示信息 */}
              <div className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">💡</span>
                  <div className="flex-1 text-xs text-yellow-900 space-y-1">
                    <p className="font-semibold">温馨提示：</p>
                    <ul className="list-disc list-inside space-y-0.5 text-yellow-800">
                      <li>AI分析需要一定时间，请耐心等待，不要关闭页面</li>
                      <li>上方日志实时展示AI的推导过程，让您了解每个字段是如何被推导出来的</li>
                      <li>如需终止分析，点击右上角红色"终止分析"按钮</li>
                      <li>已分析的数据会被保留，失败的需求会标记为红色</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 根据是否有AI填充数据切换显示内容 */}
          {aiFilledData.length > 0 ? (
            /* AI填充后的数据预览表格 */
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Sparkles className="text-purple-600" size={18} />
                  AI智能填充结果预览
                </h3>
                <span className="text-sm text-gray-600">
                  ✅ {aiFilledData.filter(r => r._aiAnalysisStatus === 'success').length} 成功 |
                  ❌ {aiFilledData.filter(r => r._aiAnalysisStatus === 'failed').length} 失败
                </span>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  💡 提示：请检查AI填充的数据，勾选需要导入的需求。失败的需求已标记为红色，您可以取消勾选或手动修正后再导入。
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left w-12">
                        <input
                          type="checkbox"
                          checked={aiFilledData.every(r => r._isSelected)}
                          onChange={(e) => {
                            const updated = aiFilledData.map(r => ({
                              ...r,
                              _isSelected: e.target.checked
                            }));
                            setAIFilledData(updated);
                          }}
                          className="w-4 h-4 rounded"
                        />
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">状态</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">需求名称</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">业务影响度</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">技术复杂度</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">产品领域</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">工作量</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">AI字段数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiFilledData.map((req, index) => {
                      const isSuccess = req._aiAnalysisStatus === 'success';
                      const aiFieldCount = req._aiFilledFields?.length || 0;

                      return (
                        <tr
                          key={index}
                          className={`border-t border-gray-200 cursor-pointer hover:bg-gray-50 ${
                            !isSuccess ? 'bg-red-50' : ''
                          } ${selectedRequirementIndex === index ? 'bg-blue-100' : ''}`}
                          onClick={() => setSelectedRequirementIndex(index)}
                        >
                          <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={req._isSelected || false}
                              onChange={(e) => {
                                const updated = [...aiFilledData];
                                updated[index] = { ...updated[index], _isSelected: e.target.checked };
                                setAIFilledData(updated);
                              }}
                              className="w-4 h-4 rounded"
                            />
                          </td>
                          <td className="px-3 py-2">
                            {isSuccess ? (
                              <span className="text-green-600 font-semibold">✅ 成功</span>
                            ) : (
                              <span className="text-red-600 font-semibold" title={req._aiErrorMessage}>
                                ❌ 失败
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-800 max-w-xs truncate">
                            {req.name}
                          </td>
                          <td className="px-3 py-2">
                            {req.businessImpactScore ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="font-semibold text-blue-600">{req.businessImpactScore}分</span>
                                {req._aiFilledFields?.includes('businessImpactScore') && (
                                  <Sparkles size={12} className="text-purple-500" />
                                )}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-3 py-2">
                            {req.complexityScore ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="font-semibold text-orange-600">{req.complexityScore}分</span>
                                {req._aiFilledFields?.includes('complexityScore') && (
                                  <Sparkles size={12} className="text-purple-500" />
                                )}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-3 py-2 text-gray-600 max-w-xs truncate">
                            {req.productArea || '-'}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {req.effortDays || 0}天
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className="text-purple-600 font-semibold cursor-help flex items-center gap-1"
                              title={req._aiFilledFields?.map(f => FIELD_NAME_MAP[f] || f).join('、') || '无AI填充字段'}
                            >
                              <Sparkles size={14} className="text-purple-600" />
                              {aiFieldCount}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 选中需求的详细信息 - 完整展示所有字段和值 */}
              {selectedRequirementIndex !== null && aiFilledData[selectedRequirementIndex] && (
                <div className="mt-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                        {selectedRequirementIndex + 1}
                      </span>
                      需求详情预览 - 完整信息
                    </h4>
                    <button
                      onClick={() => setSelectedRequirementIndex(null)}
                      className="text-blue-600 hover:text-blue-800 transition"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  {(() => {
                    const req = aiFilledData[selectedRequirementIndex];
                    const aiFilledFields = req._aiFilledFields || [];
                    const basicFields = ['name', 'description', 'submitterName', 'submitDate', 'submitter', 'businessTeam'];
                    const businessFields = ['businessImpactScore', 'affectedMetrics', 'impactScope', 'businessDomain', 'customBusinessDomain'];
                    const timeFields = ['timeCriticality', 'hardDeadline', 'deadlineDate'];
                    const techFields = ['effortDays', 'complexityScore', 'type', 'productManager', 'developer', 'productProgress', 'techProgress', 'dependencies', 'isRMS'];
                    const extendedFields = ['project', 'productArea', 'backendDeveloper', 'frontendDeveloper', 'tester', 'rdNotes'];

                    // 计算字段统计
                    const allFieldKeys = [...basicFields, ...businessFields, ...timeFields, ...techFields, ...extendedFields];
                    const totalFieldsCount = allFieldKeys.filter(key => {
                      const value = (req as any)[key];
                      return value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0);
                    }).length;
                    const aiFilledCount = aiFilledFields.length;
                    const directMatchedCount = totalFieldsCount - aiFilledCount;

                    // 定义字段渲染逻辑
                    const renderField = (fieldKey: string, fieldValue: any) => {
                      if (fieldKey.startsWith('_') || fieldKey === 'id') return null;
                      if (fieldValue === undefined || fieldValue === null || fieldValue === '' ||
                          (Array.isArray(fieldValue) && fieldValue.length === 0)) return null;

                      const isAIFilled = aiFilledFields.includes(fieldKey);
                      const fieldLabel = FIELD_NAME_MAP[fieldKey] || fieldKey;

                      // 格式化字段值
                      let displayValue: string;
                      if (Array.isArray(fieldValue)) {
                        if (fieldKey === 'affectedMetrics') {
                          displayValue = fieldValue.map((m: any) => m.displayName || m.metricName).join('、');
                        } else if (fieldKey === 'dependencies') {
                          displayValue = fieldValue.join('、');
                        } else {
                          displayValue = fieldValue.join('、');
                        }
                      } else if (typeof fieldValue === 'object') {
                        if (fieldKey === 'impactScope') {
                          const parts = [];
                          if (fieldValue.storeTypes?.length) parts.push(`门店类型: ${fieldValue.storeTypes.join('、')}`);
                          if (fieldValue.regions?.length) parts.push(`区域: ${fieldValue.regions.join('、')}`);
                          if (fieldValue.storeCountRange) parts.push(`门店数: ${fieldValue.storeCountRange}`);
                          displayValue = parts.join(' | ');
                        } else {
                          displayValue = JSON.stringify(fieldValue);
                        }
                      } else if (typeof fieldValue === 'boolean') {
                        displayValue = fieldValue ? '是' : '否';
                      } else {
                        displayValue = String(fieldValue);
                      }

                      return (
                        <div key={fieldKey} className="flex items-start gap-2 py-1.5 border-b border-gray-200 last:border-0">
                          <div className="flex items-center gap-1 min-w-[100px]">
                            {isAIFilled && <Sparkles size={12} className="text-purple-600 flex-shrink-0" />}
                            <span className={`text-xs font-semibold ${isAIFilled ? 'text-purple-700' : 'text-gray-700'}`}>
                              {fieldLabel}:
                            </span>
                          </div>
                          <div className="flex-1 text-xs text-gray-900 break-words">
                            {displayValue}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <>
                        {/* 字段统计信息 */}
                        <div className="mb-2 px-2 py-1.5 bg-white/60 rounded text-xs text-gray-700 flex items-center gap-3">
                          <span className="font-semibold">共 {totalFieldsCount} 个字段</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-green-700">{directMatchedCount} 个直接匹配</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-purple-700 flex items-center gap-1">
                            <Sparkles size={10} className="text-purple-600" />
                            {aiFilledCount} 个AI推导
                          </span>
                          <span className="text-gray-400">|</span>
                          <span className="text-orange-600 font-medium">请仔细核对</span>
                        </div>

                        <div className="space-y-3 text-xs max-h-[500px] overflow-y-auto">
                          {/* 基本信息 */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-1">
                              <span className="w-1 h-4 bg-blue-600 rounded"></span>
                              基本信息
                            </h5>
                            {basicFields.map(field => renderField(field, (req as any)[field]))}
                          </div>

                          {/* 业务影响度 */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-1">
                              <span className="w-1 h-4 bg-blue-600 rounded"></span>
                              业务影响度
                            </h5>
                            {businessFields.map(field => renderField(field, (req as any)[field]))}
                          </div>

                          {/* 时间维度 */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-1">
                              <span className="w-1 h-4 bg-orange-600 rounded"></span>
                              时间维度
                            </h5>
                            {timeFields.map(field => renderField(field, (req as any)[field]))}
                          </div>

                          {/* 技术信息 */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-1">
                              <span className="w-1 h-4 bg-green-600 rounded"></span>
                              技术信息
                            </h5>
                            {techFields.map(field => renderField(field, (req as any)[field]))}
                          </div>

                          {/* 产研扩展 */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-1">
                              <span className="w-1 h-4 bg-purple-600 rounded"></span>
                              产研扩展
                            </h5>
                            {extendedFields.map(field => renderField(field, (req as any)[field]))}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            /* 原有的字段映射配置 */
            <>
              <div ref={fieldMappingRef} className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <ArrowUpDown size={18} />
                  字段映射配置
                </h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/3">Excel列名</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/4">示例数据</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/3">映射到系统字段</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fileFields.map((field, index) => {
                        const mappedSystemField = Object.keys(importMapping).find(
                          key => importMapping[key] === field
                        ) || '';

                        return (
                          <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">{field}</td>
                            <td className="px-4 py-3 text-gray-600 truncate max-w-xs">
                              {String(sampleRow[field])}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={mappedSystemField}
                                onChange={(e) => {
                                  const newMapping = { ...importMapping };
                                  Object.keys(newMapping).forEach(key => {
                                    if (newMapping[key] === field) {
                                      delete newMapping[key];
                                    }
                                  });
                                  if (e.target.value) {
                                    newMapping[e.target.value] = field;
                                  }
                                  onImportMappingChange(newMapping);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                              >
                                {systemFieldOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 数据预览 */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">数据预览（前5条）</h3>
                <div className="border border-gray-200 rounded-lg overflow-auto max-h-60">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {fileFields.map(field => (
                          <th key={field} className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">
                            {field}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importData.slice(0, 5).map((row: any, index: number) => (
                        <tr key={index} className="border-t border-gray-200">
                          {fileFields.map(field => (
                            <td key={field} className="px-3 py-2 text-gray-600 whitespace-nowrap">
                              {String(row[field])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 警告提示 */}
              {!hasRequiredFields && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span className="font-semibold">注意：</span>
                    必须映射"需求名称"字段才能导入
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="clear-before-import"
              checked={clearBeforeImport}
              onChange={(e) => onClearBeforeImportChange(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
            />
            <label htmlFor="clear-before-import" className="text-sm text-gray-700 cursor-pointer">
              清空已有需求并导入全新数据
              {clearBeforeImport && (
                <span className="ml-2 text-red-600 font-semibold">（警告：将删除所有现有需求！）</span>
              )}
            </label>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
            >
              取消
            </button>
            <button
              onClick={onConfirmImport}
              disabled={aiFilledData.length > 0 ? aiFilledData.filter(r => r._isSelected).length === 0 : !hasRequiredFields}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg transition font-medium flex items-center gap-2"
            >
              <Save size={18} />
              {aiFilledData.length > 0
                ? `确认导入 (已选${aiFilledData.filter(r => r._isSelected).length}/${aiFilledData.length} 条)`
                : `确认导入 (${importData.length} 条)`}
            </button>
          </div>
        </div>
      </div>

      {/* 终止分析确认对话框 */}
      {showTerminateConfirm && (
        <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-[slideIn_0.3s_ease-out]">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">确定要终止AI分析吗？</h3>
                <p className="text-sm text-gray-600">此操作无法撤销</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-gray-700">已分析 <strong className="text-green-700">{aiFillingCurrentIndex}</strong> 条需求的数据将会保留</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-600">⚠</span>
                <span className="text-gray-700">剩余 <strong className="text-orange-700">{importData.length - aiFillingCurrentIndex}</strong> 条需求将不会分析</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span className="text-gray-700">终止后 <strong className="text-red-700">无法恢复</strong>，需要重新开始</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (modalContentRef.current) {
                    setImportModalScrollTop(modalContentRef.current.scrollTop);
                  }
                  setShowTerminateConfirm(false);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
              >
                取消
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (modalContentRef.current) {
                    setImportModalScrollTop(modalContentRef.current.scrollTop);
                  }
                  setShowTerminateConfirm(false);
                  onTerminateAI();
                }}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium shadow-md"
              >
                确定终止
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
