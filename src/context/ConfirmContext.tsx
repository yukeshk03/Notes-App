import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(value: boolean) => void>();

  const confirm = useCallback<ConfirmFn>((options) => {
    setRequest(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    setRequest(null);
    resolver.current?.(value);
    resolver.current = undefined;
  };

  useEffect(() => {
    if (!request) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-fade-in"
          onClick={() => settle(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-2xl shadow-2xl p-6 animate-pop-in"
          >
            <div className="flex items-start gap-3 mb-2">
              {request.danger && (
                <div className="shrink-0 w-9 h-9 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                  <AlertTriangle className="w-[18px] h-[18px]" />
                </div>
              )}
              <div>
                <h2 id="confirm-title" className="text-base font-bold text-[var(--text-primary)]">
                  {request.title}
                </h2>
                {request.description && (
                  <p className="text-sm text-[var(--text-faint)] mt-1.5 leading-relaxed">{request.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => settle(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card)] transition-colors"
              >
                {request.cancelLabel || 'Cancel'}
              </button>
              <button
                autoFocus
                onClick={() => settle(true)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors ${
                  request.danger
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-[var(--text-primary)] text-[var(--bg-panel)] hover:opacity-90'
                }`}
              >
                {request.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}
