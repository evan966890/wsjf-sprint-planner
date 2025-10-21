/**
 * Toast 通知系统 Hook
 *
 * 功能：
 * - 显示成功/错误/信息提示
 * - 支持自动消失和持久显示
 * - 支持手动关闭
 *
 * 使用示例：
 * ```tsx
 * const { toasts, showToast, dismissToast, terminationToastIdRef } = useToast();
 *
 * // 显示普通提示（3秒后自动消失）
 * showToast('操作成功', 'success');
 *
 * // 显示持久提示
 * const id = showToast('正在处理...', 'info', { persistent: true });
 * // 稍后手动关闭
 * dismissToast(id);
 * ```
 */

import { useState, useRef } from 'react';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ToastOptions {
  duration?: number;
  persistent?: boolean;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const terminationToastIdRef = useRef<number | null>(null);

  /**
   * 显示Toast通知
   * @param message 通知消息
   * @param type 通知类型
   * @param options 可选配置：duration(显示时长ms，默认3000)，persistent(是否持久显示，默认false)
   * @returns toast ID，用于手动移除持久toast
   */
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
    options?: ToastOptions
  ): number => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    // 如果不是持久toast，则在指定时间后自动移除
    if (!options?.persistent) {
      const duration = options?.duration || 3000;
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration);
    }

    return id; // 返回ID，用于手动移除
  };

  /**
   * 手动移除指定ID的toast
   */
  const dismissToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    dismissToast,
    terminationToastIdRef,
  };
}
