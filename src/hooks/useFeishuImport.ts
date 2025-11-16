/**
 * useFeishuImport Hook
 *
 * 功能：
 * - 从飞书项目导入工作项
 * - 字段映射配置
 * - 数据预览和确认
 * - 增量同步支持
 */

import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  feishuMCPService,
  type FeishuQueryOptions,
  type FieldMapping,
  DEFAULT_FIELD_MAPPINGS,
} from '../services/feishuMCPService';
import type { Requirement } from '../types';

export interface FeishuImportState {
  // 加载状态
  loading: boolean;
  error: string | null;

  // 查询到的数据
  stories: any[];
  requirements: Requirement[];

  // 字段映射
  fieldMappings: FieldMapping[];

  // 选中状态
  selectedIds: Set<string>;
}

export function useFeishuImport() {
  const [state, setState] = useState<FeishuImportState>({
    loading: false,
    error: null,
    stories: [],
    requirements: [],
    fieldMappings: [...DEFAULT_FIELD_MAPPINGS],
    selectedIds: new Set(),
  });

  const { addRequirements } = useStore();

  /**
   * 从飞书查询工作项
   */
  const queryStories = async (options: FeishuQueryOptions = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('[useFeishuImport] 开始查询飞书工作项...');

      // 调用 MCP 服务查询
      const stories = await feishuMCPService.queryStories(options);
      console.log(`[useFeishuImport] 查询成功，获取 ${stories.length} 条工作项`);

      // 转换为 WSJF 需求
      const requirements = feishuMCPService.convertStoriesToRequirements(
        stories,
        state.fieldMappings
      );

      // 默认全选
      const selectedIds = new Set(requirements.map(r => r.id));

      setState(prev => ({
        ...prev,
        loading: false,
        stories,
        requirements,
        selectedIds,
      }));

      return { stories, requirements };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      console.error('[useFeishuImport] 查询失败:', error);

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMsg,
      }));

      throw error;
    }
  };

  /**
   * 更新字段映射
   */
  const updateFieldMappings = (mappings: FieldMapping[]) => {
    setState(prev => ({ ...prev, fieldMappings: mappings }));

    // 如果已经有数据，重新转换
    if (state.stories.length > 0) {
      const requirements = feishuMCPService.convertStoriesToRequirements(
        state.stories,
        mappings
      );

      setState(prev => ({ ...prev, requirements }));
    }
  };

  /**
   * 切换选中状态
   */
  const toggleSelection = (id: string) => {
    setState(prev => {
      const newSelectedIds = new Set(prev.selectedIds);
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id);
      } else {
        newSelectedIds.add(id);
      }
      return { ...prev, selectedIds: newSelectedIds };
    });
  };

  /**
   * 全选/取消全选
   */
  const toggleSelectAll = () => {
    setState(prev => {
      const allSelected = prev.selectedIds.size === prev.requirements.length;
      const newSelectedIds = allSelected
        ? new Set<string>()
        : new Set(prev.requirements.map(r => r.id));

      return { ...prev, selectedIds: newSelectedIds };
    });
  };

  /**
   * 确认导入选中的需求
   */
  const confirmImport = () => {
    const selectedRequirements = state.requirements.filter(r =>
      state.selectedIds.has(r.id)
    );

    if (selectedRequirements.length === 0) {
      throw new Error('请至少选择一条需求');
    }

    console.log(`[useFeishuImport] 导入 ${selectedRequirements.length} 条需求`);

    // 批量添加到系统
    addRequirements(selectedRequirements);

    return selectedRequirements.length;
  };

  /**
   * 增量同步（自上次同步后的更新）
   */
  const syncUpdates = async (lastSyncTime: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('[useFeishuImport] 开始增量同步...');

      const updatedRequirements = await feishuMCPService.syncUpdatedStories(lastSyncTime);

      console.log(`[useFeishuImport] 同步成功，获取 ${updatedRequirements.length} 条更新`);

      // 自动导入更新
      if (updatedRequirements.length > 0) {
        addRequirements(updatedRequirements);
      }

      setState(prev => ({ ...prev, loading: false }));

      return updatedRequirements.length;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      console.error('[useFeishuImport] 同步失败:', error);

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMsg,
      }));

      throw error;
    }
  };

  /**
   * 重置状态
   */
  const reset = () => {
    setState({
      loading: false,
      error: null,
      stories: [],
      requirements: [],
      fieldMappings: [...DEFAULT_FIELD_MAPPINGS],
      selectedIds: new Set(),
    });
  };

  return {
    // 状态
    ...state,

    // 方法
    queryStories,
    updateFieldMappings,
    toggleSelection,
    toggleSelectAll,
    confirmImport,
    syncUpdates,
    reset,
  };
}
