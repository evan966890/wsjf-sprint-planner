/**
 * WSJF Sprint Planner - 编辑需求弹窗组件 (v1.2.0 - 重构版)
 *
 * v1.2.0 核心功能：
 * - 2列布局：左侧主表单 + 右侧预览和产研填写
 * - AI智能填写集成
 * - 业务域与角色/门店类型联动
 * - 指标选择默认收起
 * - 按用户需求重新排列字段顺序
 */

import { useState, useMemo, useEffect } from 'react';
import { X, Save, Info, Link as LinkIcon, Users, Store, Target } from 'lucide-react';
import type { Requirement, BusinessImpactScore, AffectedMetric, Document, AIModelType } from '../types';
import { useStore } from '../store/useStore';
import RequirementCard from './RequirementCard';
import BusinessImpactScoreSelector from './BusinessImpactScoreSelector';
import MetricSelector from './MetricSelector';
import ScoringStandardsHandbook from './ScoringStandardsHandbook';
import AIDocumentAnalyzer from './AIDocumentAnalyzer';
import {
  getStoreTypesByDomain,
  getRoleConfigsByDomain,
  REGIONS,
  STORE_COUNT_RANGES,
  TIME_CRITICALITY_DESCRIPTIONS
} from '../config/businessFields';

interface EditRequirementModalProps {
  requirement: Requirement | null;
  onSave: (req: Requirement) => void;
  onClose: () => void;
  isNew?: boolean;
}

