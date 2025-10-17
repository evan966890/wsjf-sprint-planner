/**
 * WSJF Sprint Planner - WSJF加权优先级排期可视化工具
 *
 * 项目概述：
 * 基于 WSJF (Weighted Shortest Job First) 方法的迭代需求排期决策工具
 * 帮助团队通过业务价值、时间临界性、工作量等维度评估需求优先级
 *
 * 技术栈：
 * - React 18 + TypeScript
 * - Tailwind CSS (样式)
 * - Lucide React (图标)
 * - xlsx (Excel导出)
 * - jsPDF + html2canvas (PDF导出)
 *
 * 核心功能：
 * 1. WSJF评分算法：自动计算需求热度分(1-100)和星级(2-5星)
 * 2. 拖拽排期：支持需求在迭代池间拖拽移动
 * 3. 数据持久化：LocalStorage存储用户数据
 * 4. 多维筛选：按业务价值、时间临界性、截止日期等筛选
 * 5. 数据导入导出：支持Excel、JSON格式导入导出，支持PDF导出
 * 6. 智能映射：AI辅助字段映射(集成Gemini API)
 *
 * @author WSJF Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, X, Save, Edit2, Plus, Search, Filter, Star, Info, HelpCircle, Download, Upload, FileSpreadsheet, FileText, Image as ImageIcon, LogOut, User as UserIcon, ArrowUpDown, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as storage from './storage';

// ============================================================================
// 系统配置 (System Configuration)
// ============================================================================

/**
 * OpenAI API配置
 * 用于AI智能字段映射功能
 *
 * 配置说明：
 * 1. 将您的OpenAI API Key填入下方OPENAI_API_KEY常量
 * 2. 获取方式：访问 https://platform.openai.com/api-keys 创建API Key
 * 3. 配置后所有用户将共享使用此API Key进行AI映射
 */
const OPENAI_API_KEY = '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'; // 请在此处填入您的OpenAI API Key

// ============================================================================
// 类型定义 (Type Definitions)
// ============================================================================

/**
 * 需求条目接口
 * 描述单个需求的完整信息，包括基本信息、评分维度和计算结果
 */
interface Requirement {
  id: string;                    // 需求唯一标识符
  name: string;                  // 需求名称
  submitterName: string;         // 需求提交人姓名
  productManager: string;        // 产品经理
  developer: string;             // 研发负责人
  productProgress: string;       // 产品进度状态
  effortDays: number;            // 预估工作量（人天）
  bv: string;                    // Business Value 业务价值：局部/明显/撬动核心/战略平台
  tc: string;                    // Time Criticality 时间临界性：随时/三月窗口/一月硬窗口
  hardDeadline: boolean;         // 是否存在强制截止日期
  deadlineDate?: string;         // 截止日期（可选，hardDeadline为true时应填写）
  techProgress: string;          // 技术进度状态
  dependencies?: string[];       // 依赖的其他需求ID列表（可选）
  type: string;                  // 需求类型
  submitDate: string;            // 需求提交日期
  submitter: string;             // 需求提交方：产品/研发/业务
  isRMS: boolean;                // 是否为RMS重构项目
  businessDomain: string;        // 业务域：新零售/渠道零售/国际零售通用/自定义
  customBusinessDomain?: string; // 自定义业务域名称（当businessDomain为"自定义"时填写）
  rawScore?: number;             // 原始分数（3-26范围，由WSJF算法计算）
  displayScore?: number;         // 展示分数（1-100范围，归一化后的热度分）
  stars?: number;                // 星级评定（2-5星，基于displayScore分档）
}

/**
 * 迭代池接口
 * 描述一个迭代周期的时间范围、资源预留和已排期需求
 */
interface SprintPool {
  id: string;                    // 迭代池唯一标识符
  name: string;                  // 迭代池名称（如"迭代1"）
  startDate: string;             // 开始日期（YYYY-MM-DD格式）
  endDate: string;               // 结束日期（YYYY-MM-DD格式）
  totalDays: number;             // 迭代总可用人天数
  bugReserve: number;            // Bug修复预留人天（百分比，0-100）
  refactorReserve: number;       // 重构预留人天（百分比，0-100）
  otherReserve: number;          // 其他预留人天（百分比，0-100）
  requirements: Requirement[];   // 已排期的需求列表
}

/**
 * 用户接口
 * 描述登录用户的基本信息
 */
interface User {
  name: string;                  // 用户姓名
  email: string;                 // 用户邮箱
}

// ============================================================================
// WSJF评分算法 (WSJF Scoring Algorithm)
// ============================================================================

/**
 * 计算WSJF分数
 *
 * 算法说明：
 * 1. 计算原始分(rawScore): BV + TC + DDL + WorkloadScore，范围3-26
 * 2. 归一化为展示分(displayScore): 线性映射到1-100范围
 * 3. 分档为星级(stars): 根据展示分划分为2-5星
 *
 * 评分维度：
 * - BV(业务价值): 局部3 | 明显6 | 撬动核心8 | 战略平台10
 * - TC(时间临界): 随时0 | 三月窗口3 | 一月硬窗口5
 * - DDL(强制截止): 无0 | 有5
 * - WorkloadScore(工作量奖励): ≤5天+6 | 6-15天+4 | 16-30天+2 | >30天+0
 *
 * @param requirements - 需求列表
 * @returns 带有计算分数的需求列表
 */
const calculateScores = (requirements: Requirement[]) => {
  // 空数组检查：如果没有需求，直接返回空数组
  if (!requirements || requirements.length === 0) {
    return [];
  }

  // 业务价值映射表（默认值为最低档"局部"的3分）
  const BV_MAP: Record<string, number> = {
    '局部': 3,
    '明显': 6,
    '撬动核心': 8,
    '战略平台': 10
  };

  // 时间临界性映射表（默认值为"随时"的0分）
  const TC_MAP: Record<string, number> = {
    '随时': 0,
    '三月窗口': 3,
    '一月硬窗口': 5
  };

  /**
   * 根据工作量计算加分
   * 鼓励需求拆分，小需求获得更高加分
   * @param days - 工作量天数
   * @returns 工作量加分（0-6分）
   */
  const getWorkloadScore = (days: number): number => {
    // 健壮性检查：确保days是有效数字
    const validDays = Math.max(0, Number(days) || 0);

    if (validDays <= 5) return 6;
    if (validDays <= 15) return 4;
    if (validDays <= 30) return 2;
    return 0;
  };

  // 第一步：计算原始分数（rawScore）
  const withRawScores = requirements.map(req => {
    // 使用默认值确保计算安全性
    const bvScore = BV_MAP[req.bv] || 3;           // 业务价值分
    const tcScore = TC_MAP[req.tc] || 0;           // 时间临界分
    const ddlScore = req.hardDeadline ? 5 : 0;     // 强制截止加分
    const wlScore = getWorkloadScore(req.effortDays); // 工作量加分

    // 原始分 = 各维度分数之和（范围: 3-26）
    const rawScore = bvScore + tcScore + ddlScore + wlScore;

    return { ...req, rawScore };
  });

  // 第二步：归一化为展示分数（displayScore, 1-100）
  const rawScores = withRawScores.map(r => r.rawScore!);

  // 处理空数组情况
  if (rawScores.length === 0) {
    return withRawScores;
  }

  // 获取当前批次的最小值和最大值
  const minRaw = Math.min(...rawScores);
  const maxRaw = Math.max(...rawScores);

  return withRawScores.map(req => {
    let displayScore = 60; // 默认展示分（所有需求分数相同时使用）

    // 当最大值和最小值不同时，进行线性归一化
    // 公式: DisplayScore = 10 + 90 * (RawScore - MinRaw) / (MaxRaw - MinRaw)
    if (maxRaw !== minRaw) {
      displayScore = Math.round(10 + 90 * (req.rawScore! - minRaw) / (maxRaw - minRaw));
    }

    // 第三步：根据展示分确定星级（2-5星）
    let stars = 2; // 默认2星
    if (displayScore >= 85) stars = 5;      // ★★★★★ 强窗口/立即投入
    else if (displayScore >= 70) stars = 4; // ★★★★ 优先执行
    else if (displayScore >= 55) stars = 3; // ★★★ 普通计划项
    // ≤54: ★★ 择机安排

    return { ...req, displayScore, stars };
  });
};

/**
 * 四舍五入工具函数
 * 用于修复JavaScript浮点数精度问题
 * @param num - 需要四舍五入的数字
 * @param decimals - 保留的小数位数，默认1位
 * @returns 四舍五入后的数字
 */
const roundNumber = (num: number, decimals: number = 1): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

// ============================================================================
// UI组件 - 需求卡片 (Requirement Card Component)
// ============================================================================

/**
 * 需求卡片组件
 *
 * 功能说明：
 * - 显示需求的核心信息（名称、工作量、分数、星级）
 * - 卡片尺寸随工作量动态变化，直观体现需求大小
 * - 根据业务价值和截止日期显示不同颜色渐变
 * - 支持拖拽功能（HTML5 Drag & Drop API）
 * - 悬停时显示详细信息的Tooltip
 *
 * 视觉设计：
 * - 强制DDL：红色渐变背景 + 红色边框 + 感叹号标记
 * - 业务价值：蓝色系渐变（局部→明显→撬动核心→战略平台，颜色逐渐加深）
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
  compact = false,
  showTooltip = true
}: {
  requirement: Requirement;
  onDragStart?: (e: React.DragEvent) => void;
  onClick?: () => void;
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
   * - 业务价值：蓝色系渐变，价值越高颜色越深
   *   - 局部：浅蓝色（#DBEAFE → #BFDBFE）
   *   - 明显：中蓝色（#60A5FA → #3B82F6）
   *   - 撬动核心：深蓝色（#2563EB → #1D4ED8）
   *   - 战略平台：极深蓝色（#1E40AF → #1E3A8A）
   *
   * @param bv - 业务价值
   * @param hardDeadline - 是否有强制截止日期
   * @returns CSS渐变字符串
   */
  const getColor = (bv: string, hardDeadline: boolean): string => {
    // 强制DDL优先级最高，使用红色渐变
    if (hardDeadline) {
      return 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)';
    }

    // 根据业务价值返回不同深度的蓝色渐变
    const gradients: Record<string, string> = {
      '局部': 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
      '明显': 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
      '撬动核心': 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
      '战略平台': 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)'
    };
    return gradients[bv] || gradients['明显']; // 未知值默认为"明显"
  };

  // 计算视觉样式
  const bgGradient = getColor(requirement.bv, requirement.hardDeadline);
  const isLight = requirement.bv === '局部' && !requirement.hardDeadline; // 浅色背景需要深色文字
  const textColor = isLight ? 'text-gray-800' : 'text-white';

  /**
   * 获取业务价值的完整标签
   * @param bv - 业务价值简称
   * @returns 完整标签文本
   */
  const getBVLabel = (bv: string): string => {
    const labels: Record<string, string> = {
      '局部': '局部体验优化',
      '明显': '明显改善',
      '撬动核心': '撬动核心指标',
      '战略平台': '战略/平台级'
    };
    return labels[bv] || bv; // 未知值返回原值
  };

  /**
   * 获取时间临界性的完整标签
   * @param tc - 时间临界性简称
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
    <div className="relative inline-block" ref={cardRef}>
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
        <div className={`p-1.5 pointer-events-none flex-1 flex flex-col justify-between`}>
          <div>
            <div className={`font-semibold ${textColor} leading-tight line-clamp-2 ${nameSize}`}>
              {requirement.name}
            </div>
            <div className={`flex items-center justify-between ${textColor} opacity-75 mt-0.5 ${daySize}`}>
              <span>{roundNumber(requirement.effortDays, 1)}天</span>
              <span className="ml-1 truncate">{requirement.businessDomain === '自定义' ? requirement.customBusinessDomain || '自定义' : requirement.businessDomain}</span>
            </div>
          </div>
        </div>

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
        
        {requirement.hardDeadline && (
          <div
            className={`absolute bg-red-600 text-white rounded-full flex items-center justify-center font-bold ${compact ? 'text-xs w-5 h-5 -top-1 -right-1' : 'text-sm w-6 h-6 -top-2 -right-2'}`}
          >
            !
          </div>
        )}

        {requirement.isRMS && (
          <div
            className={`absolute bg-purple-600 text-white rounded px-1.5 py-0.5 font-semibold ${compact ? 'text-[8px] -top-1 -left-1' : 'text-[9px] -top-1.5 -left-1.5'}`}
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
            <div>业务域: <span className="font-semibold">{requirement.businessDomain === '自定义' ? requirement.customBusinessDomain || '自定义' : requirement.businessDomain}</span></div>
            <div>提交方: <span className="font-semibold">{requirement.submitter}</span></div>
            <div>业务价值: <span className="font-semibold">{getBVLabel(requirement.bv)}</span></div>
            <div>迫切程度: <span className="font-semibold">{getTCLabel(requirement.tc)}</span></div>
            <div>工作量: <span className="font-semibold">{roundNumber(requirement.effortDays, 1)}天</span></div>
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

// ============================================================================
// UI组件 - WSJF评分说明书弹窗 (Handbook Modal Component)
// ============================================================================

/**
 * WSJF-Lite排期评分说明书弹窗组件
 *
 * 功能说明：
 * - 展示完整的WSJF评分方法论说明文档
 * - 包含业务版和产品/研发版两部分内容
 * - 详细解释评分维度、计算公式、分数区间设计
 * - 提供示例帮助用户理解评分逻辑
 *
 * 内容结构：
 * - 第一部分：业务版（面向业务人员）
 * - 第二部分：产品/研发版（面向PM和研发）
 * - 第三部分：3-26分数区间设计说明
 * - 附注：术语解释
 *
 * @param onClose - 关闭弹窗回调函数
 */
const HandbookModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex-shrink-0 p-5 border-b border-gray-200 bg-gray-900 text-white rounded-t-xl flex items-center justify-between">
          <h3 className="text-xl font-semibold">WSJF-Lite 排期评分说明书</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none">
          <p className="text-sm text-gray-600">（业务版 + 产品/研发版，含分数区间"3–26"设计说明）</p>
          
          <p><strong>说明</strong>：本文将所有缩写在首次出现处标注英文全称与含义。评分全过程仅使用整数，最终对业务侧展示为<strong>1–100 的"热度分"</strong>与星级分档。</p>

          <h2 className="text-xl font-bold mt-6 mb-3">第一部分｜业务版（Business）</h2>
          
          <h3 className="text-lg font-semibold mt-4 mb-2">1. 需要提供的三项选择（全为选择题，无需计算）</h3>
          
          <h4 className="font-semibold mt-3 mb-2">价值（BV, Business Value）—四选一</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>局部体验优化</strong>：影响范围较小，锦上添花。</li>
            <li><strong>明显改善</strong>：能够看到指标改善或明确的节省时间/成本。</li>
            <li><strong>撬动核心指标</strong>：直接作用于北极星指标或关键 KPI（Key Performance Indicator）。</li>
            <li><strong>战略/平台级</strong>：形成可复用平台能力、显著降低合规/技术风险，或打开新业务线。</li>
          </ul>
          <p className="text-sm text-gray-600 mt-2">说明：原 WSJF 中的 RR/OE（Risk Reduction / Opportunity Enablement，风险降低/机会开启）已并入 BV 的判断口径，不再单独打分。</p>

          <h4 className="font-semibold mt-3 mb-2">迫切程度度（TC, Time Criticality）—三选一</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>随时可做</strong>：任何时间完成的效果基本等同。</li>
            <li><strong>需要在未来三个月内完成</strong>：存在明确业务窗口，越晚效果越差。</li>
            <li><strong>必须在未来一个月内完成</strong>：存在硬性时间限制（法规、合同、重大活动等），过期则价值显著衰减或失效。</li>
          </ul>

          <h4 className="font-semibold mt-3 mb-2">强截止（DDL, Hard Deadline）—是/否</h4>
          <p>若存在明确日期且能够提供凭据（合同条款、合规函件、活动档期等），请选择"是"；否则选择"否"。</p>
          <p><strong>开发工作量（人日）</strong>由研发侧评估，不需要业务填写或估算。</p>

          <h3 className="text-lg font-semibold mt-4 mb-2">2. 系统如何使用这些选择</h3>
          <p>系统将上述三项选择与研发评估的开发人日结合，计算出1–100 的热度分并生成排序。颜色越深表示越应优先进入排期；会议过程中可根据讨论实时修改选择项，系统即时重算与重排。大体量需求建议先切分为当期可交付的 MVP（Minimum Viable Product，最小可行版本），更利于在容量限制内获得优先排期。</p>

          <h3 className="text-lg font-semibold mt-4 mb-2">3. 业务示例（面向直觉理解）</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>示例 A</strong>：撬动核心指标 + 必须在未来一个月内完成 + 存在强截止 → 热度显著偏高，即便人日偏大，也应优先排期。</li>
            <li><strong>示例 B</strong>：明显改善 + 随时可做 → 热度中等；若切分为多个小块，更容易在当月容量内安排。</li>
            <li><strong>示例 C</strong>：局部体验优化 + 需要在未来三个月内完成 → 热度中上；建议在窗口前完成以获取更好收益。</li>
            <li><strong>示例 D</strong>：战略/平台级 + 随时可做 → 热度中等；若能证明复用范围广，热度将进一步提高。</li>
            <li><strong>示例 E</strong>：撬动核心指标 + 随时可做 + 人日很小（≤5）→ 常因"见效快"获得优先计划位置。</li>
            <li><strong>示例 F</strong>：存在强截止 + 人日特别大（&gt;30）→ 建议切分并锁定当期 MVP 以确保撞上时间窗口。</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-3">第二部分｜产品/研发版（PM/Dev）</h2>
          
          <h3 className="text-lg font-semibold mt-4 mb-2">1. 字段与数值映射（统一整数口径）</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>BV（Business Value）</strong>：局部 3｜明显 6｜撬动核心 8｜战略/平台级 10。</li>
            <li><strong>TC（Time Criticality）</strong>：随时 0｜三个月窗口 3｜一月硬窗口 5。</li>
            <li><strong>DDL（Hard Deadline）</strong>：无 0｜有（凭据齐全）5。</li>
            <li><strong>工作量分（WorkloadScore，正向加分）</strong>：≤5 → +6｜6–15 → +4｜16–30 → +2｜&gt;30 → +0。目的：以"加分"方式鼓励切分，避免"扣分"心智负担。</li>
            <li><strong>就绪度（DoR, Definition of Ready）</strong>：非"已就绪"条目默认不可入池；如需例外，必须记录原因并在复盘中审视。</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4 mb-2">2. 计算与展示（仅整数）</h3>
          <p><strong>原始分（RawScore）</strong>：Raw = BV + TC + DDL + WorkloadScore（典型范围 3–26）。</p>
          <p><strong>归一化展示分（Display，1–100 整分）</strong>：使用当前待排批次的最小/最大 RawScore 进行线性归一化；当 max=min 时统一置为 60。</p>
          
          <h4 className="font-semibold mt-3 mb-2">星级与分档（用于标签与配色）</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>85–100：★★★★★ "强窗口/立即投入"</li>
            <li>70–84：★★★★ "优先执行"</li>
            <li>55–69：★★★ "普通计划项"</li>
            <li>≤54：★★ "择机安排/视容量安排"</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4 mb-2">3. 排序与入池规则</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>主排序键</strong>：Display（降序）。</li>
            <li><strong>平手顺序</strong>：① 强 DDL 在前；② TC 高在前（5＞3＞0）；③ 开发人日更小在前；④ 仍并列时由主持人裁量并记录"例外理由"。</li>
            <li><strong>入池校验</strong>：容量（∑人日 ≤ 池容量）、窗口（DDL 不跨期）、就绪（DoR 达标）。</li>
            <li><strong>切分建议</strong>：当人日 &gt;30 或容量不足时，引导填写当期 MVP 范围与承诺人日，余量自动结转下一迭代。</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4 mb-2">4. 技术示例（含整分 Raw 与示意 Display）</h3>
          <p className="text-sm text-gray-600">注：Display 取决于当批次的 min/max，下表仅示意相对高低。</p>
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-2 py-1">条目</th>
                  <th className="border border-gray-300 px-2 py-1">BV</th>
                  <th className="border border-gray-300 px-2 py-1">TC</th>
                  <th className="border border-gray-300 px-2 py-1">DDL</th>
                  <th className="border border-gray-300 px-2 py-1">人日→WL</th>
                  <th className="border border-gray-300 px-2 py-1">Raw</th>
                  <th className="border border-gray-300 px-2 py-1">典型Display</th>
                  <th className="border border-gray-300 px-2 py-1">解读</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-gray-300 px-2 py-1">A 撬核心+月度+有DDL+12d</td><td className="border border-gray-300 px-2 py-1">8</td><td className="border border-gray-300 px-2 py-1">5</td><td className="border border-gray-300 px-2 py-1">5</td><td className="border border-gray-300 px-2 py-1">+4</td><td className="border border-gray-300 px-2 py-1">22</td><td className="border border-gray-300 px-2 py-1">~95</td><td className="border border-gray-300 px-2 py-1">强窗口高价值，优先锁池</td></tr>
                <tr><td className="border border-gray-300 px-2 py-1">B 明显+随时+无DDL+6d</td><td className="border border-gray-300 px-2 py-1">6</td><td className="border border-gray-300 px-2 py-1">0</td><td className="border border-gray-300 px-2 py-1">0</td><td className="border border-gray-300 px-2 py-1">+4</td><td className="border border-gray-300 px-2 py-1">10</td><td className="border border-gray-300 px-2 py-1">~55</td><td className="border border-gray-300 px-2 py-1">中热度，视容量与切分</td></tr>
                <tr><td className="border border-gray-300 px-2 py-1">C 局部+三月窗口+无DDL+4d</td><td className="border border-gray-300 px-2 py-1">3</td><td className="border border-gray-300 px-2 py-1">3</td><td className="border border-gray-300 px-2 py-1">0</td><td className="border border-gray-300 px-2 py-1">+6</td><td className="border border-gray-300 px-2 py-1">12</td><td className="border border-gray-300 px-2 py-1">~65</td><td className="border border-gray-300 px-2 py-1">窗口前完成更优</td></tr>
                <tr><td className="border border-gray-300 px-2 py-1">D 战略平台+随时+无DDL+20d</td><td className="border border-gray-300 px-2 py-1">10</td><td className="border border-gray-300 px-2 py-1">0</td><td className="border border-gray-300 px-2 py-1">0</td><td className="border border-gray-300 px-2 py-1">+2</td><td className="border border-gray-300 px-2 py-1">12</td><td className="border border-gray-300 px-2 py-1">~60</td><td className="border border-gray-300 px-2 py-1">高价值但体量大，宜切分</td></tr>
                <tr><td className="border border-gray-300 px-2 py-1">E 撬核心+随时+无DDL+3d</td><td className="border border-gray-300 px-2 py-1">8</td><td className="border border-gray-300 px-2 py-1">0</td><td className="border border-gray-300 px-2 py-1">0</td><td className="border border-gray-300 px-2 py-1">+6</td><td className="border border-gray-300 px-2 py-1">14</td><td className="border border-gray-300 px-2 py-1">~70</td><td className="border border-gray-300 px-2 py-1">小而美，常可插队</td></tr>
                <tr><td className="border border-gray-300 px-2 py-1">F 明显+月度+无DDL+28d</td><td className="border border-gray-300 px-2 py-1">6</td><td className="border border-gray-300 px-2 py-1">5</td><td className="border border-gray-300 px-2 py-1">0</td><td className="border border-gray-300 px-2 py-1">+2</td><td className="border border-gray-300 px-2 py-1">13</td><td className="border border-gray-300 px-2 py-1">~68</td><td className="border border-gray-300 px-2 py-1">有窗口但体量大，建议切分</td></tr>
                <tr><td className="border border-gray-300 px-2 py-1">G 战略平台+月度+有DDL+35d</td><td className="border border-gray-300 px-2 py-1">10</td><td className="border border-gray-300 px-2 py-1">5</td><td className="border border-gray-300 px-2 py-1">5</td><td className="border border-gray-300 px-2 py-1">+0</td><td className="border border-gray-300 px-2 py-1">20</td><td className="border border-gray-300 px-2 py-1">~88</td><td className="border border-gray-300 px-2 py-1">必做但需以 MVP 形式入当期</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-bold mt-6 mb-3">第三部分｜"3–26"区间设计的原因与对比</h2>
          <h3 className="text-lg font-semibold mt-4 mb-2">1. 区间由四个整数映射自然组合而成</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>BV</strong>：3/6/8/10（区分"不错"与"真硬货"）。</li>
            <li><strong>TC</strong>：0/3/5（将"季度窗口"与"月度硬窗口"拉开 2 分）。</li>
            <li><strong>DDL</strong>：0/5（强截止一票难求）。</li>
            <li><strong>工作量分</strong>：+6/+4/+2/+0（每档相差 2 分，切分有明确激励）。</li>
          </ul>
          <p className="mt-2">由此，Raw 最小值 = 3 + 0 + 0 + 0 = 3；Raw 最大值 = 10 + 5 + 5 + 6 = 26。</p>

          <h3 className="text-lg font-semibold mt-4 mb-2">2. 为什么不采用 1–10 或 1–11 等更"整齐"的区间</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>区分度不足</strong>：窄区间在几十个条目中容易形成"6–9 分密集带"，大量平手，排序需要频繁口头裁决。</li>
            <li><strong>窗口与体量难以显性影响排序</strong>：例如 TC 若仅为 0/1/2，月度 vs 季度的差值只有 1，易被其他噪声抵消。</li>
            <li><strong>对切分的激励不明显</strong>：工作量若仅为 +3/+2/+1/+0，每档差 1，难以促使大项拆分为可当期交付的 MVP。</li>
          </ul>

          <p className="mt-2"><strong>结论</strong>：3–26 区间是"整数、好解释、能拉开差距、鼓励切分并保障窗口"的平衡点。前端仍统一展示为 1–100 的热度分与星级，业务无需接触底层数字。</p>

          <h2 className="text-xl font-bold mt-6 mb-3">附注（名词解释）</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>WSJF</strong>（Weighted Shortest Job First）：带权重的最短任务优先排序方法。</li>
            <li><strong>BV</strong>（Business Value）：业务价值。</li>
            <li><strong>TC</strong>（Time Criticality）：迫切程度度。</li>
            <li><strong>DDL</strong>（Hard Deadline）：强截止日期。</li>
            <li><strong>RR/OE</strong>（Risk Reduction / Opportunity Enablement）：风险降低/机会开启（在本方案中已并入 BV）。</li>
            <li><strong>DoR</strong>（Definition of Ready）：就绪定义。</li>
            <li><strong>MVP</strong>（Minimum Viable Product）：最小可行版本。</li>
            <li><strong>KPI</strong>（Key Performance Indicator）：关键绩效指标。</li>
          </ul>
        </div>

        <div className="flex-shrink-0 p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// UI组件 - 登录/注册弹窗 (Login Modal Component)
// ============================================================================

/**
 * 登录/注册弹窗组件
 *
 * 功能说明：
 * - 用户首次访问时显示，要求输入姓名和邮箱
 * - 验证邮箱格式
 * - 将用户信息保存到LocalStorage
 * - 支持自动登录（如果已有用户信息）
 *
 * 数据持久化：
 * - 使用storage模块保存用户信息
 * - 登录后可在系统中标识需求提交人
 *
 * @param onLogin - 登录成功回调函数
 */
