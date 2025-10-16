import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, X, Save, Edit2, Plus, Search, Filter, Star, Info, HelpCircle, Download, FileSpreadsheet, FileText, Image as ImageIcon, LogOut, User as UserIcon, ChevronDown, ChevronUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as storage from './storage';

// 类型定义
interface Requirement {
  id: string;
  name: string;
  businessOwner: string;
  productManager: string;
  productProgress: string;
  effortDays: number;
  bv: string;
  tc: string;
  hardDeadline: boolean;
  deadlineDate?: string;
  techProgress: string;
  dependencies?: string[];
  type: string;
  rawScore?: number;
  displayScore?: number;
  stars?: number;
}

interface SprintPool {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  bugReserve: number;
  refactorReserve: number;
  otherReserve: number;
  requirements: Requirement[];
}

interface User {
  name: string;
  email: string;
}

// 计算WSJF分数
const calculateScores = (requirements: Requirement[]) => {
  const BV_MAP: Record<string, number> = { '局部': 3, '明显': 6, '撬动核心': 8, '战略平台': 10 };
  const TC_MAP: Record<string, number> = { '随时': 0, '三月窗口': 3, '一月硬窗口': 5 };
  
  const getWorkloadScore = (days: number) => {
    if (days <= 5) return 6;
    if (days <= 15) return 4;
    if (days <= 30) return 2;
    return 0;
  };

  const withRawScores = requirements.map(req => {
    const bvScore = BV_MAP[req.bv] || 3;
    const tcScore = TC_MAP[req.tc] || 0;
    const ddlScore = req.hardDeadline ? 5 : 0;
    const wlScore = getWorkloadScore(req.effortDays);
    const rawScore = bvScore + tcScore + ddlScore + wlScore;
    return { ...req, rawScore };
  });

  const rawScores = withRawScores.map(r => r.rawScore!);
  const minRaw = Math.min(...rawScores);
  const maxRaw = Math.max(...rawScores);
  
  return withRawScores.map(req => {
    let displayScore = 60;
    if (maxRaw !== minRaw) {
      displayScore = Math.round(10 + 90 * (req.rawScore! - minRaw) / (maxRaw - minRaw));
    }
    
    let stars = 2;
    if (displayScore >= 85) stars = 5;
    else if (displayScore >= 70) stars = 4;
    else if (displayScore >= 55) stars = 3;
    
    return { ...req, displayScore, stars };
  });
};

