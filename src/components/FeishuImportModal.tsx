/**
 * 飞书导入Modal组件
 *
 * 集成飞书认证、项目选择、任务预览和导入功能
 * 文件大小控制: < 500行
 */

import { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, LogIn } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useFeishuAuth } from '../hooks/useFeishuAuth';
import { useFeishuSync } from '../hooks/useFeishuSync';
import { transformWorkItems } from '../utils/feishu/feishuDataTransform';
import { DEFAULT_FIELD_MAPPINGS } from '../utils/feishu/feishuFieldMapper';
import { maskSecret, startOAuthFlow } from '../services/feishu';
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
    authManager,
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

  // 授权模式和token
  const [authMode, setAuthMode] = useState<'oauth' | 'manual'>('manual'); // 默认手动模式（更快）
  const [manualToken, setManualToken] = useState('');
  const [usePluginHeader, setUsePluginHeader] = useState(true); // 默认使用插件Header
  const [isAuthorized, setIsAuthorized] = useState(false);

  // 初始化：检查是否已有配置和授权
  useEffect(() => {
    if (isOpen) {
      if (config) {
        setPluginId(config.pluginId);
        setPluginSecret(config.pluginSecret);
        setAuthMode(config.authMode === 'manual' ? 'manual' : 'oauth');
        setManualToken(config.manualToken || '');
        setUsePluginHeader(config.usePluginHeader || false);

        // 检查是否已授权
        const authorized = authManager?.isAuthorized() || false;
        setIsAuthorized(authorized);

        if (authorized) {
          setStep('project');
        } else {
          setStep('config');
        }
      } else {
        setStep('config');
        setIsAuthorized(false);
      }
    }
  }, [config, isOpen, authManager]);

  // 关闭Modal时重置状态
  const handleClose = () => {
    reset();
    setSelectedWorkItemIds(new Set());
    setTransformedRequirements([]);
    onClose();
  };

  // 保存配置（手动Token模式）
  const handleSaveManualToken = () => {
    if (!pluginId || !pluginSecret) {
      showToast('请填写Plugin ID和Secret', 'error');
      return;
    }

    if (!manualToken.trim()) {
      showToast('请填写Plugin Token', 'error');
      return;
    }

    // 保存配置（manual模式）
    saveConfig(pluginId, pluginSecret, manualToken, usePluginHeader);
    setIsAuthorized(true);
    showToast('Token已保存，可以开始导入', 'success');

    // 进入下一步
    setStep('project');
    fetchProjects();
  };

  // 启动OAuth授权
  const handleStartAuth = () => {
    if (!pluginId || !pluginSecret) {
      showToast('请填写完整的应用信息', 'error');
      return;
    }

    // 保存配置（user模式）
    saveConfig(pluginId, pluginSecret);

    // 启动OAuth授权流程（跳转到飞书授权页面）
    if (config) {
      try {
        startOAuthFlow(config);
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : '启动授权失败',
          'error'
        );
      }
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
          {/* 步骤1: 配置和授权 */}
          {step === 'config' && (
            <div className="space-y-6">
              {/* 说明 */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
                  <div className="text-sm text-gray-800">
                    <p className="font-bold text-lg mb-2">✨ 快速模式（推荐）</p>
                    <p className="mb-2">
                      使用<span className="font-bold text-green-600">手动Token</span>模式，
                      <span className="font-bold text-blue-600">立即可用</span>，
                      无需复杂配置！
                    </p>
                  </div>
                </div>
              </div>

              {!isAuthorized ? (
                <>
                  {/* 授权模式选择 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      授权方式 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setAuthMode('manual')}
                        className={`flex-1 px-4 py-3 border-2 rounded-lg text-left transition ${
                          authMode === 'manual'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-bold text-sm">手动Token（推荐）</p>
                        <p className="text-xs text-gray-600 mt-1">
                          ⚡ 立即可用，无需OAuth配置
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthMode('oauth')}
                        className={`flex-1 px-4 py-3 border-2 rounded-lg text-left transition ${
                          authMode === 'oauth'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-bold text-sm">OAuth授权</p>
                        <p className="text-xs text-gray-600 mt-1">
                          🔐 需要配置回调URL
                        </p>
                      </button>
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
                      placeholder="MII_68F1064FA240006C"
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
                      placeholder="050E***********64F"
                    />
                  </div>

                  {/* 手动Token模式的额外输入 */}
                  {authMode === 'manual' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Plugin Token <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={manualToken}
                          onChange={(e) => setManualToken(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                          placeholder="p-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          从飞书开放平台获取（详见下方说明）
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="usePluginHeader"
                          checked={usePluginHeader}
                          onChange={(e) => setUsePluginHeader(e.target.checked)}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <label htmlFor="usePluginHeader" className="text-sm text-gray-700">
                          使用飞书项目插件Header（X-Plugin-Token）
                        </label>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                        <p className="font-bold mb-2">📖 如何获取Plugin Token：</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs">
                          <li>在飞书开放平台 → 您的插件 → 开发 → 权限管理</li>
                          <li>找到"虚拟plugin_token"或"测试Token"</li>
                          <li>复制token粘贴到上方输入框</li>
                          <li>勾选"使用飞书项目插件Header"</li>
                          <li>点击"保存并测试"</li>
                        </ol>
                      </div>
                    </>
                  )}

                  {/* OAuth模式的提示 */}
                  {authMode === 'oauth' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        💡 <span className="font-bold">OAuth模式需要额外配置</span>：
                        需要在飞书开放平台配置回调URL。
                        <br />
                        建议先使用"手动Token"模式快速测试！
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-bold text-green-900 text-lg">✅ 已配置</p>
                      <p className="text-sm text-green-700 mt-1">
                        Token已保存，可以访问飞书项目数据
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        模式: {authMode === 'manual' ? '手动Token' : 'OAuth授权'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      authManager?.clearToken();
                      setIsAuthorized(false);
                      setManualToken('');
                      showToast('已清除配置，请重新配置', 'info');
                    }}
                    className="mt-4 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white transition"
                  >
                    重新配置
                  </button>
                </div>
              )}
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
              isAuthorized ? (
                <button
                  type="button"
                  onClick={() => {
                    setStep('project');
                    fetchProjects();
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  继续导入
                </button>
              ) : authMode === 'manual' ? (
                <button
                  type="button"
                  onClick={handleSaveManualToken}
                  disabled={!pluginId || !pluginSecret || !manualToken}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-300 flex items-center gap-2 font-bold"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  保存并测试
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartAuth}
                  disabled={!pluginId || !pluginSecret}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-300 flex items-center gap-2 font-bold"
                >
                  <LogIn className="w-5 h-5" />
                  开始OAuth授权
                </button>
              )
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
