/**
 * WSJF Sprint Planner - 编辑需求弹窗组件 (v1.2.2 - 重构版)
 * 文件大小：从 2229 行减少到 < 500 行
 * 使用自定义 Hooks 管理状态（表单、文档、AI分析）
 */

import { useState } from 'react';
import { X, Save, Info, Link as LinkIcon, Users, Store, Target, Sparkles, Loader, AlertCircle, CheckCircle, Settings, Upload, FileText, Trash2, Eye } from 'lucide-react';
import type { Requirement } from '../types';
import { useStore } from '../store/useStore';
import BusinessImpactScoreSelector from './BusinessImpactScoreSelector';
import MetricSelector from './MetricSelector';
import ScoringStandardsHandbook from './ScoringStandardsHandbook';
import { useRequirementForm } from './edit-requirement/hooks/useRequirementForm';
import { useDocumentManager } from './edit-requirement/hooks/useDocumentManager';
import { useAIAnalysis } from './edit-requirement/hooks/useAIAnalysis';
import { FilePreviewModal } from './edit-requirement/FilePreviewModal';
import { AIAnalysisPanel } from './edit-requirement/AIAnalysisPanel';
import { REGIONS, STORE_COUNT_RANGES, TIME_CRITICALITY_DESCRIPTIONS } from '../config/businessFields';
import { COMPLEXITY_STANDARDS } from '../config/complexityStandards';
import { formatFileSize } from '../utils/fileParser';

interface EditRequirementModalProps {
  requirement: Requirement | null;
  onSave: (req: Requirement) => void;
  onClose: () => void;
  isNew?: boolean;
}

