import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export function ToastContainer() {
  const { toasts, dismissToast } = usePlatform();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-full max-w-sm pointer-events-none no-print">
      {toasts.map((t) => {
        const colors =
          t.type === 'success'
            ? 'border-emerald-200 bg-white dark:bg-slate-900 dark:border-emerald-800'
            : t.type === 'error'
            ? 'border-red-200 bg-white dark:bg-slate-900 dark:border-red-800'
            : t.type === 'warning'
            ? 'border-amber-200 bg-white dark:bg-slate-900 dark:border-amber-800'
            : 'border-blue-200 bg-white dark:bg-slate-900 dark:border-blue-800';

        const icon =
          t.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : t.type === 'error' ? (
            <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          ) : t.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          );

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg ${colors}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.title}</p>
              {t.description && <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{t.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
