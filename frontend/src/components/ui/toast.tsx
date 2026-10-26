import * as React from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from './utils';
import type { ToastItem, ToastType } from './toast-types';
import { ToastDispatchContext, ToastStateContext } from './use-toast';

let toastCount = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const lastToastRef = React.useRef<{ title: string; time: number } | null>(null);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback((item: Omit<ToastItem, 'id'>) => {
    const now = Date.now();
    // Prevent duplicate rapid toasts with the same title within 2 seconds
    if (
      lastToastRef.current &&
      lastToastRef.current.title === item.title &&
      now - lastToastRef.current.time < 2000
    ) {
      return;
    }
    lastToastRef.current = { title: item.title, time: now };

    const id = `toast-${++toastCount}`;
    setToasts((prev) => {
      // Keep only up to 3 most recent toasts visible to prevent notification cascades
      const next = [...prev, { ...item, id }];
      return next.slice(-3);
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const toast = React.useCallback(
    (title: string, options?: { description?: string; type?: ToastType }) => {
      addToast({
        title,
        description: options?.description,
        type: options?.type || 'info',
      });
    },
    [addToast]
  );

  const dispatchValue = React.useMemo(
    () => ({
      toast,
      addToast,
      removeToast,
    }),
    [toast, addToast, removeToast]
  );

  return (
    <ToastDispatchContext.Provider value={dispatchValue}>
      <ToastStateContext.Provider value={{ toasts }}>
        {children}
        <Toaster />
      </ToastStateContext.Provider>
    </ToastDispatchContext.Provider>
  );
};

export function Toaster() {
  const { toasts } = React.useContext(ToastStateContext);
  const { removeToast } = React.useContext(ToastDispatchContext);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 p-4 rounded-[var(--radius-input)] bg-[var(--tile-white)] border border-[var(--border)] shadow-[var(--shadow-popover)] transition-all animate-in slide-in-from-bottom-5',
            t.type === 'error' && 'border-[var(--destructive)] bg-[#FFF5F5]',
            t.type === 'success' && 'border-emerald-200 bg-[#F0FDF4]'
          )}
        >
          {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
          {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
          {(!t.type || t.type === 'info') && <Info className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" />}

          <div className="flex-1">
            <h4 className="text-sm font-semibold text-[var(--text-main)]">{t.title}</h4>
            {t.description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.description}</p>}
          </div>

          <button
            onClick={() => removeToast(t.id)}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-full p-1 cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
