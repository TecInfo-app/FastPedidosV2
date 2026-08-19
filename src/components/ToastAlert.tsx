import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

interface ToastAlertProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const ToastAlert: React.FC<ToastAlertProps> = ({ toast, onClose }) => {
  if (!toast) return null;

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-emerald-600 text-white';
      case 'error':
        return 'bg-rose-600 text-white';
      case 'warning':
        return 'bg-amber-500 text-white';
      case 'info':
      default:
        return 'bg-blue-600 text-white';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 flex-shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 flex-shrink-0" />;
    }
  };

  return (
    <div
      id="customAlert"
      className={`fixed bottom-6 right-6 p-4 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3.5 max-w-md z-50 transition-all transform duration-300 font-sans ${getBgColor()}`}
      role="alert"
    >
      {getIcon()}
      <span className="text-sm font-semibold leading-snug flex-grow">{toast.message}</span>
      <button
        onClick={onClose}
        className="p-1.5 rounded-xl hover:bg-white/20 transition-colors text-white/80 hover:text-white cursor-pointer text-base font-bold leading-none"
        aria-label="Fechar aviso"
      >
        ×
      </button>
    </div>
  );
};
