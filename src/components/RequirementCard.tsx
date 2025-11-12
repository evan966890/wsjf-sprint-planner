import React, { useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import type { Requirement } from '../types';
import { roundNumber } from '../utils/scoring';
import { isReadyForSchedule } from '../constants/techProgress';

// ============================================================================
// UI组件 - 需求卡片 (Requirement Card Component)
// ============================================================================

/**
 * 需求卡片组件
 *
 * 功能说明：
 * - 显示需求的核心信息（名称、工作量、分数、星级）
 * - 卡片尺寸随工作量动态变化，直观体现需求大小
 * - 根据业务影响度和截止日期显示不同颜色渐变
 * - 支持拖拽功能（HTML5 Drag & Drop API）
 * - 悬停时显示详细信息的Tooltip
 *
 * 视觉设计：
 * - 强制DDL：红色渐变背景 + 红色边框 + 感叹号标记
 * - 业务影响度：蓝色系渐变（局部→明显→撬动核心→战略平台，颜色逐渐加深）
 * - RMS重构：紫色标签
 *
 * @param requirement - 需求对象
 * @param onDragStart - 拖拽开始事件（可选）
 * @param onClick - 点击事件（可选）
 * @param compact - 紧凑模式（默认false）
 * @param showTooltip - 是否显示悬停提示（默认true）
 */
const RequirementCard = ({
  requirement,
  onDragStart,
  onClick,
  onDelete,
  compact = false,
  showTooltip = true
}: {
  requirement: Requirement;
  onDragStart?: (e: React.DragEvent) => void;
  onClick?: () => void;
  onDelete?: (reqId: string) => void;
  compact?: boolean;
  showTooltip?: boolean;
}) => {
  // 状态管理
  const [showHover, setShowHover] = useState(false);                            // 是否显示悬停提示
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top'); // 提示位置
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});   // 提示样式
  const cardRef = React.useRef<HTMLDivElement>(null);                          // 卡片DOM引用

  // 使用默认值确保安全性
  const displayScore = requirement.displayScore || 60;
  const stars = requirement.stars || 2;

  // 业务域显示逻辑
  const getBusinessDomainDisplay = () => {
    const domain = requirement.businessDomain || '国际零售通用';
    return domain;
  };

  /**
   * 计算卡片尺寸配置
   *
   * 设计理念：卡片尺寸与工作量成正比，让用户一眼看出需求大小
   * - 紧凑模式：适用于迭代池，尺寸较小，线性增长
   * - 正常模式：适用于待排期区，尺寸较大，渐进式增长
   * - 30天以上的需求增速放缓，避免卡片过大
   * - 字体大小随卡片尺寸自适应
   *
   * @returns 包含宽度、高度和字体尺寸的配置对象
   */
  const getSizeConfig = () => {
    // 健壮性检查：确保days是有效数字
    const days = Math.max(0, Number(requirement?.effortDays) || 0);

    if (compact) {
      // 紧凑模式：线性增长
      const width = Math.min(160, 70 + days * 1.8);
      const height = Math.min(105, 60 + days * 0.9);

      if (days <= 5) {
        return { width, height, nameSize: 'text-[9px]', daySize: 'text-[8px]', scoreSize: 'text-sm', starSize: 6 };
      } else if (days <= 15) {
        return { width, height, nameSize: 'text-[10px]', daySize: 'text-[9px]', scoreSize: 'text-base', starSize: 7 };
      } else if (days <= 30) {
        return { width, height, nameSize: 'text-[11px]', daySize: 'text-[10px]', scoreSize: 'text-lg', starSize: 8 };
      } else {
        return { width, height, nameSize: 'text-xs', daySize: 'text-[10px]', scoreSize: 'text-xl', starSize: 9 };
      }
    } else {
      // 正常模式：更明显的连续增长
      // 基础尺寸 + 渐进增长，30天以上继续增长但速度放缓
      let width, height;

      if (days <= 30) {
        width = 90 + days * 2.7;  // 90 -> 171
        height = 80 + days * 1.7; // 80 -> 131
      } else {
        // 30天以上继续增长，但增速降低
        width = 90 + 30 * 2.7 + (days - 30) * 1.5;  // 继续增长
        height = 80 + 30 * 1.7 + (days - 30) * 1.0; // 继续增长
      }

      // 设置最大限制，避免卡片过大
      width = Math.min(280, width);
      height = Math.min(190, height);

      // 根据天数分配字体大小
      if (days <= 5) {
        return { width, height, nameSize: 'text-[10px]', daySize: 'text-[9px]', scoreSize: 'text-base', starSize: 7 };
      } else if (days <= 15) {
        return { width, height, nameSize: 'text-xs', daySize: 'text-[10px]', scoreSize: 'text-lg', starSize: 8 };
      } else if (days <= 30) {
        return { width, height, nameSize: 'text-sm', daySize: 'text-xs', scoreSize: 'text-xl', starSize: 10 };
      } else if (days <= 60) {
        return { width, height, nameSize: 'text-base', daySize: 'text-sm', scoreSize: 'text-2xl', starSize: 12 };
      } else {
        return { width, height, nameSize: 'text-lg', daySize: 'text-base', scoreSize: 'text-3xl', starSize: 14 };
      }
    }
  };

  // 获取尺寸配置
  const sizeConfig = getSizeConfig();
  const { width, height, nameSize, daySize, scoreSize, starSize } = sizeConfig;

  /**
   * 获取卡片背景颜色渐变
   *
   * 颜色策略：
   * - 强制DDL：红色渐变（最高优先级，视觉警示）
   * - 业务影响度：蓝色系渐变，价值越高颜色越深
   *   - 局部：浅蓝色（#DBEAFE → #BFDBFE）
   *   - 明显：中蓝色（#60A5FA → #3B82F6）
   *   - 撬动核心：深蓝色（#2563EB → #1D4ED8）
   *   - 战略平台：极深蓝色（#1E40AF → #1E3A8A）
   *
   * @param bv - 业务影响度(旧字段)
   * @param hardDeadline - 是否有强制截止日期
   * @returns CSS渐变字符串
   */
  const getColor = (req: Requirement): string => {
    // 强制DDL优先级最高，使用红色渐变
    if (req.hardDeadline) {
      return 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)';
    }

    // v1.2.0升级：优先使用10分制businessImpactScore，映射到4档蓝色
    let tier = '明显'; // 默认档位

    if (req.businessImpactScore) {
      // 10分制映射到4档：战略平台(10)、撬动核心(8-9)、明显(5-7)、局部(1-4)
      const score = req.businessImpactScore;
      if (score === 10) tier = '战略平台';
      else if (score >= 8) tier = '撬动核心';
      else if (score >= 5) tier = '明显';
      else tier = '局部';
    } else if (req.bv) {
      // 向后兼容：使用旧的bv字段
      tier = req.bv;
    }

    // 根据业务影响度档位返回不同深度的蓝色渐变
    const gradients: Record<string, string> = {
      '局部': 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',      // blue-100 to blue-200
      '明显': 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',      // blue-400 to blue-500
      '撬动核心': 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',  // blue-600 to blue-700
      '战略平台': 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)'   // blue-800 to blue-900
    };
    return gradients[tier] || gradients['明显'];
  };

  // 计算视觉样式
  const bgGradient = getColor(requirement);

  // 判断是否是浅色背景（需要深色文字）
  let isLight = false;
  if (requirement.businessImpactScore) {
    isLight = requirement.businessImpactScore <= 4;
  } else {
    isLight = (requirement.bv || '明显') === '局部';
  }
  isLight = isLight && !requirement.hardDeadline;
  const textColor = isLight ? 'text-gray-800' : 'text-white';

  /**
   * 获取时间窗口的完整标签
   * @param tc - 时间窗口简称
   * @returns 完整标签文本
   */
  const getTCLabel = (tc: string): string => {
    const labels: Record<string, string> = {
      '随时': '随时可做',
      '三月窗口': '三个月内',
      '一月硬窗口': '一个月内'
    };
    return labels[tc] || tc; // 未知值返回原值
  };

  /**
   * 处理鼠标悬停事件
   *
   * 功能：智能计算Tooltip位置，确保始终在视口内可见
   * - 自动检测卡片位置，决定Tooltip显示在上方还是下方
   * - 防止Tooltip超出屏幕左右边界
   * - 使用fixed定位确保在滚动容器中正确显示
   */
  const handleMouseEnter = () => {
    setShowHover(true);

    // 检测卡片位置，决定 tooltip 显示在上方还是下方
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;

      // 使用fixed定位，计算tooltip的绝对位置
      // 如果上方空间不足250px，则显示在下方
      const position = spaceAbove < 250 ? 'bottom' : 'top';
      setTooltipPosition(position);

      const tooltipWidth = 200; // Tooltip最小宽度
      const padding = 8;         // 屏幕边缘留白

      // 计算理想的中心位置（卡片中心）
      let centerX = rect.left + rect.width / 2;
      let leftPosition = centerX;
      let transform = 'translateX(-50%)'; // 默认水平居中

      // 边界检查：防止Tooltip超出左边界
      const tooltipLeft = centerX - tooltipWidth / 2;
      if (tooltipLeft < padding) {
        // 超出左边界，调整到左边界内，左对齐
        leftPosition = padding;
        transform = 'translateX(0)';
      }

      // 边界检查：防止Tooltip超出右边界
      const tooltipRight = centerX + tooltipWidth / 2;
      if (tooltipRight > window.innerWidth - padding) {
        // 超出右边界，调整到右边界内，右对齐
        leftPosition = window.innerWidth - padding;
        transform = 'translateX(-100%)';
      }

      // 构建Tooltip样式对象
      const style: React.CSSProperties = {
        left: leftPosition,
        transform: transform,
        minWidth: `${tooltipWidth}px`
      };

      // 根据位置设置垂直偏移
      if (position === 'top') {
        style.bottom = window.innerHeight - rect.top + 8; // 显示在卡片上方
      } else {
        style.top = rect.bottom + 8; // 显示在卡片下方
      }

      setTooltipStyle(style);
    }
  };

  return (
    <div className="relative inline-block group" ref={cardRef}>
      <div
        draggable={onDragStart ? true : false}
        onDragStart={onDragStart}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowHover(false)}
        className={`flex flex-col justify-between rounded-lg transition-all duration-200 ${
          onDragStart ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
        } hover:scale-105 hover:shadow-xl ${
          requirement.hardDeadline ? 'ring-2 ring-red-500' : 'ring-1 ring-black/10'
        }`}
        style={{
          width: width,
          height: height,
          background: bgGradient,
          minWidth: width,
          minHeight: height,
          boxShadow: requirement.hardDeadline
            ? '0 4px 16px rgba(220, 38, 38, 0.3)'
            : '0 4px 16px rgba(59, 130, 246, 0.2)',
          position: 'relative',
        }}
      >
        {/* 删除按钮 - 右上角 */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();  // 防止触发卡片点击事件
              if (confirm(`确定要删除需求"${requirement.name}"吗？`)) {
                onDelete(requirement.id);
              }
            }}
            className="absolute top-1 right-1 p-1 rounded bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-auto"
            title="删除需求"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}

        {/* 标题区域 - 顶部 */}
        <div className={`p-1.5 pb-0 pointer-events-none`}>
          <div className={`font-semibold ${textColor} leading-tight line-clamp-2 ${nameSize}`}>
            {requirement.name}
          </div>
        </div>

        {/* 工作量和业务域 - 底部（权重分上方） */}
        <div className={`px-1.5 pb-1.5 pointer-events-none`}>
          <div className={`flex items-center justify-between ${textColor} opacity-75 ${daySize}`}>
            <span>{requirement.effortDays > 0 ? `${roundNumber(requirement.effortDays, 1)}天` : '未评估'}</span>
            <span className="ml-1 truncate">{getBusinessDomainDisplay()}</span>
          </div>
        </div>

        {/* 未完成技术评估的需求不显示权重分和星级（不可排期） */}
        {isReadyForSchedule(requirement.techProgress) && (
          <div className={`${isLight ? 'bg-white/40' : 'bg-black/20'} backdrop-blur-sm p-1.5 rounded-b-lg`}>
            <div className="flex items-center justify-between pointer-events-none">
              <div className={`font-bold ${textColor} ${scoreSize}`}>
                {displayScore}
              </div>
              <div className="flex gap-0.5">
                {[...Array(stars)].map((_, i) => (
                  <Star key={i} size={starSize} className={`fill-current ${textColor}`} />
                ))}
              </div>
            </div>
          </div>
        )}

        {requirement.hardDeadline && (
          <div
            className={`absolute bg-red-600 text-white rounded-full flex items-center justify-center font-bold ${compact ? 'text-xs w-5 h-5 -top-1 -right-1' : 'text-sm w-6 h-6 -top-2 -right-2'}`}
          >
            !
          </div>
        )}

        {requirement.isRMS && (
          <div
            className={`absolute bg-purple-600 text-white rounded px-1.5 py-0.5 font-semibold ${
              compact
                ? `text-[8px] ${requirement.hardDeadline ? 'top-3 -right-1' : '-top-1 -right-1'}`
                : `text-[9px] ${requirement.hardDeadline ? 'top-4 -right-1.5' : '-top-1.5 -right-1.5'}`
            }`}
          >
            RMS
          </div>
        )}
      </div>

      {showTooltip && showHover && (
        <div
          className="fixed z-[9999] bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3 whitespace-nowrap pointer-events-none"
          style={tooltipStyle}
        >
          <div className="space-y-1">
            <div className="font-semibold border-b border-white/20 pb-1 mb-1">{requirement.name}</div>
            <div>业务域: <span className="font-semibold">{getBusinessDomainDisplay()}</span></div>
            {requirement.businessSubDomain && (
              <div>业务子域: <span className="font-semibold">{requirement.businessSubDomain}</span></div>
            )}
            <div>提交方: <span className="font-semibold">{requirement.submitter}</span></div>
            <div>业务影响度: <span className="font-semibold">{requirement.businessImpactScore || 5}分</span></div>
            {requirement.complexityScore && requirement.complexityScore > 0 && (
              <div>复杂度: <span className="font-semibold">{requirement.complexityScore}分</span></div>
            )}
            <div>迫切程度: <span className="font-semibold">{getTCLabel(requirement.tc || '随时')}</span></div>
            {requirement.effortDays > 0 && (
              <div>工作量: <span className="font-semibold">{roundNumber(requirement.effortDays, 1)}天</span></div>
            )}
            {requirement.isRMS && (
              <div className="text-purple-400 font-semibold">🔧 RMS重构项目</div>
            )}
            {requirement.hardDeadline && (
              <div className="text-red-400 font-semibold">⚠️ 强制DDL: {requirement.deadlineDate}</div>
            )}
          </div>
          {tooltipPosition === 'top' ? (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          ) : (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-px">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RequirementCard;
