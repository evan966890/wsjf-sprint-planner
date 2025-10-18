/**
 * WSJF Sprint Planner - 编辑需求弹窗组件 (v1.2.0)
 *
 * v1.2.0 重大更新：
 * - 采用1400px宽屏布局，3列卡片式设计
 * - 集成10分制业务影响度评分系统
 * - 新增影响的指标选择器
 * - 新增影响范围字段（门店类型、区域、关键角色、门店数）
 * - 新增需求描述、文档链接、业务团队等字段
 * - 保留旧字段(bv, tc)以支持数据迁移
 * - 实时预览WSJF评分结果
 */

import { useState, useMemo } from 'react';
import { X, Save, Info, FileText, Link as LinkIcon, Users, MapPin, Store, Target } from 'lucide-react';
import type { Requirement, BusinessImpactScore, AffectedMetric, Document } from '../types';
import { useStore } from '../store/useStore';
import RequirementCard from './RequirementCard';
import BusinessImpactScoreSelector from './BusinessImpactScoreSelector';
import MetricSelector from './MetricSelector';
import ScoringStandardsHandbook from './ScoringStandardsHandbook';
import { STORE_TYPES, REGIONS, KEY_ROLES_CONFIG, STORE_COUNT_RANGES, BUSINESS_TEAMS } from '../config/businessFields';

interface EditRequirementModalProps {
  requirement: Requirement | null;
  onSave: (req: Requirement) => void;
  onClose: () => void;
  isNew?: boolean;
}

