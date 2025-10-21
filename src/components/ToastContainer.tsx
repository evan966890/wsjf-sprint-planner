/**
 * Toast 通知容器组件
 *
 * 显示在屏幕中央顶部的 Toast 消息列表
 */

import { X } from 'lucide-react';
import type { ToastMessage } from '../hooks/useToast';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

const ToastContainer = ({ toasts, onDismiss }: ToastContainerProps) => {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            px-6 py-4 rounded-lg shadow-2xl border-2 min-w-[400px] max-w-2xl
            animate-[slideIn_0.3s_ease-out]
            flex items-start gap-3
            ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-500 text-green-900'
                : toast.type === 'error'
                ? 'bg-red-50 border-red-500 text-red-900'
                : 'bg-blue-50 border-blue-500 text-blue-900'
            }
          `}
        >
          <div className="flex-shrink-0 text-2xl">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </div>
          <div className="flex-1 text-sm font-medium leading-relaxed">
            {toast.message}
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="flex-shrink-0 text-gray-500 hover:text-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
