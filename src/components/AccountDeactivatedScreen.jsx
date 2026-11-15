import React, { useState } from 'react';
import { ShieldAlert, LogOut, Mail, RefreshCw, ExternalLink } from 'lucide-react';

export default function AccountDeactivatedScreen({ user, onSignOut, onRefresh }) {
  const [checking, setChecking] = useState(false);

  const handleCheckAgain = async () => {
    setChecking(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setChecking(false), 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-rose-500 selection:text-white">
      <div className="max-w-md w-full bg-slate-900 border border-rose-900/60 rounded-2xl shadow-2xl p-6 sm:p-8 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-5 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Heading */}
        <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
          Account Deactivated
        </h1>

        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800/80 text-rose-300 font-mono text-xs">
          <span>Profile:</span>
          <strong>{user?.email || 'User'}</strong>
        </div>

        {/* Notice description */}
        <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-2 text-xs text-slate-300">
          <div className="font-semibold text-rose-400 flex items-center gap-1.5">
            <span>Access Restriction Notice</span>
          </div>
          <p className="leading-relaxed text-slate-400">
            Your workspace access has been deactivated by a system administrator. While deactivated, access to the Lead Finder, database records, custom clusters, and lead export tools is suspended.
          </p>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Status:</span>
            <span className="text-rose-400 font-bold uppercase tracking-wider">Deactivated</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2.5">
          <a
            href={`mailto:support@leadsarrow.io?subject=Account%20Reactivation%20Request%20-%20${encodeURIComponent(user?.email || '')}`}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Contact Administrator to Reactivate</span>
          </a>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleCheckAgain}
              disabled={checking}
              className="py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span>Check Status</span>
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="py-2 px-3 rounded-xl text-xs font-semibold text-rose-400 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <p className="mt-6 text-[10px] text-slate-500">
          Need immediate assistance? Email us at <a href="mailto:support@leadsarrow.io" className="text-orange-400 hover:underline">support@leadsarrow.io</a>
        </p>
      </div>
    </div>
  );
}
