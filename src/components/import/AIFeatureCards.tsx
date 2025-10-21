/**
 * AIFeatureCards - AI功能对比卡片
 *
 * 功能说明：
 * 1. 展示两种AI导入方式的对比卡片
 * 2. 方式一：AI智能映射（快速映射列名）
 * 3. 方式二：AI智能填充（深度分析内容填充30+字段）
 * 4. 根据映射状态显示推荐标签
 */

import React from 'react';
import { ArrowUpDown, Sparkles } from 'lucide-react';

interface AIFeatureCardsProps {
  /** 是否有字段映射 */
  hasMappedFields: boolean;
  /** 是否正在AI映射 */
  isAIMappingLoading: boolean;
  /** 是否正在AI填充 */
  isAIFillingLoading: boolean;
  /** 导入数据总条数 */
  importDataCount: number;
  /** AI填充进度百分比 */
  aiFillingProgress: number;
  /** 滚动容器引用（用于保存滚动位置） */
  modalContentRef: React.RefObject<HTMLDivElement>;
  /** 开始AI智能映射回调 */
  onAIMappingClick: () => void;
  /** 开始AI智能填充回调 */
  onAISmartFillClick: () => void;
  /** 保存滚动位置回调 */
  onSaveScrollPosition: (scrollTop: number) => void;
}

export default function AIFeatureCards({
  hasMappedFields,
  isAIMappingLoading,
  isAIFillingLoading,
  importDataCount,
  aiFillingProgress,
  modalContentRef,
  onAIMappingClick,
  onAISmartFillClick,
  onSaveScrollPosition,
}: AIFeatureCardsProps) {
  const handleAIMappingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (modalContentRef.current) {
      onSaveScrollPosition(modalContentRef.current.scrollTop);
    }
    onAIMappingClick();
  };

  const handleAISmartFillClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (modalContentRef.current) {
      onSaveScrollPosition(modalContentRef.current.scrollTop);
    }
    onAISmartFillClick();
  };

  const estimatedMinutes = Math.ceil((importDataCount * 3) / 60);
  const estimatedSeconds = (importDataCount * 3) % 60;

  return (
    <div className="mb-6 grid grid-cols-2 gap-4">
      {/* 方式一：AI智能映射（快速） */}
      <div className="border-2 border-purple-200 rounded-xl p-5 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-shadow relative overflow-hidden">
        {hasMappedFields && (
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
          onClick={handleAIMappingClick}
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
        {!hasMappedFields && (
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
          onClick={handleAISmartFillClick}
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
              <span>开始智能填充（预计{estimatedMinutes}分{estimatedSeconds}秒）</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
