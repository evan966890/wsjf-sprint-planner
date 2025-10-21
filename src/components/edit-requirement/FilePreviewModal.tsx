/**
 * 文件预览模态框组件
 */

import { X, FileText } from 'lucide-react';
import type { UploadedFileInfo } from './hooks/useDocumentManager';
import { formatFileSize } from '../../utils/fileParser';

interface FilePreviewModalProps {
  file: UploadedFileInfo | null;
  onClose: () => void;
}

export const FilePreviewModal = ({ file, onClose }: FilePreviewModalProps) => {
  if (!file) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">文档内容预览</h3>
            <p className="text-sm text-gray-600 mt-0.5">{file.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-300">
              <div className="text-sm text-gray-600">
                解析字符数：<span className="font-semibold text-gray-900">{file.parsedWordCount?.toLocaleString()}</span>
              </div>
              <div className="text-sm text-gray-600">
                文件大小：<span className="font-semibold text-gray-900">{formatFileSize(file.size)}</span>
              </div>
            </div>

            {file.parsedContent && file.parsedContent.trim() ? (
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                {file.parsedContent}
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

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
