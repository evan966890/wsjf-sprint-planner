/**
 * AIProgressPanel - AI分析进度面板
 *
 * 功能说明：
 * 1. 显示AI智能填充的实时进度
 * 2. 显示当前分析的需求名称
 * 3. 显示AI推导过程的实时日志
 * 4. 提供终止分析功能
 */

import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface AIProgressPanelProps {
  /** 当前进度百分比 0-100 */
  progress: number;
  /** 当前分析的需求索引（从0开始） */
  currentIndex: number;
  /** 当前分析的需求名称 */
  currentName: string;
  /** 总数据条数 */
  totalCount: number;
  /** AI分析日志数组 */
  logs: string[];
  /** 日志容器引用（用于自动滚动） */
  logContainerRef: React.RefObject<HTMLDivElement>;
  /** 进度框引用（用于滚动到此位置） */
  progressBoxRef: React.RefObject<HTMLDivElement>;
  /** 终止分析回调 */
  onTerminate: () => void;
}

export default function AIProgressPanel({
  progress,
  currentIndex,
  currentName,
  totalCount,
  logs,
  logContainerRef,
  progressBoxRef,
  onTerminate,
}: AIProgressPanelProps) {
  const completedCount = currentIndex;
  const remainingCount = totalCount - currentIndex;
  const estimatedMinutes = Math.ceil(remainingCount * 3 / 60);

  return (
    <div
      ref={progressBoxRef}
      className="mb-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-400 rounded-xl p-6 shadow-2xl"
    >
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
              <span className="text-sm font-bold text-gray-900">{totalCount}</span>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-green-700">已完成</span>
              <span className="text-sm font-bold text-green-600">{completedCount}</span>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-orange-700">剩余</span>
              <span className="text-sm font-bold text-orange-600">{remainingCount}</span>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-purple-700">预计</span>
              <span className="text-sm font-bold text-purple-600">{estimatedMinutes}分钟</span>
            </div>
            <button
              type="button"
              onClick={onTerminate}
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
            style={{ width: `${progress}%` }}
          >
            {progress > 10 && (
              <span className="text-white text-xs font-bold drop-shadow">{progress}%</span>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>
        </div>
      </div>

      {/* 当前分析的需求名称 */}
      <div className="bg-blue-100 rounded-lg p-3 border-l-4 border-blue-600 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center animate-bounce">
            <span className="text-white font-bold text-xs">#{currentIndex + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-700 mb-0.5">🔍 正在深度分析</p>
            <p className="text-sm font-bold text-blue-900 truncate">{currentName}</p>
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
          <span className="text-xs text-gray-500">显示最近 {Math.min(logs.length, 20)} 条</span>
        </div>
        <div
          ref={logContainerRef}
          className="bg-black rounded p-3 h-64 overflow-y-auto font-mono text-xs space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
        >
          {logs.length === 0 ? (
            <p className="text-gray-600 text-center py-8">暂无日志...</p>
          ) : (
            logs.slice(-20).map((log, index) => (
              <div
                key={index}
                className={`
                  ${log.includes('❌') ? 'text-red-400' : ''}
                  ${log.includes('✅') || log.includes('成功') ? 'text-green-400' : ''}
                  ${log.includes('⏳') || log.includes('等待') ? 'text-yellow-400' : ''}
                  ${log.includes('📋') || log.includes('━━━') ? 'text-blue-400 font-bold' : ''}
                  ${log.includes('  └─') ? 'text-purple-300 pl-4' : ''}
                  ${!log.includes('❌') && !log.includes('✅') && !log.includes('⏳') && !log.includes('📋') && !log.includes('━━━') && !log.includes('└─') ? 'text-gray-300' : ''}
                `}
              >
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
  );
}
