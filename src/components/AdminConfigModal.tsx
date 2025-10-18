/**
 * 管理员配置Modal组件
 *
 * 功能说明：
 * - 配置评分标准（ScoringStandard）
 * - 配置指标定义（MetricDefinition）
 * - 配置影响范围的各类指标
 *
 * @version 1.2.2
 */

import React, { useState } from 'react';
import { X, Settings, Save, Plus, Trash2 } from 'lucide-react';
import type { ScoringStandard, MetricDefinition } from '../types';

interface Props {
  onClose: () => void;
  onSave: (config: {
    scoringStandards: ScoringStandard[];
    metricDefinitions: MetricDefinition[];
  }) => void;
  initialScoringStandards: ScoringStandard[];
  initialMetricDefinitions: MetricDefinition[];
}

const AdminConfigModal: React.FC<Props> = ({
  onClose,
  onSave,
  initialScoringStandards,
  initialMetricDefinitions
}) => {
  const [activeTab, setActiveTab] = useState<'scoring' | 'metrics'>('scoring');
  const [scoringStandards, setScoringStandards] = useState<ScoringStandard[]>(initialScoringStandards);
  const [metricDefinitions, setMetricDefinitions] = useState<MetricDefinition[]>(initialMetricDefinitions);

  const handleSave = () => {
    onSave({
      scoringStandards,
      metricDefinitions
    });
    onClose();
  };

  const addMetric = () => {
    const newMetric: MetricDefinition = {
      key: `metric_${Date.now()}`,
      defaultName: '新指标',
      category: '运营效率类',
      type: 'process',
      description: ''
    };
    setMetricDefinitions([...metricDefinitions, newMetric]);
  };

  const updateMetric = (index: number, updates: Partial<MetricDefinition>) => {
    const updated = [...metricDefinitions];
    updated[index] = { ...updated[index], ...updates };
    setMetricDefinitions(updated);
  };

  const deleteMetric = (index: number) => {
    if (confirm('确定要删除这个指标吗？')) {
      const updated = metricDefinitions.filter((_, i) => i !== index);
      setMetricDefinitions(updated);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="text-white" size={24} />
            <h2 className="text-xl font-bold text-white">管理员配置</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tab切换 */}
        <div className="border-b border-gray-200 px-6 bg-gray-50">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('scoring')}
              className={`py-3 px-4 font-medium border-b-2 transition ${
                activeTab === 'scoring'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              评分标准配置
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`py-3 px-4 font-medium border-b-2 transition ${
                activeTab === 'metrics'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              指标定义配置
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'scoring' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>评分标准说明：</strong>
                  10分制评分标准定义了业务影响度的评分规则。每个分值对应不同的业务后果和影响范围。
                </p>
              </div>

              {scoringStandards.map((standard, index) => (
                <div key={standard.score} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {standard.score}分 - {standard.name}
                    </h3>
                    <span className="text-xs text-gray-500">（不可删除，仅可修改）</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        一句话总结
                      </label>
                      <input
                        type="text"
                        value={standard.shortDescription}
                        onChange={(e) => {
                          const updated = [...scoringStandards];
                          updated[index] = { ...updated[index], shortDescription: e.target.value };
                          setScoringStandards(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        业务后果（逗号分隔）
                      </label>
                      <input
                        type="text"
                        value={standard.businessConsequence.join(', ')}
                        onChange={(e) => {
                          const updated = [...scoringStandards];
                          updated[index] = {
                            ...updated[index],
                            businessConsequence: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          };
                          setScoringStandards(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        影响范围（逗号分隔）
                      </label>
                      <input
                        type="text"
                        value={standard.impactScope.join(', ')}
                        onChange={(e) => {
                          const updated = [...scoringStandards];
                          updated[index] = {
                            ...updated[index],
                            impactScope: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          };
                          setScoringStandards(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-1 mr-4">
                  <p className="text-sm text-blue-800">
                    <strong>指标定义说明：</strong>
                    配置核心OKR指标和过程指标，用于评估需求对业务的影响。
                  </p>
                </div>
                <button
                  onClick={addMetric}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2 font-medium"
                >
                  <Plus size={16} />
                  新增指标
                </button>
              </div>

              {metricDefinitions.map((metric, index) => (
                <div key={metric.key} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        指标唯一键
                      </label>
                      <input
                        type="text"
                        value={metric.key}
                        onChange={(e) => updateMetric(index, { key: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        指标名称
                      </label>
                      <input
                        type="text"
                        value={metric.defaultName}
                        onChange={(e) => updateMetric(index, { defaultName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        指标分类
                      </label>
                      <input
                        type="text"
                        value={metric.category}
                        onChange={(e) => updateMetric(index, { category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="如：收入相关、规模相关、运营效率类"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        指标类型
                      </label>
                      <select
                        value={metric.type}
                        onChange={(e) => updateMetric(index, { type: e.target.value as 'okr' | 'process' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="okr">核心OKR指标</option>
                        <option value="process">过程指标</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        指标说明
                      </label>
                      <textarea
                        value={metric.description || ''}
                        onChange={(e) => updateMetric(index, { description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        rows={2}
                      />
                    </div>

                    <div className="col-span-2 flex justify-end">
                      <button
                        onClick={() => deleteMetric(index)}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center gap-1 text-sm"
                      >
                        <Trash2 size={14} />
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium flex items-center gap-2"
          >
            <Save size={18} />
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminConfigModal;
