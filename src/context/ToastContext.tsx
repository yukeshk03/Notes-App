import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { generateId } from '../utils/id';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<ToastVariant, { icon: ReactNode; accent: string }> = {
  success: { icon: <CheckCircle2 className="w-4 h-4" />, accent: 'text-emerald-600 dark:text-emerald-400' },
  error: { icon: <AlertTriangle className="w-4 h-4" />, accent: 'text-red-500' },
  info: { icon: <Info className="w-4 h-4" />, accent: 'text-[var(--text-muted)]' },
};

const AUTO_DISMISS_MS = 3800;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = generateId();
      setToasts((prev) => [...prev, { id, message, variant }].slice(-4));
      timers.current[id] = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  const value: ToastContextValue = {
    success: (message) => push(message, 'success'),
    error: (message) => push(message, 'error'),
    info: (message) => push(message, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto animate-toast-in flex items-center gap-2.5 bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-light)] shadow-lg rounded-xl pl-3.5 pr-2 py-2.5 text-sm font-medium max-w-xs"
          >
            <span className={VARIANT_STYLES[t.variant].accent}>{VARIANT_STYLES[t.variant].icon}</span>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="p-1 rounded-md text-[var(--text-faint)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
