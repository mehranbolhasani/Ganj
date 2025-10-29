'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  toast: {
    success: (title: string, message?: string, options?: Partial<Toast>) => string;
    error: (title: string, message?: string, options?: Partial<Toast>) => string;
    warning: (title: string, message?: string, options?: Partial<Toast>) => string;
    info: (title: string, message?: string, options?: Partial<Toast>) => string;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000, // 5 seconds default
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const toast = {
    success: (title: string, message?: string, options?: Partial<Toast>) => 
      addToast({ type: 'success', title, message, ...options }),
    error: (title: string, message?: string, options?: Partial<Toast>) => 
      addToast({ type: 'error', title, message, ...options }),
    warning: (title: string, message?: string, options?: Partial<Toast>) => 
      addToast({ type: 'warning', title, message, ...options }),
    info: (title: string, message?: string, options?: Partial<Toast>) => 
      addToast({ type: 'info', title, message, ...options }),
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAllToasts, toast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 left-4 z-50 space-y-2 max-w-sm w-full"
      role="region"
      aria-live="polite"
      aria-label="اعلانات"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 150);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div
      className={`
        ${getBackgroundColor()}
        border rounded-lg p-4 shadow-lg transform transition-all duration-200 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 text-right">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-sm text-stone-600 dark:text-stone-400 text-right mt-1">
              {toast.message}
            </p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="text-sm text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 underline mt-2"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          onClick={handleRemove}
          className="flex-shrink-0 p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          aria-label="بستن اعلان"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Note: To use toast notifications, import and call useToast() in your component:
// const { toast } = useToast();
// toast.success('Title', 'Message');
