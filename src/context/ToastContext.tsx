import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev.slice(-3), { id, message, variant }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-[calc(100%-2.5rem)] pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 rounded-[12px] bg-white px-4 py-3.5 shadow-[0_12px_32px_rgba(32,24,83,0.16)] border border-gray-200 text-[#1F2937]"
          >
            {toast.variant === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={1.75} />
            )}
            {toast.variant === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" strokeWidth={1.75} />
            )}
            {toast.variant === 'info' && (
              <Info className="w-5 h-5 text-[#45459E] shrink-0 mt-0.5" strokeWidth={1.75} />
            )}
            <p className="text-[14px] font-medium leading-snug flex-1 text-[#1F2937]">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Close notification"
              className="text-gray-400 hover:text-gray-700 p-1 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
