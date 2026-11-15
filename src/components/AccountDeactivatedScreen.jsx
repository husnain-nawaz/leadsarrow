import React, { useState, useEffect } from 'react';
import { ShieldAlert, LogOut, Mail, RefreshCw, Globe, ExternalLink, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { fetchCurrentUserProfileApi } from '../services/api.js';

export default function AccountDeactivatedScreen({ user, onSignOut, onRefresh, onGoToLanding }) {
  const [checking, setChecking] = useState(false);
  const [reactivatedNotice, setReactivatedNotice] = useState(false);

  // Automated background polling every 3.5s to instantly detect if admin reactivated the user
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetchCurrentUserProfileApi();
        if (res?.user && !res.user.isDeactivated && isMounted) {
          setReactivatedNotice(true);
          setTimeout(async () => {
            if (onRefresh && isMounted) {
              await onRefresh();
            }
          }, 600);
        }
      } catch (e) {
        // Still suspended or network error
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [onRefresh]);

  const handleCheckAgain = async () => {
    setChecking(true);
    try {
      const res = await fetchCurrentUserProfileApi();
      if (res?.user && !res.user.isDeactivated) {
        setReactivatedNotice(true);
        setTimeout(async () => {
          if (onRefresh) await onRefresh();
        }, 500);
        return;
      }
      if (onRefresh) {
        await onRefresh();
      }
    } catch (e) {}
    setTimeout(() => setChecking(false), 800);
  };

  const reason = user?.deactivationReason || 'Administrative suspension: account access deactivated by workspace administrator.';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      {/* Top minimal header with Landing Page & Sign Out options */}
      <header className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white shadow-xs">
            LA
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white">
            LeadsArrow
          </span>
          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            Account Suspended
          </span>
        </div>

        <div className="flex items-center gap-3">
          {onGoToLanding && (
            <button
              type="button"
              onClick={onGoToLanding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-orange-400" />
              <span>Landing Page</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-200 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main card */}
      <main className="flex-1 flex items-center justify-center p-4">
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
              Your workspace access has been deactivated by an administrator. While deactivated, access to the Lead Finder, database records, custom clusters, and lead export tools is suspended.
            </p>

            {/* Prominent Deactivation Reason specified by Admin */}
            <div className="mt-3 p-3 rounded-lg bg-rose-950/50 border border-rose-900/70 text-left">
              <div className="text-[11px] font-semibold text-rose-300 flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Reason for Deactivation:</span>
              </div>
              <p className="text-xs text-rose-100 mt-1 font-medium leading-relaxed bg-rose-900/30 p-2 rounded border border-rose-800/40">
                "{reason}"
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Status:</span>
              <span className="text-rose-400 font-bold uppercase tracking-wider">Deactivated</span>
            </div>
          </div>

          {/* Dynamic Reactivated Success Notification */}
          {reactivatedNotice && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="font-semibold">Account Reactivated! Restoring workspace...</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 space-y-2.5">
            <a
              href={`mailto:support@leadsarrow.io?subject=Account%20Reactivation%20Request%20-%20${encodeURIComponent(user?.email || '')}&body=${encodeURIComponent(`Hello LeadsArrow Support,\n\nMy account (${user?.email}) is deactivated with reason: "${reason}".\nPlease review and let me know the steps to reactivate.\n\nThank you.`)}`}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Administrator to Reactivate</span>
            </a>

            {/* Landing Page Navigation Button */}
            {onGoToLanding && (
              <button
                type="button"
                onClick={onGoToLanding}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Globe className="w-4 h-4 text-orange-400" />
                <span>Browse Public Landing Page & Pricing</span>
                <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>
            )}

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

          <p className="mt-5 text-[10px] text-slate-500">
            Need immediate assistance? Email us at <a href="mailto:support@leadsarrow.io" className="text-orange-400 hover:underline">support@leadsarrow.io</a>
          </p>
        </div>
      </main>

      {/* Footer with Landing Page link */}
      <footer className="border-t border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div>&copy; {new Date().getFullYear()} LeadsArrow Enterprise B2B Platform</div>
        {onGoToLanding && (
          <button
            type="button"
            onClick={onGoToLanding}
            className="text-slate-400 hover:text-orange-400 transition-colors cursor-pointer underline"
          >
            Visit Landing Page
          </button>
        )}
      </footer>
    </div>
  );
}
