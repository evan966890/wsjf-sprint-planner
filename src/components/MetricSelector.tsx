/**
 * WSJF Sprint Planner - 指标选择器组件
 *
 * v1.2.0: 支持选择影响的业务指标
 *
 * 功能：
 * - 分类展示OKR指标和过程指标
 * - 支持多选
 * - 支持自定义指标名称（团队内部称呼）
 * - 支持填写预估影响值
 * - 支持搜索和筛选
 */

import { useState } from 'react';
import { Plus, X, Target, Activity, Edit2, Check } from 'lucide-react';
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
 * 指标选择器组件
 *
 * 允许用户选择需求影响的业务指标，并填写自定义名称和预估影响
 */
const MetricSelector = ({
  value,
  onChange,
  okrMetrics,
  processMetrics,
  disabled = false
}: MetricSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMetricKey, setEditingMetricKey] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'okr' | 'process'>('all');

  /**
   * 检查指标是否已选中
   */
  const isMetricSelected = (metricKey: string): boolean => {
    return value.some(m => m.metricKey === metricKey);
  };

  /**
   * 切换指标选中状态
   */
  const toggleMetric = (metric: MetricDefinition) => {
    if (isMetricSelected(metric.key)) {
      // 取消选中：从列表中移除
      onChange(value.filter(m => m.metricKey !== metric.key));
    } else {
      // 选中：添加到列表
      const newMetric: AffectedMetric = {
        metricKey: metric.key,
        metricName: metric.defaultName,
        displayName: metric.defaultName,
        estimatedImpact: '',
        category: metric.type
      };
      onChange([...value, newMetric]);
    }
  };

  /**
   * 更新指标的自定义名称
   */
  const updateCustomName = (metricKey: string, customName: string) => {
    onChange(
      value.map(m =>
        m.metricKey === metricKey
          ? { ...m, customName, displayName: customName || m.metricName }
          : m
      )
    );
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
   * 过滤指标列表
   */
  const filterMetrics = (metrics: MetricDefinition[]): MetricDefinition[] => {
    return metrics.filter(metric => {
      const matchesSearch =
        searchTerm === '' ||
        metric.defaultName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        metric.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (metric.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        filterType === 'all' || metric.type === filterType;

      return matchesSearch && matchesType;
    });
  };

  const filteredOKRMetrics = filterMetrics(okrMetrics);
  const filteredProcessMetrics = filterMetrics(processMetrics);

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

  const okrGroups = groupByCategory(filteredOKRMetrics);
  const processGroups = groupByCategory(filteredProcessMetrics);

  return (
    <div className="space-y-3">
      {/* 已选指标列表 */}
      {value.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            已选择 {value.length} 个指标
          </div>

          <div className="space-y-2">
            {value.map((metric) => {
              const isEditing = editingMetricKey === metric.metricKey;

              return (
                <div
                  key={metric.metricKey}
                  className={`
                    border-2 rounded-lg p-3 transition-all
                    ${metric.category === 'okr' ? 'border-blue-200 bg-blue-50' : 'border-purple-200 bg-purple-50'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* 类型徽章 */}
                    <div className={`
                      flex-shrink-0 px-2 py-1 rounded text-xs font-medium
                      ${metric.category === 'okr' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'}
                    `}>
                      {metric.category === 'okr' ? 'OKR' : '过程'}
                    </div>

                    {/* 指标信息 */}
                    <div className="flex-1 min-w-0">
                      {/* 指标名称 */}
                      <div className="mb-2">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {metric.metricName}
                        </div>

                        {/* 自定义名称输入 */}
                        {!isEditing ? (
                          <button
                            type="button"
                            onClick={() => setEditingMetricKey(metric.metricKey)}
                            disabled={disabled}
                            className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
                          >
                            <Edit2 size={12} />
                            {metric.customName ? (
                              <span>团队称呼: <span className="font-medium">{metric.customName}</span></span>
                            ) : (
                              <span>添加团队内部称呼（可选）</span>
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              placeholder="例如：GMV、月活、NPS等"
                              value={metric.customName || ''}
                              onChange={(e) => updateCustomName(metric.metricKey, e.target.value)}
                              disabled={disabled}
                              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => setEditingMetricKey(null)}
                              className="text-green-600 hover:text-green-700 p-1"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 预估影响输入 */}
                      <input
                        type="text"
                        placeholder="预估影响（例如：+5%、明显提升、减少50%等）"
                        value={metric.estimatedImpact}
                        onChange={(e) => updateEstimatedImpact(metric.metricKey, e.target.value)}
                        disabled={disabled}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* 删除按钮 */}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => onChange(value.filter(m => m.metricKey !== metric.metricKey))}
                        className="flex-shrink-0 text-gray-400 hover:text-red-600 transition p-1"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 添加指标按钮 */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 border-2 border-dashed rounded-lg transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300' : 'hover:border-blue-500 hover:bg-blue-50 border-gray-300'}
        `}
      >
        <div className="flex items-center justify-center gap-2 text-gray-700">
          <Plus size={18} />
          <span className="font-medium">添加影响的指标</span>
        </div>
      </button>

      {/* 指标选择器展开区域 */}
      {isExpanded && !disabled && (
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-white shadow-lg">
          {/* 搜索和筛选 */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="搜索指标..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部</option>
              <option value="okr">OKR指标</option>
              <option value="process">过程指标</option>
            </select>
          </div>

          {/* OKR指标 */}
          {(filterType === 'all' || filterType === 'okr') && Object.keys(okrGroups).length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Target size={18} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900">核心OKR指标</h3>
                <span className="text-xs text-gray-500">（直接影响公司核心目标）</span>
              </div>

              {Object.entries(okrGroups).map(([category, metrics]) => (
                <div key={category} className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2 pl-2 border-l-4 border-blue-500">
                    {category}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {metrics.map((metric) => {
                      const isSelected = isMetricSelected(metric.key);

                      return (
                        <button
                          key={metric.key}
                          type="button"
                          onClick={() => toggleMetric(metric)}
                          className={`
                            px-3 py-2 rounded-lg text-left transition-all text-sm
                            ${
                              isSelected
                                ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                                : 'bg-gray-50 text-gray-900 hover:bg-blue-50 border border-gray-200'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`
                              w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                              ${isSelected ? 'bg-white border-white' : 'bg-white border-gray-300'}
                            `}>
                              {isSelected && <Check size={12} className="text-blue-600" />}
                            </div>
                            <span className="font-medium">{metric.defaultName}</span>
                          </div>
                          {metric.description && (
                            <div className={`text-xs mt-1 ml-6 ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                              {metric.description}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 过程指标 */}
          {(filterType === 'all' || filterType === 'process') && Object.keys(processGroups).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity size={18} className="text-purple-600" />
                <h3 className="font-semibold text-gray-900">过程指标</h3>
                <span className="text-xs text-gray-500">（改善运营效率和体验）</span>
              </div>

              {Object.entries(processGroups).map(([category, metrics]) => (
                <div key={category} className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2 pl-2 border-l-4 border-purple-500">
                    {category}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {metrics.map((metric) => {
                      const isSelected = isMetricSelected(metric.key);

                      return (
                        <button
                          key={metric.key}
                          type="button"
                          onClick={() => toggleMetric(metric)}
                          className={`
                            px-3 py-2 rounded-lg text-left transition-all text-sm
                            ${
                              isSelected
                                ? 'bg-purple-500 text-white ring-2 ring-purple-300'
                                : 'bg-gray-50 text-gray-900 hover:bg-purple-50 border border-gray-200'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`
                              w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                              ${isSelected ? 'bg-white border-white' : 'bg-white border-gray-300'}
                            `}>
                              {isSelected && <Check size={12} className="text-purple-600" />}
                            </div>
                            <span className="font-medium">{metric.defaultName}</span>
                          </div>
                          {metric.description && (
                            <div className={`text-xs mt-1 ml-6 ${isSelected ? 'text-purple-100' : 'text-gray-600'}`}>
                              {metric.description}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 无结果提示 */}
          {filteredOKRMetrics.length === 0 && filteredProcessMetrics.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Activity size={48} className="mx-auto mb-3 text-gray-300" />
              <p>未找到匹配的指标</p>
            </div>
          )}

          {/* 底部操作栏 */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              完成
            </button>
          </div>
        </div>
      )}

      {/* 帮助提示 */}
      {value.length === 0 && !isExpanded && (
        <div className="text-xs text-gray-500 pl-1">
          选择该需求会影响的核心OKR指标或过程指标（可选，但建议填写以便管理层决策）
        </div>
      )}
    </div>
  );
};

export default MetricSelector;
