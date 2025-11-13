/**
 * ConfirmDialog - 确认对话框组件
 *
 * 提供可定制的确认对话框，支持不同的类型（danger/warning/info/success）
 * 包含 Toast 通知组件和相关的自定义 hooks
 */

import { create } from 'zustand';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type ConfirmDialogType = 'danger' | 'warning' | 'info' | 'success';
export type ToastType = 'success' | 'warning' | 'danger' | 'info';

export interface ConfirmDialogConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type: ConfirmDialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface ToastConfig {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// ============================================================================
// Confirm Dialog Store
// ============================================================================

interface ConfirmDialogStore extends ConfirmDialogConfig {
  showConfirm: (config: Omit<ConfirmDialogConfig, 'isOpen'>) => Promise<boolean>;
  hideConfirm: () => void;
  resolvePromise?: (value: boolean) => void;
}

export const useConfirmDialogStore = create<ConfirmDialogStore>((set, get) => ({
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
  confirmText: '确定',
  cancelText: '取消',

  showConfirm: (config) => {
    return new Promise<boolean>((resolve) => {
      set({
        ...config,
        isOpen: true,
        confirmText: config.confirmText || '确定',
        cancelText: config.cancelText || '取消',
        resolvePromise: resolve,
      });
    });
  },

  hideConfirm: () => {
    const { resolvePromise } = get();
    if (resolvePromise) {
      resolvePromise(false);
    }
    set({
      isOpen: false,
      resolvePromise: undefined,
    });
  },
}));

// ============================================================================
// Toast Store
// ============================================================================

interface ToastStore {
  toasts: ToastConfig[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  showToast: (message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: ToastConfig = { id, message, type, duration };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // 自动关闭
    if (duration > 0) {
      setTimeout(() => {
        get().hideToast(id);
      }, duration);
    }
  },

  hideToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// ============================================================================
// Custom Hooks
// ============================================================================

export function useConfirmDialog() {
  const store = useConfirmDialogStore();

  return {
    showConfirm: store.showConfirm,
  };
}

export function useToast() {
  const store = useToastStore();

  return {
    showToast: store.showToast,
  };
}

// ============================================================================
// ConfirmDialog Component
// ============================================================================

export const ConfirmDialog = () => {
  const {
    isOpen,
    title,
    message,
    type,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    hideConfirm,
    resolvePromise,
  } = useConfirmDialogStore();

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    if (resolvePromise) {
      resolvePromise(true);
    }
    hideConfirm();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    if (resolvePromise) {
      resolvePromise(false);
    }
    hideConfirm();
  };

  // 根据类型选择样式和图标
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <XCircle size={48} className="text-red-500" />,
          iconBg: 'bg-red-100',
          titleColor: 'text-red-900',
          buttonColor: 'bg-red-600 hover:bg-red-700',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={48} className="text-yellow-500" />,
          iconBg: 'bg-yellow-100',
          titleColor: 'text-yellow-900',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
        };
      case 'success':
        return {
          icon: <CheckCircle size={48} className="text-green-500" />,
          iconBg: 'bg-green-100',
          titleColor: 'text-green-900',
          buttonColor: 'bg-green-600 hover:bg-green-700',
        };
      case 'info':
      default:
        return {
          icon: <Info size={48} className="text-blue-500" />,
          iconBg: 'bg-blue-100',
          titleColor: 'text-blue-900',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[480px] p-8 animate-[slideIn_0.2s_ease-out]">
        {/* 图标 */}
        <div className="flex justify-center mb-6">
          <div className={`${styles.iconBg} rounded-full p-4`}>
            {styles.icon}
          </div>
        </div>

        {/* 标题 */}
        <h2 className={`text-2xl font-bold text-center mb-4 ${styles.titleColor}`}>
          {title}
        </h2>

        {/* 消息 */}
        <p className="text-gray-700 text-center mb-8 leading-relaxed whitespace-pre-wrap">
          {message}
        </p>

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-6 py-3 rounded-lg font-medium text-white transition-colors ${styles.buttonColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Toast Component
// ============================================================================

export const Toast = () => {
  const { toasts, hideToast } = useToastStore();

  if (toasts.length === 0) return null;

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-500',
          text: 'text-green-900',
          icon: '✅',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-500',
          text: 'text-yellow-900',
          icon: '⚠️',
        };
      case 'danger':
        return {
          bg: 'bg-red-50',
          border: 'border-red-500',
          text: 'text-red-900',
          icon: '❌',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-500',
          text: 'text-blue-900',
          icon: 'ℹ️',
        };
    }
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type);
        return (
          <div
            key={toast.id}
            className={`
              px-6 py-4 rounded-lg shadow-2xl border-2 min-w-[400px] max-w-2xl
              animate-[slideIn_0.3s_ease-out]
              flex items-start gap-3
              ${styles.bg} ${styles.border} ${styles.text}
            `}
          >
            <div className="flex-shrink-0 text-2xl">{styles.icon}</div>
            <div className="flex-1 text-sm font-medium leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => hideToast(toast.id)}
              className="flex-shrink-0 text-gray-500 hover:text-gray-700 transition"
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ConfirmDialog;
