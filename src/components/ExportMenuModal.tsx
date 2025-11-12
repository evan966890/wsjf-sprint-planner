/**
 * 导出菜单模态框
 * v1.6.0新增：提供双模式导出选择界面
 */

import { useState } from 'react';
import { X, FileDown, Database, FileText, Download } from 'lucide-react';
import type { ExportConfig, ExportMode, ExportFormat } from '../types/export';

interface ExportMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (config: ExportConfig) => void;
}

export function ExportMenuModal({ isOpen, onClose, onExport }: ExportMenuModalProps) {
  const [mode, setMode] = useState<ExportMode>('presentation');
  const [format, setFormat] = useState<ExportFormat>('excel');

  if (!isOpen) return null;

  const handleExport = () => {
    const config: ExportConfig = {
      mode,
      format,
      includeMetadata: true,
      includeUnscheduled: true,
      includeSprintPools: true,
    };
    onExport(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">导出数据</h2>
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
          {/* 导出模式选择 */}
          <div>
            <h3 className="text-lg font-medium mb-3">选择导出模式</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* 展示模式 */}
              <button
                onClick={() => setMode('presentation')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  mode === 'presentation'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">展示模式</span>
                </div>
                <p className="text-sm text-gray-600 text-left">
                  人类阅读友好，格式化数据，适合分析和报告
                </p>
                <div className="mt-2 text-xs text-gray-500 text-left">
                  ✓ 单Sheet导出<br/>
                  ✓ 30+扩展字段<br/>
                  ✗ 不支持完整还原
                </div>
              </button>

              {/* 数据模式 */}
              <button
                onClick={() => setMode('data')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  mode === 'data'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Database className="w-5 h-5 text-green-500" />
                  <span className="font-medium">数据模式</span>
                </div>
                <p className="text-sm text-gray-600 text-left">
                  完整数据备份，支持100%还原
                </p>
                <div className="mt-2 text-xs text-gray-500 text-left">
                  ✓ 多Sheet结构<br/>
                  ✓ 完整字段保留<br/>
                  ✓ 支持导入还原
                </div>
              </button>
            </div>
          </div>

          {/* 导出格式选择（仅数据模式显示） */}
          {mode === 'data' && (
            <div>
              <h3 className="text-lg font-medium mb-3">选择导出格式</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Excel格式 */}
                <button
                  onClick={() => setFormat('excel')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    format === 'excel'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Excel (.xlsx)</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-left">
                    多Sheet结构，可在Excel中查看
                  </p>
                </button>

                {/* JSON格式 */}
                <button
                  onClick={() => setFormat('json')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    format === 'json'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-green-600" />
                    <span className="font-medium">JSON (.json)</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-left">
                    纯数据格式，更小文件体积
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* 提示信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <div className="text-blue-600 font-medium text-sm">💡 提示</div>
            </div>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              {mode === 'presentation' ? (
                <>
                  <p>• 展示模式导出的数据格式化友好，但无法完整还原</p>
                  <p>• 适合用于数据分析、报表生成、团队分享</p>
                  <p>• 导出字段包含业务影响度、技术复杂度、影响指标等30+字段</p>
                </>
              ) : (
                <>
                  <p>• 数据模式保留所有字段，支持通过"导入"功能完整还原</p>
                  <p>• 适合用于数据备份、跨设备迁移、版本归档</p>
                  <p>• 包含元数据、需求数据、迭代池配置、关联关系等完整信息</p>
                </>
              )}
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
            onClick={handleExport}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>
    </div>
  );
}
