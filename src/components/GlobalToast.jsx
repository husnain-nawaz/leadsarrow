import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { hideToast, showToast } from '../store/toastSlice.js';

export default function GlobalToast() {
  const dispatch = useDispatch();
  const { message, type, id, duration } = useSelector((state) => state.toast);

  // Auto-dismiss toast after duration
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      dispatch(hideToast());
    }, duration || 3800);

    return () => clearTimeout(timer);
  }, [message, id, duration, dispatch]);

  // Support dispatching via window event for non-redux contexts if needed
  useEffect(() => {
    const handleCustomToast = (e) => {
      if (e?.detail) {
        dispatch(showToast(e.detail));
      }
    };
    window.addEventListener('leadsarrow:toast', handleCustomToast);
    return () => window.removeEventListener('leadsarrow:toast', handleCustomToast);
  }, [dispatch]);

  if (!message) return null;

  const config = {
    success: {
      border: 'border-emerald-500/40 dark:border-emerald-500/50 shadow-emerald-950/15',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400',
      icon: CheckCircle2
    },
    warning: {
      border: 'border-amber-500/40 dark:border-amber-500/50 shadow-amber-950/15',
      iconBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400',
      icon: AlertTriangle
    },
    error: {
      border: 'border-rose-500/40 dark:border-rose-500/50 shadow-rose-950/15',
      iconBg: 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400',
      icon: AlertCircle
    },
    info: {
      border: 'border-sky-500/40 dark:border-sky-500/50 shadow-sky-950/15',
      iconBg: 'bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400',
      icon: Info
    }
  };

  const activeConfig = config[type] || config.success;
  const IconComponent = activeConfig.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[9999] max-w-xs sm:max-w-sm pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border ${activeConfig.border} shadow-xl text-slate-800 dark:text-slate-100 text-xs font-semibold backdrop-blur-md transition-all`}
      >
        <div
          className={`w-6 h-6 rounded-lg ${activeConfig.iconBg} flex items-center justify-center shrink-0`}
        >
          <IconComponent className="w-3.5 h-3.5" />
        </div>
        <span className="flex-1 leading-snug break-words pr-1">{message}</span>
        <button
          type="button"
          onClick={() => dispatch(hideToast())}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          title="Dismiss"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