const LoginModal = ({ onLogin }: { onLogin: (user: storage.User) => void }) => {
  const [name, setName] = useState('');      // 用户姓名
  const [email, setEmail] = useState('');    // 用户邮箱
  const [error, setError] = useState('');    // 错误提示信息

  /**
   * 处理登录提交
   * - 验证输入不为空
   * - 验证邮箱格式
   * - 保存用户信息并回调
   */
  const handleSubmit = () => {
    // 验证：确保姓名和邮箱不为空
    if (!name.trim() || !email.trim()) {
      setError('请填写姓名和邮箱');
      return;
    }

    // 验证：邮箱格式检查
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    // 保存用户信息到LocalStorage并触发登录回调
    const user = storage.loginUser(name.trim(), email.trim());
    onLogin(user);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[420px] p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">小米国际WSJF-Lite系统beta</h2>
          <p className="text-sm text-gray-600 mt-2">请输入您的信息登录或注册</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入您的姓名"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg"
          >
            进入应用
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          无需密码，下次使用相同邮箱即可访问您的数据
        </p>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-gray-700 text-center leading-relaxed">
              <span className="font-semibold text-yellow-800">注意事项：</span>本系统为纯前端搭建，数据保存在您的浏览器缓存，更新数据后请及时导出保存在本地。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// UI组件 - 编辑需求弹窗 (Edit Requirement Modal Component)
// ============================================================================

/**
 * 编辑需求弹窗组件
 *
 * 功能说明：
 * - 创建新需求或编辑现有需求
 * - 实时预览WSJF评分结果
 * - 支持所有需求字段的编辑
 * - 表单验证（必填项检查）
 *
 * 核心功能：
 * - 实时分数预览：修改评分维度时，右侧卡片实时更新分数和星级
 * - 智能默认值：新建需求时提供合理的默认值
 * - 截止日期联动：勾选"强制截止"时显示日期选择器
 *
 * @param requirement - 要编辑的需求对象（null表示新建）
 * @param onSave - 保存回调函数
 * @param onClose - 关闭回调函数
 * @param isNew - 是否为新建模式（默认false）
 */
const EditRequirementModal = ({
  requirement,
  onSave,
  onClose,
  isNew = false
}: {
  requirement: Requirement | null;
  onSave: (req: Requirement) => void;
  onClose: () => void;
  isNew?: boolean;
}) => {
  // 初始化表单状态，提供默认值确保健壮性
  const [form, setForm] = useState<Requirement>(requirement || {
    id: `REQ-${Date.now()}`,                              // 唯一ID，使用时间戳
    name: '',                                             // 需求名称
    submitterName: '',                                    // 需求提交人姓名
    productManager: '',                                   // 产品经理
    developer: '',                                        // 研发负责人
    productProgress: '未评估',                            // 产品进度
    effortDays: 0,                                        // 工作量（未评估时默认0天）
    bv: '明显',                                           // 业务价值默认"明显"
    tc: '随时',                                           // 时间临界性默认"随时"
    hardDeadline: false,                                  // 默认无强制截止
    techProgress: '未评估',                               // 技术进度
    type: '功能开发',                                     // 需求类型
    submitDate: new Date().toISOString().split('T')[0],  // 提交日期默认今天
    submitter: '产品',                                    // 提交方默认产品
    isRMS: false,                                         // 默认非RMS重构
    businessDomain: '国际零售通用'                        // 业务域默认"国际零售通用"
  });

  /**
   * 实时计算预览分数
   * 使用useMemo优化性能，只有form变化时才重新计算
   * 返回原始分和展示分，用于右侧预览卡片
   */
  const previewScore = useMemo(() => {
    const BV_MAP: Record<string, number> = { '局部': 3, '明显': 6, '撬动核心': 8, '战略平台': 10 };
    const TC_MAP: Record<string, number> = { '随时': 0, '三月窗口': 3, '一月硬窗口': 5 };

    // 工作量加分计算（与calculateScores保持一致）
    const getWL = (d: number) => {
      const validDays = Math.max(0, Number(d) || 0); // 健壮性检查
      return validDays <= 5 ? 6 : validDays <= 15 ? 4 : validDays <= 30 ? 2 : 0;
    };

    // 计算原始分（3-26范围）
    const raw = (BV_MAP[form.bv] || 3) + (TC_MAP[form.tc] || 0) + (form.hardDeadline ? 5 : 0) + getWL(form.effortDays);

    // 归一化到展示分（10-100范围）
    const display = Math.round(10 + 90 * (raw - 3) / (26 - 3));

    return { raw, display };
  }, [form]);

  const previewReq: Requirement = {
    ...form,
    displayScore: previewScore.display,
    stars: previewScore.display >= 85 ? 5 : previewScore.display >= 70 ? 4 : previewScore.display >= 55 ? 3 : 2
  };

  const canEditEffort = form.techProgress === '已评估工作量' || form.techProgress === '已完成技术方案';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[750px] max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 p-5 border-b border-gray-200 bg-gray-900 text-white rounded-t-xl flex items-center justify-between z-10">
          <h3 className="text-xl font-semibold">{isNew ? '新增需求' : '编辑需求'}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    需求名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    placeholder="输入需求名称（必填）"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">业务域</label>
                  <select
                    value={form.businessDomain}
                    onChange={(e) => setForm({...form, businessDomain: e.target.value, customBusinessDomain: e.target.value === '自定义' ? form.customBusinessDomain : ''})}
                    className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  >
                    <option value="新零售">新零售</option>
                    <option value="渠道零售">渠道零售</option>
                    <option value="国际零售通用">国际零售通用</option>
                    <option value="自定义">自定义</option>
                  </select>
                </div>
              </div>

              {form.businessDomain === '自定义' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">自定义业务域名称</label>
                  <input
                    type="text"
                    value={form.customBusinessDomain || ''}
                    onChange={(e) => setForm({...form, customBusinessDomain: e.target.value})}
                    placeholder="请输入自定义业务域名称"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">需求提交日期</label>
                  <input
                    type="date"
                    value={form.submitDate}
                    onChange={(e) => setForm({...form, submitDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">需求提交方</label>
                  <select
                    value={form.submitter}
                    onChange={(e) => setForm({...form, submitter: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  >
                    <option value="产品">产品</option>
                    <option value="研发">研发</option>
                    <option value="业务">业务</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">需求提交人</label>
                  <input
                    type="text"
                    value={form.submitterName}
                    onChange={(e) => setForm({...form, submitterName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    placeholder="提交人姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">产品经理</label>
                  <input
                    type="text"
                    value={form.productManager}
                    onChange={(e) => setForm({...form, productManager: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    placeholder="产品经理姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">研发同学</label>
                  <input
                    type="text"
                    value={form.developer}
                    onChange={(e) => setForm({...form, developer: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    placeholder="研发同学姓名"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isRMS}
                    onChange={(e) => setForm({...form, isRMS: e.target.checked})}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-700">RMS重构项目</span>
                </label>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-3">业务评估</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">业务价值（BV）</label>
                    <select
                      value={form.bv}
                      onChange={(e) => setForm({...form, bv: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    >
                      <option value="局部">局部体验优化</option>
                      <option value="明显">明显改善</option>
                      <option value="撬动核心">撬动核心指标</option>
                      <option value="战略平台">战略/平台级</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">迫切程度（TC）</label>
                    <select
                      value={form.tc}
                      onChange={(e) => setForm({...form, tc: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    >
                      <option value="随时">随时可做</option>
                      <option value="三月窗口">三个月内完成</option>
                      <option value="一月硬窗口">一个月内完成</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.hardDeadline}
                        onChange={(e) => setForm({...form, hardDeadline: e.target.checked})}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                      />
                      <span className="text-sm font-medium text-gray-700">强制DDL</span>
                    </label>
                  </div>

                  {form.hardDeadline && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">截止日期</label>
                      <input
                        type="date"
                        value={form.deadlineDate || ''}
                        onChange={(e) => setForm({...form, deadlineDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-3">进展跟踪</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">产品进展</label>
                    <select
                      value={form.productProgress}
                      onChange={(e) => setForm({...form, productProgress: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    >
                      <option value="未评估">未评估</option>
                      <option value="已评估">已评估</option>
                      <option value="已出PRD">已出PRD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">技术进展</label>
                    <select
                      value={form.techProgress}
                      onChange={(e) => setForm({...form, techProgress: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    >
                      <option value="未评估">未评估</option>
                      <option value="已评估工作量">已评估工作量</option>
                      <option value="已完成技术方案">已完成技术方案</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  开发工作量（人日）
                  {!canEditEffort && <span className="text-xs text-red-600 ml-2">需先完成技术评估</span>}
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.effortDays}
                  onChange={(e) => setForm({...form, effortDays: Math.max(1, parseInt(e.target.value) || 1)})}
                  disabled={!canEditEffort}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {canEditEffort && (
                  <div className="text-xs text-gray-500 mt-1">
                    工作量加分: {form.effortDays <= 5 ? '+6分' : form.effortDays <= 15 ? '+4分' : form.effortDays <= 30 ? '+2分' : '不加分（建议切分）'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">需求类型</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({...form, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                >
                  <option value="功能开发">功能开发</option>
                  <option value="技术债">技术债</option>
                  <option value="Bug修复">Bug修复</option>
                </select>
              </div>
            </div>

            <div className="col-span-1">
              <div className="sticky top-6 space-y-4">
                <div className="text-sm font-semibold text-gray-700 mb-3">实时预览</div>

                <div className="flex justify-center items-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 overflow-auto max-h-[300px]">
                  <RequirementCard requirement={previewReq} showTooltip={false} />
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border-2 border-teal-300 rounded-lg p-4">
                  <div className="text-sm font-medium text-teal-900 mb-2">权重分</div>
                  <div className="text-4xl font-bold text-teal-700">
                    {previewScore.display}
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    归一化分数 (1-100)
                  </div>
                </div>

                <div className="text-xs text-gray-500 bg-gray-100 rounded p-2">
                  <div className="flex items-center gap-1">
                    <Info size={12} />
                    <span>Raw Score: {previewScore.raw}/26</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3 z-10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            取消
          </button>
          <button
            onClick={() => {
              if (!form.name.trim()) {
                alert('需求名称不能为空');
                return;
              }
              onSave(form);
              onClose();
            }}
            disabled={!form.name.trim()}
            className={`px-5 py-2.5 rounded-lg transition font-medium flex items-center gap-2 ${
              form.name.trim()
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save size={18} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// UI组件 - 编辑迭代池弹窗 (Edit Sprint Modal Component)
// ============================================================================

/**
 * 编辑迭代池弹窗组件
 *
 * 功能说明：
 * - 编辑迭代池的基本信息（名称、时间范围、总人天）
 * - 设置资源预留百分比（Bug修复、重构、其他）
 * - 实时计算净可用人天
 *
 * 资源计算逻辑：
 * - 总预留 = Bug预留% + 重构预留% + 其他预留%
 * - 预留人天 = 总人天 × 总预留% / 100
 * - 净可用 = 总人天 - 预留人天
 *
 * @param sprint - 要编辑的迭代池对象
 * @param onSave - 保存回调函数
 * @param onClose - 关闭回调函数
 */
const EditSprintModal = ({
  sprint,
  onSave,
  onClose
}: {
  sprint: SprintPool;
  onSave: (sprint: SprintPool) => void;
  onClose: () => void;
}) => {
  const [form, setForm] = useState(sprint);

  // 健壮性检查：确保所有预留百分比是有效数字
  const bugReserve = Math.max(0, Math.min(100, Number(form.bugReserve) || 0));
  const refactorReserve = Math.max(0, Math.min(100, Number(form.refactorReserve) || 0));
  const otherReserve = Math.max(0, Math.min(100, Number(form.otherReserve) || 0));

  // 计算总预留百分比
  const totalReserve = bugReserve + refactorReserve + otherReserve;

  // 计算预留人天（健壮性：避免除以0或负数）
  const totalDays = Math.max(0, Number(form.totalDays) || 0);
  const reservedDays = Math.round(totalDays * totalReserve / 100);

  // 计算净可用人天
  const netAvailable = totalDays - reservedDays;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[500px]">
        <div className="p-5 border-b border-gray-200 bg-gray-900 text-white rounded-t-xl flex items-center justify-between">
          <h3 className="text-xl font-semibold">编辑迭代池</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">迭代名称</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">开始日期</label>
              <input
                type="text"
                value={form.startDate}
                onChange={(e) => setForm({...form, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">结束日期</label>
              <input
                type="text"
                value={form.endDate}
                onChange={(e) => setForm({...form, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">总可用人日</label>
            <input
              type="number"
              value={form.totalDays}
              onChange={(e) => setForm({...form, totalDays: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bug预留%</label>
              <input
                type="number"
                value={form.bugReserve}
                onChange={(e) => setForm({...form, bugReserve: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">重构预留%</label>
              <input
                type="number"
                value={form.refactorReserve}
                onChange={(e) => setForm({...form, refactorReserve: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">其他预留%</label>
              <input
                type="number"
                value={form.otherReserve}
                onChange={(e) => setForm({...form, otherReserve: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-1">
            <div className="text-sm text-gray-700">
              不可用人日: <span className="font-semibold text-red-600">{reservedDays}</span> ({totalReserve}%)
            </div>
            <div className="text-sm font-medium text-teal-900 border-t border-teal-200 pt-2">
              净可用资源: <span className="text-2xl font-bold text-teal-600">{netAvailable}</span> 人日
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            取消
          </button>
          <button 
            onClick={() => {
              onSave(form);
              onClose();
            }}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium flex items-center gap-2"
          >
            <Save size={18} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// UI组件 - 迭代池 (Sprint Pool Component)
// ============================================================================

/**
 * 迭代池组件
 *
 * 功能说明：
 * - 展示单个迭代池的完整信息
 * - 支持拖拽放置需求（HTML5 Drag & Drop API）
 * - 实时计算资源使用情况和超载警告
 * - 显示已排期需求列表
 *
 * 资源计算：
 * - 净可用 = 总人天 - 预留人天
 * - 已用 = 所有需求工作量之和
 * - 使用率 = 已用 / 净可用 × 100%
 *
 * 视觉反馈：
 * - 使用率 ≥100%: 红色边框（超载）
 * - 使用率 ≥90%: 黄色边框（接近满载）
 * - 拖拽悬停: 青色高亮
 *
 * @param pool - 迭代池对象
 * @param onRequirementClick - 需求点击回调
 * @param onDrop - 拖拽放置回调
 * @param isDragOver - 是否正在拖拽悬停
 * @param onEdit - 编辑迭代池回调
 * @param onDelete - 删除迭代池回调
 * @param compact - 紧凑模式
 */
const SprintPoolComponent = ({
  pool,
  onRequirementClick,
  onDrop,
  isDragOver,
  onEdit,
  onDelete,
  compact
}: {
  pool: SprintPool;
  onRequirementClick: (req: Requirement) => void;
  onDrop: (poolId: string) => void;
  isDragOver: boolean;
  onEdit: () => void;
  onDelete: () => void;
  compact: boolean;
}) => {
  // 健壮性检查：确保所有百分比和数值有效
  const bugReserve = Math.max(0, Number(pool.bugReserve) || 0);
  const refactorReserve = Math.max(0, Number(pool.refactorReserve) || 0);
  const otherReserve = Math.max(0, Number(pool.otherReserve) || 0);
  const totalDays = Math.max(0, Number(pool.totalDays) || 0);

  // 计算资源分配
  const totalReserve = bugReserve + refactorReserve + otherReserve;
  const reservedDays = Math.round(totalDays * totalReserve / 100);
  const netAvailable = totalDays - reservedDays;

  // 计算已用人天（健壮性：确保requirements是数组）
  const requirements = Array.isArray(pool.requirements) ? pool.requirements : [];
  const usedDays = requirements.reduce((sum, req) => sum + (Number(req?.effortDays) || 0), 0);

  // 计算使用率百分比（健壮性：避免除以0）
  const percentage = netAvailable > 0 ? Math.round((usedDays / netAvailable) * 100) : 0;

  // 计算总价值（所有需求的展示分之和）
  const totalValue = requirements.reduce((sum, req) => sum + (Number(req?.displayScore) || 0), 0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(pool.id);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`w-full h-full bg-white rounded-xl border transition-all flex flex-col ${
        isDragOver ? 'border-teal-500 bg-teal-50/50 shadow-xl' : 'border-gray-200 shadow-sm'
      } ${percentage >= 100 ? 'ring-2 ring-red-500' : percentage >= 90 ? 'ring-2 ring-amber-400' : ''}`}
    >
      <div className="flex-shrink-0 p-3 border-b border-gray-200 bg-gray-900 text-white rounded-t-xl">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {pool.name} <span className="text-sm font-normal text-gray-300">总人日{roundNumber(pool.totalDays, 1)}（可用{roundNumber(netAvailable, 1)}+不可用{roundNumber(reservedDays, 1)}）</span>
            </h3>
            <p className="text-sm text-gray-300 mt-0.5">{pool.startDate} ~ {pool.endDate}</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="text-gray-300 hover:text-white hover:bg-white/10 rounded-lg p-2 transition"
              title="编辑迭代池"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={onDelete}
              className="text-gray-300 hover:text-red-400 hover:bg-white/10 rounded-lg p-2 transition"
              title="删除迭代池"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-lg font-bold text-white">{roundNumber(usedDays, 1)}/{roundNumber(netAvailable, 1)}人日</span>
            <span className={`text-base font-bold ${percentage >= 100 ? 'text-red-400' : percentage >= 90 ? 'text-amber-400' : 'text-teal-400'}`}>
              {percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                percentage >= 100 ? 'bg-red-500' :
                percentage >= 90 ? 'bg-amber-500' :
                'bg-teal-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-1.5 text-xs text-gray-400 bg-white/5 rounded-lg px-2 py-1">
          不可用: {roundNumber(reservedDays, 1)}人日 (Bug {pool.bugReserve}% · 重构 {pool.refactorReserve}% · 其他 {pool.otherReserve}%)
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className={`p-3 h-full border-2 border-dashed rounded-lg m-2 transition-all ${
          isDragOver ? 'border-teal-400 bg-teal-50' : pool.requirements.length === 0 ? 'border-gray-200 bg-gray-50' : 'border-transparent'
        }`}>
          {pool.requirements.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 py-8">
              <div className="text-3xl mb-2">📥</div>
              <div className="text-sm font-medium">拖拽需求到这里</div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 content-start justify-center">
              {pool.requirements.map((req) => (
                <RequirementCard
                  key={req.id}
                  requirement={req}
                  compact={compact}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('requirementId', req.id);
                    e.dataTransfer.setData('sourcePoolId', pool.id);
                  }}
                  onClick={() => onRequirementClick(req)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">已排期 <span className="font-semibold text-gray-900">{pool.requirements.length}</span></span>
          <span className="text-gray-600">总权重分 <span className="font-semibold text-gray-900">{Math.round(totalValue)}</span></span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// UI组件 - 待排期区 (Unscheduled Area Component)
// ============================================================================

/**
 * 待排期区组件
 *
 * 功能说明：
 * - 展示所有未排期的需求列表
 * - 支持多维度筛选和搜索
 * - 支持自定义排序
 * - 支持拖拽需求到迭代池
 * - 支持气泡和列表两种视图模式
 *
 * 筛选维度：
 * - 搜索：需求名称、提交人、产品经理、研发负责人
 * - 需求类型：功能开发、Bug修复、技术债务等
 * - 热度分：高(≥70)、中(40-69)、低(<40)
 * - 工作量：微小(≤3)、小(4-10)、中(11-30)、大(31-60)、超大(61-100)、巨大(>100)
 * - 业务价值：局部、明显、撬动核心、战略平台
 * - RMS重构：是/否
 *
 * 排序方式：
 * - 热度分（默认降序）
 * - 业务价值
 * - 提交日期
 * - 工作量
 *
 * @param unscheduled - 未排期需求列表
 * @param onRequirementClick - 需求点击回调
 * @param onDrop - 拖拽放置回调
 * @param isDragOver - 是否正在拖拽悬停
 * @param onAddNew - 添加新需求回调
 * @param compact - 紧凑模式
 * @param searchTerm - 搜索关键词
 * @param onSearchChange - 搜索变化回调
 * @param filterType - 类型筛选
 * @param onFilterChange - 类型筛选变化回调
 * @param scoreFilter - 热度分筛选
 * @param onScoreFilterChange - 热度分筛选变化回调
 * @param effortFilter - 工作量筛选
 * @param onEffortFilterChange - 工作量筛选变化回调
 * @param bvFilter - 业务价值筛选
 * @param onBVFilterChange - 业务价值筛选变化回调
 * @param rmsFilter - RMS筛选
 * @param onRMSFilterChange - RMS筛选变化回调
 * @param leftPanelWidth - 左侧面板宽度
 */
const UnscheduledArea = ({
  unscheduled,
  onRequirementClick,
  onDrop,
  isDragOver,
  onAddNew,
  compact,
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
  scoreFilter,
  onScoreFilterChange,
  effortFilter,
  onEffortFilterChange,
  bvFilter,
  onBVFilterChange,
  businessDomainFilter,
  onBusinessDomainFilterChange,
  rmsFilter,
  onRMSFilterChange,
  leftPanelWidth,
  onClearAll
}: {
  unscheduled: Requirement[];
  onRequirementClick: (req: Requirement) => void;
  onDrop: () => void;
  isDragOver: boolean;
  onAddNew: () => void;
  compact: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterType: string;
  onFilterChange: (type: string) => void;
  scoreFilter: string;
  onScoreFilterChange: (filter: string) => void;
  effortFilter: string;
  onEffortFilterChange: (filter: string) => void;
  bvFilter: string;
  onBVFilterChange: (filter: string) => void;
  businessDomainFilter: string;
  onBusinessDomainFilterChange: (filter: string) => void;
  rmsFilter: boolean;
  onRMSFilterChange: (filter: boolean) => void;
  leftPanelWidth: number;
  onClearAll: () => void;
}) => {
  // 组件状态
  const [showFilters, setShowFilters] = useState(false);                              // 是否展开筛选器
  const [sortBy, setSortBy] = useState<'score' | 'bv' | 'submitDate' | 'effort'>('score'); // 排序字段
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');                // 排序方向（默认降序）
  const [viewMode, setViewMode] = useState<'bubble' | 'list'>('bubble');             // 视图模式：气泡或列表

  /**
   * 提取所有自定义业务域（用于动态显示筛选选项）
   */
  const customBusinessDomains = useMemo(() => {
    const domains = new Set<string>();
    unscheduled.forEach(req => {
      if (req.businessDomain === '自定义' && req.customBusinessDomain) {
        domains.add(req.customBusinessDomain);
      }
    });
    return Array.from(domains).sort();
  }, [unscheduled]);

  /**
   * 处理拖拽悬停事件
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  /**
   * 处理拖拽放置事件
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop();
  };

  /**
   * 多维度筛选逻辑
   * 健壮性：使用可选链和默认值确保不会因为空值报错
   */
  const filteredReqs = (Array.isArray(unscheduled) ? unscheduled : []).filter(req => {
    // 搜索匹配：需求名称、提交人、产品经理、研发负责人
    const matchesSearch = (req?.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (req?.submitterName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (req?.productManager || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (req?.developer || '').toLowerCase().includes((searchTerm || '').toLowerCase());

    // 类型匹配
    const matchesType = filterType === 'all' || req?.type === filterType;

    // 热度分匹配
    let matchesScore = true;
    const displayScore = Number(req?.displayScore) || 0;
    if (scoreFilter === 'high') matchesScore = displayScore >= 70;
    else if (scoreFilter === 'medium') matchesScore = displayScore >= 40 && displayScore < 70;
    else if (scoreFilter === 'low') matchesScore = displayScore < 40;

    // 工作量匹配
    let matchesEffort = true;
    const effortDays = Number(req?.effortDays) || 0;
    if (effortFilter === 'tiny') matchesEffort = effortDays <= 3;
    else if (effortFilter === 'small') matchesEffort = effortDays >= 4 && effortDays <= 10;
    else if (effortFilter === 'medium') matchesEffort = effortDays >= 11 && effortDays <= 30;
    else if (effortFilter === 'large') matchesEffort = effortDays >= 31 && effortDays <= 60;
    else if (effortFilter === 'xlarge') matchesEffort = effortDays >= 61 && effortDays <= 100;
    else if (effortFilter === 'huge') matchesEffort = effortDays > 100;

    // 业务价值匹配
    const matchesBV = bvFilter === 'all' || req?.bv === bvFilter;

    // 业务域匹配（国际零售通用 = 新零售 + 渠道零售）
    let matchesBusinessDomain = true;
    if (businessDomainFilter !== 'all') {
      if (businessDomainFilter === '国际零售通用') {
        // 选择"国际零售通用"时，匹配"新零售"、"渠道零售"或"国际零售通用"
        matchesBusinessDomain = req?.businessDomain === '新零售' ||
                                req?.businessDomain === '渠道零售' ||
                                req?.businessDomain === '国际零售通用';
      } else if (['新零售', '渠道零售'].includes(businessDomainFilter)) {
        // 选择预设业务域时，精确匹配businessDomain字段
        matchesBusinessDomain = req?.businessDomain === businessDomainFilter;
      } else {
        // 选择自定义业务域时，匹配customBusinessDomain字段
        matchesBusinessDomain = req?.businessDomain === '自定义' && req?.customBusinessDomain === businessDomainFilter;
      }
    }

    // RMS筛选匹配（如果rmsFilter为true，只显示RMS项目）
    const matchesRMS = !rmsFilter || req?.isRMS;

    return matchesSearch && matchesType && matchesScore && matchesEffort && matchesBV && matchesBusinessDomain && matchesRMS;
  });

  // 应用排序
  const sortedReqs = [...filteredReqs].sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'score') {
      comparison = (b.displayScore || 0) - (a.displayScore || 0);
    } else if (sortBy === 'bv') {
      const bvOrder: Record<string, number> = { '战略平台': 4, '撬动核心': 3, '明显': 2, '局部': 1 };
      comparison = (bvOrder[b.bv] || 0) - (bvOrder[a.bv] || 0);
    } else if (sortBy === 'submitDate') {
      comparison = new Date(b.submitDate).getTime() - new Date(a.submitDate).getTime();
    } else if (sortBy === 'effort') {
      comparison = b.effortDays - a.effortDays;
    }

    // 根据 sortOrder 决定是否反转结果
    return sortOrder === 'desc' ? comparison : -comparison;
  });

  const readyReqs = sortedReqs.filter(r => r.techProgress === '已评估工作量' || r.techProgress === '已完成技术方案');
  const notReadyReqs = sortedReqs.filter(r => r.techProgress === '未评估');

  return (
    <div style={{ width: `${leftPanelWidth}px` }} className="bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="flex-shrink-0 p-3 border-b border-gray-200 bg-gray-900 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">待排期区</h2>
            <div className="flex items-center bg-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('bubble')}
                className={`px-2 py-1 text-xs transition ${
                  viewMode === 'bubble'
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                气泡
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 py-1 text-xs transition ${
                  viewMode === 'list'
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                列表
              </button>
            </div>
          </div>
          <button
            onClick={onAddNew}
            className="text-white hover:bg-white/10 rounded-lg p-1.5 transition"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="搜索需求..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:bg-white/20 focus:border-white/40 transition text-xs"
            />
          </div>
          <select
            value={businessDomainFilter}
            onChange={(e) => onBusinessDomainFilterChange(e.target.value)}
            className="px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:bg-white/20 focus:border-white/40 transition whitespace-nowrap"
          >
            <option value="all" className="text-gray-900">全部业务域</option>
            <option value="新零售" className="text-gray-900">新零售</option>
            <option value="渠道零售" className="text-gray-900">渠道零售</option>
            <option value="国际零售通用" className="text-gray-900">国际零售通用</option>
            {customBusinessDomains.map(domain => (
              <option key={domain} value={domain} className="text-gray-900">{domain}</option>
            ))}
          </select>
          <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={rmsFilter}
              onChange={(e) => onRMSFilterChange(e.target.checked)}
              className="w-3.5 h-3.5 rounded cursor-pointer"
            />
            <span className="text-xs text-white">RMS</span>
          </label>
        </div>

        <div className="flex items-center gap-1.5 mb-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-1 px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:bg-white/20 focus:border-white/40 transition"
          >
            <option value="score" className="bg-gray-800 text-white">按权重分</option>
            <option value="bv" className="bg-gray-800 text-white">按业务价值</option>
            <option value="submitDate" className="bg-gray-800 text-white">按提交时间</option>
            <option value="effort" className="bg-gray-800 text-white">按工作量</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex-shrink-0 px-2 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition"
            title={sortOrder === 'desc' ? '降序' : '升序'}
          >
            <ArrowUpDown size={14} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex-shrink-0 px-2 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition"
            title="筛选条件"
          >
            <Filter size={14} />
          </button>
        </div>

        {showFilters && (
          <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-300 flex-shrink-0" />
            <select
              value={filterType}
              onChange={(e) => onFilterChange(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:bg-white/20 focus:border-white/40 transition"
            >
              <option value="all" className="bg-gray-800 text-white">全部类型</option>
              <option value="功能开发" className="bg-gray-800 text-white">功能开发</option>
              <option value="技术债" className="bg-gray-800 text-white">技术债</option>
              <option value="Bug修复" className="bg-gray-800 text-white">Bug修复</option>
            </select>
          </div>

          <select
            value={scoreFilter}
            onChange={(e) => onScoreFilterChange(e.target.value)}
            className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:bg-white/20 focus:border-white/40 transition"
          >
            <option value="all" className="bg-gray-800 text-white">全部权重</option>
            <option value="high" className="bg-gray-800 text-white">高权重 (≥70)</option>
            <option value="medium" className="bg-gray-800 text-white">中权重 (40-69)</option>
            <option value="low" className="bg-gray-800 text-white">低权重 (&lt;40)</option>
          </select>

          <select
            value={effortFilter}
            onChange={(e) => onEffortFilterChange(e.target.value)}
            className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:bg-white/20 focus:border-white/40 transition"
          >
            <option value="all" className="bg-gray-800 text-white">全部工作量</option>
            <option value="tiny" className="bg-gray-800 text-white">微小 (≤3天)</option>
            <option value="small" className="bg-gray-800 text-white">小 (4-10天)</option>
            <option value="medium" className="bg-gray-800 text-white">中 (11-30天)</option>
            <option value="large" className="bg-gray-800 text-white">大 (31-60天)</option>
            <option value="xlarge" className="bg-gray-800 text-white">超大 (61-100天)</option>
            <option value="huge" className="bg-gray-800 text-white">巨型 (&gt;100天)</option>
          </select>

          <select
            value={bvFilter}
            onChange={(e) => onBVFilterChange(e.target.value)}
            className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:bg-white/20 focus:border-white/40 transition"
          >
            <option value="all" className="bg-gray-800 text-white">全部价值</option>
            <option value="局部" className="bg-gray-800 text-white">局部优化</option>
            <option value="明显" className="bg-gray-800 text-white">明显改善</option>
            <option value="撬动核心" className="bg-gray-800 text-white">撬动核心</option>
            <option value="战略平台" className="bg-gray-800 text-white">战略平台</option>
          </select>
          </div>
        )}

        <div className="mt-2 bg-white/10 rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between">
          <div>
            <span className="text-gray-300">筛选结果: </span>
            <span className="font-semibold text-white">{filteredReqs.length}</span>
          </div>
          <div>
            <span className="text-gray-300">未评估: </span>
            <span className="font-semibold text-red-300">{notReadyReqs.length}</span>
          </div>
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex-1 ${viewMode === 'bubble' ? 'overflow-y-auto' : 'overflow-hidden'} transition-all ${
          isDragOver ? 'bg-teal-50' : ''
        }`}
      >
        {viewMode === 'bubble' ? (
          <>
            {/* 气泡视图 - 可排期区 */}
            <div className="p-3 pb-2">
              <div className="flex flex-wrap gap-2 justify-start">
                {readyReqs.map(req => (
                  <RequirementCard
                    key={req.id}
                    requirement={req}
                    compact={compact}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('requirementId', req.id);
                      e.dataTransfer.setData('sourcePoolId', 'unscheduled');
                    }}
                    onClick={() => onRequirementClick(req)}
                  />
                ))}
              </div>
            </div>

            {/* 分割线 + 未评估区 */}
            {notReadyReqs.length > 0 && (
              <>
                <div className="px-3 py-2">
                  <div className="border-t border-gray-300 relative">
                    <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 text-xs text-gray-500 rounded-full border border-gray-300 whitespace-nowrap">
                      未完成技术评估（不可排期）
                    </div>
                  </div>
                </div>
                <div className="px-3 pb-3 bg-gray-100">
                  <div className="flex flex-wrap gap-2 justify-start opacity-60 pt-1.5">
                    {notReadyReqs.map(req => (
                      <RequirementCard
                        key={req.id}
                        requirement={req}
                        compact={compact}
                        onClick={() => onRequirementClick(req)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* 列表视图 - 可排期区 */}
            <div className="p-3 h-full flex flex-col">
              <div className="overflow-auto border border-gray-200 rounded-lg flex-1">
                <table className="text-xs border-collapse w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">需求名称</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">权重分</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">星级</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">业务价值</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">迫切程度</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">强制截止</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">工作量</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">提交人</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">RMS</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">技术评估</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readyReqs.map(req => (
                      <tr
                        key={req.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('requirementId', req.id);
                          e.dataTransfer.setData('sourcePoolId', 'unscheduled');
                        }}
                        onClick={() => onRequirementClick(req)}
                        className="hover:bg-gray-50 cursor-pointer transition"
                      >
                        <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.name}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center">
                          <span className="font-semibold text-teal-700">{Math.round(req.displayScore || 0)}</span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center">
                          <span className="text-yellow-500">{req.stars}</span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.bv}</td>
                        <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.tc}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center">{req.hardDeadline ? '有' : '无'}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-right whitespace-nowrap">{roundNumber(req.effortDays, 1)}天</td>
                        <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.submitter || '-'}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center">
                          {req.isRMS ? <span className="text-purple-600 font-semibold">✓</span> : '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.techProgress}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 未评估区 - 列表视图 */}
            {notReadyReqs.length > 0 && (
              <>
                <div className="px-3 py-2">
                  <div className="border-t border-gray-300 relative">
                    <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 text-xs text-gray-500 rounded-full border border-gray-300 whitespace-nowrap">
                      未完成技术评估（不可排期）
                    </div>
                  </div>
                </div>
                <div className="px-3 pb-3 bg-gray-100">
                  <div className="overflow-auto border border-gray-200 rounded-lg opacity-60" style={{ maxHeight: '300px' }}>
                    <table className="text-xs border-collapse w-full">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">需求名称</th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">权重分</th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">星级</th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">业务价值</th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">迫切程度</th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">强制截止</th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">工作量</th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">提交人</th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">RMS</th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold whitespace-nowrap">技术评估</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notReadyReqs.map(req => (
                          <tr
                            key={req.id}
                            onClick={() => onRequirementClick(req)}
                            className="hover:bg-gray-50 cursor-pointer transition"
                          >
                            <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.name}</td>
                            <td className="border border-gray-300 px-2 py-1.5 text-center">
                              <span className="font-semibold text-teal-700">{Math.round(req.displayScore || 0)}</span>
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5 text-center">
                              <span className="text-yellow-500">{req.stars}</span>
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.bv}</td>
                            <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.tc}</td>
                            <td className="border border-gray-300 px-2 py-1.5 text-center">{req.hardDeadline ? '有' : '无'}</td>
                            <td className="border border-gray-300 px-2 py-1.5 text-right whitespace-nowrap">{roundNumber(req.effortDays, 1)}天</td>
                            <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.submitter || '-'}</td>
                            <td className="border border-gray-300 px-2 py-1.5 text-center">
                              {req.isRMS ? <span className="text-purple-600 font-semibold">✓</span> : '-'}
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{req.techProgress}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* 底部清空按钮 */}
      <div className="flex-shrink-0 border-t border-gray-200 p-3 bg-gray-50">
        <button
          onClick={() => {
            if (confirm('确定要清空所有需求吗？此操作不可撤销！')) {
              onClearAll();
            }
          }}
          className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
        >
          <Trash2 size={16} />
          清空需求池
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 示例数据生成 (Sample Data Generator)
// ============================================================================

/**
 * 生成示例需求数据
 *
 * 数据来源：专卖系统开发影响其他功能上线评估.pdf
 * 用途：为新用户提供预置的示例数据，帮助快速了解系统功能
 *
 * 包含需求类型：
 * - 必须要做的功能（评分10分）
 * - 建议马上/近期做（评分8分）
 * - 有余力再做（评分5分）
 *
 * @returns 需求对象数组
 */
const generateSampleData = (): Requirement[] => {
  // 真实数据来自专卖系统开发影响其他功能上线评估.pdf
  const realData = [
    // 评分10分：必须要做的功能
    { name: '英国直营零售通适配', owner: 'Zhisheng1 Liu 刘智晟', pm: 'Andy Wei魏有峰', days: 45, importance: 10, status: 'todo', deadline: '2025-11-30', category: '国际部新增' },
    { name: '韩国授权零售通适配', owner: 'Zhisheng1 Liu 刘智晟', pm: 'Andy Wei魏有峰', days: 50, importance: 10, status: 'todo', deadline: '2025-12-15', category: '国际部新增' },
    { name: '展位规划', owner: 'Jaye 朴景雯', pm: 'Nick Su 苏梦醒', days: 40, importance: 10, status: 'todo', deadline: '2025-11-20', category: '国际部新增' },
    { name: '智利销服一体11.15试营业', owner: 'Andy Wei魏有峰', pm: 'Zhisheng1 Liu 刘智晟', days: 35, importance: 10, status: 'doing', deadline: '2025-11-15', category: '国际部新增' },
    { name: '浮窗&金刚位优化', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 30, importance: 10, status: 'todo', deadline: '2025-12-01', category: '国际部新增' },
    { name: '越南销服一体12月试营业', owner: 'Andy Wei魏有峰', pm: 'Zhisheng1 Liu 刘智晟', days: 40, importance: 10, status: 'todo', deadline: '2025-12-01', category: '国际部新增' },
    { name: 'ERA需求Cashback', owner: 'Asher 徐泽一', pm: 'Andy Wei魏有峰', days: 35, importance: 10, status: 'todo', deadline: '2025-11-25', category: '国际部新增' },
    { name: 'ERA需求盘点优化', owner: 'Asher 徐泽一', pm: 'Andy Wei魏有峰', days: 45, importance: 10, status: 'todo', deadline: '2025-12-10', category: '国际部新增' },
    { name: '授权大家电退货', owner: '李申宇', pm: 'Asher 徐泽一', days: 40, importance: 10, status: 'todo', deadline: '2025-11-30', category: '国际部新增' },

    // 评分9分：重点功能
    { name: 'ERA需求APP端授权商采购单、汇总看板&批量审批', owner: 'Asher 徐泽一', pm: 'Andy Wei魏有峰', days: 55, importance: 9, status: 'todo', deadline: '2025-12-20', category: '国际部新增' },
    { name: '进货单部分拒收', owner: '李申宇', pm: 'Asher 徐泽一', days: 35, importance: 9, status: 'todo', deadline: '2025-11-28', category: '国际部新增' },
    { name: '授权坏品返仓', owner: '李申宇', pm: 'Asher 徐泽一', days: 40, importance: 9, status: 'todo', deadline: '2025-12-05', category: '国际部新增' },

    // 评分8分：中等优先级
    { name: '物料系统搭建', owner: 'Jaye 朴景雯', pm: 'Andy Wei魏有峰', days: 60, importance: 8, status: 'todo', category: '国际部新增' },
    { name: 'CPS的买赠活动', owner: 'Jamie 吴静姗', pm: 'Nick Su 苏梦醒', days: 30, importance: 8, status: 'todo', deadline: '2025-11-30', category: '国际部新增' },
    { name: 'CPS订单消费者感知', owner: 'Jamie 吴静姗', pm: 'Nick Su 苏梦醒', days: 25, importance: 8, status: 'todo', deadline: '2025-12-10', category: '国际部新增' },
    { name: '小票各国统一优化', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 20, importance: 8, status: 'todo', category: '国际部新增' },
    { name: '授权店活动预算优化迭代', owner: 'Asher 徐泽一', pm: 'Andy Wei魏有峰', days: 30, importance: 8, status: 'todo', category: '国际部新增' },

    // 评分7分：建议做的功能
    { name: '政策日历(促销)', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 20, importance: 7, status: 'todo', category: '中国区导入' },
    { name: '目标复理二期迭代', owner: 'Zhisheng1 Liu 刘智晟', pm: 'Andy Wei魏有峰', days: 35, importance: 7, status: 'todo', category: '国际部新增' },
    { name: '直营店非串码坏品返仓', owner: '李申宇', pm: 'Asher 徐泽一', days: 25, importance: 7, status: 'todo', category: '国际部新增' },
    { name: 'PC端员工看板 2.0', owner: 'Zhisheng1 Liu 刘智晟', pm: 'Andy Wei魏有峰', days: 30, importance: 7, status: 'todo', category: '国际部新增' },
    { name: '坏品、良品互转', owner: '李申宇', pm: 'Asher 徐泽一', days: 15, importance: 7, status: 'todo', category: '中国区导入' },
    { name: '理赔返仓', owner: '李申宇', pm: 'Asher 徐泽一', days: 20, importance: 7, status: 'todo', category: '中国区导入' },
    { name: '商品周转看板', owner: 'Jaye 朴景雯', pm: 'Andy Wei魏有峰', days: 25, importance: 7, status: 'todo', category: '中国区导入' },
    { name: 'ROI看板1.1', owner: 'Zhisheng1 Liu 刘智晟', pm: 'Andy Wei魏有峰', days: 30, importance: 7, status: 'todo', category: '国际部新增' },
    { name: '串码轨迹查询', owner: '李申宇', pm: 'Asher 徐泽一', days: 20, importance: 7, status: 'todo', category: '国际部新增' },

    // 评分6分：如果有资源建议做
    { name: '门店补差', owner: 'Jamie 吴静姗', pm: 'Nick Su 苏梦醒', days: 15, importance: 6, status: 'todo', category: '中国区导入' },
    { name: '满减满赠', owner: 'Jamie 吴静姗', pm: 'Nick Su 苏梦醒', days: 20, importance: 6, status: 'todo', category: '中国区导入' },
    { name: '固资盘点', owner: 'Jaye 朴景雯', pm: 'Andy Wei魏有峰', days: 25, importance: 6, status: 'todo', category: '中国区导入' },
    { name: '员工激励与提成', owner: 'Zhisheng1 Liu 刘智晟', pm: 'Andy Wei魏有峰', days: 40, importance: 6, status: 'todo', category: '国际部新增' },

    // 评分5分：次优先级
    { name: 'MBR(月报、周报)', owner: 'Zhisheng1 Liu 刘智晟', pm: 'Andy Wei魏有峰', days: 18, importance: 5, status: 'todo', category: '中国区导入' },
    { name: '异业券', owner: 'Jamie 吴静姗', pm: 'Nick Su 苏梦醒', days: 15, importance: 5, status: 'todo', category: '中国区导入' },
    { name: '固资处理', owner: 'Jaye 朴景雯', pm: 'Andy Wei魏有峰', days: 20, importance: 5, status: 'todo', category: '中国区导入' },
    { name: '组织中台3.0', owner: 'Zhisheng1 Liu 刘智晟', pm: 'Andy Wei魏有峰', days: 50, importance: 5, status: 'todo', category: '国际部新增' },
    { name: '库存查询APP多角色看板&PC看板', owner: 'Asher 徐泽一', pm: 'Andy Wei魏有峰', days: 30, importance: 5, status: 'todo', category: '国际部新增' },

    // 评分4分：NSS体验改善
    { name: 'NSS体验改善——扫码场景提示优化', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 8, importance: 4, status: 'todo', category: '国际部新增' },
    { name: 'NSS体验改善——商品搜索能力优化', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 10, importance: 4, status: 'todo', category: '国际部新增' },
    { name: 'NSS体验改善——订单筛选能力优化', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 8, importance: 4, status: 'todo', category: '国际部新增' },
    { name: 'NSS体验改善——收货地址查询体验优化', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 7, importance: 4, status: 'todo', category: '国际部新增' },
    { name: 'NSS体验改善——退款效率与提示优化', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 10, importance: 4, status: 'todo', category: '国际部新增' },

    // 评分3分：可延期到26年初
    { name: '新品专区', owner: 'Jamie 吴静姗', pm: 'Nick Su 苏梦醒', days: 12, importance: 3, status: 'todo', category: '中国区导入' },
    { name: '商场礼品卡', owner: 'Jamie 吴静姗', pm: 'Nick Su 苏梦醒', days: 15, importance: 3, status: 'todo', category: '国际部新增' },
    { name: '客流数据二期迭代', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 20, importance: 3, status: 'todo', category: '国际部新增' },
    { name: '专属LDU活动报价机取', owner: 'Asher 徐泽一', pm: 'Andy Wei魏有峰', days: 18, importance: 3, status: 'todo', category: '国际部新增' },

    // 评分2分：低优先级
    { name: '串批流加催办', owner: '李申宇', pm: 'Asher 徐泽一', days: 8, importance: 2, status: 'todo', category: '国际部新增' },
    { name: '建店系统和ISP建立机构打通', owner: 'Zhisheng1 Liu 刘智晟', pm: 'Andy Wei魏有峰', days: 10, importance: 2, status: 'todo', category: '国际部新增' },

    // 评分1分：最低优先级
    { name: '2C部分退款', owner: 'Jamie 吴静姗', pm: 'Nick Su 苏梦醒', days: 5, importance: 1, status: 'todo', category: '国际部新增' },
  ];

  const bvMapping: Record<number, string> = {
    10: '战略平台',
    9: '撬动核心',
    8: '撬动核心',
    7: '明显',
    6: '明显',
    5: '明显',
    4: '局部',
    3: '局部',
    2: '局部',
    1: '局部'
  };

  return realData.map((item, i) => {
    const hasDeadline = !!item.deadline;
    const isUrgent = hasDeadline && new Date(item.deadline) < new Date('2025-11-15');

    // 生成提交日期：高优先级的需求提交时间较早
    // importance 10-9: 10月初, 8-7: 10月中, 6-5: 10月底, 4-3: 11月, 1-2: 11月底
    const baseDate = new Date('2025-10-01');
    let daysOffset = 0;
    if (item.importance >= 9) {
      daysOffset = i % 10; // 10月1-10日
    } else if (item.importance >= 7) {
      daysOffset = 10 + (i % 10); // 10月11-20日
    } else if (item.importance >= 5) {
      daysOffset = 20 + (i % 10); // 10月21-30日
    } else if (item.importance >= 3) {
      daysOffset = 30 + (i % 10); // 11月
    } else {
      daysOffset = 40 + (i % 10); // 11月中旬以后
    }

    const submitDate = new Date(baseDate);
    submitDate.setDate(submitDate.getDate() + daysOffset);

    // 根据类别分配需求提交方
    let submitter: '产品' | '研发' | '业务' = '产品';
    if (item.category === '中国区导入') {
      submitter = '业务';
    } else if (item.name.includes('优化') || item.name.includes('体验改善') || item.name.includes('看板')) {
      submitter = i % 2 === 0 ? '产品' : '研发';
    } else {
      submitter = '产品';
    }

    // 判断是否为RMS重构项目：一些系统性、平台性、架构性的需求
    const isRMS = item.name.includes('系统') || item.name.includes('中台') ||
                  item.name.includes('平台') || item.name.includes('架构') ||
                  (item.days > 40 && item.importance >= 8); // 大工作量+高优先级

    // 生成研发同学名字（从owner中提取或者使用pm的名字）
    const developer = item.owner;

    return {
      id: `ZM-${String(i + 1).padStart(3, '0')}`,
      name: item.name,
      submitterName: item.pm, // 需求提交人使用产品经理名字
      productManager: item.pm,
      developer: developer, // 研发同学使用原owner字段
      productProgress: item.status === 'doing' ? '已出PRD' : '已评估',
      effortDays: item.days,
      bv: bvMapping[item.importance] || '明显',
      tc: isUrgent ? '一月硬窗口' : (hasDeadline ? '三月窗口' : '随时'),
      hardDeadline: isUrgent,
      deadlineDate: item.deadline,
      techProgress: '已评估工作量',
      type: '功能开发',
      submitDate: submitDate.toISOString().split('T')[0], // 格式化为 YYYY-MM-DD
      submitter, // 需求提交方
      isRMS, // 是否RMS重构
      businessDomain: item.category === '中国区导入' ? '渠道零售' : '国际零售通用' // 根据类别设置业务域
    };
  });
};

// ============================================================================
// 主应用组件 (Main Application Component)
// ============================================================================

/**
 * WSJF Planner 主应用组件
 *
 * 架构说明：
 * - 单文件组件架构，所有组件和逻辑在同一文件中
 * - 使用React Hooks管理状态
 * - 使用LocalStorage持久化数据
 *
 * 核心状态管理：
 * - currentUser: 当前登录用户
 * - requirements: 所有需求列表（包含已排期和未排期）
 * - sprintPools: 迭代池列表
 * - unscheduled: 未排期需求列表（由requirements动态计算）
 *
 * 主要功能：
 * - 需求管理：创建、编辑、删除、导入、导出
 * - 迭代池管理：创建、编辑、删除、调整宽度
 * - 拖拽排期：在待排期区和迭代池之间拖拽需求
 * - 数据持久化：自动保存到LocalStorage
 * - 多维度筛选和排序
 * - 数据导出：Excel、JSON、PDF
 *
 * @returns JSX元素
 */
export default function WSJFPlanner() {
  // ========== 状态管理 ==========

  // 用户相关状态
  const [currentUser, setCurrentUser] = useState<User | null>(null);       // 当前登录用户
  const [showLogin, setShowLogin] = useState(false);                       // 是否显示登录弹窗

  // 核心数据状态
  const [requirements, setRequirements] = useState<Requirement[]>([]);     // 所有需求列表
  const [sprintPools, setSprintPools] = useState<SprintPool[]>([]);        // 迭代池列表
  const [unscheduled, setUnscheduled] = useState<Requirement[]>([]);       // 未排期需求列表

  // 拖拽相关状态
  const [dragOverPool, setDragOverPool] = useState<string | null>(null);   // 拖拽悬停的池ID

  // 编辑相关状态
  const [editingReq, setEditingReq] = useState<Requirement | null>(null);  // 正在编辑的需求
  const [editingSprint, setEditingSprint] = useState<SprintPool | null>(null); // 正在编辑的迭代池
  const [isNewReq, setIsNewReq] = useState(false);                         // 是否为新建需求

  // UI控制状态
  const [compact, setCompact] = useState(false);                           // 紧凑模式
  const [showHandbook, setShowHandbook] = useState(false);                 // 显示说明书
  const [showExportMenu, setShowExportMenu] = useState(false);             // 显示导出菜单
  const [showImportModal, setShowImportModal] = useState(false);           // 显示导入预览Modal
  const [importData, setImportData] = useState<any[]>([]);                 // 导入的原始数据
  const [importMapping, setImportMapping] = useState<Record<string, string>>({}); // 字段映射关系
  const [isAIMappingLoading, setIsAIMappingLoading] = useState(false);     // AI映射加载状态
  const [clearBeforeImport, setClearBeforeImport] = useState(false);       // 导入时是否清空已有需求

  // 筛选和搜索状态
  const [searchTerm, setSearchTerm] = useState('');                        // 搜索关键词
  const [filterType, setFilterType] = useState('all');                     // 类型筛选
  const [scoreFilter, setScoreFilter] = useState('all');                   // 热度分筛选
  const [effortFilter, setEffortFilter] = useState('all');                 // 工作量筛选
  const [bvFilter, setBVFilter] = useState('all');                         // 业务价值筛选
  const [businessDomainFilter, setBusinessDomainFilter] = useState('all'); // 业务域筛选
  const [rmsFilter, setRMSFilter] = useState(false);                       // RMS筛选

  // 布局相关状态
  const [leftPanelWidth, setLeftPanelWidth] = useState(400);               // 待排期区宽度（像素）
  const [poolWidths, setPoolWidths] = useState<Record<string, number>>({}); // 各迭代池宽度（像素）

  // ========== 数据初始化和持久化 ==========

  /**
   * 加载示例数据
   * 包含预置的需求和迭代池，帮助新用户快速了解系统
   */

  const loadSampleData = () => {
    const sampleReqs = generateSampleData();
    const samplePools: SprintPool[] = [
      { id: 'SPRINT-01', name: '迭代1', startDate: '2025-11', endDate: '2025-11-30', totalDays: 200, bugReserve: 10, refactorReserve: 15, otherReserve: 5, requirements: [] },
      { id: 'SPRINT-02', name: '迭代2', startDate: '2025-12', endDate: '2025-12-31', totalDays: 200, bugReserve: 10, refactorReserve: 15, otherReserve: 5, requirements: [] },
      { id: 'SPRINT-03', name: '迭代3', startDate: '2026-01', endDate: '2026-01-31', totalDays: 200, bugReserve: 10, refactorReserve: 15, otherReserve: 5, requirements: [] },
    ];

    const withScores = calculateScores(sampleReqs);
    setRequirements(withScores);
    setSprintPools(samplePools);
    
    const sorted = [...withScores].sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0));
    setUnscheduled(sorted);
  };

  // 初始化：检查用户登录状态
  useEffect(() => {
    const user = storage.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      const savedData = storage.loadUserData(user);
      if (savedData) {
        setRequirements(savedData.requirements);
        setSprintPools(savedData.sprintPools);
        setUnscheduled(savedData.unscheduled);
      } else {
        loadSampleData();
      }
    } else {
      setShowLogin(true);
    }
  }, []);

  // 自动保存：监听数据变化
  useEffect(() => {
    if (currentUser && requirements.length > 0) {
      const data: storage.StorageData = {
        requirements,
        sprintPools,
        unscheduled
      };
      storage.saveUserData(currentUser, data);
    }
  }, [currentUser, requirements, sprintPools, unscheduled]);

  const recalculateScores = (allReqs: Requirement[]) => {
    const updated = calculateScores(allReqs);
    setRequirements(updated);
    
    const unscheduledIds = new Set(unscheduled.map(r => r.id));
    const updatedUnscheduled = updated.filter(r => unscheduledIds.has(r.id))
      .sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0));
    setUnscheduled(updatedUnscheduled);
    
    setSprintPools(prev => prev.map(pool => ({
      ...pool,
      requirements: pool.requirements.map(r => updated.find(u => u.id === r.id) || r)
    })));
  };

  const handleSaveRequirement = (req: Requirement) => {
    if (isNewReq) {
      const newReqs = [...requirements, req];
      const updated = calculateScores(newReqs);
      setRequirements(updated);

      // 将新需求添加到待排期区
      const newReq = updated.find(r => r.id === req.id);
      if (newReq) {
        setUnscheduled(prev => {
          const newList = [...prev, newReq];
          return newList.sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0));
        });
      }
    } else {
      const newReqs = requirements.map(r => r.id === req.id ? req : r);
      recalculateScores(newReqs);
    }
  };

  const handleSaveSprint = (sprint: SprintPool) => {
    setSprintPools(prev => prev.map(p => p.id === sprint.id ? sprint : p));
  };

  const handleDeleteSprint = (poolId: string) => {
    const pool = sprintPools.find(p => p.id === poolId);
    if (!pool) return;

    if (pool.requirements.length > 0) {
      if (!confirm(`迭代池"${pool.name}"中还有 ${pool.requirements.length} 个需求，删除后这些需求将被移回待排期区。确定删除吗？`)) {
        return;
      }
      // 将迭代池中的需求移回待排期区
      setUnscheduled(prev => {
        const newList = [...prev, ...pool.requirements];
        return newList.sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0));
      });
    } else {
      if (!confirm(`确定要删除迭代池"${pool.name}"吗？`)) {
        return;
      }
    }

    setSprintPools(prev => prev.filter(p => p.id !== poolId));
  };

  const handleAddSprint = () => {
    const newId = `SPRINT-${Date.now()}`;
    const newSprint: SprintPool = {
      id: newId,
      name: `迭代${sprintPools.length + 1}`,
      startDate: '2026-01',
      endDate: '2026-01-31',
      totalDays: 200,
      bugReserve: 10,
      refactorReserve: 15,
      otherReserve: 5,
      requirements: []
    };
    setSprintPools(prev => [...prev, newSprint]);
    // 打开编辑弹窗让用户配置
    setEditingSprint(newSprint);
  };

  const handleLogin = (user: storage.User) => {
    setCurrentUser(user);
    setShowLogin(false);
    const savedData = storage.loadUserData(user);
    if (savedData) {
      setRequirements(savedData.requirements);
      setSprintPools(savedData.sprintPools);
      setUnscheduled(savedData.unscheduled);
    } else {
      loadSampleData();
    }
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？数据已自动保存。')) {
      storage.logout();
      setCurrentUser(null);
      setShowLogin(true);
      setRequirements([]);
      setSprintPools([]);
      setUnscheduled([]);
    }
  };

  /**
   * 处理文件导入
   * 支持CSV和Excel格式
   */
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseFile(file);
      if (data && data.length > 0) {
        setImportData(data);
        // 自动进行模糊匹配
        const mapping = autoMapFields(data[0]);
        setImportMapping(mapping);
        setShowImportModal(true);
      } else {
        alert('文件中没有数据');
      }
    } catch (error) {
      console.error('文件解析失败:', error);
      alert('文件解析失败，请检查文件格式');
    }

    // 重置input以允许重复上传同一文件
    e.target.value = '';
  };

  /**
   * 解析文件（CSV或Excel）
   */
  const parseFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsBinaryString(file);
    });
  };

  /**
   * 自动映射字段（模糊匹配）
   * 匹配系统字段和导入文件的字段
   */
  const autoMapFields = (sampleRow: any): Record<string, string> => {
    const mapping: Record<string, string> = {};
    const fileFields = Object.keys(sampleRow);

    // 系统字段定义
    // 注意：techProgress和productProgress不做自动映射，使用智能默认值
    const systemFields: Record<string, string[]> = {
      name: ['需求名称', '名称', 'name', 'title', '标题', '需求', 'requirement', '功能'],
      submitterName: ['提交人', '提交人姓名', 'submitter', 'author', '作者'],
      productManager: ['产品经理', '产品', 'pm', 'product manager', '负责人', '产品主r'],
      developer: ['开发人员', '开发', 'developer', 'dev', '开发者', '研发主r', '研发负责人'],
      effortDays: ['工作量', '人天', '工作日', 'effort', 'days', '人日', '天数', '工时', '预估工时', 'workday'],
      bv: ['业务价值', 'bv', 'business value', '价值', '重要性', '业务重要性', '优先级'],
      tc: ['时间临界', 'tc', 'time critical', '临界性', '紧急', '迫切'],
      hardDeadline: ['强制截止', 'ddl', 'deadline', '截止', '上线时间', '交付时间'],
      // techProgress: 不自动映射，使用智能默认值（有工作量=已评估工作量，无工作量=未评估）
      // productProgress: 不自动映射，使用默认值"未评估"
      type: ['类型', 'type', '需求类型'],
      submitDate: ['提交日期', '日期', 'date', '提交时间', '开始时间'],
      submitter: ['提交者', '提交方', '来源'],
      isRMS: ['是否RMS', 'rms', 'is rms'],
    };

    // 对每个文件字段进行匹配
    fileFields.forEach(fileField => {
      const normalizedFileField = fileField.toLowerCase().trim();

      for (const [systemField, keywords] of Object.entries(systemFields)) {
        const matched = keywords.some(keyword =>
          normalizedFileField.includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(normalizedFileField)
        );

        if (matched && !Object.values(mapping).includes(fileField)) {
          mapping[systemField] = fileField;
          break;
        }
      }
    });

    return mapping;
  };

  /**
   * 使用AI映射字段（OpenAI API）
   */
  const handleAIMapping = async () => {
    const apiKey = OPENAI_API_KEY;
    if (!apiKey) {
      alert('AI映射功能未配置。请联系管理员在代码中配置 OpenAI API Key。');
      return;
    }

    setIsAIMappingLoading(true);

    try {
      const sampleRow = importData[0];
      const fileFields = Object.keys(sampleRow);
      const systemFields = {
        name: '需求名称（必填）',
        submitterName: '提交人姓名',
        productManager: '产品经理',
        developer: '开发人员',
        effortDays: '工作量（天数）',
        bv: '业务价值（局部/明显/撬动核心/战略平台）',
        tc: '时间临界（随时/三月窗口/一月硬窗口）',
        hardDeadline: '是否有强制截止日期（true/false）',
        techProgress: '技术进展（未评估/已评估工作量/已完成技术方案）',
        productProgress: '产品进展（未评估/设计中/开发中/已完成）',
        type: '需求类型（功能开发/技术债/Bug修复）',
        submitDate: '提交日期',
        submitter: '提交方（产品/技术/运营/业务）',
        isRMS: '是否RMS需求（true/false）'
      };

      const prompt = `你是一个数据映射专家。请将Excel文件的列名映射到系统字段。

系统字段（目标）：
${Object.entries(systemFields).map(([key, desc]) => `- ${key}: ${desc}`).join('\n')}

Excel文件列名（来源）：
${fileFields.map((field, index) => `${index + 1}. ${field}`).join('\n')}

示例数据（第一行）：
${JSON.stringify(sampleRow, null, 2)}

请分析列名和示例数据，返回最合理的映射关系。只返回JSON格式，不要其他解释：
{"systemField1": "excelColumn1", "systemField2": "excelColumn2", ...}

注意：
1. 如果某个Excel列无法映射到任何系统字段，不要包含在结果中
2. 确保name字段必须被映射（这是必填字段）
3. 对于布尔值字段（hardDeadline、isRMS），尝试识别"是/否"、"有/无"、"true/false"等表示`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的数据映射专家，擅长分析Excel列名和系统字段的对应关系。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || response.statusText;
        throw new Error(`API请求失败 (${response.status}): ${errorMsg}\n\n可能原因：\n1. API Key无效或已过期\n2. API Key权限不足\n3. 超出API配额限制\n4. 网络连接问题\n\n请检查API Key配置`);
      }

      const result = await response.json();

      // 检查OpenAI API返回的结果
      if (!result.choices || result.choices.length === 0) {
        throw new Error('API返回数据格式异常：没有返回结果');
      }

      const aiText = result.choices[0]?.message?.content || '';

      if (!aiText) {
        throw new Error('API返回数据为空');
      }

      // 从AI返回的文本中提取JSON
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiMapping = JSON.parse(jsonMatch[0]);
        setImportMapping(aiMapping);
        alert('AI映射完成！请检查映射结果');
      } else {
        throw new Error(`无法解析AI返回的映射结果。AI返回内容：\n${aiText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.error('AI映射失败:', error);
      let errorMessage = 'AI映射失败：';

      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage += '网络连接失败，请检查网络连接或防火墙设置';
      } else if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += '未知错误';
      }

      alert(errorMessage);
    } finally {
      setIsAIMappingLoading(false);
    }
  };

  /**
   * 确认导入数据
   */
  const handleConfirmImport = () => {
    try {
      const newRequirements: Requirement[] = importData.map((row, index) => {
        // 生成唯一ID（使用时间戳+随机数+索引确保唯一性）
        const uniqueId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`;
        const mapped: any = {};

        // 根据映射关系转换数据（不包括id字段，防止被覆盖）
        Object.entries(importMapping).forEach(([systemField, fileField]) => {
          // 跳过id字段，确保ID不会被Excel数据覆盖
          if (systemField === 'id') return;

          let value = row[fileField];

          // 数据类型转换
          if (systemField === 'effortDays') {
            value = Number(value) || 0;
          } else if (systemField === 'hardDeadline' || systemField === 'isRMS') {
            value = value === true || value === 'true' || value === '是' || value === '有' || value === 1;
          }

          mapped[systemField] = value;
        });

        // 设置默认值，使用生成的uniqueId
        // 智能合并工作量：扫描所有可能包含工作量的列，取最大值
        // 这样即使映射不完美，也能尽可能获取到工作量数据
        let effortDays = Number(mapped.effortDays) || 0;

        // 扫描原始行数据中所有可能的工作量列
        const effortKeywords = ['工作量', '人天', '工时', 'workday', 'effort', 'days', 'java', '预估'];
        const allColumns = Object.keys(row);

        allColumns.forEach(colName => {
          // 检查列名是否包含工作量相关关键词
          const lowerColName = colName.toLowerCase();
          const hasKeyword = effortKeywords.some(keyword =>
            lowerColName.includes(keyword.toLowerCase()) || colName.includes(keyword)
          );

          if (hasKeyword) {
            const val = row[colName];
            // 严格验证：值必须存在、不是空字符串、是有效数字、且大于0
            if (val !== null && val !== undefined && val !== '') {
              const num = Number(val);
              if (!isNaN(num) && num > 0 && num > effortDays) {
                effortDays = num;
              }
            }
          }
        });

        // 枚举值验证：确保所有枚举字段都是有效值
        // 如果映射的值不在有效枚举中，使用智能默认值或标准默认值

        // 验证并智能设置技术进展
        const validTechProgress = ['未评估', '已评估工作量', '已完成技术方案'];
        let finalTechProgress = validTechProgress.includes(mapped.techProgress)
          ? mapped.techProgress
          : (effortDays > 0 ? '已评估工作量' : '未评估');

        // 如果映射的是有效的"未评估"但有工作量数据，自动升级
        if (effortDays > 0 && finalTechProgress === '未评估') {
          finalTechProgress = '已评估工作量';
        }

        // 验证业务价值
        const validBV = ['局部', '明显', '撬动核心', '战略平台'];
        let finalBV = validBV.includes(mapped.bv) ? mapped.bv : '明显';

        // 智能转换：如果是数字，尝试映射到业务价值等级
        if (typeof mapped.bv === 'number' || !isNaN(Number(mapped.bv))) {
          const bvNum = Number(mapped.bv);
          if (bvNum >= 9) finalBV = '战略平台';
          else if (bvNum >= 7) finalBV = '撬动核心';
          else if (bvNum >= 5) finalBV = '明显';
          else finalBV = '局部';
        }

        // 验证时间临界
        const validTC = ['随时', '三月窗口', '一月硬窗口'];
        const finalTC = validTC.includes(mapped.tc) ? mapped.tc : '随时';

        // 验证产品进展
        const validProductProgress = ['未评估', '设计中', '开发中', '已完成'];
        const finalProductProgress = validProductProgress.includes(mapped.productProgress)
          ? mapped.productProgress
          : '未评估';

        // 验证需求类型
        const validType = ['功能开发', '技术债', 'Bug修复'];
        const finalType = validType.includes(mapped.type) ? mapped.type : '功能开发';

        // 验证提交方
        const validSubmitter = ['产品', '技术', '运营', '业务'];
        const finalSubmitter = validSubmitter.includes(mapped.submitter) ? mapped.submitter : '产品';

        return {
          id: uniqueId,
          name: mapped.name || `导入需求-${index + 1}`,
          submitterName: mapped.submitterName || '',
          productManager: mapped.productManager || '',
          developer: mapped.developer || '',
          productProgress: finalProductProgress,
          effortDays: effortDays,
          bv: finalBV,
          tc: finalTC,
          hardDeadline: mapped.hardDeadline || false,
          techProgress: finalTechProgress,
          type: finalType,
          submitDate: mapped.submitDate || new Date().toISOString().split('T')[0],
          submitter: finalSubmitter,
          isRMS: mapped.isRMS || false,
          businessDomain: '国际零售通用', // 导入的需求默认为"国际零售通用"业务域
        };
      });

      // 添加到系统（根据clearBeforeImport决定是否清空已有需求）
      // 重要：先合并所有需求，然后统一计算分数，确保分数归一化基于全局范围
      const allReqs = clearBeforeImport ? newRequirements : [...requirements, ...newRequirements];
      const updated = calculateScores(allReqs);
      setRequirements(updated);

      // 如果清空模式，同时清空所有迭代池和待排期区
      if (clearBeforeImport) {
        setSprintPools(prev => prev.map(pool => ({ ...pool, requirements: [] })));
      }

      // 从updated中提取新导入的需求（通过ID匹配）
      // 这样确保使用的是经过统一分数计算的对象，而不是旧的对象引用
      const newReqIds = new Set(newRequirements.map(r => r.id));
      const newUnscheduledFromUpdated = updated.filter(r => newReqIds.has(r.id));

      setUnscheduled(prev => {
        const combined = clearBeforeImport
          ? newUnscheduledFromUpdated
          : [...prev, ...newUnscheduledFromUpdated];
        return combined.sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0));
      });

      setShowImportModal(false);
      setImportData([]);
      setImportMapping({});
      setClearBeforeImport(false); // 重置清空选项

      const message = clearBeforeImport
        ? `已清空原有需求，成功导入 ${newRequirements.length} 条新需求！`
        : `成功导入 ${newRequirements.length} 条需求！`;
      alert(message);
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleExportExcel = () => {
    const exportData: any[] = [];

    sprintPools.forEach(pool => {
      pool.requirements.forEach(req => {
        exportData.push({
          '迭代池': pool.name,
          '需求名称': req.name,
          '需求提交人': req.submitterName,
          '产品经理': req.productManager,
          '研发同学': req.developer,
          '类型': req.type,
          '工作量(天)': req.effortDays,
          '业务价值': req.bv,
          '迫切程度': req.tc,
          '强制DDL': req.hardDeadline ? '是' : '否',
          '权重分': req.displayScore || 0,
          '星级': '★'.repeat(req.stars || 0),
          '技术评估': req.techProgress
        });
      });
    });

    unscheduled.forEach(req => {
      exportData.push({
        '迭代池': '未排期',
        '需求名称': req.name,
        '需求提交人': req.submitterName,
        '产品经理': req.productManager,
        '研发同学': req.developer,
        '类型': req.type,
        '工作量(天)': req.effortDays,
        '业务价值': req.bv,
        '迫切程度': req.tc,
        '强制DDL': req.hardDeadline ? '是' : '否',
        '热度分': req.displayScore || 0,
        '星级': '★'.repeat(req.stars || 0),
        '技术评估': req.techProgress
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'WSJF排期');
    XLSX.writeFile(workbook, `WSJF排期_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportPNG = async () => {
    const element = document.body;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const link = document.createElement('a');
    link.download = `WSJF排期_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
    setShowExportMenu(false);
  };

  const handleExportPDF = async () => {
    const element = document.body;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`WSJF排期_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  const handleDragEnter = (poolId: string) => {
    setDragOverPool(poolId);
  };

  const handleDragLeave = () => {
    setDragOverPool(null);
  };

  const handleDrop = (targetPoolId: string) => {
    setDragOverPool(null);
    
    const event = window.event as DragEvent;
    if (!event || !event.dataTransfer) return;
    
    const reqId = event.dataTransfer.getData('requirementId');
    const sourcePoolId = event.dataTransfer.getData('sourcePoolId');
    
    if (!reqId || sourcePoolId === targetPoolId) return;

    let requirement: Requirement | undefined;
    if (sourcePoolId === 'unscheduled') {
      requirement = unscheduled.find(r => r.id === reqId);
    } else {
      const sourcePool = sprintPools.find(p => p.id === sourcePoolId);
      requirement = sourcePool?.requirements.find(r => r.id === reqId);
    }

    if (!requirement) return;

    if (targetPoolId !== 'unscheduled' && requirement.techProgress === '未评估') {
      alert('此需求未完成技术评估，无法排期！');
      return;
    }

    if (targetPoolId !== 'unscheduled') {
      // 允许拖入超出容量的需求，SprintPoolComponent会显示警告状态

      if (sourcePoolId === 'unscheduled') {
        setUnscheduled(prev => prev.filter(r => r.id !== reqId));
      } else {
        setSprintPools(prev => prev.map(p => 
          p.id === sourcePoolId
            ? { ...p, requirements: p.requirements.filter(r => r.id !== reqId) }
            : p
        ));
      }

      setSprintPools(prev => prev.map(p => 
        p.id === targetPoolId
          ? { ...p, requirements: [...p.requirements, requirement!] }
          : p
      ));
    } else {
      if (sourcePoolId !== 'unscheduled') {
        setSprintPools(prev => prev.map(p => 
          p.id === sourcePoolId
            ? { ...p, requirements: p.requirements.filter(r => r.id !== reqId) }
            : p
        ));
        
        setUnscheduled(prev => {
          const newList = [...prev, requirement!];
          return newList.sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0));
        });
      }
    }
  };

  const totalScheduled = sprintPools.reduce((sum, pool) => sum + pool.requirements.length, 0);
  const hardDeadlineReqs = unscheduled.filter(r => r.hardDeadline);
  const totalResourceUsed = sprintPools.reduce((sum, p) => sum + p.requirements.reduce((s, r) => s + r.effortDays, 0), 0);
  const totalResourceAvailable = sprintPools.reduce((sum, p) => sum + p.totalDays * (1 - (p.bugReserve + p.refactorReserve + p.otherReserve) / 100), 0);
  const notEvaluatedCount = unscheduled.filter(r => r.techProgress === '未评估').length;

  /**
   * 导入预览Modal组件
   * 显示导入数据预览和字段映射配置
   * 支持手动调整映射和AI辅助映射
   */
  const ImportPreviewModal = () => {
    if (!showImportModal || importData.length === 0) return null;

    const sampleRow = importData[0];
    const fileFields = Object.keys(sampleRow);

    // 系统字段选项
    const systemFieldOptions = [
      { value: '', label: '-- 不映射 --' },
      { value: 'name', label: '需求名称 *' },
      { value: 'submitterName', label: '提交人姓名' },
      { value: 'productManager', label: '产品经理' },
      { value: 'developer', label: '开发人员' },
      { value: 'effortDays', label: '工作量(天数)' },
      { value: 'bv', label: '业务价值' },
      { value: 'tc', label: '时间临界' },
      { value: 'hardDeadline', label: '强制截止' },
      { value: 'techProgress', label: '技术进展' },
      { value: 'productProgress', label: '产品进展' },
      { value: 'type', label: '需求类型' },
      { value: 'submitDate', label: '提交日期' },
      { value: 'submitter', label: '提交方' },
      { value: 'isRMS', label: '是否RMS' },
    ];

    // 检查是否所有必填字段都已映射
    const hasRequiredFields = Object.values(importMapping).length > 0 && importMapping.name;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* 标题栏 */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="text-white" size={24} />
              <h2 className="text-xl font-bold text-white">导入预览与字段映射</h2>
            </div>
            <button
              onClick={() => setShowImportModal(false)}
              className="text-white/80 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* 统计信息 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">检测到 {importData.length} 条记录</span>，
                共 {fileFields.length} 个字段。请配置字段映射关系后确认导入。
              </p>
            </div>

            {/* AI映射按钮 */}
            <div className="mb-6 flex items-center gap-3">
              <button
                onClick={handleAIMapping}
                disabled={isAIMappingLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center gap-2"
              >
                <Star size={16} />
                {isAIMappingLoading ? 'AI映射中...' : '使用AI智能映射'}
              </button>
              <span className="text-xs text-gray-500">AI会分析字段名称和示例数据，自动匹配最合适的系统字段</span>
            </div>

            {/* 字段映射配置 */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <ArrowUpDown size={18} />
                字段映射配置
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/3">Excel列名</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/4">示例数据</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/3">映射到系统字段</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fileFields.map((field, index) => {
                      // 找到当前文件字段映射到的系统字段
                      const mappedSystemField = Object.keys(importMapping).find(
                        key => importMapping[key] === field
                      ) || '';

                      return (
                        <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{field}</td>
                          <td className="px-4 py-3 text-gray-600 truncate max-w-xs">
                            {String(sampleRow[field])}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={mappedSystemField}
                              onChange={(e) => {
                                const newMapping = { ...importMapping };
                                // 移除旧映射
                                Object.keys(newMapping).forEach(key => {
                                  if (newMapping[key] === field) {
                                    delete newMapping[key];
                                  }
                                });
                                // 添加新映射
                                if (e.target.value) {
                                  newMapping[e.target.value] = field;
                                }
                                setImportMapping(newMapping);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                            >
                              {systemFieldOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 数据预览 */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">数据预览（前5条）</h3>
              <div className="border border-gray-200 rounded-lg overflow-auto max-h-60">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {fileFields.map(field => (
                        <th key={field} className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importData.slice(0, 5).map((row: any, index: number) => (
                      <tr key={index} className="border-t border-gray-200">
                        {fileFields.map(field => (
                          <td key={field} className="px-3 py-2 text-gray-600 whitespace-nowrap">
                            {String(row[field])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 警告提示 */}
            {!hasRequiredFields && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span className="font-semibold">注意：</span>
                  必须映射"需求名称"字段才能导入
                </p>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="clear-before-import"
                checked={clearBeforeImport}
                onChange={(e) => setClearBeforeImport(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
              />
              <label htmlFor="clear-before-import" className="text-sm text-gray-700 cursor-pointer">
                清空已有需求并导入全新数据
                {clearBeforeImport && (
                  <span className="ml-2 text-red-600 font-semibold">（警告：将删除所有现有需求！）</span>
                )}
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
              >
                取消
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={!hasRequiredFields}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg transition font-medium flex items-center gap-2"
              >
                <Save size={18} />
                确认导入 ({importData.length} 条)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* 标题区域 - 两行显示 */}
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">小米国际 WSJF-Lite Tools</h1>
              <p className="text-xs text-gray-400 mt-0.5">by Evan (tianyuan8@xiaomi.com)</p>
            </div>

            {/* 图例 - 左对齐 */}
            <div className="flex items-center gap-3 text-xs text-gray-300">
              {/* BV颜色图例 */}
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-100 to-blue-200" title="局部"></div>
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-400 to-blue-500" title="明显"></div>
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-600 to-blue-700" title="撬动核心"></div>
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-800 to-blue-900" title="战略平台"></div>
                </div>
                <span>业务价值</span>
              </div>

              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gradient-to-br from-red-600 to-red-900 rounded-sm"></div>
                <span>强DDL</span>
              </div>

              <div className="flex items-center gap-1">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                <span>权重</span>
              </div>
            </div>

            <button
              onClick={() => setShowHandbook(true)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
            >
              <HelpCircle size={14} />
              <span>说明书</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <UserIcon size={16} className="text-blue-400" />
                <span className="text-sm text-white">{currentUser.name}</span>
                <span className="text-xs text-gray-400">({currentUser.email})</span>
              </div>
            )}

            <button
              onClick={() => setCompact(!compact)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm font-medium"
            >
              {compact ? '宽松视图' : '紧凑视图'}
            </button>

            {/* 导入按钮 */}
            <button
              onClick={() => document.getElementById('file-import-input')?.click()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
            >
              <Upload size={16} />
              导入
            </button>
            <input
              id="file-import-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileImport}
              className="hidden"
            />

            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
              >
                <Download size={16} />
                导出
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                  <button
                    onClick={handleExportExcel}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition"
                  >
                    <FileSpreadsheet size={18} className="text-green-600" />
                    导出为 Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition"
                  >
                    <FileText size={18} className="text-red-600" />
                    导出为 PDF
                  </button>
                  <button
                    onClick={handleExportPNG}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition"
                  >
                    <ImageIcon size={18} className="text-blue-600" />
                    导出为图片
                  </button>
                </div>
              )}
            </div>

            {currentUser && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
              >
                <LogOut size={16} />
                退出
              </button>
            )}
          </div>
        </div>
      </div>

      {hardDeadlineReqs.length > 0 && (
        <div className="bg-red-500 border-b border-red-600 px-6 py-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-white">
            <AlertCircle size={20} />
            <span className="font-medium">
              {hardDeadlineReqs.length} 个强制DDL需求未排期
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div onDragEnter={() => handleDragEnter('unscheduled')} onDragLeave={handleDragLeave} className="flex-shrink-0">
          <UnscheduledArea
            unscheduled={unscheduled}
            onRequirementClick={(req) => {
              setEditingReq(req);
              setIsNewReq(false);
            }}
            onDrop={() => handleDrop('unscheduled')}
            isDragOver={dragOverPool === 'unscheduled'}
            onAddNew={() => {
              setEditingReq(null);
              setIsNewReq(true);
            }}
            compact={compact}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterType={filterType}
            onFilterChange={setFilterType}
            scoreFilter={scoreFilter}
            onScoreFilterChange={setScoreFilter}
            effortFilter={effortFilter}
            onEffortFilterChange={setEffortFilter}
            bvFilter={bvFilter}
            onBVFilterChange={setBVFilter}
            businessDomainFilter={businessDomainFilter}
            onBusinessDomainFilterChange={setBusinessDomainFilter}
            rmsFilter={rmsFilter}
            onRMSFilterChange={setRMSFilter}
            leftPanelWidth={leftPanelWidth}
            onClearAll={() => {
              setRequirements([]);
              setUnscheduled([]);
              setSprintPools(prev => prev.map(pool => ({ ...pool, requirements: [] })));
            }}
          />
        </div>

        {/* 拖动条 */}
        <div
          className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0 h-full"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = leftPanelWidth;

            const handleMouseMove = (e: MouseEvent) => {
              const diff = e.clientX - startX;
              const newWidth = Math.max(300, Math.min(1400, startWidth + diff));
              setLeftPanelWidth(newWidth);
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />

        <div className="flex-1 p-3 overflow-x-auto overflow-y-hidden bg-gray-100">
          <div className="flex items-stretch min-w-min h-full">
            {sprintPools.map((pool) => (
              <React.Fragment key={pool.id}>
                <div
                  onDragEnter={() => handleDragEnter(pool.id)}
                  onDragLeave={handleDragLeave}
                  className="h-full flex-shrink-0"
                  style={{ width: `${poolWidths[pool.id] || 384}px` }}
                >
                  <SprintPoolComponent
                    pool={pool}
                    onRequirementClick={(req) => {
                      setEditingReq(req);
                      setIsNewReq(false);
                    }}
                    onDrop={(poolId) => handleDrop(poolId)}
                    isDragOver={dragOverPool === pool.id}
                    onEdit={() => setEditingSprint(pool)}
                    onDelete={() => handleDeleteSprint(pool.id)}
                    compact={compact}
                  />
                </div>

                {/* 拖动条 - 每个池右侧都有 */}
                <div
                  className="w-1 mx-3 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0 h-full"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const startX = e.clientX;
                    const startWidth = poolWidths[pool.id] || 384;

                    const handleMouseMove = (e: MouseEvent) => {
                      const diff = e.clientX - startX;
                      const newWidth = Math.max(300, Math.min(800, startWidth + diff));
                      setPoolWidths(prev => ({ ...prev, [pool.id]: newWidth }));
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                />
              </React.Fragment>
            ))}

            {/* 新增迭代池按钮 */}
            <div className="flex-shrink-0 w-96 h-full">
              <button
                onClick={handleAddSprint}
                className="w-full h-full bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-teal-600"
              >
                <Plus size={48} className="opacity-50" />
                <span className="text-lg font-medium">新增迭代池</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 px-6 py-3 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex gap-6">
            <span>总需求 <strong className="text-gray-900">{requirements.length}</strong></span>
            <span>已排期 <strong className="text-gray-900">{totalScheduled}</strong></span>
            <span>未排期 <strong className="text-gray-900">{unscheduled.length}</strong></span>
            <span>未评估 <strong className="text-red-600">{notEvaluatedCount}</strong></span>
          </div>
          <div className="flex gap-6">
            <span>强DDL <strong className="text-red-600">{requirements.filter(r => r.hardDeadline).length}</strong></span>
            <span>资源使用 <strong className="text-gray-900">{totalResourceUsed}/{Math.round(totalResourceAvailable)}</strong> ({Math.round(totalResourceUsed / totalResourceAvailable * 100)}%)</span>
          </div>
        </div>
      </div>

      {(editingReq || isNewReq) && (
        <EditRequirementModal 
          requirement={editingReq}
          onSave={handleSaveRequirement}
          onClose={() => {
            setEditingReq(null);
            setIsNewReq(false);
          }}
          isNew={isNewReq}
        />
      )}

      {editingSprint && (
        <EditSprintModal 
          sprint={editingSprint}
          onSave={handleSaveSprint}
          onClose={() => setEditingSprint(null)}
        />
      )}

      {showLogin && (
        <LoginModal onLogin={handleLogin} />
      )}

      {showHandbook && (
        <HandbookModal onClose={() => setShowHandbook(false)} />
      )}

      {/* 导入预览Modal */}
      <ImportPreviewModal />
    </div>
  );
}