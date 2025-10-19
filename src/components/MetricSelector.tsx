/**
 * WSJF Sprint Planner - 指标选择器组件
 *
 * v1.3.2: 简化交互为始终可见的紧凑列表
 *
 * 功能：
 * - 始终可见的指标列表，无需展开按钮
 * - 分类折叠展示OKR指标和过程指标
 * - 每个指标一行：checkbox + 名称 + 影响值输入框
 * - 选中checkbox后影响值输入框自动启用
 * - 与表单其他部分（业务团队、地区等）风格统一
 */

import { useState } from 'react';
import { Target, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import type { MetricDefinition, AffectedMetric } from '../types';

interface MetricSelectorProps {
  /** 当前选中的指标列表 */
  value: AffectedMetric[];

  /** 指标改变回调 */
  onChange: (metrics: AffectedMetric[]) => void;

  /** 可选的OKR指标列表 */
  okrMetrics: MetricDefinition[];

  /** 可选的过程指标列表 */
  processMetrics: MetricDefinition[];

  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 指标选择器组件（v1.3.2 - 简化版）
 */
const MetricSelector = ({
  value,
  onChange,
  okrMetrics,
  processMetrics,
  disabled = false
}: MetricSelectorProps) => {
  const [isOKRExpanded, setIsOKRExpanded] = useState(true);
  const [isProcessExpanded, setIsProcessExpanded] = useState(true);

  /**
   * 检查指标是否已选中
   */
  const isMetricSelected = (metricKey: string): boolean => {
    return value.some(m => m.metricKey === metricKey);
  };

  /**
   * 获取已选指标的影响值
   */
  const getMetricImpact = (metricKey: string): string => {
    const metric = value.find(m => m.metricKey === metricKey);
    return metric?.estimatedImpact || '';
  };

  /**
   * 切换指标选中状态
   */
  const toggleMetric = (metric: MetricDefinition, checked: boolean) => {
    if (checked) {
      // 选中：添加到列表
      const newMetric: AffectedMetric = {
        metricKey: metric.key,
        metricName: metric.defaultName,
        displayName: metric.defaultName,
        estimatedImpact: '',
        category: metric.type
      };
      onChange([...value, newMetric]);
    } else {
      // 取消选中：从列表中移除
      onChange(value.filter(m => m.metricKey !== metric.key));
    }
  };

  /**
   * 更新指标的预估影响
   */
  const updateEstimatedImpact = (metricKey: string, estimatedImpact: string) => {
    onChange(
      value.map(m =>
        m.metricKey === metricKey ? { ...m, estimatedImpact } : m
      )
    );
  };

  /**
   * 按类别分组指标
   */
  const groupByCategory = (metrics: MetricDefinition[]): Record<string, MetricDefinition[]> => {
    const groups: Record<string, MetricDefinition[]> = {};
    metrics.forEach(metric => {
      if (!groups[metric.category]) {
        groups[metric.category] = [];
      }
      groups[metric.category].push(metric);
    });
    return groups;
  };

  const okrGroups = groupByCategory(okrMetrics);
  const processGroups = groupByCategory(processMetrics);

  /**
   * 渲染指标行
   */
  const renderMetricRow = (metric: MetricDefinition) => {
    const isSelected = isMetricSelected(metric.key);
    const impact = getMetricImpact(metric.key);
    const isOKR = metric.type === 'okr';

    return (
      <div key={metric.key} className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 rounded transition">
        <label className="flex items-center gap-1.5 flex-1 cursor-pointer min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => toggleMetric(metric, e.target.checked)}
            disabled={disabled}
            className={`w-4 h-4 rounded border-gray-300 focus:ring-2 flex-shrink-0 ${
              isOKR ? 'text-blue-600 focus:ring-blue-500' : 'text-purple-600 focus:ring-purple-500'
            }`}
          />
          <span className="text-xs font-medium text-gray-900 truncate" title={metric.defaultName}>
            {metric.defaultName}
          </span>
        </label>
        <div className="flex-shrink-0 w-32">
          <input
            type="text"
            value={impact}
            onChange={(e) => updateEstimatedImpact(metric.key, e.target.value)}
            disabled={!isSelected || disabled}
            placeholder={isSelected ? "如: +5%" : "影响值"}
            className={`w-full px-2 py-1 text-xs border rounded focus:ring-2 transition ${
              isSelected
                ? `border-gray-300 ${isOKR ? 'focus:ring-blue-500' : 'focus:ring-purple-500'}`
                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 统计摘要 */}
      {value.length > 0 && (
        <div className="text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
          已选择 <span className="font-semibold text-blue-700">{value.length}</span> 个指标
          {value.filter(m => m.estimatedImpact).length > 0 && (
            <span className="text-gray-600">
              ，其中 {value.filter(m => m.estimatedImpact).length} 个已填写影响值
            </span>
          )}
        </div>
      )}

      {/* OKR指标区域 - 主要指标，视觉更突出 */}
      <div className="border-2 border-blue-300 rounded-lg overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setIsOKRExpanded(!isOKRExpanded)}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150 transition flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Target size={20} className="text-blue-600" />
            <span className="font-bold text-gray-900 text-base">核心OKR指标</span>
            <span className="text-xs text-blue-700 bg-blue-200 px-2 py-0.5 rounded-full font-medium">重点关注</span>
          </div>
          {isOKRExpanded ? <ChevronDown size={20} className="text-blue-700" /> : <ChevronRight size={20} className="text-blue-700" />}
        </button>

        {isOKRExpanded && (
          <div className="bg-white">
            {Object.keys(okrGroups).length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                暂无OKR指标
              </div>
            ) : (
              Object.entries(okrGroups).map(([category, metrics]) => (
                <div key={category} className="border-t border-blue-100 first:border-t-0">
                  <div className="px-4 py-2 bg-blue-50">
                    <div className="text-sm font-semibold text-blue-800 border-l-4 border-blue-500 pl-2">
                      {category}
                    </div>
                  </div>
                  <div className="px-2 py-1 grid grid-cols-2 gap-x-4">
                    {metrics.map(renderMetricRow)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 过程指标区域 - 次要指标，视觉相对低调 */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setIsProcessExpanded(!isProcessExpanded)}
          className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-gray-600" />
            <span className="font-medium text-gray-800 text-sm">过程指标</span>
            <span className="text-xs text-gray-500">（改善运营效率和体验）</span>
          </div>
          {isProcessExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
        </button>

        {isProcessExpanded && (
          <div className="bg-white">
            {Object.keys(processGroups).length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                暂无过程指标
              </div>
            ) : (
              Object.entries(processGroups).map(([category, metrics]) => (
                <div key={category} className="border-t border-gray-100 first:border-t-0">
                  <div className="px-4 py-1.5 bg-gray-50">
                    <div className="text-xs font-medium text-gray-700 border-l-3 border-gray-400 pl-2">
                      {category}
                    </div>
                  </div>
                  <div className="px-2 py-1 grid grid-cols-2 gap-x-4">
                    {metrics.map(renderMetricRow)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 帮助提示 */}
      {value.length === 0 && (
        <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          💡 选择该需求会影响的核心OKR指标或过程指标，并填写预估影响值（如: +5%, 明显提升, 减少50%等）
        </div>
      )}
    </div>
  );
};

export default MetricSelector;
