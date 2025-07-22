import React from 'react';
import { Icon } from './Icon';
import { Toast as ToastType, ToastType as ToastTypeEnum } from '../../hooks/useToast';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

const getToastStyles = (type: ToastTypeEnum) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'error':
      return 'bg-red-50 border-red-200 text-red-800';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case 'info':
    default:
      return 'bg-blue-50 border-blue-200 text-blue-800';
  }
};

const getToastIcon = (type: ToastTypeEnum) => {
  switch (type) {
    case 'success':
      return 'CheckCircle';
    case 'error':
      return 'AlertCircle';
    case 'warning':
      return 'AlertTriangle';
    case 'info':
    default:
      return 'Bell';
  }
};

export const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  return (
    <div className={`
      flex items-center p-4 mb-3 rounded-lg border shadow-sm transition-all duration-300
      ${getToastStyles(toast.type)}
    `}>
      <Icon 
        name={getToastIcon(toast.type) as any} 
        size={20} 
        className="mr-3 flex-shrink-0" 
      />
      <div className="flex-1 text-sm font-medium">
        {toast.message}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-3 flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
      >
        <Icon name="X" size={16} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-w-sm">
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          toast={toast} 
          onRemove={onRemove} 
        />
      ))}
    </div>
  );
}; 