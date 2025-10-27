/**
 * 飞书数据同步 Hook
 *
 * 管理飞书项目和工作项数据的获取和同步
 * 文件大小控制: < 300行
 */

import { useState, useCallback, useMemo } from 'react';
import type { FeishuConfig, FeishuProject, FeishuWorkItem } from '../services/feishu';
import { FeishuAPI, handleFeishuError } from '../services/feishu';

export interface UseFeishuSyncOptions {
  config: FeishuConfig | null;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export interface FeishuSyncState {
  projects: FeishuProject[];
  workItems: FeishuWorkItem[];
  selectedProject: FeishuProject | null;
  isLoading: boolean;
  progress: number;
  currentAction: string;
}

export function useFeishuSync({ config, showToast }: UseFeishuSyncOptions) {
  const [state, setState] = useState<FeishuSyncState>({
    projects: [],
    workItems: [],
    selectedProject: null,
    isLoading: false,
    progress: 0,
    currentAction: '',
  });

  // 创建API实例
  const api = useMemo(() => {
    return config ? new FeishuAPI(config) : null;
  }, [config]);

  /**
   * 更新状态（部分更新）
   */
  const updateState = useCallback(
    (partial: Partial<FeishuSyncState>) => {
      setState((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  /**
   * 获取所有项目
   */
  const fetchProjects = useCallback(
    async (spaceId?: string) => {
      if (!api) {
        showToast('请先配置飞书认证', 'error');
        return;
      }

      updateState({ isLoading: true, currentAction: '正在获取项目列表...' });

      try {
        const projects = await api.getAllProjects(spaceId);
        updateState({
          projects,
          isLoading: false,
          currentAction: '',
        });
        showToast(`成功获取 ${projects.length} 个项目`, 'success');
      } catch (error) {
        console.error('[useFeishuSync] Failed to fetch projects:', error);
        handleFeishuError(error, showToast);
        updateState({ isLoading: false, currentAction: '' });
      }
    },
    [api, showToast, updateState]
  );

  /**
   * 选择项目
   */
  const selectProject = useCallback(
    (project: FeishuProject) => {
      updateState({ selectedProject: project, workItems: [] });
    },
    [updateState]
  );

  /**
   * 获取工作项列表
   */
  const fetchWorkItems = useCallback(
    async (projectId: string, workItemTypeName?: string) => {
      if (!api) {
        showToast('请先配置飞书认证', 'error');
        return;
      }

      updateState({
        isLoading: true,
        progress: 0,
        currentAction: '正在获取任务列表...',
      });

      try {
        const items = await api.getAllWorkItems(
          projectId,
          (current, total) => {
            const progress = total ? (current / total) * 100 : 0;
            updateState({ progress });
          },
          workItemTypeName // 传递工作项类型名称
        );

        updateState({
          workItems: items,
          isLoading: false,
          progress: 100,
          currentAction: '',
        });

        showToast(`成功获取 ${items.length} 个任务`, 'success');
      } catch (error) {
        console.error('[useFeishuSync] Failed to fetch work items:', error);
        handleFeishuError(error, showToast);
        updateState({ isLoading: false, progress: 0, currentAction: '' });
      }
    },
    [api, showToast, updateState]
  );

  /**
   * 获取工作项详情（批量）
   */
  const fetchWorkItemDetails = useCallback(
    async (workItemIds: string[]) => {
      if (!api) {
        showToast('请先配置飞书认证', 'error');
        return [];
      }

      updateState({
        isLoading: true,
        progress: 0,
        currentAction: '正在获取任务详情...',
      });

      try {
        const items = await api.batchGetWorkItems(
          workItemIds,
          (current, total) => {
            const progress = (current / total) * 100;
            updateState({ progress });
          }
        );

        updateState({
          isLoading: false,
          progress: 100,
          currentAction: '',
        });

        return items;
      } catch (error) {
        console.error('[useFeishuSync] Failed to fetch work item details:', error);
        handleFeishuError(error, showToast);
        updateState({ isLoading: false, progress: 0, currentAction: '' });
        return [];
      }
    },
    [api, showToast, updateState]
  );

  /**
   * 清除数据
   */
  const clearData = useCallback(() => {
    updateState({
      projects: [],
      workItems: [],
      selectedProject: null,
      progress: 0,
      currentAction: '',
    });
  }, [updateState]);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setState({
      projects: [],
      workItems: [],
      selectedProject: null,
      isLoading: false,
      progress: 0,
      currentAction: '',
    });
  }, []);

  return {
    // 状态
    projects: state.projects,
    workItems: state.workItems,
    selectedProject: state.selectedProject,
    isLoading: state.isLoading,
    progress: state.progress,
    currentAction: state.currentAction,

    // 操作
    fetchProjects,
    selectProject,
    fetchWorkItems,
    fetchWorkItemDetails,
    clearData,
    reset,
  };
}
