/**
 * 导入验证模态框
 * v1.6.0新增：显示导入预览和验证结果
 */

import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle, AlertCircle, AlertTriangle, FileUp } from 'lucide-react';
import type { ImportValidationResult, ImportOptions } from '../types/export';

interface ImportValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onValidate: (file: File) => Promise<ImportValidationResult>;
  onImport: (file: File, options: ImportOptions) => Promise<void>;
  isImporting: boolean;
  externalFile?: File;  // 外部传入的文件（从ImportEntryModal）
}

export function ImportValidationModal({
  isOpen,
  onClose,
  onValidate,
  onImport,
  isImporting,
  externalFile,
}: ImportValidationModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [mergeMode, setMergeMode] = useState<'replace' | 'append'>('replace');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 如果有外部传入的文件，自动使用它
  React.useEffect(() => {
    if (externalFile && isOpen) {
      console.log('[ImportValidationModal] 使用外部传入的文件:', externalFile.name);
      setSelectedFile(externalFile);
      setValidationResult(null);

      // 自动验证
      (async () => {
        try {
          const result = await onValidate(externalFile);
          setValidationResult(result);
        } catch (error) {
          console.error('[ImportValidationModal] 验证失败:', error);
        }
      })();
    }
  }, [externalFile, isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setValidationResult(null);

    // 自动验证
    try {
      const result = await onValidate(file);
      setValidationResult(result);
    } catch (error) {
      console.error('验证失败:', error);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    // 检查是否有阻塞错误
    if (validationResult) {
      const blockingErrors = validationResult.errors.filter(
        e => e.severity === 'critical' || e.severity === 'error'
      );
      if (blockingErrors.length > 0) {
        console.error('[ImportValidationModal] 有阻塞错误，无法导入');
        return;
      }
    }

    const options: ImportOptions = {
      mergeMode,
      validateOnly: false,
      autoFixErrors: true,
      createBackup: true,
    };

    try {
      await onImport(selectedFile, options);
      onClose();
    } catch (error) {
      console.error('导入失败:', error);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setValidationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-semibold">导入数据</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="px-6 py-6 space-y-6">
          {/* 文件选择 */}
          <div>
            <h3 className="text-lg font-medium mb-3">选择导入文件</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="import-file-input"
              />
              <label
                htmlFor="import-file-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <FileUp className="w-12 h-12 text-gray-400" />
                <div className="text-sm text-gray-600">
                  点击选择文件或拖拽文件到此处
                </div>
                <div className="text-xs text-gray-500">
                  支持 JSON (.json) 和 Excel (.xlsx) 格式
                </div>
              </label>
              {selectedFile && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-gray-500">
                    ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </span>
                  <button
                    onClick={handleReset}
                    className="text-red-500 hover:text-red-600"
                  >
                    重新选择
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 验证结果 */}
          {validationResult && (
            <div>
              <h3 className="text-lg font-medium mb-3">验证结果</h3>

              {/* 状态指示 */}
              {(() => {
                const blockingErrors = validationResult.errors.filter(
                  e => e.severity === 'critical' || e.severity === 'error'
                );
                const hasCleanup = validationResult.cleanupStats &&
                  (validationResult.cleanupStats.cleanedFromPools > 0 ||
                   validationResult.cleanupStats.cleanedFromUnscheduled > 0);

                if (blockingErrors.length === 0 && !hasCleanup) {
                  // 完全通过
                  return (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-green-900">验证通过</div>
                        <div className="text-sm text-green-700 mt-1">
                          数据格式正确，可以安全导入
                        </div>
                      </div>
                    </div>
                  );
                } else if (blockingErrors.length === 0 && hasCleanup) {
                  // 有清理但可以导入
                  return (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-yellow-900">数据需要清理</div>
                        <div className="text-sm text-yellow-700 mt-1">
                          系统已自动修复 {validationResult.warnings.length} 个问题，可以安全导入
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // 有阻塞错误
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-red-900">验证失败</div>
                        <div className="text-sm text-red-700 mt-1">
                          发现 {blockingErrors.length} 个错误，无法导入
                        </div>
                      </div>
                    </div>
                  );
                }
              })()}

              {/* 错误列表 */}
              {validationResult.errors.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="font-medium text-sm text-gray-700">错误详情：</div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {validationResult.errors.map((error, idx) => (
                      <div
                        key={idx}
                        className="bg-red-50 border border-red-200 rounded p-3 text-sm"
                      >
                        <div className="font-medium text-red-900">{error.message}</div>
                        {error.details && (
                          <div className="text-red-700 mt-1 text-xs">{error.details}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 警告列表 */}
              {validationResult.warnings.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="font-medium text-sm text-gray-700">警告信息：</div>
                  <div className="space-y-2">
                    {validationResult.warnings.map((warning, idx) => (
                      <div
                        key={idx}
                        className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm flex gap-2"
                      >
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-yellow-900">{warning.message}</div>
                          {warning.suggestion && (
                            <div className="text-yellow-700 mt-1 text-xs">
                              建议：{warning.suggestion}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 数据预览 */}
              {validationResult.preview && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <div className="font-medium text-sm text-gray-700 mb-2">数据预览：</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">总需求数：</span>
                      <span className="font-medium ml-1">
                        {validationResult.preview.totalRequirements}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">已排期：</span>
                      <span className="font-medium ml-1">
                        {validationResult.preview.scheduledRequirements}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">待排期：</span>
                      <span className="font-medium ml-1">
                        {validationResult.preview.unscheduledRequirements}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">迭代池数：</span>
                      <span className="font-medium ml-1">
                        {validationResult.preview.sprintPoolsCount}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 清理统计报告 */}
              {validationResult.cleanupStats &&
               (validationResult.cleanupStats.cleanedFromPools > 0 ||
                validationResult.cleanupStats.cleanedFromUnscheduled > 0) && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="font-medium text-sm text-blue-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    🧹 自动清理报告
                  </div>
                  <div className="text-sm text-gray-700 space-y-1">
                    {validationResult.cleanupStats.cleanedFromPools > 0 && (
                      <p>• 迭代池：清理了 <span className="font-medium text-blue-700">{validationResult.cleanupStats.cleanedFromPools}</span> 个无效引用</p>
                    )}
                    {validationResult.cleanupStats.cleanedFromUnscheduled > 0 && (
                      <p>• 待排期列表：清理了 <span className="font-medium text-blue-700">{validationResult.cleanupStats.cleanedFromUnscheduled}</span> 个无效引用</p>
                    )}
                    <p className="text-xs text-gray-600 mt-2">
                      💡 这些引用指向已删除的需求，系统已自动过滤
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 导入选项 */}
          {validationResult && (() => {
            const blockingErrors = validationResult.errors.filter(
              e => e.severity === 'critical' || e.severity === 'error'
            );
            return blockingErrors.length === 0;
          })() && (
            <div>
              <h3 className="text-lg font-medium mb-3">导入选项</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mergeMode"
                      value="replace"
                      checked={mergeMode === 'replace'}
                      onChange={() => setMergeMode('replace')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">替换模式：清空现有数据后导入</span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mergeMode"
                      value="append"
                      checked={mergeMode === 'append'}
                      onChange={() => setMergeMode('append')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">追加模式：保留现有数据，追加新数据</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 编辑警告 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-yellow-900 text-sm">⚠️ 编辑导出文件的注意事项</div>
                <div className="mt-2 text-sm text-yellow-700 space-y-1">
                  <p>• ✅ 可编辑简单字段：名称、工作量、评分、日期等</p>
                  <p>• ✅ 可删除需求行：系统会自动清理相关引用</p>
                  <p>• ⚠️ 不要编辑包含 [] 或 {'{}'} 的字段（如影响指标、影响范围）</p>
                  <p>• ⚠️ 不要删除或重命名Sheet名称</p>
                  <p>• 💡 数字字段可以是文本格式，系统会自动转换</p>
                </div>
              </div>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <div className="text-blue-600 font-medium text-sm">💡 提示</div>
            </div>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              <p>• 仅支持导入"数据模式"导出的文件</p>
              <p>• 导入前会自动创建当前数据的备份</p>
              <p>• 建议使用"替换模式"以避免数据冲突</p>
              <p>• 系统会自动修复常见的格式问题（数字、布尔值等）</p>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={(() => {
              if (!validationResult || isImporting) return true;
              const blockingErrors = validationResult.errors.filter(
                e => e.severity === 'critical' || e.severity === 'error'
              );
              return blockingErrors.length > 0;
            })()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            {isImporting ? '导入中...' : '确认导入'}
          </button>
        </div>
      </div>
    </div>
  );
}
