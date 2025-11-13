/**
 * Toast 通知 Store
 * 用于在非组件上下文中显示提示消息
 */

import { create } from 'zustand';

export type ToastType = 'success' | 'warning' | 'danger' | 'info';

interface ToastState {
  isOpen: boolean;
  message: string;
  type: ToastType;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  isOpen: false,
  message: '',
  type: 'info',
  showToast: (message: string, type: ToastType = 'info') => {
    set({ isOpen: true, message, type });
    // 自动关闭
    setTimeout(() => {
      set({ isOpen: false });
    }, 3000);
  },
  hideToast: () => set({ isOpen: false }),
}));
