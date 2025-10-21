/**
 * 评估进度显示组件
 *
 * 功能：
 * - AI模型选择
 * - 进度条显示
 * - API Key配置提示
 */

import { Sparkles, AlertCircle } from 'lucide-react';
import type { AIModelType } from '../../types';

interface EvaluationProgressProps {
  current: number;
  total: number;
  isEvaluating: boolean;
  selectedAIModel: AIModelType;
  onModelChange: (model: AIModelType) => void;
  apiKey: string | undefined;
}

export function EvaluationProgress({
  current,
  total,
  isEvaluating,
  selectedAIModel,
  onModelChange,
  apiKey,
}: EvaluationProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          {/* AI模型选择 */}
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-purple-600" />
            <label className="text-sm font-medium text-gray-700">AI模型：</label>
            <select
              value={selectedAIModel}
              onChange={(e) => onModelChange(e.target.value as AIModelType)}
              disabled={isEvaluating}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="deepseek">DeepSeek（推荐国内）</option>
              <option value="openai">OpenAI（推荐海外）</option>
            </select>
          </div>
        </div>
      </div>

      {/* 进度条 */}
      {isEvaluating && total > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>正在评估...</span>
            <span>{current} / {total} ({percentage}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* API Key未配置警告 */}
      {!apiKey && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>
              AI评估功能未配置。请在项目根目录创建 .env.local 文件，配置{' '}
              {selectedAIModel === 'openai' ? 'VITE_OPENAI_API_KEY' : 'VITE_DEEPSEEK_API_KEY'}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