// 卡片组件
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
  const [showHover, setShowHover] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top');
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const cardRef = React.useRef<HTMLDivElement>(null);
  const displayScore = requirement.displayScore || 60;
  const stars = requirement.stars || 2;

  // 大幅增大尺寸差异，让工作量非常直观
  const width = compact ?
    (requirement.effortDays <= 5 ? 90 : requirement.effortDays <= 15 ? 140 : requirement.effortDays <= 30 ? 190 : 240) :
    (requirement.effortDays <= 5 ? 110 : requirement.effortDays <= 15 ? 170 : requirement.effortDays <= 30 ? 230 : 290);

  const height = compact ?
    (requirement.effortDays <= 5 ? 75 : requirement.effortDays <= 15 ? 95 : requirement.effortDays <= 30 ? 115 : 135) :
    (requirement.effortDays <= 5 ? 95 : requirement.effortDays <= 15 ? 120 : requirement.effortDays <= 30 ? 145 : 170);
  
  const getColor = (bv: string, hardDeadline: boolean) => {
    if (hardDeadline) {
      return 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)';
    }
    const gradients: Record<string, string> = {
      '局部': 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
      '明显': 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
      '撬动核心': 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
      '战略平台': 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)'
    };
    return gradients[bv] || gradients['明显'];
  };

  const bgGradient = getColor(requirement.bv, requirement.hardDeadline);
  const isLight = requirement.bv === '局部' && !requirement.hardDeadline;
  const textColor = isLight ? 'text-gray-800' : 'text-white';
  
  const getBVLabel = (bv: string) => {
    const labels: Record<string, string> = {
      '局部': '局部体验优化',
      '明显': '明显改善',
      '撬动核心': '撬动核心指标',
      '战略平台': '战略/平台级'
    };
    return labels[bv] || bv;
  };

  const getTCLabel = (tc: string) => {
    const labels: Record<string, string> = {
      '随时': '随时可做',
      '三月窗口': '三个月内',
      '一月硬窗口': '一个月内'
    };
    return labels[tc] || tc;
  };

  const handleMouseEnter = () => {
    setShowHover(true);
    // 检测卡片位置，决定 tooltip 显示在上方还是下方
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;

      // 使用fixed定位，计算tooltip的绝对位置
      const position = spaceAbove < 250 ? 'bottom' : 'top';
      setTooltipPosition(position);

      const tooltipWidth = 200; // 最小宽度
      const style: React.CSSProperties = {
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
        minWidth: `${tooltipWidth}px`
      };

      if (position === 'top') {
        style.bottom = window.innerHeight - rect.top + 8;
      } else {
        style.top = rect.bottom + 8;
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
        <div className={`p-2 pointer-events-none flex-1 flex flex-col justify-between ${compact ? 'text-xs' : 'text-sm'}`}>
          <div>
            <div className={`font-semibold ${textColor} leading-tight line-clamp-2`}>
              {requirement.name}
            </div>
            <div className={`${textColor} opacity-75 mt-1 ${compact ? 'text-[10px]' : 'text-xs'}`}>
              {requirement.effortDays}天
            </div>
          </div>
        </div>

        <div className={`${isLight ? 'bg-white/40' : 'bg-black/20'} backdrop-blur-sm p-2 rounded-b-lg`}>
          <div className="flex items-center justify-between pointer-events-none">
            <div className={`font-bold ${textColor} ${compact ? 'text-xl' : 'text-2xl'}`}>
              {displayScore}
            </div>
            <div className="flex gap-0.5">
              {[...Array(stars)].map((_, i) => (
                <Star key={i} size={compact ? 8 : 10} className={`fill-current ${textColor}`} />
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
      </div>

      {showTooltip && showHover && (
        <div
          className="fixed z-[9999] bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3 whitespace-nowrap pointer-events-none"
          style={tooltipStyle}
        >
          <div className="space-y-1">
            <div className="font-semibold border-b border-white/20 pb-1 mb-1">{requirement.name}</div>
            <div>业务价值: <span className="font-semibold">{getBVLabel(requirement.bv)}</span></div>
            <div>时间临界: <span className="font-semibold">{getTCLabel(requirement.tc)}</span></div>
            <div>工作量: <span className="font-semibold">{requirement.effortDays}天</span></div>
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

// 说明书弹窗 - 使用完整内容
const HandbookModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
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

          <h4 className="font-semibold mt-3 mb-2">时间临界度（TC, Time Criticality）—三选一</h4>
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
            <li><strong>TC</strong>（Time Criticality）：时间临界度。</li>
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

// 登录/注册弹窗
const LoginModal = ({ onLogin }: { onLogin: (user: storage.User) => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) {
      setError('请填写姓名和邮箱');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    const user = storage.loginUser(name.trim(), email.trim());
    onLogin(user);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[580px] p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">欢迎使用小米国际WSJF-Lite排期系统</h2>
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
      </div>
    </div>
  );
};

// 编辑需求弹窗
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
  const [form, setForm] = useState<Requirement>(requirement || {
    id: `REQ-${Date.now()}`,
    name: '',
    businessOwner: '',
    productManager: '',
    productProgress: '未评估',
    effortDays: 5,
    bv: '明显',
    tc: '随时',
    hardDeadline: false,
    techProgress: '未评估',
    type: '功能开发'
  });

  const previewScore = useMemo(() => {
    const BV_MAP: Record<string, number> = { '局部': 3, '明显': 6, '撬动核心': 8, '战略平台': 10 };
    const TC_MAP: Record<string, number> = { '随时': 0, '三月窗口': 3, '一月硬窗口': 5 };
    const getWL = (d: number) => d <= 5 ? 6 : d <= 15 ? 4 : d <= 30 ? 2 : 0;
    
    const raw = (BV_MAP[form.bv] || 3) + (TC_MAP[form.tc] || 0) + (form.hardDeadline ? 5 : 0) + getWL(form.effortDays);
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[750px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 p-5 border-b border-gray-200 bg-gray-900 text-white rounded-t-xl flex items-center justify-between z-10">
          <h3 className="text-xl font-semibold">{isNew ? '新增需求' : '编辑需求'}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">需求名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  placeholder="输入需求名称"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">业务负责人</label>
                  <input
                    type="text"
                    value={form.businessOwner}
                    onChange={(e) => setForm({...form, businessOwner: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">产品经理</label>
                  <input
                    type="text"
                    value={form.productManager}
                    onChange={(e) => setForm({...form, productManager: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-3">业务评估</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">业务价值</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">时间临界度</label>
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
                
                <div className="flex justify-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <RequirementCard requirement={previewReq} showTooltip={false} />
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border-2 border-teal-300 rounded-lg p-4">
                  <div className="text-sm font-medium text-teal-900 mb-2">热度分</div>
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

// 编辑迭代弹窗
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
  const totalReserve = form.bugReserve + form.refactorReserve + form.otherReserve;
  const reservedDays = Math.round(form.totalDays * totalReserve / 100);
  const netAvailable = form.totalDays - reservedDays;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[500px]" onClick={e => e.stopPropagation()}>
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

// 资源池组件
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
  const totalReserve = pool.bugReserve + pool.refactorReserve + pool.otherReserve;
  const reservedDays = Math.round(pool.totalDays * totalReserve / 100);
  const netAvailable = pool.totalDays - reservedDays;
  const usedDays = pool.requirements.reduce((sum, req) => sum + req.effortDays, 0);
  const percentage = Math.round((usedDays / netAvailable) * 100);
  const totalValue = pool.requirements.reduce((sum, req) => sum + (req.displayScore || 0), 0);

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
      className={`flex-shrink-0 w-96 h-full bg-white rounded-xl border transition-all flex flex-col ${
        isDragOver ? 'border-teal-500 bg-teal-50/50 shadow-xl' : 'border-gray-200 shadow-sm'
      } ${percentage >= 100 ? 'ring-2 ring-red-500' : percentage >= 90 ? 'ring-2 ring-amber-400' : ''}`}
    >
      <div className="flex-shrink-0 p-3 border-b border-gray-200 bg-gray-900 text-white rounded-t-xl">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{pool.name}</h3>
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
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-300">{usedDays}/{netAvailable}人日</span>
            <span className={`font-semibold ${percentage >= 100 ? 'text-red-400' : percentage >= 90 ? 'text-amber-400' : 'text-teal-400'}`}>
              {percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                percentage >= 100 ? 'bg-red-500' : 
                percentage >= 90 ? 'bg-amber-500' : 
                'bg-teal-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-300 bg-white/5 rounded-lg p-2">
          <div className="space-y-0.5">
            <div className="text-red-300">不可用: {reservedDays}人日 (Bug {pool.bugReserve}% · 重构 {pool.refactorReserve}% · 其他 {pool.otherReserve}%)</div>
            <div className="font-semibold text-white border-t border-white/20 pt-0.5">净可用: {netAvailable}人日</div>
          </div>
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
          <span className="text-gray-600">总热度 <span className="font-semibold text-gray-900">{Math.round(totalValue)}</span></span>
        </div>
      </div>
    </div>
  );
};

// 待排期区组件
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
  onBVFilterChange
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
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop();
  };

  const filteredReqs = unscheduled.filter(req => {
    const matchesSearch = req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.businessOwner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || req.type === filterType;
    
    let matchesScore = true;
    if (scoreFilter === 'high') matchesScore = (req.displayScore || 0) >= 70;
    else if (scoreFilter === 'medium') matchesScore = (req.displayScore || 0) >= 40 && (req.displayScore || 0) < 70;
    else if (scoreFilter === 'low') matchesScore = (req.displayScore || 0) < 40;
    
    let matchesEffort = true;
    if (effortFilter === 'tiny') matchesEffort = req.effortDays <= 3;
    else if (effortFilter === 'small') matchesEffort = req.effortDays >= 4 && req.effortDays <= 10;
    else if (effortFilter === 'medium') matchesEffort = req.effortDays >= 11 && req.effortDays <= 30;
    else if (effortFilter === 'large') matchesEffort = req.effortDays >= 31 && req.effortDays <= 60;
    else if (effortFilter === 'xlarge') matchesEffort = req.effortDays >= 61 && req.effortDays <= 100;
    else if (effortFilter === 'huge') matchesEffort = req.effortDays > 100;
    
    const matchesBV = bvFilter === 'all' || req.bv === bvFilter;
    
    return matchesSearch && matchesType && matchesScore && matchesEffort && matchesBV;
  });

  const readyReqs = filteredReqs.filter(r => r.techProgress === '已评估工作量' || r.techProgress === '已完成技术方案');
  const notReadyReqs = filteredReqs.filter(r => r.techProgress === '未评估');

  return (
    <div className="w-[480px] bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="flex-shrink-0 p-3 border-b border-gray-200 bg-gray-900 text-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold">待排期区</h2>
          <button
            onClick={onAddNew}
            className="text-white hover:bg-white/10 rounded-lg p-1.5 transition"
          >
            <Plus size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-300 mb-2">按热度分排序</p>

        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="搜索需求..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:bg-white/20 focus:border-white/40 transition text-xs"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-2 py-1.5 mb-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-xs transition"
        >
          <div className="flex items-center gap-1.5">
            <Filter size={12} />
            <span>筛选条件</span>
          </div>
          {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

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
            <option value="all" className="bg-gray-800 text-white">全部热度</option>
            <option value="high" className="bg-gray-800 text-white">高热度 (≥70)</option>
            <option value="medium" className="bg-gray-800 text-white">中热度 (40-69)</option>
            <option value="low" className="bg-gray-800 text-white">低热度 (&lt;40)</option>
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

        <div className="mt-2 bg-white/10 rounded-lg px-2.5 py-1.5 text-xs space-y-0.5">
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
        className={`flex-1 overflow-y-auto transition-all ${
          isDragOver ? 'bg-teal-50' : ''
        }`}
      >
        {/* 可排期区 */}
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
      </div>
    </div>
  );
};

// 生成示例数据 - 基于专卖系统开发影响其他功能上线评估
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

    return {
      id: `ZM-${String(i + 1).padStart(3, '0')}`,
      name: item.name,
      businessOwner: item.owner,
      productManager: item.pm,
      productProgress: item.status === 'doing' ? '已出PRD' : '已评估',
      effortDays: item.days,
      bv: bvMapping[item.importance] || '明显',
      tc: isUrgent ? '一月硬窗口' : (hasDeadline ? '三月窗口' : '随时'),
      hardDeadline: isUrgent,
      deadlineDate: item.deadline,
      techProgress: '已评估工作量',
      type: '功能开发'
    };
  });
};

// 主应用
export default function WSJFPlanner() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [sprintPools, setSprintPools] = useState<SprintPool[]>([]);
  const [unscheduled, setUnscheduled] = useState<Requirement[]>([]);
  const [dragOverPool, setDragOverPool] = useState<string | null>(null);
  const [editingReq, setEditingReq] = useState<Requirement | null>(null);
  const [editingSprint, setEditingSprint] = useState<SprintPool | null>(null);
  const [isNewReq, setIsNewReq] = useState(false);
  const [compact, setCompact] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [effortFilter, setEffortFilter] = useState('all');
  const [bvFilter, setBVFilter] = useState('all');
  const [showHandbook, setShowHandbook] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

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
      recalculateScores(newReqs);
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

  const handleExportExcel = () => {
    const exportData: any[] = [];

    sprintPools.forEach(pool => {
      pool.requirements.forEach(req => {
        exportData.push({
          '迭代池': pool.name,
          '需求名称': req.name,
          '负责人': req.businessOwner,
          '产品经理': req.productManager,
          '类型': req.type,
          '工作量(天)': req.effortDays,
          '业务价值': req.bv,
          '时间临界': req.tc,
          '强制DDL': req.hardDeadline ? '是' : '否',
          '热度分': req.displayScore || 0,
          '星级': '★'.repeat(req.stars || 0),
          '技术评估': req.techProgress
        });
      });
    });

    unscheduled.forEach(req => {
      exportData.push({
        '迭代池': '未排期',
        '需求名称': req.name,
        '负责人': req.businessOwner,
        '产品经理': req.productManager,
        '类型': req.type,
        '工作量(天)': req.effortDays,
        '业务价值': req.bv,
        '时间临界': req.tc,
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
      const targetPool = sprintPools.find(p => p.id === targetPoolId);
      if (!targetPool) return;

      const totalReserve = targetPool.bugReserve + targetPool.refactorReserve + targetPool.otherReserve;
      const netAvailable = targetPool.totalDays * (1 - totalReserve / 100);
      const usedDays = targetPool.requirements.reduce((sum, req) => sum + req.effortDays, 0);
      
      if (usedDays + requirement.effortDays > netAvailable) {
        alert(`资源不足！超出 ${Math.round(usedDays + requirement.effortDays - netAvailable)} 人日`);
        return;
      }

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

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white">小米国际WSJF-Lite迭代排期小工具 - by Evan（tianyuan8@xiaomi.com）</h1>
            
            {/* 图例 */}
            <div className="flex items-center gap-4 text-xs text-gray-300 border-l border-gray-700 pl-4">
              {/* BV颜色图例 */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
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
                <span>热度星级</span>
              </div>
            </div>

            <button
              onClick={() => setShowHandbook(true)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
            >
              <HelpCircle size={14} />
              <span>查看说明书</span>
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

      <div className="flex-1 flex overflow-hidden justify-center">
        <div onDragEnter={() => handleDragEnter('unscheduled')} onDragLeave={handleDragLeave} className="h-full flex-shrink-0">
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
          />
        </div>

        <div className="flex-1 p-6 overflow-x-auto overflow-y-hidden bg-gray-100">
          <div className="flex gap-4 items-stretch min-w-min h-full">
            {sprintPools.map(pool => (
              <div
                key={pool.id}
                onDragEnter={() => handleDragEnter(pool.id)}
                onDragLeave={handleDragLeave}
                className="h-full"
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
    </div>
  );
}