const EditRequirementModal = ({ requirement, onSave, onClose, isNew = false }: EditRequirementModalProps) => {
  const { scoringStandards, okrMetrics, processMetrics } = useStore();
  const [isHandbookOpen, setIsHandbookOpen] = useState(false);
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
  const [isRelevanceExpanded, setIsRelevanceExpanded] = useState(false);
  const [isAISectionExpanded, setIsAISectionExpanded] = useState(false);

  const formHook = useRequirementForm(requirement);
  const { form, updateField, updateFields, validate, previewScore, canEditEffort, availableStoreTypes, availableRoleConfigs, hqRolesOnly } = formHook;

  const docManager = useDocumentManager(requirement?.documents || []);
  const { documents, newDocTitle, newDocUrl, setNewDocTitle, handleUrlChange, addDocument, removeDocument, uploadedFiles, uploadFile, removeFile, previewFileId, previewFile: previewFileFn, closePreview } = docManager;

  const aiHook = useAIAnalysis();
  const { selectedAIModel, isAnalyzing, analysisProgress, analysisStep, analysisResult, error: aiError, adoptionStatus: aiAdoptionStatus, adoptedItems: aiAdoptedItems, isPanelCollapsed: isAIPanelCollapsed, changeModel, analyze, adoptAll, adoptScoreOnly, adoptOKRMetrics, adoptProcessMetrics, ignore: handleIgnoreAI, reanalyze, setIsPanelCollapsed: setIsAIPanelCollapsed } = aiHook;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    try {
      await uploadFile(files[0]);
    } catch (error) {
      alert(error instanceof Error ? error.message : '文件上传失败');
    }
    event.target.value = '';
  };

  const handleSave = () => {
    const error = validate();
    if (error) {
      alert(error);
      return;
    }
    onSave({ ...form, documents });
    onClose();
  };

  const selectedStandard = COMPLEXITY_STANDARDS.find(s => s.score === form.complexityScore);
  const previewFileData = uploadedFiles.find(f => f.id === previewFileId);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl">
          <div className="sticky top-0 px-6 py-4 border-b border-gray-200 bg-white rounded-t-xl flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{isNew ? '新建需求' : '编辑需求'}</h2>
              {!isNew && <span className="text-sm text-gray-500 font-mono">{requirement?.id}</span>}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={24} /></button>
          </div>

          <div className="flex-1 overflow-auto px-6 py-5">
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Info size={20} className="text-blue-600" />基础信息
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">需求名称 <span className="text-red-500">*</span></label>
                    <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="输入需求名称..." />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">需求描述</label>
                    <textarea value={form.description || ''} onChange={(e) => updateField('description', e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" placeholder="描述需求的业务背景、目标、预期效果..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">提交人</label>
                    <input type="text" value={form.submitterName || ''} onChange={(e) => updateField('submitterName', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="提交人姓名..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">产品经理</label>
                    <input type="text" value={form.productManager || ''} onChange={(e) => updateField('productManager', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="产品经理姓名..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">开发负责人</label>
                    <input type="text" value={form.developer || ''} onChange={(e) => updateField('developer', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="开发负责人姓名..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">提交日期</label>
                    <input type="date" value={form.submitDate} onChange={(e) => updateField('submitDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">需求来源</label>
                    <select value={form.submitter} onChange={(e) => updateField('submitter', e.target.value as '业务' | '产品' | '技术')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="业务">业务</option>
                      <option value="产品">产品</option>
                      <option value="技术">技术</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">需求类型</label>
                    <select value={form.type} onChange={(e) => updateField('type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="功能开发">功能开发</option>
                      <option value="Bug修复">Bug修复</option>
                      <option value="技术优化">技术优化</option>
                      <option value="体验优化">体验优化</option>
                      <option value="数据需求">数据需求</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">业务域</label>
                    <select value={form.businessDomain} onChange={(e) => updateField('businessDomain', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="国际零售通用">国际零售通用</option>
                      <option value="国际自营">国际自营</option>
                      <option value="国际平台">国际平台</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">业务团队</label>
                    <select value={form.businessTeam || ''} onChange={(e) => updateField('businessTeam', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">请选择...</option>
                      {hqRolesOnly.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">产品进展</label>
                    <select value={form.productProgress || '待评估'} onChange={(e) => updateField('productProgress', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="待评估">待评估</option>
                      <option value="未评估">未评估</option>
                      <option value="已完成产品方案">已完成产品方案</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">技术进展</label>
                    <select value={form.techProgress || '待评估'} onChange={(e) => updateField('techProgress', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="待评估">待评估</option>
                      <option value="未评估">未评估</option>
                      <option value="已评估工作量">已评估工作量</option>
                      <option value="已完成技术方案">已完成技术方案</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Target size={20} className="text-purple-600" />业务影响评估
                  </h3>
                  <button onClick={() => setIsHandbookOpen(true)} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <Info size={16} />查看评分标准
                  </button>
                </div>
                <BusinessImpactScoreSelector value={form.businessImpactScore || 5} onChange={(score) => updateField('businessImpactScore', score)} scoringStandards={scoringStandards} />
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">业务影响度 (BV)</label>
                  <select value={form.bv || '明显'} onChange={(e) => updateField('bv', e.target.value as '局部' | '明显' | '撬动核心' | '战略平台')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="局部">局部 (3分)</option>
                    <option value="明显">明显 (6分)</option>
                    <option value="撬动核心">撬动核心 (8分)</option>
                    <option value="战略平台">战略平台 (10分)</option>
                  </select>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">时间窗口 (TC)</label>
                  <select value={form.tc || '随时'} onChange={(e) => updateField('tc', e.target.value as '随时' | '三月窗口' | '一月硬窗口')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="随时">随时 (0分) - {TIME_CRITICALITY_DESCRIPTIONS['随时']}</option>
                    <option value="三月窗口">三月窗口 (3分) - {TIME_CRITICALITY_DESCRIPTIONS['三月窗口']}</option>
                    <option value="一月硬窗口">一月硬窗口 (5分) - {TIME_CRITICALITY_DESCRIPTIONS['一月硬窗口']}</option>
                  </select>
                </div>
                <div className="mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.hardDeadline} onChange={(e) => updateField('hardDeadline', e.target.checked)} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">有强制截止日期 (DDL +5分)</span>
                  </label>
                  {form.hardDeadline && <input type="date" value={form.deadlineDate || ''} onChange={(e) => updateField('deadlineDate', e.target.value || undefined)} className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />}
                </div>
                <div className="mt-4">
                  <button onClick={() => setIsMetricsExpanded(!isMetricsExpanded)} className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    <span className="text-sm font-medium text-gray-700">影响的核心指标 ({(form.affectedMetrics || []).length}个)</span>
                    <span className={`transform transition-transform ${isMetricsExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {isMetricsExpanded && <div className="mt-2"><MetricSelector value={form.affectedMetrics || []} okrMetrics={okrMetrics} processMetrics={processMetrics} onChange={(metrics) => updateField('affectedMetrics', metrics)} /></div>}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <button onClick={() => setIsRelevanceExpanded(!isRelevanceExpanded)} className="w-full flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Store size={20} className="text-green-600" />影响范围 (可选)
                  </h3>
                  <span className={`transform transition-transform ${isRelevanceExpanded ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {isRelevanceExpanded && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">门店类型</label>
                      <div className="flex flex-wrap gap-2">
                        {availableStoreTypes.map(type => (
                          <label key={type} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" checked={(form.impactScope?.storeTypes || []).includes(type)} onChange={(e) => {
                              const current = form.impactScope?.storeTypes || [];
                              updateField('impactScope', { storeTypes: e.target.checked ? [...current, type] : current.filter(t => t !== type), regions: form.impactScope?.regions || [], keyRoles: form.impactScope?.keyRoles || [], storeCountRange: form.impactScope?.storeCountRange });
                            }} className="w-4 h-4" />
                            <span className="text-sm">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">区域</label>
                      <div className="flex flex-wrap gap-2">
                        {REGIONS.map(region => {
                          const regionName = typeof region === 'string' ? region : region.name;
                          return (
                            <label key={regionName} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                              <input type="checkbox" checked={(form.impactScope?.regions || []).includes(regionName)} onChange={(e) => {
                                const current = form.impactScope?.regions || [];
                                updateField('impactScope', { storeTypes: form.impactScope?.storeTypes || [], regions: e.target.checked ? [...current, regionName] : current.filter(r => r !== regionName), keyRoles: form.impactScope?.keyRoles || [], storeCountRange: form.impactScope?.storeCountRange });
                              }} className="w-4 h-4" />
                              <span className="text-sm">{regionName}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Users size={16} className="inline mr-1" />关键角色
                      </label>
                      {availableRoleConfigs.map(config => (
                        <div key={config.category} className="mb-3">
                          <div className="text-xs font-semibold text-gray-600 mb-1.5">{config.category}</div>
                          <div className="flex flex-wrap gap-2">
                            {config.roles.map(role => {
                              const isSelected = (form.impactScope?.keyRoles || []).some(kr => kr.roleName === role);
                              return (
                                <label key={role} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                  <input type="checkbox" checked={isSelected} onChange={(e) => {
                                    const current = form.impactScope?.keyRoles || [];
                                    updateField('impactScope', { storeTypes: form.impactScope?.storeTypes || [], regions: form.impactScope?.regions || [], keyRoles: e.target.checked ? [...current, { roleName: role, category: config.category, isCustom: false }] : current.filter(kr => kr.roleName !== role), storeCountRange: form.impactScope?.storeCountRange });
                                  }} className="w-4 h-4" />
                                  <span className="text-sm">{role}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">门店数量范围</label>
                      <select value={form.impactScope?.storeCountRange || ''} onChange={(e) => updateField('impactScope', { storeTypes: form.impactScope?.storeTypes || [], regions: form.impactScope?.regions || [], keyRoles: form.impactScope?.keyRoles || [], storeCountRange: e.target.value || undefined })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">不限</option>
                        {STORE_COUNT_RANGES.map(range => <option key={range} value={range}>{range}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <LinkIcon size={20} className="text-blue-600" />文档与AI分析
                </h3>
                <div className="space-y-3 mb-4">
                  <label className="block text-sm font-medium text-gray-700">添加文档链接</label>
                  <div className="flex gap-2">
                    <input type="text" value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} placeholder="标题 (可选，留空自动提取)" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    <input type="url" value={newDocUrl} onChange={(e) => handleUrlChange(e.target.value)} placeholder="文档URL..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    <button onClick={addDocument} disabled={!newDocUrl.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition">添加</button>
                  </div>
                  {documents.length > 0 && (
                    <div className="space-y-2">
                      {documents.map((doc, idx) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-white border border-gray-300 rounded-lg">
                          <div className="flex-1">
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{doc.fileName}</a>
                          </div>
                          <button onClick={() => removeDocument(idx)} className="text-red-600 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">或上传文件 (PDF/Excel)</label>
                  <div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                      <Upload size={18} /><span className="text-sm">选择文件</span>
                      <input type="file" accept=".pdf,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">支持 PDF、Excel，最大 10MB</p>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      {uploadedFiles.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <FileText size={16} className="text-gray-500" />
                              <span className="text-sm font-medium">{file.name}</span>
                              {file.parseStatus === 'parsing' && <Loader size={14} className="animate-spin text-blue-600" />}
                              {file.parseStatus === 'success' && <CheckCircle size={14} className="text-green-600" />}
                              {file.parseStatus === 'error' && <AlertCircle size={14} className="text-red-600" />}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatFileSize(file.size)}
                              {file.parsedWordCount !== undefined && ` • ${file.parsedWordCount.toLocaleString()} 字符`}
                              {file.errorMessage && <span className="text-orange-600 ml-2">{file.errorMessage}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {file.parseStatus === 'success' && file.parsedContent && (
                              <button onClick={() => previewFileFn(file.id)} className="text-blue-600 hover:text-blue-700 p-1" title="预览内容"><Eye size={16} /></button>
                            )}
                            <button onClick={() => removeFile(file.id)} className="text-red-600 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <button onClick={() => setIsAISectionExpanded(!isAISectionExpanded)} className="w-full flex items-center justify-between mb-3">
                    <h4 className="text-md font-semibold text-gray-700 flex items-center gap-2">
                      <Sparkles size={18} className="text-purple-600" />AI 智能分析
                    </h4>
                    <span className={`transform transition-transform ${isAISectionExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {isAISectionExpanded && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Settings size={16} className="text-gray-500" />
                        <label className="flex items-center gap-2">
                          <input type="radio" checked={selectedAIModel === 'deepseek'} onChange={() => changeModel('deepseek')} className="w-4 h-4" />
                          <span className="text-sm">DeepSeek</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" checked={selectedAIModel === 'openai'} onChange={() => changeModel('openai')} className="w-4 h-4" />
                          <span className="text-sm">OpenAI</span>
                        </label>
                      </div>
                      <button onClick={() => analyze(form, uploadedFiles, newDocUrl, newDocTitle, addDocument)} disabled={isAnalyzing} className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                        {isAnalyzing ? (<><Loader size={18} className="animate-spin" />{analysisStep || '分析中...'}</>) : (<><Sparkles size={18} />开始AI分析</>)}
                      </button>
                      {isAnalyzing && analysisProgress > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${analysisProgress}%` }} />
                        </div>
                      )}
                      {aiError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{aiError}</div>}
                      {analysisResult && !isAIPanelCollapsed && (
                        <AIAnalysisPanel
                          analysisResult={analysisResult}
                          adoptionStatus={aiAdoptionStatus}
                          adoptedItems={aiAdoptedItems}
                          currentForm={form}
                          onAdoptAll={adoptAll}
                          onAdoptScoreOnly={adoptScoreOnly}
                          onAdoptOKRMetrics={adoptOKRMetrics}
                          onAdoptProcessMetrics={adoptProcessMetrics}
                          onIgnore={handleIgnoreAI}
                          onReanalyze={() => reanalyze(form, uploadedFiles, newDocUrl, newDocTitle, addDocument)}
                          onClose={() => setIsAIPanelCollapsed(true)}
                          onUpdateFields={updateFields}
                        />
                      )}
                      {analysisResult && isAIPanelCollapsed && (
                        <button onClick={() => setIsAIPanelCollapsed(false)} className="w-full px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm">
                          查看AI建议 ({aiAdoptionStatus === 'adopted' ? '已采纳' : aiAdoptionStatus === 'partial' ? '部分采纳' : '待处理'})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Settings size={20} className="text-orange-600" />技术评估
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">工作量 (人天)</label>
                    <input type="number" value={form.effortDays} onChange={(e) => updateField('effortDays', Math.max(0, parseFloat(e.target.value) || 0))} disabled={!canEditEffort} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" placeholder="输入工作量..." />
                    {!canEditEffort && <p className="text-xs text-gray-500 mt-1">需要"已评估工作量"或"已完成技术方案"后才能填写</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">技术复杂度</label>
                    <select value={form.complexityScore} onChange={(e) => updateField('complexityScore', parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      {COMPLEXITY_STANDARDS.map(std => <option key={std.score} value={std.score}>{std.score}分 - {std.name}</option>)}
                    </select>
                  </div>
                  {selectedStandard && (
                    <div className="col-span-2 p-3 bg-white rounded-lg border border-gray-300">
                      <div className="text-sm font-medium text-gray-800 mb-1">{selectedStandard.name}：{selectedStandard.shortDescription}</div>
                      <div className="text-gray-600 text-xs">参考工作量：{selectedStandard.estimatedEffort}</div>
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.isRMS} onChange={(e) => updateField('isRMS', e.target.checked)} className="w-4 h-4" />
                      <span className="text-sm font-medium text-gray-700">是否属于 RMS 项目</span>
                    </label>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">产研备注/进展说明</label>
                    <textarea value={form.rdNotes || ''} onChange={(e) => updateField('rdNotes', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" placeholder="填写产研进展、技术方案要点、风险提示等..." />
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-gray-700 mb-2">权重分预览</div>
                  <div className="flex items-center gap-4">
                    <div><span className="text-xs text-gray-600">原始分：</span><span className="ml-1 font-bold text-lg">{previewScore.raw}</span></div>
                    <div><span className="text-xs text-gray-600">展示分：</span><span className="ml-1 font-bold text-lg text-blue-600">{previewScore.display}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3 z-10">
            <button onClick={onClose} className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">取消</button>
            <button onClick={handleSave} disabled={!form.name.trim()} className={`px-6 py-2.5 rounded-lg transition font-medium flex items-center gap-2 ${form.name.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
              <Save size={18} />保存
            </button>
          </div>
        </div>
      </div>

      <ScoringStandardsHandbook isOpen={isHandbookOpen} onClose={() => setIsHandbookOpen(false)} scoringStandards={scoringStandards} />
      <FilePreviewModal file={previewFileData || null} onClose={closePreview} />
    </>
  );
};

export default EditRequirementModal;
