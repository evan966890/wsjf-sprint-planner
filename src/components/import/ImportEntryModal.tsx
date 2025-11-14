/**
 * 智能导入入口组件
 *
 * 功能：
 * - 统一的导入入口
 * - 自动检测文件格式
 * - 智能路由到合适的导入方式
 * - 友好的UI引导
 */

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Database, FileSpreadsheet, FileImage, Sparkles, HelpCircle } from 'lucide-react';
import { detectFileFormat } from '../../utils/fileFormatDetector';
import type { FormatDetectionResult } from '../../utils/fileFormatDetector';

interface ImportEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRouteToStandard: (file: File) => void;      // 路由到标准格式导入（新导入）
  onRouteToGeneric: (file: File) => void;       // 路由到通用格式导入（旧导入）
}

export function ImportEntryModal({
  isOpen,
  onClose,
  onRouteToStandard,
  onRouteToGeneric,
}: ImportEntryModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<FormatDetectionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setDetecting(true);
    setDetectionResult(null);

    try {
      console.log('[ImportEntry] 开始检测文件:', file.name);

      // 检测文件格式
      const result = await detectFileFormat(file);
      console.log('[ImportEntry] 检测结果:', result);
      setDetectionResult(result);

      // 不再自动路由，等待用户点击按钮确认
    } catch (error) {
      console.error('[ImportEntry] 格式检测失败:', error);
      // 默认使用通用导入
      setDetectionResult({
        format: 'generic',
        confidence: 0.5,
        reason: '格式检测失败，使用AI智能导入',
        fileType: file.name.split('.').pop() || 'unknown',
      });
    } finally {
      setDetecting(false);
    }
  };

  // 确认使用标准格式导入
  const handleUseStandardImport = () => {
    if (!selectedFile) return;
    console.log('[ImportEntry] 用户选择：标准格式导入');
    onRouteToStandard(selectedFile);
    handleClose();
  };

  // 确认使用AI智能导入
  const handleUseGenericImport = () => {
    if (!selectedFile) return;
    console.log('[ImportEntry] 用户选择：AI智能导入');
    onRouteToGeneric(selectedFile);
    handleClose();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setDetecting(false);
    setDetectionResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">导入需求</h2>
              <p className="text-sm text-gray-500">支持多种格式，智能识别</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="px-6 py-6 space-y-6">
          {/* 文件选择区域 */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              选择要导入的文件
            </h3>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-gray-50">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.xlsx,.xls,.csv,.pdf,.docx,.png,.jpg,.jpeg,.webp,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="import-entry-file-input"
              />
              <label
                htmlFor="import-entry-file-input"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <div className="text-base font-medium text-gray-700">
                    点击选择文件或拖拽文件到此处
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    系统会自动识别格式并使用最合适的导入方式
                  </div>
                </div>
              </label>

              {selectedFile && (
                <div className="mt-4 flex items-center justify-center gap-3 text-sm">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-700">{selectedFile.name}</span>
                  <span className="text-gray-500">
                    ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
              )}

              {detecting && (
                <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm font-medium">正在检测文件格式...</span>
                </div>
              )}

              {detectionResult && (
                <div className={`mt-4 px-4 py-3 rounded-lg ${
                  detectionResult.format === 'wsjf-standard'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {detectionResult.format === 'wsjf-standard' ? (
                      <>
                        <Database className="w-4 h-4 text-green-600" />
                        <span className="text-green-900">标准格式</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-900">AI智能导入</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{detectionResult.reason}</div>
                </div>
              )}
            </div>
          </div>

          {/* 支持的格式说明 */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-5">
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              支持的文件格式
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* 标准格式 */}
              <div className="bg-white rounded-md p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-gray-800">系统备份文件</span>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>• JSON 数据备份</div>
                  <div>• Excel 完整备份（4个Sheet）</div>
                  <div className="text-green-600 font-medium mt-1">
                    ✓ 完整还原，零配置
                  </div>
                </div>
              </div>

              {/* 通用格式 */}
              <div className="bg-white rounded-md p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-gray-800">外部文件</span>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>• Excel / CSV 表格</div>
                  <div>• PDF 文档 / Word 文档</div>
                  <div>• 图片（OCR识别）</div>
                  <div className="text-purple-600 font-medium mt-1">
                    ✓ AI智能识别，支持任意格式
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 导入方式对比 */}
          <div className="bg-gray-50 rounded-lg p-5">
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-gray-600" />
              两种导入方式说明
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <Database className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-800">完整还原导入</div>
                  <div className="text-gray-600 mt-0.5">
                    用于还原从本系统导出的数据备份，支持版本兼容、脏数据清理、完整还原需求+迭代池+排期状态
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-800">AI智能导入</div>
                  <div className="text-gray-600 mt-0.5">
                    用于导入外部Excel、PDF、图片等文件，支持AI字段映射、AI智能填充、OCR识别、批量处理
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <FileImage className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-medium text-blue-900">💡 智能提示</p>
                <p>• 上传文件后，系统会自动识别格式并选择最佳导入方式</p>
                <p>• 系统导出的文件会自动完整还原</p>
                <p>• 外部文件会使用AI智能识别和映射</p>
                <p>• 支持Excel、PDF、图片等多种格式</p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            取消
          </button>

          {/* 根据检测结果显示推荐按钮 */}
          {detectionResult && selectedFile && (
            <div className="flex gap-3">
              {detectionResult.format === 'wsjf-standard' ? (
                <button
                  onClick={handleUseStandardImport}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <Database className="w-4 h-4" />
                  使用完整还原导入
                </button>
              ) : (
                <button
                  onClick={handleUseGenericImport}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  使用AI智能导入
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
