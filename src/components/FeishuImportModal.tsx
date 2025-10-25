/**
 * 飞书导入Modal组件
 *
 * 集成飞书认证、项目选择、任务预览和导入功能
 * 文件大小控制: < 500行
 */

import { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useFeishuAuth } from '../hooks/useFeishuAuth';
import { useFeishuSync } from '../hooks/useFeishuSync';
import { transformWorkItems } from '../utils/feishu/feishuDataTransform';
import { DEFAULT_FIELD_MAPPINGS } from '../utils/feishu/feishuFieldMapper';
import { maskSecret } from '../services/feishu';
import type { FeishuProject, FeishuWorkItem } from '../services/feishu';
import type { Requirement } from '../types';

export interface FeishuImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (requirements: Requirement[]) => void;
}

export function FeishuImportModal({
  isOpen,
  onClose,
  onImport,
}: FeishuImportModalProps) {
  const { showToast } = useToast();
  const {
    config,
    isConnected,
    isLoading: authLoading,
    saveConfig,
    testConnection,
  } = useFeishuAuth({ showToast });

  const {
    projects,
    workItems,
    selectedProject,
    isLoading: syncLoading,
    progress,
    currentAction,
    fetchProjects,
    selectProject,
    fetchWorkItems,
    reset,
  } = useFeishuSync({ config, showToast });

  const [step, setStep] = useState<'config' | 'project' | 'tasks' | 'confirm'>('config');
  const [pluginId, setPluginId] = useState('');
  const [pluginSecret, setPluginSecret] = useState('');
  const [selectedWorkItemIds, setSelectedWorkItemIds] = useState<Set<string>>(new Set());
  const [transformedRequirements, setTransformedRequirements] = useState<Requirement[]>([]);

  // 初始化：检查是否已有配置
  useEffect(() => {
    if (config && isOpen) {
      setStep('project');
      setPluginId(config.pluginId);
      setPluginSecret(config.pluginSecret);
    } else if (isOpen) {
      setStep('config');
    }
  }, [config, isOpen]);

  // 关闭Modal时重置状态
  const handleClose = () => {
    reset();
    setSelectedWorkItemIds(new Set());
    setTransformedRequirements([]);
    onClose();
  };

  // 保存配置并测试连接
  const handleSaveConfig = async () => {
    if (!pluginId || !pluginSecret) {
      showToast('请填写完整的认证信息', 'error');
      return;
    }

    saveConfig(pluginId, pluginSecret);

    // 测试连接
    const success = await testConnection();
    if (success) {
      setStep('project');
      // 自动获取项目列表
      fetchProjects();
    }
  };

  // 选择项目并获取工作项
  const handleSelectProject = async (project: FeishuProject) => {
    selectProject(project);
    setStep('tasks');
    await fetchWorkItems(project.id);
  };

  // 切换工作项选择
  const toggleWorkItem = (workItemId: string) => {
    const newSet = new Set(selectedWorkItemIds);
    if (newSet.has(workItemId)) {
      newSet.delete(workItemId);
    } else {
      newSet.add(workItemId);
    }
    setSelectedWorkItemIds(newSet);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedWorkItemIds.size === workItems.length) {
      setSelectedWorkItemIds(new Set());
    } else {
      setSelectedWorkItemIds(new Set(workItems.map(item => item.id)));
    }
  };

  // 预览导入
  const handlePreview = () => {
    const selected = workItems.filter(item => selectedWorkItemIds.has(item.id));

    if (selected.length === 0) {
      showToast('请至少选择一个任务', 'error');
      return;
    }

    // 转换数据
    const result = transformWorkItems(selected, DEFAULT_FIELD_MAPPINGS, {
      defaultSubmitter: '业务',
      defaultBusinessDomain: '国际零售通用',
    });

    if (result.failed.length > 0) {
      showToast(
        `${result.failed.length} 个任务转换失败，请查看详情`,
        'error'
      );
    }

    setTransformedRequirements(result.success);
    setStep('confirm');
  };

  // 确认导入
  const handleConfirmImport = () => {
    onImport(transformedRequirements);
    showToast(`成功导入 ${transformedRequirements.length} 个需求`, 'success');
    handleClose();
  };

  if (!isOpen) return null;

  const isLoading = authLoading || syncLoading;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">从飞书导入需求</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 步骤指示器 */}
        <div className="px-6 py-4 border-b flex items-center justify-center gap-8">
          {['配置', '选择项目', '选择任务', '确认导入'].map((label, idx) => {
            const stepValue = ['config', 'project', 'tasks', 'confirm'][idx];
            const isActive = step === stepValue;
            const stepIndex = ['config', 'project', 'tasks', 'confirm'].indexOf(step);
            const isCompleted = stepIndex > idx;

            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                </div>
                <span
                  className={`text-sm ${
                    isActive ? 'font-bold text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* 加载进度条 */}
        {isLoading && (
          <div className="px-6 py-3 bg-blue-50 border-b">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <div className="flex-1">
                <div className="text-sm text-gray-700 mb-1">{currentAction}</div>
                {progress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-6">
          {/* 步骤1: 飞书认证配置 */}
          {step === 'config' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">配置说明：</p>
                    <p>请前往飞书开放平台创建应用，获取 Plugin ID 和 Plugin Secret</p>
                    <p className="mt-1 text-xs">
                      文档：
                      <a
                        href="https://open.feishu.cn"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline ml-1"
                      >
                        https://open.feishu.cn
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plugin ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={pluginId}
                  onChange={(e) => setPluginId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入 Plugin ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plugin Secret <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={pluginSecret}
                  onChange={(e) => setPluginSecret(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入 Plugin Secret"
                />
                {config && (
                  <p className="text-xs text-gray-500 mt-1">
                    当前配置：{maskSecret(config.pluginSecret)}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isConnected && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>连接成功</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 步骤2: 选择项目 */}
          {step === 'project' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">选择飞书项目</h3>
                <button
                  type="button"
                  onClick={() => fetchProjects()}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
                >
                  刷新列表
                </button>
              </div>

              {projects.length === 0 && !isLoading ? (
                <div className="text-center py-12 text-gray-500">
                  <p>暂无项目</p>
                  <p className="text-sm mt-2">请点击"刷新列表"获取项目</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => handleSelectProject(project)}
                      className="text-left p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <h4 className="font-bold text-gray-900">{project.name}</h4>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>状态: {project.status}</span>
                        <span>
                          创建时间:{' '}
                          {new Date(project.created_at * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 步骤3: 选择任务 */}
          {step === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">
                  选择任务 - {selectedProject?.name}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                  >
                    {selectedWorkItemIds.size === workItems.length
                      ? '取消全选'
                      : '全选'}
                  </button>
                  <span className="text-sm text-gray-600">
                    已选择 {selectedWorkItemIds.size} / {workItems.length}
                  </span>
                </div>
              </div>

              {workItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>该项目暂无任务</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="w-12 px-4 py-2"></th>
                          <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">
                            任务名称
                          </th>
                          <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">
                            状态
                          </th>
                          <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">
                            负责人
                          </th>
                          <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">
                            预估工时
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {workItems.map((item) => (
                          <tr
                            key={item.id}
                            className={`border-t hover:bg-gray-50 ${
                              selectedWorkItemIds.has(item.id) ? 'bg-blue-50' : ''
                            }`}
                          >
                            <td className="px-4 py-2">
                              <input
                                type="checkbox"
                                checked={selectedWorkItemIds.has(item.id)}
                                onChange={() => toggleWorkItem(item.id)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                            </td>
                            <td className="px-4 py-2 text-sm">{item.name}</td>
                            <td className="px-4 py-2 text-sm">{item.status}</td>
                            <td className="px-4 py-2 text-sm">
                              {item.assignee?.name || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {item.estimated_hours
                                ? `${item.estimated_hours}h`
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 步骤4: 确认导入 */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg">
                确认导入 ({transformedRequirements.length} 个需求)
              </h3>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2">需求名称</th>
                        <th className="text-left px-4 py-2">提交人</th>
                        <th className="text-left px-4 py-2">工作量(天)</th>
                        <th className="text-left px-4 py-2">技术进度</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transformedRequirements.map((req, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2">{req.name}</td>
                          <td className="px-4 py-2">{req.submitterName}</td>
                          <td className="px-4 py-2">{req.effortDays}</td>
                          <td className="px-4 py-2">{req.techProgress}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ 导入后，这些需求将添加到待排期区域
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="border-t px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            取消
          </button>

          <div className="flex gap-2">
            {step !== 'config' && (
              <button
                type="button"
                onClick={() => {
                  const steps = ['config', 'project', 'tasks', 'confirm'];
                  const currentIndex = steps.indexOf(step);
                  setStep(steps[currentIndex - 1] as typeof step);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                上一步
              </button>
            )}

            {step === 'config' && (
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
              >
                {isLoading ? '连接中...' : '保存并连接'}
              </button>
            )}

            {step === 'tasks' && (
              <button
                type="button"
                onClick={handlePreview}
                disabled={selectedWorkItemIds.size === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
              >
                下一步
              </button>
            )}

            {step === 'confirm' && (
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                确认导入
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
