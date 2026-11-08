import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { openAuthModal, logoutUser, openUpgradeModal } from '../store/authSlice.js';
import { setOnlyCustom, resetAllFilters } from '../store/filtersSlice.js';
import { setSavedListsModalOpen } from '../store/savedListsSlice.js';
import { Zap, Sparkles, Shield } from 'lucide-react';

export default function Navbar({ activeView, setActiveView, onToggleLanding }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { onlyCustom, savedListLeadIds } = useSelector((state) => state.filters);

  const handleNavClick = (viewKey) => {
    if (viewKey === 'finder') {
      setActiveView('finder');
      if (onlyCustom || savedListLeadIds) {
        dispatch(resetAllFilters());
      }
    } else if (viewKey === 'lists') {
      dispatch(setSavedListsModalOpen(true));
    } else if (viewKey === 'custom') {
      setActiveView('finder');
      dispatch(setOnlyCustom(true));
    } else if (viewKey === 'schema') {
      setActiveView('schema');
    } else if (viewKey === 'superadmin') {
      setActiveView('superadmin');
    }
  };

  const isUnlimited = user?.planId === 'unlimited' || user?.plan?.toLowerCase().includes('unlimited');
  const userPlanName = user?.plan || 'Free Starter';
  const isSuperAdmin = Boolean(user && (user.isSuperAdmin || user.role === 'superadmin' || user.email === 'alex@leadsarrow.io' || user.email === 'alex@nexuslead.io'));

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 py-3 bg-white border-b border-slate-200">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-6">
        <a
          href="#finder"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('finder');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
          <span><span className="text-orange-600">Leads</span>Arrow</span>
        </a>

        {/* Zone 2: Navigation links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => handleNavClick('finder')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeView === 'finder' && !onlyCustom
                ? 'text-slate-900 border-b-2 border-orange-600 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Lead Finder
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('lists')}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5"
          >
            Saved Lists
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('custom')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeView === 'finder' && onlyCustom
                ? 'text-slate-900 border-b-2 border-orange-600 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Custom Leads
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('schema')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeView === 'schema'
                ? 'text-slate-900 border-b-2 border-orange-600 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            SQL Schema
          </button>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => handleNavClick('superadmin')}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 flex items-center gap-1.5 ${
                activeView === 'superadmin'
                  ? 'text-orange-600 border-b-2 border-orange-600 font-bold'
                  : 'text-orange-600 hover:text-orange-700 font-semibold'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-orange-600" />
              <span>Superadmin Panel</span>
            </button>
          )}
          {onToggleLanding && (
            <button
              type="button"
              onClick={onToggleLanding}
              className="text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5"
            >
              View Landing Page
            </button>
          )}
        </nav>
      </div>

      {/* Zone 3: Credits Meter, Upgrade CTA & User Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {user ? (
          <>
            {/* Daily Credits Display */}
            <div className="hidden sm:flex items-center gap-2">
              <span
                title="Daily credit allowance refreshes every 24 hours at midnight"
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
                  isUnlimited
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-orange-50 text-orange-800 border-orange-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span>
                  {isUnlimited ? (
                    'Unlimited Credits'
                  ) : (
                    <>
                      <strong>{user.creditsRemaining ?? 100}</strong> / {user.dailyCreditsLimit || 100} daily credits
                    </>
                  )}
                </span>
              </span>

              {!isUnlimited && (
                <span className="text-[10px] text-slate-400 font-medium hidden xl:inline">
                  (Refreshes daily)
                </span>
              )}

              <span className="hidden md:inline-block text-[11px] font-semibold text-slate-500 px-2 py-0.5 rounded-md bg-slate-100">
                {userPlanName}
              </span>
            </div>

            {/* Upgrade Button */}
            <button
              type="button"
              onClick={() => dispatch(openUpgradeModal())}
              className="px-3 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade Plan</span>
            </button>

            {/* Sign Out */}
            <button
              type="button"
              onClick={() => dispatch(logoutUser())}
              title="Click to sign out"
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap cursor-pointer"
            >
              {user.name?.split(' ')[0] || 'User'} · Sign Out
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => dispatch(openAuthModal('login'))}
            className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sign In / Google Auth
          </button>
        )}
      </div>
    </header>
  );
}
