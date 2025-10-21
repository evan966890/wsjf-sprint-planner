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
import { FileSpreadsheet, X, AlertCircle, Save } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { AIModelType } from '../../types';

// 导入子组件
import AIModelSelector from './AIModelSelector';
import AIFeatureCards from './AIFeatureCards';
import AIProgressPanel from './AIProgressPanel';
import FieldMappingTable from './FieldMappingTable';
import DataPreviewTable from './DataPreviewTable';
import AIFilledDataTable from './AIFilledDataTable';

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

  // 检查是否有字段映射
  const hasMappedFields = Object.values(importMapping).some(v => v !== '');

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

  // 处理终止AI分析（显示确认对话框）
  const handleTerminateClick = () => {
    if (modalContentRef.current) {
      setImportModalScrollTop(modalContentRef.current.scrollTop);
    }
    setShowTerminateConfirm(true);
  };

  // 确认终止AI分析
  const handleConfirmTerminate = () => {
    if (modalContentRef.current) {
      setImportModalScrollTop(modalContentRef.current.scrollTop);
    }
    setShowTerminateConfirm(false);
    onTerminateAI();
  };

  // 取消终止
  const handleCancelTerminate = () => {
    if (modalContentRef.current) {
      setImportModalScrollTop(modalContentRef.current.scrollTop);
    }
    setShowTerminateConfirm(false);
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
          {/* AI模型选择器 */}
          <AIModelSelector
            recordCount={importData.length}
            fieldCount={fileFields.length}
            selectedModel={selectedAIModel}
            isLoading={isAIMappingLoading || isAIFillingLoading}
            onModelChange={onSelectedAIModelChange}
          />

          {/* AI功能对比卡片 */}
          <AIFeatureCards
            hasMappedFields={hasMappedFields}
            isAIMappingLoading={isAIMappingLoading}
            isAIFillingLoading={isAIFillingLoading}
            importDataCount={importData.length}
            aiFillingProgress={aiFillingProgress}
            modalContentRef={modalContentRef}
            onAIMappingClick={onAIMappingClick}
            onAISmartFillClick={onAISmartFillClick}
            onSaveScrollPosition={setImportModalScrollTop}
          />

          {/* AI填充进度面板 */}
          {isAIFillingLoading && (
            <AIProgressPanel
              progress={aiFillingProgress}
              currentIndex={aiFillingCurrentIndex}
              currentName={aiFillingCurrentName}
              totalCount={importData.length}
              logs={aiAnalysisLogs}
              logContainerRef={logContainerRef}
              progressBoxRef={aiProgressBoxRef}
              onTerminate={handleTerminateClick}
            />
          )}

          {/* 根据是否有AI填充数据切换显示内容 */}
          {aiFilledData.length > 0 ? (
            /* AI填充后的数据预览表格 */
            <AIFilledDataTable
              aiFilledData={aiFilledData}
              selectedRequirementIndex={selectedRequirementIndex}
              onSelectedRequirementChange={setSelectedRequirementIndex}
              onAIFilledDataChange={setAIFilledData}
            />
          ) : (
            /* 原有的字段映射配置和数据预览 */
            <>
              <FieldMappingTable
                fileFields={fileFields}
                sampleRow={sampleRow}
                importMapping={importMapping}
                onMappingChange={onImportMappingChange}
                fieldMappingRef={fieldMappingRef}
              />

              <DataPreviewTable
                fileFields={fileFields}
                importData={importData}
                previewRows={5}
              />
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
                onClick={handleCancelTerminate}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmTerminate}
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
