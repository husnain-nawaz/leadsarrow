import React, { useEffect, useRef } from 'react';
import { FileSpreadsheet, Download, X, Loader2, CheckCircle2 } from 'lucide-react';
import useBodyScrollLock from '../hooks/useBodyScrollLock.js';

export default function ConfirmExportModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm CSV Export',
  message = 'Are you sure you want to download and export these leads to a CSV spreadsheet?',
  exportCount = 0,
  targetName = '',
  format = 'CSV',
  creditCost = null,
  remainingCredits = null,
  confirmText = 'Yes, Download CSV',
  cancelText = 'Cancel',
  loading = false
}) {
  const cancelBtnRef = useRef(null);

  // Focus the "Cancel" button by default whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, loading]);

  // Prevent background scrolling while export confirmation modal is open
  useBodyScrollLock(Boolean(isOpen));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      {/* Click outside to cancel */}
      <div
        className="fixed inset-0"
        onClick={() => !loading && onClose()}
      />

      <div className="relative z-10 w-full max-w-[calc(100vw-24px)] sm:max-w-md mx-auto my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900/60 flex items-center justify-center shrink-0 text-orange-600 dark:text-orange-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-display truncate">
              {title}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
              {message}
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Export Details Summary Card */}
        <div className="px-4 sm:px-6 py-2 space-y-2.5">
          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Total Leads to Export:</span>
              <span className="font-bold font-mono text-orange-600 dark:text-orange-400 text-sm">
                {exportCount.toLocaleString()} {exportCount === 1 ? 'lead' : 'leads'}
              </span>
            </div>

            {targetName && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Target Segment / Source:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px] sm:max-w-[200px]" title={targetName}>
                  {targetName}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">File Format:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {format.toUpperCase()} (.csv spreadsheet)
              </span>
            </div>

            {creditCost !== null && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Export Credit Cost:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {creditCost === 0 ? 'Free (0 Credits)' : `${creditCost} Credits`}
                  {remainingCredits !== null && ` · ${remainingCredits} remaining`}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 px-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Includes decision makers, direct emails, phones, and company data.</span>
          </div>
        </div>

        {/* Footer Actions: Cancel is default-focused! */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 mt-2 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 sm:gap-3">
          <button
            ref={cancelBtnRef}
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-3 sm:px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading || exportCount === 0}
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Preparing CSV...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