/**
 * 编辑需求弹窗组件 (v1.2.0)
 *
 * 宽屏3列布局：
 * - 左列(500px): 基本信息卡片
 * - 中列(600px): 业务评估卡片（影响度、指标、范围、时间临界性）
 * - 右列(300px): 实时预览和进展跟踪
 */
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

  // 初始化表单状态
  const [form, setForm] = useState<Requirement>(requirement || {
    // 基本字段
    id: `REQ-${Date.now()}`,
    name: '',
    description: '',  // v1.2.0新增
    submitterName: '',
    productManager: '',
    developer: '',
    submitDate: new Date().toISOString().split('T')[0],
    submitter: '产品',
    type: '功能开发',
    businessDomain: '国际零售通用',
    businessTeam: '',  // v1.2.0新增

    // v1.2.0业务评估字段
    businessImpactScore: 5 as BusinessImpactScore,  // 默认5分（中等影响）
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

    // 进展字段
    productProgress: '未评估',
    techProgress: '未评估',
    effortDays: 0,

    // 其他
    isRMS: false,

    // 保留旧字段以支持向后兼容
    bv: '明显',
    tc: '随时'
  });

  // 文档链接输入状态（临时）
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');

  /**
   * 实时计算预览分数（基于v1.2.0算法）
   */
  const previewScore = useMemo(() => {
    const BV_MAP: Record<string, number> = { '局部': 3, '明显': 6, '撬动核心': 8, '战略平台': 10 };
    const TC_MAP: Record<string, number> = { '随时': 0, '三月窗口': 3, '一月硬窗口': 5 };

    // 工作量加分计算
    const getWL = (d: number) => {
      const validDays = Math.max(0, Number(d) || 0);
      if (validDays <= 2) return 8;
      if (validDays <= 5) return 7;
      if (validDays <= 14) return 5;
      if (validDays <= 30) return 3;
      if (validDays <= 50) return 2;
      if (validDays <= 100) return 1;
      if (validDays <= 150) return 0;
      return 0;
    };

    // 计算原始分（3-28范围）
    const raw = (BV_MAP[form.bv || '明显'] || 3) + (TC_MAP[form.tc || '随时'] || 0) + (form.hardDeadline ? 5 : 0) + getWL(form.effortDays);

    // 归一化到展示分（10-100范围）
    const display = Math.round(10 + 90 * (raw - 3) / (28 - 3));

    return { raw, display };
  }, [form.bv, form.tc, form.hardDeadline, form.effortDays]);

  const previewReq: Requirement = {
    ...form,
    displayScore: previewScore.display,
    stars: previewScore.display >= 85 ? 5 : previewScore.display >= 70 ? 4 : previewScore.display >= 55 ? 3 : 2
  };

  const canEditEffort = form.techProgress === '已评估工作量' || form.techProgress === '已完成技术方案';

  /**
   * 添加文档链接
   */
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

  /**
   * 删除文档链接
   */
  const handleRemoveDocument = (index: number) => {
    setForm({
      ...form,
      documents: (form.documents || []).filter((_, i) => i !== index)
    });
  };

  /**
   * 展开所有区域的国家列表
   */
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

  /**
   * 展开所有关键角色列表
   */
  const getAllRoleOptions = () => {
    const options: string[] = [];
    KEY_ROLES_CONFIG.forEach(config => {
      options.push(`[${config.categoryName}]`);  // Category header
      config.roles.forEach(role => {
        options.push(role);
      });
    });
    return options;
  };

  const regionOptions = getAllRegionOptions();
  const roleOptions = getAllRoleOptions();

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

          {/* Main Content - 3 Column Layout */}
          <div className="p-6">
            <div className="grid grid-cols-12 gap-6">
              {/* ========== LEFT COLUMN: Basic Info ========== */}
              <div className="col-span-4 space-y-4">
                {/* 基本信息卡片 */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                    <FileText size={18} className="text-blue-600" />
                    <h4 className="font-semibold text-gray-900">基本信息</h4>
                  </div>

                  <div className="space-y-4">
                    {/* 需求名称 */}
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

                    {/* 需求描述 */}
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

                    {/* 业务团队 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        业务团队
                      </label>
                      <select
                        value={form.businessTeam || ''}
                        onChange={(e) => setForm({ ...form, businessTeam: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      >
                        <option value="">请选择</option>
                        {BUSINESS_TEAMS.map(team => (
                          <option key={team} value={team}>{team}</option>
                        ))}
                      </select>
                    </div>

                    {/* 业务域 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">业务域</label>
                      <select
                        value={form.businessDomain}
                        onChange={(e) => setForm({
                          ...form,
                          businessDomain: e.target.value,
                          customBusinessDomain: e.target.value === '自定义' ? form.customBusinessDomain : ''
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                    )}

                    {/* 提交信息 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">提交日期</label>
                        <input
                          type="date"
                          value={form.submitDate}
                          onChange={(e) => setForm({ ...form, submitDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">提交方</label>
                        <select
                          value={form.submitter}
                          onChange={(e) => setForm({ ...form, submitter: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        >
                          <option value="产品">产品</option>
                          <option value="研发">研发</option>
                          <option value="业务">业务</option>
                        </select>
                      </div>
                    </div>

                    {/* 人员信息 */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">提交人</label>
                        <input
                          type="text"
                          value={form.submitterName}
                          onChange={(e) => setForm({ ...form, submitterName: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          placeholder="姓名"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">产品经理</label>
                        <input
                          type="text"
                          value={form.productManager}
                          onChange={(e) => setForm({ ...form, productManager: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          placeholder="姓名"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">研发同学</label>
                        <input
                          type="text"
                          value={form.developer}
                          onChange={(e) => setForm({ ...form, developer: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          placeholder="姓名"
                        />
                      </div>
                    </div>

                    {/* 需求类型和RMS */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">需求类型</label>
                        <select
                          value={form.type}
                          onChange={(e) => setForm({ ...form, type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        >
                          <option value="功能开发">功能开发</option>
                          <option value="技术债">技术债</option>
                          <option value="Bug修复">Bug修复</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer h-[42px]">
                          <input
                            type="checkbox"
                            checked={form.isRMS}
                            onChange={(e) => setForm({ ...form, isRMS: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">RMS重构项目</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========== MIDDLE COLUMN: Business Assessment ========== */}
              <div className="col-span-5 space-y-4">
                {/* 业务影响度评分卡片 */}
                <div className="bg-white border-2 border-blue-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                    <Target size={18} className="text-blue-600" />
                    <h4 className="font-semibold text-gray-900">业务影响度评分</h4>
                    <span className="text-xs text-gray-500">(v1.2.0新增)</span>
                  </div>

                  <BusinessImpactScoreSelector
                    value={form.businessImpactScore || 5}
                    onChange={(score) => setForm({ ...form, businessImpactScore: score })}
                    scoringStandards={scoringStandards}
                    onViewHandbook={() => setIsHandbookOpen(true)}
                  />
                </div>

                {/* 影响的指标卡片 */}
                <div className="bg-white border-2 border-purple-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                    <Target size={18} className="text-purple-600" />
                    <h4 className="font-semibold text-gray-900">影响的指标</h4>
                    <span className="text-xs text-gray-500">(可选，建议填写)</span>
                  </div>

                  <MetricSelector
                    value={form.affectedMetrics || []}
                    onChange={(metrics) => setForm({ ...form, affectedMetrics: metrics })}
                    okrMetrics={okrMetrics}
                    processMetrics={processMetrics}
                  />
                </div>

                {/* 影响范围卡片 */}
                <div className="bg-white border-2 border-green-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                    <MapPin size={18} className="text-green-600" />
                    <h4 className="font-semibold text-gray-900">影响范围</h4>
                    <span className="text-xs text-gray-500">(v1.2.0新增)</span>
                  </div>

                  <div className="space-y-4">
                    {/* 门店类型 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <Store size={14} />
                        门店类型
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {STORE_TYPES.map(type => (
                          <label key={type} className="flex items-center gap-2 cursor-pointer text-sm">
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

                    {/* 区域 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        区域和国家（多选）
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

                    {/* 关键角色 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <Users size={14} />
                        关键角色（多选）
                      </label>
                      <select
                        multiple
                        value={(form.impactScope?.keyRoles || []).map(kr => kr.roleName)}
                        onChange={(e) => {
                          const selectedRoleNames = Array.from(e.target.selectedOptions, option => option.value)
                            .filter(v => !v.startsWith('['));  // Filter out category headers

                          // Convert role names back to KeyRole objects
                          const keyRoles = selectedRoleNames.map(roleName => {
                            // Find the category for this role
                            const config = KEY_ROLES_CONFIG.find(c => c.roles.includes(roleName));
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
                        {roleOptions.map(option => (
                          <option
                            key={option}
                            value={option}
                            disabled={option.startsWith('[')}
                            className={option.startsWith('[') ? 'font-bold bg-gray-100' : ''}
                          >
                            {option}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">按住Ctrl(Windows)或Cmd(Mac)多选</p>
                    </div>

                    {/* 门店数量范围 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  </div>
                </div>

                {/* 时间临界性卡片 */}
                <div className="bg-white border-2 border-orange-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                    <Info size={18} className="text-orange-600" />
                    <h4 className="font-semibold text-gray-900">时间临界性</h4>
                  </div>

                  <div className="space-y-4">
                    {/* 时间窗口 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">时间窗口</label>
                      <select
                        value={form.timeCriticality || '随时'}
                        onChange={(e) => setForm({ ...form, timeCriticality: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      >
                        <option value="随时">随时可做</option>
                        <option value="三月窗口">三个月内完成</option>
                        <option value="一月硬窗口">一个月内完成</option>
                      </select>
                    </div>

                    {/* 强制截止日期 */}
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                    )}

                    {/* 相关文档 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <LinkIcon size={14} />
                        相关文档链接
                      </label>

                      {/* 已添加的文档列表 */}
                      {(form.documents || []).length > 0 && (
                        <div className="space-y-2 mb-3">
                          {form.documents!.map((doc, index) => (
                            <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
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
                  </div>
                </div>
              </div>

              {/* ========== RIGHT COLUMN: Preview & Progress ========== */}
              <div className="col-span-3 space-y-4">
                {/* 实时预览卡片 */}
                <div className="bg-white border-2 border-teal-200 rounded-lg p-5 sticky top-6">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                    <Info size={18} className="text-teal-600" />
                    <h4 className="font-semibold text-gray-900">实时预览</h4>
                  </div>

                  <div className="flex justify-center items-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 overflow-auto max-h-[200px] mb-4">
                    <RequirementCard requirement={previewReq} showTooltip={false} />
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border-2 border-teal-300 rounded-lg p-4 mb-3">
                    <div className="text-sm font-medium text-teal-900 mb-1">权重分</div>
                    <div className="text-4xl font-bold text-teal-700">
                      {previewScore.display}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      归一化分数 (10-100)
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 bg-gray-100 rounded p-2">
                    <div className="flex items-center gap-1">
                      <Info size={12} />
                      <span>Raw Score: {previewScore.raw}/28</span>
                    </div>
                  </div>
                </div>

                {/* 进展跟踪卡片 */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                    <Target size={18} className="text-gray-600" />
                    <h4 className="font-semibold text-gray-900">进展跟踪</h4>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">产品进展</label>
                      <select
                        value={form.productProgress}
                        onChange={(e) => setForm({ ...form, productProgress: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                        onChange={(e) => setForm({ ...form, techProgress: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      >
                        <option value="未评估">未评估</option>
                        <option value="已评估工作量">已评估工作量</option>
                        <option value="已完成技术方案">已完成技术方案</option>
                      </select>
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
                        onChange={(e) => setForm({ ...form, effortDays: Math.max(1, parseInt(e.target.value) || 1) })}
                        disabled={!canEditEffort}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
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
