/**
 * WSJF Sprint Planner - 业务影响度评分选择器组件
 *
 * v1.2.0: 10分制业务影响度评分系统
 *
 * 功能：
 * - 显示10个评分等级的可视化选择器
 * - 每个等级显示分数、名称、简短描述
 * - 支持点击选择
 * - 提供"查看详细说明"按钮打开手册
 * - 高亮显示当前选中的分数
 */

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { BusinessImpactScore, ScoringStandard } from '../types';

interface BusinessImpactScoreSelectorProps {
  /** 当前选中的分数（1-10） */
  value: BusinessImpactScore;

  /** 分数改变回调 */
  onChange: (score: BusinessImpactScore) => void;

  /** 评分标准定义 */
  scoringStandards: ScoringStandard[];

  /** 点击"查看详细说明"按钮的回调 */
  onViewHandbook?: () => void;

  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 业务影响度评分选择器
 *
 * 展示形式：
 * - 紧凑模式：下拉选择框，点击展开显示所有选项
 * - 每个选项显示：[分数] 名称 - 简短描述
 * - 当前选中项高亮显示
 * - 底部提供"查看完整评分说明书"链接
 */
const BusinessImpactScoreSelector = ({
  value,
  onChange,
  scoringStandards,
  onViewHandbook,
  disabled = false
}: BusinessImpactScoreSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 获取当前选中分数的标准
  const currentStandard = scoringStandards.find(s => s.score === value);

  // 按分数降序排列（10分在最上面）
  const sortedStandards = [...scoringStandards].sort((a, b) => b.score - a.score);

  /**
   * 获取分数对应的颜色
   * 10-8: 红色系（致命/严重）
   * 7-5: 橙色系（重要）
   * 4-3: 黄色系（中等）
   * 2-1: 绿色系（低优先级）
   */
  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'bg-red-500 text-white';
    if (score >= 5) return 'bg-orange-500 text-white';
    if (score >= 3) return 'bg-yellow-500 text-gray-900';
    return 'bg-green-500 text-white';
  };

  /**
   * 获取分数对应的边框颜色
   */
  const getScoreBorderColor = (score: number): string => {
    if (score >= 8) return 'border-red-500';
    if (score >= 5) return 'border-orange-500';
    if (score >= 3) return 'border-yellow-500';
    return 'border-green-500';
  };

  return (
    <div className="space-y-2">
      {/* 选择器主体 */}
      <div className="relative">
        {/* 当前选中项显示 */}
        <button
          type="button"
          onClick={() => !disabled && setIsExpanded(!isExpanded)}
          disabled={disabled}
          className={`
            w-full px-4 py-3 rounded-lg border-2 transition-all
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:shadow-md'}
            ${currentStandard ? getScoreBorderColor(currentStandard.score) : 'border-gray-300'}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {currentStandard ? (
                <>
                  {/* 分数徽章 */}
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg
                    ${getScoreColor(currentStandard.score)}
                  `}>
                    {currentStandard.score}
                  </div>

                  {/* 名称和描述 */}
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-900">{currentStandard.name}</div>
                    <div className="text-sm text-gray-600">{currentStandard.shortDescription}</div>
                  </div>
                </>
              ) : (
                <div className="text-gray-500">请选择业务影响度评分</div>
              )}
            </div>

            {/* 展开/收起图标 */}
            {!disabled && (
              <div className="text-gray-400">
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            )}
          </div>
        </button>

        {/* 下拉选项列表 */}
        {isExpanded && !disabled && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-[500px] overflow-y-auto">
            {sortedStandards.map((standard) => {
              const isSelected = standard.score === value;

              // 生成悬浮提示内容
              const tooltipContent = [
                `【${standard.score}分 - ${standard.name}】`,
                '',
                '典型案例：',
                ...standard.typicalCases.slice(0, 2).map((c, i) => `${i + 1}. ${c}`)
              ].join('\n');

              return (
                <button
                  key={standard.score}
                  type="button"
                  onClick={() => {
                    onChange(standard.score);
                    setIsExpanded(false);
                  }}
                  title={tooltipContent}
                  className={`
                    w-full px-4 py-3 border-b border-gray-200 last:border-b-0
                    transition-colors hover:bg-gray-50
                    ${isSelected ? 'bg-blue-50' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* 分数徽章 */}
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg flex-shrink-0
                      ${getScoreColor(standard.score)}
                      ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                    `}>
                      {standard.score}
                    </div>

                    {/* 名称和描述 */}
                    <div className="text-left flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {standard.name}
                        {isSelected && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                            当前选中
                          </span>
                        )}
                        <span className="text-xs text-gray-400">(悬浮查看案例)</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-0.5">
                        {standard.shortDescription}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* 查看详细说明链接 */}
            {onViewHandbook && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    onViewHandbook();
                    setIsExpanded(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition"
                >
                  <HelpCircle size={16} />
                  查看完整评分说明书
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 帮助提示 */}
      {onViewHandbook && !isExpanded && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <HelpCircle size={12} />
          <span>
            不确定如何评分？
            <button
              type="button"
              onClick={onViewHandbook}
              className="text-blue-600 hover:text-blue-700 underline ml-1"
            >
              查看评分说明书
            </button>
          </span>
        </div>
      )}
    </div>
  );
};

export default BusinessImpactScoreSelector;
