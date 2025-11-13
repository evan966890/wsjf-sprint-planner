import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

export type ConfirmDialogType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: ConfirmDialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const typeConfig = {
  danger: {
    icon: AlertCircle,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    buttonColor: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    buttonColor: 'bg-green-600 hover:bg-green-700',
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  type = 'warning',
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        {/* 顶部图标区域 */}
        <div className={`${config.bgColor} ${config.borderColor} border-b px-6 py-4 rounded-t-lg`}>
          <div className="flex items-center gap-3">
            <Icon className={`${config.iconColor} w-6 h-6`} />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        </div>

        {/* 消息内容 */}
        <div className="px-6 py-4">
          <p className="text-gray-700 whitespace-pre-wrap">{message}</p>
        </div>

        {/* 按钮区域 */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-md transition-colors ${config.buttonColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast 提示组件（替代 alert）
interface ToastProps {
  isOpen: boolean;
  message: string;
  type?: ConfirmDialogType;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  isOpen,
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) => {
  React.useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
      <div className={`${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg p-4 max-w-md`}>
        <div className="flex items-start gap-3">
          <Icon className={`${config.iconColor} w-5 h-5 flex-shrink-0 mt-0.5`} />
          <p className="text-gray-900 whitespace-pre-wrap flex-1">{message}</p>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

// Hooks for easier usage
export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ConfirmDialogType;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
  });

  const confirm = (
    title: string,
    message: string,
    type: ConfirmDialogType = 'warning'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        type,
        onConfirm: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
      });
    });
  };

  const handleCancel = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    confirm,
    dialogState,
    handleCancel,
  };
};

export const useToast = () => {
  const [toastState, setToastState] = React.useState<{
    isOpen: boolean;
    message: string;
    type: ConfirmDialogType;
  }>({
    isOpen: false,
    message: '',
    type: 'info',
  });

  const showToast = (
    message: string,
    type: ConfirmDialogType = 'info'
  ) => {
    setToastState({
      isOpen: true,
      message,
      type,
    });
  };

  const hideToast = () => {
    setToastState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    showToast,
    toastState,
    hideToast,
  };
};
