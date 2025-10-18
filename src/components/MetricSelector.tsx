/**
 * WSJF Sprint Planner - 指标选择器组件
 *
 * v1.2.1: 改进选择器交互体验
 *
 * 功能：
 * - 分类展示OKR指标和过程指标
 * - 支持多选
 * - 已选指标以tag形式显示在顶部，不从列表中移除
 * - 支持搜索和筛选
 * - 支持快速填写预估影响值
 */

import { useState } from 'react';
import { Plus, X, Target, Activity, Search } from 'lucide-react';
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
 * 指标选择器组件（v1.2.1 - 改进版）
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
  const [filterType, setFilterType] = useState<'all' | 'okr' | 'process'>('all');
  const [editingMetricKey, setEditingMetricKey] = useState<string | null>(null);
  const [tempImpact, setTempImpact] = useState<string>('');

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
   * 移除指标
   */
  const removeMetric = (metricKey: string) => {
    onChange(value.filter(m => m.metricKey !== metricKey));
    if (editingMetricKey === metricKey) {
      setEditingMetricKey(null);
    }
  };

  /**
   * 开始编辑影响值
   */
  const startEditImpact = (metricKey: string) => {
    setEditingMetricKey(metricKey);
    setTempImpact(getMetricImpact(metricKey));
  };

  /**
   * 保存影响值
   */
  const saveImpact = (metricKey: string) => {
    updateEstimatedImpact(metricKey, tempImpact);
    setEditingMetricKey(null);
    setTempImpact('');
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
      {/* 已选指标 - 紧凑tag形式 */}
      {value.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">
            已选择 {value.length} 个指标：
          </div>
          <div className="flex flex-wrap gap-2">
            {value.map((metric) => {
              const isEditing = editingMetricKey === metric.metricKey;

              return (
                <div
                  key={metric.metricKey}
                  className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all
                    ${metric.category === 'okr' ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-purple-100 text-purple-800 border border-purple-300'}
                    ${isEditing ? 'ring-2 ring-offset-1 ring-blue-500' : ''}
                  `}
                >
                  <span className="font-medium">{metric.metricName}</span>
                  {metric.estimatedImpact && !isEditing && (
                    <span className="text-gray-600">({metric.estimatedImpact})</span>
                  )}
                  {!disabled && !isEditing && (
                    <button
                      type="button"
                      onClick={() => startEditImpact(metric.metricKey)}
                      className="hover:text-gray-900"
                      title="编辑预估影响"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeMetric(metric.metricKey)}
                      className="hover:text-red-700"
                      title="移除"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* 编辑影响值输入框 */}
          {editingMetricKey && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                预估影响 (如: +5%, 明显提升, 减少50%等)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempImpact}
                  onChange={(e) => setTempImpact(e.target.value)}
                  placeholder="输入预估影响..."
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveImpact(editingMetricKey);
                    } else if (e.key === 'Escape') {
                      setEditingMetricKey(null);
                      setTempImpact('');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => saveImpact(editingMetricKey)}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMetricKey(null);
                    setTempImpact('');
                  }}
                  className="px-3 py-1 text-sm bg-gray-300 hover:bg-gray-400 text-gray-700 rounded"
                >
                  取消
                </button>
              </div>
            </div>
          )}
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
          {isExpanded ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span className="font-medium">收起指标选择器</span>
            </>
          ) : (
            <>
              <Plus size={18} />
              <span className="font-medium">添加影响的指标</span>
            </>
          )}
        </div>
      </button>

      {/* 指标选择器展开区域 */}
      {isExpanded && !disabled && (
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-white shadow-lg">
          {/* 搜索和筛选 */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索指标..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
                      const impact = getMetricImpact(metric.key);

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
                          <div className="flex items-start gap-2">
                            <div className={`
                              w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                              ${isSelected ? 'bg-white border-white' : 'bg-white border-gray-300'}
                            `}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium block">{metric.defaultName}</span>
                              {metric.description && (
                                <div className={`text-xs mt-0.5 ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                                  {metric.description}
                                </div>
                              )}
                              {isSelected && impact && (
                                <div className="text-xs mt-1 bg-white/20 px-2 py-0.5 rounded inline-block">
                                  影响: {impact}
                                </div>
                              )}
                            </div>
                          </div>
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
                      const impact = getMetricImpact(metric.key);

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
                          <div className="flex items-start gap-2">
                            <div className={`
                              w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                              ${isSelected ? 'bg-white border-white' : 'bg-white border-gray-300'}
                            `}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium block">{metric.defaultName}</span>
                              {metric.description && (
                                <div className={`text-xs mt-0.5 ${isSelected ? 'text-purple-100' : 'text-gray-600'}`}>
                                  {metric.description}
                                </div>
                              )}
                              {isSelected && impact && (
                                <div className="text-xs mt-1 bg-white/20 px-2 py-0.5 rounded inline-block">
                                  影响: {impact}
                                </div>
                              )}
                            </div>
                          </div>
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
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              已选择 <span className="font-medium text-gray-900">{value.length}</span> 个指标
            </div>
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
