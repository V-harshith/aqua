import React from 'react';
import Toast, { ToastProps } from './Toast';
interface ToastContainerProps {
  toasts: ToastProps[];
  onRemoveToast: (id: string) => void;
}
const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onRemoveToast}
        />
      ))}
    </div>
  );
};
export default ToastContainer; 