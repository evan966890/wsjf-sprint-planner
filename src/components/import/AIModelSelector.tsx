/**
 * AIModelSelector - AI模型选择器与统计信息
 *
 * 功能说明：
 * 1. 显示导入数据统计信息（记录数、字段数）
 * 2. 提供AI模型选择器（OpenAI/DeepSeek）
 * 3. 显示在导入预览Modal顶部
 */

import { FileSpreadsheet, Sparkles } from 'lucide-react';
import type { AIModelType } from '../../types';

interface AIModelSelectorProps {
  /** 导入数据的记录数 */
  recordCount: number;
  /** 导入数据的字段数 */
  fieldCount: number;
  /** 当前选择的AI模型 */
  selectedModel: AIModelType;
  /** 是否正在加载（AI映射或AI填充） */
  isLoading: boolean;
  /** 模型改变回调 */
  onModelChange: (model: AIModelType) => void;
}

export default function AIModelSelector({
  recordCount,
  fieldCount,
  selectedModel,
  isLoading,
  onModelChange,
}: AIModelSelectorProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="text-white" size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              检测到 {recordCount} 条记录，共 {fieldCount} 个字段
            </p>
            <p className="text-xs text-gray-600">请选择AI模型和导入方式</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="text-purple-600" size={16} />
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value as AIModelType)}
            className="px-3 py-2 border-2 border-purple-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            disabled={isLoading}
          >
            <option value="deepseek">🇨🇳 DeepSeek</option>
            <option value="openai">🌍 OpenAI</option>
          </select>
        </div>
      </div>
    </div>
  );
}
