import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { LogOut, X, AlertTriangle } from 'lucide-react';
import { closeSignOutModal, logoutUser } from '../store/authSlice.js';

export default function SignOutModal() {
  const dispatch = useDispatch();
  const { isSignOutModalOpen, user } = useSelector((state) => state.auth);
  const cancelBtnRef = useRef(null);

  // Focus the "No, Stay Signed In" button by default when modal opens
  useEffect(() => {
    if (isSignOutModalOpen) {
      setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
    }
  }, [isSignOutModalOpen]);

  // Handle ESC key to cancel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isSignOutModalOpen) {
        dispatch(closeSignOutModal());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSignOutModalOpen, dispatch]);

  if (!isSignOutModalOpen) return null;

  const handleConfirmSignOut = () => {
    dispatch(closeSignOutModal());
    dispatch(logoutUser());
  };

  const handleCancel = () => {
    dispatch(closeSignOutModal());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={handleCancel}
      />

      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 text-slate-900 dark:text-slate-100 transition-colors z-10">
        {/* Top bar with close button */}
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
            Sign out of LeadsArrow?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Are you sure you want to log out of your session {user?.email ? <span className="font-semibold text-slate-700 dark:text-slate-200">({user.email})</span> : ''}? You will need to sign in again to access your saved lists and leads.
          </p>
        </div>

        {/* Actions: "No, Stay Signed In" is the default focused option */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={handleCancel}
            className="flex-1 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer shadow-xs focus:ring-2 focus:ring-orange-500/40"
          >
            No, Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmSignOut}
            className="flex-1 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Yes, Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
