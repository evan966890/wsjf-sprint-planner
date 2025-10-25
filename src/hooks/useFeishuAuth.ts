/**
 * 飞书认证管理 Hook
 *
 * 管理飞书认证配置、测试连接和token管理
 * 文件大小控制: < 200行
 */

import { useState, useCallback, useEffect } from 'react';
import type { FeishuConfig } from '../services/feishu';
import {
  FeishuAuthManager,
  loadFeishuConfig,
  saveFeishuConfig,
  clearFeishuConfig,
} from '../services/feishu';

export interface UseFeishuAuthOptions {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useFeishuAuth({ showToast }: UseFeishuAuthOptions) {
  const [config, setConfig] = useState<FeishuConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authManager, setAuthManager] = useState<FeishuAuthManager | null>(null);

  /**
   * 加载飞书配置
   */
  const loadConfig = useCallback(() => {
    const saved = loadFeishuConfig();
    if (saved) {
      setConfig(saved);
      setAuthManager(new FeishuAuthManager(saved));
    }
  }, []);

  /**
   * 保存飞书配置
   */
  const saveConfig = useCallback(
    (pluginId: string, pluginSecret: string) => {
      const newConfig: FeishuConfig = {
        pluginId,
        pluginSecret,
      };

      setConfig(newConfig);
      setAuthManager(new FeishuAuthManager(newConfig));
      saveFeishuConfig(newConfig);
      showToast('飞书配置已保存', 'success');
    },
    [showToast]
  );

  /**
   * 测试连接
   */
  const testConnection = useCallback(async () => {
    if (!authManager) {
      showToast('请先配置飞书认证信息', 'error');
      return false;
    }

    setIsLoading(true);
    try {
      const success = await authManager.testConnection();
      if (success) {
        setIsConnected(true);
        showToast('连接成功', 'success');
      } else {
        setIsConnected(false);
        showToast('连接失败', 'error');
      }
      return success;
    } catch (error) {
      setIsConnected(false);
      const errorMessage =
        error instanceof Error ? error.message : '连接失败';
      showToast(errorMessage, 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authManager, showToast]);

  /**
   * 清除配置
   */
  const clearConfig = useCallback(() => {
    setConfig(null);
    setAuthManager(null);
    setIsConnected(false);
    clearFeishuConfig();
    showToast('飞书配置已清除', 'info');
  }, [showToast]);

  // 组件加载时恢复配置
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    config,
    authManager,
    isConnected,
    isLoading,
    saveConfig,
    testConnection,
    clearConfig,
  };
}
