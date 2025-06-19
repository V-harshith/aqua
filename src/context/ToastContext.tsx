'use client';

import React, { createContext, useContext } from 'react';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/ToastContainer';

interface ToastContextType {
  success: (options: { title: string; message?: string; duration?: number }) => string;
  error: (options: { title: string; message?: string; duration?: number }) => string;
  warning: (options: { title: string; message?: string; duration?: number }) => string;
  info: (options: { title: string; message?: string; duration?: number }) => string;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const { toasts, success, error, warning, info, removeToast, clearAll } = useToast();

  return (
    <ToastContext.Provider value={{ success, error, warning, info, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </ToastContext.Provider>
  );
}; 