const EditRequirementModal = ({
  requirement,
  onSave,
  onClose,
  isNew = false
}: EditRequirementModalProps) => {
  // 从Store获取配置数据
  const { scoringStandards, okrMetrics, processMetrics } = useStore();

  // 评分说明书Modal状态
  const [isHandbookOpen, setIsHandbookOpen] = useState(false);

  // AI模型选择
  const [selectedAIModel, setSelectedAIModel] = useState<AIModelType>('deepseek');

  // 指标选择器展开状态（默认收起）
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);

  // 初始化表单状态
  const [form, setForm] = useState<Requirement>(requirement || {
    id: `REQ-${Date.now()}`,
    name: '',
    description: '',
    submitterName: '',
    productManager: '',
    developer: '',
    submitDate: new Date().toISOString().split('T')[0],
    submitter: '产品',
    type: '功能开发',
    businessDomain: '国际零售通用',
    businessTeam: '',
    businessImpactScore: 5 as BusinessImpactScore,
    affectedMetrics: [] as AffectedMetric[],
    impactScope: {
      storeTypes: [],
      regions: [],
      keyRoles: [],
      storeCountRange: undefined
    },
    timeCriticality: '随时' as '随时' | '三月窗口' | '一月硬窗口',
    hardDeadline: false,
    deadlineDate: undefined,
    documents: [] as Document[],
    productProgress: '未评估',
    techProgress: '未评估',
    effortDays: 0,
    isRMS: false,
    bv: '明显',
    tc: '随时'
  });

  // 文档链接输入状态
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');

  // 根据业务域更新可选项
  const availableStoreTypes = useMemo(() =>
    getStoreTypesByDomain(form.businessDomain),
    [form.businessDomain]
  );

  const availableRoleConfigs = useMemo(() =>
    getRoleConfigsByDomain(form.businessDomain),
    [form.businessDomain]
  );

  // 当业务域变化时，清理不合法的选项
  useEffect(() => {
    // 清理门店类型
    const validStoreTypes = (form.impactScope?.storeTypes || []).filter(
      type => availableStoreTypes.includes(type)
    );

    // 清理关键角色
    const availableRoles = availableRoleConfigs.flatMap(c => c.roles);
    const validKeyRoles = (form.impactScope?.keyRoles || []).filter(
      kr => availableRoles.includes(kr.roleName)
    );

    if (validStoreTypes.length !== (form.impactScope?.storeTypes || []).length ||
        validKeyRoles.length !== (form.impactScope?.keyRoles || []).length) {
      setForm(prev => ({
        ...prev,
        impactScope: {
          storeTypes: validStoreTypes,
          regions: prev.impactScope?.regions || [],
          keyRoles: validKeyRoles,
          storeCountRange: prev.impactScope?.storeCountRange
        }
      }));
    }
  }, [form.businessDomain, availableStoreTypes, availableRoleConfigs]);

  // 实时计算预览分数
  const previewScore = useMemo(() => {
    const BV_MAP: Record<string, number> = { '局部': 3, '明显': 6, '撬动核心': 8, '战略平台': 10 };
    const TC_MAP: Record<string, number> = { '随时': 0, '三月窗口': 3, '一月硬窗口': 5 };

    const getWL = (d: number) => {
      const validDays = Math.max(0, Number(d) || 0);
      if (validDays <= 2) return 8;
      if (validDays <= 5) return 7;
      if (validDays <= 14) return 5;
      if (validDays <= 30) return 3;
      if (validDays <= 50) return 2;
      if (validDays <= 100) return 1;
      return 0;
    };

    const raw = (BV_MAP[form.bv || '明显'] || 3) + (TC_MAP[form.tc || '随时'] || 0) + (form.hardDeadline ? 5 : 0) + getWL(form.effortDays);
    const display = Math.round(10 + 90 * (raw - 3) / (28 - 3));

    return { raw, display };
  }, [form.bv, form.tc, form.hardDeadline, form.effortDays]);

  const previewReq: Requirement = {
    ...form,
    displayScore: previewScore.display,
    stars: previewScore.display >= 85 ? 5 : previewScore.display >= 70 ? 4 : previewScore.display >= 55 ? 3 : 2
  };

  const canEditEffort = form.techProgress === '已评估工作量' || form.techProgress === '已完成技术方案';

  // AI分析完成回调
  const handleAIAnalysisComplete = (data: Partial<Requirement>) => {
    setForm(prev => ({
      ...prev,
      ...data,
      // 保留ID和其他必要字段
      id: prev.id
    }));

    // 如果AI填充了指标，自动展开指标选择器
    if (data.affectedMetrics && data.affectedMetrics.length > 0) {
      setIsMetricsExpanded(true);
    }
  };

  // 添加文档链接
  const handleAddDocument = () => {
    if (newDocTitle.trim() && newDocUrl.trim()) {
      const newDoc: Document = {
        id: `DOC-${Date.now()}`,
        fileName: newDocTitle.trim(),
        fileType: 'link',
        fileSize: 0,
        uploadedAt: new Date().toISOString(),
        url: newDocUrl.trim()
      };
      setForm({
        ...form,
        documents: [...(form.documents || []), newDoc]
      });
      setNewDocTitle('');
      setNewDocUrl('');
    }
  };

  // 删除文档链接
  const handleRemoveDocument = (index: number) => {
    setForm({
      ...form,
      documents: (form.documents || []).filter((_, i) => i !== index)
    });
  };

  // 展开所有区域的国家列表
  const getAllRegionOptions = () => {
    const options: string[] = [];
    REGIONS.forEach(region => {
      options.push(region.name);
      if (region.countries) {
        region.countries.forEach(country => {
          options.push(`${region.name} - ${country}`);
        });
      }
      if (region.subRegions) {
        region.subRegions.forEach(subRegion => {
          options.push(`${region.name} - ${subRegion}`);
        });
      }
    });
    return options;
  };

  const regionOptions = getAllRegionOptions();

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1400px] max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl flex items-center justify-between z-10">
            <h3 className="text-xl font-bold">{isNew ? '新增需求' : '编辑需求'}</h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Main Content - 2 Column Layout */}
          <div className="p-6">
            <div className="grid grid-cols-12 gap-6">
              {/* ========== LEFT COLUMN: Main Form ========== */}
              <div className="col-span-8 space-y-4">
                {/* 1. 需求名称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    需求名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="输入需求名称（必填）"
                  />
                </div>

                {/* 2. 需求描述 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    需求描述
                  </label>
                  <textarea
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                    placeholder="简要描述需求背景、目标和预期效果"
                  />
                </div>

                {/* 3. 上线时间窗口 + 强制DDL */}
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Info size={18} className="text-orange-600" />
                    上线时间窗口
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">时间窗口</label>
                      <select
                        value={form.timeCriticality || '随时'}
                        onChange={(e) => setForm({
                          ...form,
                          timeCriticality: e.target.value as any,
                          tc: e.target.value as any  // 同步更新tc字段
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="随时">随时可做</option>
                        <option value="三月窗口">三个月内完成</option>
                        <option value="一月硬窗口">一个月内完成</option>
                      </select>
                      {form.timeCriticality && (
                        <p className="text-xs text-gray-500 mt-1">
                          {TIME_CRITICALITY_DESCRIPTIONS[form.timeCriticality]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.hardDeadline}
                          onChange={(e) => setForm({ ...form, hardDeadline: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">强制截止日期(DDL)</span>
                      </label>
                    </div>

                    {form.hardDeadline && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">截止日期</label>
                        <input
                          type="date"
                          value={form.deadlineDate || ''}
                          onChange={(e) => setForm({ ...form, deadlineDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. 文档链接管理 */}
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <LinkIcon size={18} className="text-gray-600" />
                    相关文档链接
                  </h4>

                  {/* 已添加的文档列表 */}
                  {(form.documents || []).length > 0 && (
                    <div className="space-y-2 mb-3">
                      {form.documents!.map((doc, index) => (
                        <div key={index} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                          <LinkIcon size={14} className="text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</div>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline truncate block"
                            >
                              {doc.url}
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(index)}
                            className="text-red-500 hover:text-red-700 flex-shrink-0"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 添加新文档 */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="文档标题"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="url"
                      placeholder="文档链接（http://...）"
                      value={newDocUrl}
                      onChange={(e) => setNewDocUrl(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddDocument}
                      disabled={!newDocTitle.trim() || !newDocUrl.trim()}
                      className="w-full px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                      添加文档
                    </button>
                  </div>
                </div>

                {/* 5. AI智能填写 */}
                <AIDocumentAnalyzer
                  onAnalysisComplete={handleAIAnalysisComplete}
                  selectedModel={selectedAIModel}
                  onModelChange={setSelectedAIModel}
                />

                {/* 6. 业务域选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">业务域</label>
                  <select
                    value={form.businessDomain}
                    onChange={(e) => setForm({
                      ...form,
                      businessDomain: e.target.value,
                      customBusinessDomain: e.target.value === '自定义' ? form.customBusinessDomain : ''
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="新零售">新零售</option>
                    <option value="渠道零售">渠道零售</option>
                    <option value="国际零售通用">国际零售通用</option>
                    <option value="自定义">自定义</option>
                  </select>
                </div>

                {form.businessDomain === '自定义' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">自定义业务域名称</label>
                    <input
                      type="text"
                      value={form.customBusinessDomain || ''}
                      onChange={(e) => setForm({ ...form, customBusinessDomain: e.target.value })}
                      placeholder="请输入自定义业务域名称"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* 7. 业务团队（关键角色，与业务域联动） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Users size={14} />
                    业务团队（关键角色，多选）
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    按住Ctrl(Windows)或Cmd(Mac)多选。可选角色根据所选业务域自动筛选。
                  </p>
                  <select
                    multiple
                    value={(form.impactScope?.keyRoles || []).map(kr => kr.roleName)}
                    onChange={(e) => {
                      const selectedRoleNames = Array.from(e.target.selectedOptions, option => option.value)
                        .filter(v => !v.startsWith('['));

                      const keyRoles = selectedRoleNames.map(roleName => {
                        const config = availableRoleConfigs.find(c => c.roles.includes(roleName));
                        return {
                          category: config?.category || 'hq-common' as any,
                          roleName,
                          isCustom: false
                        };
                      });

                      setForm({
                        ...form,
                        impactScope: {
                          storeTypes: form.impactScope?.storeTypes || [],
                          regions: form.impactScope?.regions || [],
                          keyRoles,
                          storeCountRange: form.impactScope?.storeCountRange
                        }
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32 text-sm"
                  >
                    {availableRoleConfigs.map(config => (
                      <optgroup key={config.category} label={config.categoryName}>
                        {config.roles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* 8. 与哪类门店有关？（与业务域联动） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Store size={14} />
                    与哪类门店有关？
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    可选门店类型根据所选业务域自动筛选
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {availableStoreTypes.map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer text-sm p-2 border border-gray-200 rounded hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={form.impactScope?.storeTypes?.includes(type)}
                          onChange={(e) => {
                            const storeTypes = e.target.checked
                              ? [...(form.impactScope?.storeTypes || []), type]
                              : (form.impactScope?.storeTypes || []).filter(t => t !== type);
                            setForm({
                              ...form,
                              impactScope: {
                                storeTypes,
                                regions: form.impactScope?.regions || [],
                                keyRoles: form.impactScope?.keyRoles || [],
                                storeCountRange: form.impactScope?.storeCountRange
                              }
                            });
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 9. 涉及门店数量 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    涉及门店数量
                  </label>
                  <select
                    value={form.impactScope?.storeCountRange || ''}
                    onChange={(e) => setForm({
                      ...form,
                      impactScope: {
                        storeTypes: form.impactScope?.storeTypes || [],
                        regions: form.impactScope?.regions || [],
                        keyRoles: form.impactScope?.keyRoles || [],
                        storeCountRange: e.target.value || undefined
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择</option>
                    {STORE_COUNT_RANGES.map(range => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>

                {/* 10. 与哪些地区有关？ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    与哪些地区有关？（多选）
                  </label>
                  <select
                    multiple
                    value={form.impactScope?.regions || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setForm({
                        ...form,
                        impactScope: {
                          storeTypes: form.impactScope?.storeTypes || [],
                          regions: selected,
                          keyRoles: form.impactScope?.keyRoles || [],
                          storeCountRange: form.impactScope?.storeCountRange
                        }
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32 text-sm"
                  >
                    {regionOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">按住Ctrl(Windows)或Cmd(Mac)多选</p>
                </div>

                {/* 11. 提交日期 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">提交日期</label>
                  <input
                    type="date"
                    value={form.submitDate}
                    onChange={(e) => setForm({ ...form, submitDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 12. 需求提交部门 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">需求提交部门</label>
                  <select
                    value={form.submitter}
                    onChange={(e) => setForm({ ...form, submitter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="产品">产品</option>
                    <option value="研发">研发</option>
                    <option value="业务">业务</option>
                  </select>
                </div>

                {/* 13. 提交人 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">提交人</label>
                  <input
                    type="text"
                    value={form.submitterName}
                    onChange={(e) => setForm({ ...form, submitterName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="提交人姓名"
                  />
                </div>

                {/* 14. 需求类型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">需求类型</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="功能开发">功能开发</option>
                    <option value="技术债">技术债</option>
                    <option value="Bug修复">Bug修复</option>
                  </select>
                </div>

                {/* 15. RMS重构项目 */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isRMS}
                      onChange={(e) => setForm({ ...form, isRMS: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">RMS重构项目</span>
                  </label>
                </div>

                {/* 16. 业务影响度评分 */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target size={18} className="text-blue-600" />
                    业务影响度评分
                    <span className="text-xs text-gray-500">(v1.2.0)</span>
                  </h4>
                  <BusinessImpactScoreSelector
                    value={form.businessImpactScore || 5}
                    onChange={(score) => setForm({ ...form, businessImpactScore: score })}
                    scoringStandards={scoringStandards}
                    onViewHandbook={() => setIsHandbookOpen(true)}
                  />
                </div>

                {/* 17. 影响的指标（默认收起） */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <button
                    type="button"
                    onClick={() => setIsMetricsExpanded(!isMetricsExpanded)}
                    className="w-full flex items-center justify-between mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <Target size={18} className="text-purple-600" />
                      <h4 className="font-semibold text-gray-900">影响的指标</h4>
                      <span className="text-xs text-gray-500">(可选，建议填写)</span>
                    </div>
                    <div className={`transform transition-transform ${isMetricsExpanded ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isMetricsExpanded && (
                    <MetricSelector
                      value={form.affectedMetrics || []}
                      onChange={(metrics) => setForm({ ...form, affectedMetrics: metrics })}
                      okrMetrics={okrMetrics}
                      processMetrics={processMetrics}
                    />
                  )}

                  {!isMetricsExpanded && (form.affectedMetrics || []).length > 0 && (
                    <div className="text-sm text-purple-700">
                      已选择 {form.affectedMetrics!.length} 个指标
                    </div>
                  )}
                </div>
              </div>

              {/* ========== RIGHT COLUMN: Preview & Progress ========== */}
              <div className="col-span-4 space-y-4">
                {/* 实时预览卡片 */}
                <div className="bg-white border-2 border-teal-200 rounded-lg p-5 sticky top-6">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                    <Info size={18} className="text-teal-600" />
                    <h4 className="font-semibold text-gray-900">实时预览</h4>
                  </div>

                  <div className="flex justify-center items-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 overflow-auto max-h-[200px] mb-4">
                    <RequirementCard requirement={previewReq} showTooltip={false} />
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border-2 border-teal-300 rounded-lg p-4">
                    <div className="text-sm font-medium text-teal-900 mb-1">权重分</div>
                    <div className="text-4xl font-bold text-teal-700">
                      {previewScore.display}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      归一化分数 (10-100)
                    </div>
                  </div>
                </div>

                {/* 进展跟踪（产研填写部分） */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                    <Target size={18} className="text-gray-600" />
                    <h4 className="font-semibold text-gray-900">产研填写</h4>
                  </div>

                  <div className="space-y-4">
                    {/* 产品经理 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">产品经理</label>
                      <input
                        type="text"
                        value={form.productManager}
                        onChange={(e) => setForm({ ...form, productManager: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="产品经理姓名"
                      />
                    </div>

                    {/* 研发同学 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">研发同学</label>
                      <input
                        type="text"
                        value={form.developer}
                        onChange={(e) => setForm({ ...form, developer: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="研发同学姓名"
                      />
                    </div>

                    {/* 产品进展 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">产品进展</label>
                      <select
                        value={form.productProgress}
                        onChange={(e) => setForm({ ...form, productProgress: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="未评估">未评估</option>
                        <option value="已评估">已评估</option>
                        <option value="已出PRD">已出PRD</option>
                      </select>
                    </div>

                    {/* 技术进展 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">技术进展</label>
                      <select
                        value={form.techProgress}
                        onChange={(e) => setForm({ ...form, techProgress: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="未评估">未评估</option>
                        <option value="已评估工作量">已评估工作量</option>
                        <option value="已完成技术方案">已完成技术方案</option>
                      </select>
                    </div>

                    {/* 开发工作量 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        开发工作量（人日）
                        {!canEditEffort && <span className="text-xs text-red-600 ml-2">需先完成技术评估</span>}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={form.effortDays}
                        onChange={(e) => setForm({ ...form, effortDays: Math.max(1, parseInt(e.target.value) || 1) })}
                        disabled={!canEditEffort}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      {canEditEffort && (
                        <div className="text-xs text-gray-500 mt-1">
                          工作量加分: {form.effortDays <= 2 ? '+8分' : form.effortDays <= 5 ? '+7分' : form.effortDays <= 14 ? '+5分' : form.effortDays <= 30 ? '+3分' : form.effortDays <= 50 ? '+2分' : form.effortDays <= 100 ? '+1分' : '不加分'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3 z-10">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
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
              className={`px-6 py-2.5 rounded-lg transition font-medium flex items-center gap-2 ${
                form.name.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save size={18} />
              保存
            </button>
          </div>
        </div>
      </div>

      {/* Scoring Standards Handbook Modal */}
      <ScoringStandardsHandbook
        isOpen={isHandbookOpen}
        onClose={() => setIsHandbookOpen(false)}
        scoringStandards={scoringStandards}
      />
    </>
  );
};

export default EditRequirementModal;
