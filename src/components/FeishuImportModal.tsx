/**
 * 飞书导入Modal组件
 *
 * 集成飞书认证、项目选择、任务预览和导入功能
 * 文件大小控制: < 500行
 */

import { useState, useEffect } from 'react';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useFeishuAuth } from '../hooks/useFeishuAuth';
import { useFeishuSync } from '../hooks/useFeishuSync';
import { transformWorkItems } from '../utils/feishu/feishuDataTransform';
import { DEFAULT_FIELD_MAPPINGS } from '../utils/feishu/feishuFieldMapper';
// import { startOAuthFlow } from '../services/feishu'; // OAuth功能暂未启用
import type { FeishuProject } from '../services/feishu';
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
    isLoading: authLoading,
    saveConfig,
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
  const [pluginId, setPluginId] = useState('MII_68F1064FA240006C'); // 预填Plugin ID
  const [pluginSecret, setPluginSecret] = useState('050E0E049ACB87339CB9D11E5641564F'); // 预填Plugin Secret
  const [selectedWorkItemIds, setSelectedWorkItemIds] = useState<Set<string>>(new Set());
  const [transformedRequirements, setTransformedRequirements] = useState<Requirement[]>([]);

  // 配置信息
  const [manualToken, setManualToken] = useState('');
  const [userKey, setUserKey] = useState(''); // 用户需要输入自己的User Key
  const [platformDomain, setPlatformDomain] = useState('https://project.f.mioffice.cn'); // 平台域名
  const [workItemTypeName, setWorkItemTypeName] = useState('story'); // 工作项类型（story=需求）
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false); // 是否显示高级配置

  // 初始化：仅在Modal首次打开时加载配置
  useEffect(() => {
    if (isOpen) {
      if (config) {
        // 加载已有配置
        setPluginId(config.pluginId);
        setPluginSecret(config.pluginSecret);
        setManualToken(config.manualToken || '');
        setPlatformDomain(config.baseUrl || 'https://project.f.mioffice.cn');
        setWorkItemTypeName(config.workItemTypeKey || '');
        setIsAuthorized(true);
        // 注意：不在这里设置step，让用户通过按钮控制流程
      } else {
        // 首次使用，初始化为配置步骤
        setStep('config');
        setIsAuthorized(false);
      }
    }
  }, [isOpen]); // 只依赖isOpen，避免config变化时重复执行

  // 关闭Modal时重置状态
  const handleClose = () => {
    reset();
    setSelectedWorkItemIds(new Set());
    setTransformedRequirements([]);
    onClose();
  };

  // 保存配置
  const handleSaveConfig = () => {
    console.log('[FeishuImportModal] handleSaveConfig called');

    if (!pluginId || !pluginSecret) {
      showToast('请填写Plugin ID和Secret', 'error');
      return;
    }

    if (!userKey.trim()) {
      showToast('请填写User Key', 'error');
      return;
    }

    // Token留空时提示将自动获取
    if (!manualToken.trim()) {
      showToast('配置已保存，系统将自动获取Token', 'success');
    } else {
      showToast('配置已保存，可以开始导入', 'success');
    }

    console.log('[FeishuImportModal] Calling saveConfig with workItemTypeKey:', workItemTypeName);
    saveConfig(pluginId, pluginSecret, manualToken || '', true, platformDomain, userKey, workItemTypeName);

    console.log('[FeishuImportModal] Setting isAuthorized = true');
    setIsAuthorized(true);

    console.log('[FeishuImportModal] Setting step = project');
    setStep('project');

    console.log('[FeishuImportModal] handleSaveConfig completed');
  };

  // OAuth授权功能暂未启用（保留配置供未来使用）

  // 选择项目并获取工作项
  const handleSelectProject = async (project: FeishuProject) => {
    console.log('[FeishuImportModal] Selecting project, workItemTypeKey:', workItemTypeName);
    selectProject(project);
    setStep('tasks');
    await fetchWorkItems(project.id, workItemTypeName);
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

    console.log('[FeishuImportModal] Selected work items:', selected.length);
    console.log('[FeishuImportModal] First work item sample:', selected[0]);

    // 详细分析fields结构，方便字段映射
    const firstItem = selected[0] as any;
    if (firstItem && firstItem.fields) {
      console.log('[FeishuImportModal] Fields count:', firstItem.fields.length);
      console.log('[FeishuImportModal] Sample fields (first 10):', firstItem.fields.slice(0, 10));

      // 打印所有字段的key和value
      const fieldMap: any = {};
      firstItem.fields.forEach((f: any) => {
        const key = f.field_key || f.key;
        const value = f.field_value?.value || f.field_value || f.value;
        if (key && value !== undefined && value !== null && value !== '') {
          fieldMap[key] = value;
        }
      });
      console.log('[FeishuImportModal] Non-empty fields map:', fieldMap);
    }

    if (selected.length === 0) {
      showToast('请至少选择一个任务', 'error');
      return;
    }

    // 转换数据 (使用 any 避免类型错误)
    const result = transformWorkItems(selected as any[], DEFAULT_FIELD_MAPPINGS, {
      defaultSubmitter: '业务',
      defaultBusinessDomain: '国际零售通用',
    });

    console.log('[FeishuImportModal] Transform result:', {
      success: result.success.length,
      failed: result.failed.length,
    });

    if (result.failed.length > 0) {
      console.log('[FeishuImportModal] Failed items:', result.failed);
      showToast(
        `${result.failed.length} 个任务转换失败，请查看详情`,
        'error'
      );
    }

    if (result.success.length === 0) {
      console.error('[FeishuImportModal] All items failed to transform!');
      showToast('所有任务转换失败，请检查数据格式', 'error');
      return;
    }

    console.log('[FeishuImportModal] Transformed requirements:', result.success.length);
    setTransformedRequirements(result.success);
    setStep('confirm');
  };

  // 确认导入
  const handleConfirmImport = () => {
    onImport(transformedRequirements);
    showToast(`成功导入 ${transformedRequirements.length} 个需求`, 'success');
    handleClose();
  };

  if (!isOpen) {
    console.log('[FeishuImportModal] Modal is closed (isOpen=false)');
    return null;
  }

  console.log('[FeishuImportModal] Modal is rendering, step:', step, 'isAuthorized:', isAuthorized);

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
          {['配置', '选择空间', '选择任务', '确认导入'].map((label, idx) => {
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
                  {/* 主要配置 - User Key */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Key <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={userKey}
                        onChange={(e) => setUserKey(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                        placeholder="7541721806923694188"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const script = `// 一键获取User Key
(function() {
  // 尝试从Cookie提取
  const cookieMatch = document.cookie.match(/(?:^|; )(?:user_key|userKey)=([\\d]+)/);
  if (cookieMatch) {
    navigator.clipboard.writeText(cookieMatch[1]);
    alert('✅ User Key已复制: ' + cookieMatch[1] + '\\n\\n请回到WSJF粘贴！');
    return;
  }

  // 尝试从localStorage提取
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    if (value) {
      const match = value.match(/"(?:user_key|userKey)":\\s*"([\\d]{15,20})"/);
      if (match) {
        navigator.clipboard.writeText(match[1]);
        alert('✅ User Key已复制: ' + match[1] + '\\n\\n请回到WSJF粘贴！');
        return;
      }
    }
  }

  // 引导用户手动查找
  alert('⚠️ 自动检测失败\\n\\n请手动查找：\\n1. 刷新当前页面（F5）\\n2. 按F12 → Network → XHR\\n3. 点击任意请求\\n4. 在Headers中找到 X-User-Key\\n5. 复制这个值到WSJF');
})();`;

                          // 显示获取指引
                          const message = `📖 获取User Key - 超简单方法（30秒）

步骤1️⃣：打开飞书项目管理平台
访问：https://project.f.mioffice.cn
（在新标签页打开）

步骤2️⃣：运行自动脚本
1. 在飞书页面按F12打开Console
2. 粘贴以下代码并回车：

${script}

步骤3️⃣：User Key已自动复制！
回到WSJF，直接粘贴到User Key字段即可。

━━━━━━━━━━━━━━━━━━━━━━

📋 脚本已复制到剪贴板！
直接在飞书Console粘贴即可。

如果自动检测失败，会引导您手动查找。`;

                          // 复制脚本到剪贴板
                          navigator.clipboard.writeText(script).then(() => {
                            alert(message);
                          });
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm whitespace-nowrap"
                      >
                        🔍 如何获取？
                      </button>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      👆 点击"如何获取？"按钮，获取简单脚本（30秒搞定）
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      工作项类型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={workItemTypeName}
                      onChange={(e) => setWorkItemTypeName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="story">需求 (story)</option>
                      <option value="bug">缺陷 (bug)</option>
                      <option value="task">任务 (task)</option>
                      <option value="project_node">项目 (project_node)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      选择要导入的工作项类型（通常选择"需求"）
                    </p>
                  </div>

                  {/* 高级配置（折叠） */}
                  <div className="border-t pt-4 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <span className="text-lg">{showAdvancedConfig ? '▼' : '▶'}</span>
                      <span>高级配置（通常无需修改）</span>
                    </button>

                    {showAdvancedConfig && (
                      <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plugin ID
                          </label>
                          <input
                            type="text"
                            value={pluginId}
                            onChange={(e) => setPluginId(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            placeholder="MII_68F1064FA240006C"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plugin Secret
                          </label>
                          <input
                            type="password"
                            value={pluginSecret}
                            onChange={(e) => setPluginSecret(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            placeholder="050E***********64F"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Platform Domain
                          </label>
                          <input
                            type="text"
                            value={platformDomain}
                            onChange={(e) => setPlatformDomain(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://project.f.mioffice.cn"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plugin Token（可选，留空自动获取）
                          </label>
                          <textarea
                            value={manualToken}
                            onChange={(e) => setManualToken(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            placeholder="留空让系统自动获取"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-bold text-gray-800 mb-2">🎉 自动Token管理</p>
                        <p className="text-gray-700 mb-2">
                          <span className="font-bold text-green-600">Token字段留空</span>，
                          系统会自动使用Plugin ID和Secret获取token，并在过期前自动刷新。
                        </p>
                        <p className="text-xs text-gray-600">
                          ✅ 无需手动获取token<br />
                          ✅ 无需担心过期<br />
                          ✅ 完全自动化管理
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleSaveConfig}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition"
                    >
                      保存并测试
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-bold text-green-900 text-lg">✅ 已配置</p>
                      <p className="text-sm text-green-700 mt-1">
                        配置已保存，系统会自动管理Token
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Token会自动获取并在过期前刷新
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
              ) : null
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
