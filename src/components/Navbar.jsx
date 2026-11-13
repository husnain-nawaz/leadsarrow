import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { openAuthModal, logoutUser, openUpgradeModal, openProfileModal } from '../store/authSlice.js';
import { setOnlyCustom, resetAllFilters } from '../store/filtersSlice.js';
import { setSavedListsModalOpen } from '../store/savedListsSlice.js';
import { Zap, Sparkles, Shield, User as UserIcon, Globe, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Navbar({ activeView, setActiveView, onToggleLanding }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { onlyCustom, savedListLeadIds } = useSelector((state) => state.filters);
  const { theme, toggleTheme, isDark } = useTheme();

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
    } else if (viewKey === 'profile') {
      setActiveView('profile');
    }
  };

  const isUnlimited = user?.planId === 'unlimited' || user?.plan?.toLowerCase().includes('unlimited');
  const userPlanName = user?.plan || 'Free Starter';
  const isSuperAdmin = Boolean(user && (user.isSuperAdmin || user.role === 'superadmin' || user.email === 'alex@leadsarrow.io' || user.email === 'alex@nexuslead.io'));

  // Clean first name for concise profile button
  const userFirstName = (user?.name || 'User').split(' ')[0];

  return (
    <header className="relative z-20 flex items-center justify-between gap-3 px-4 lg:px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Zone 1: Brand Wordmark & Navigation Links */}
      <div className="flex items-center gap-4 lg:gap-6 shrink-0 min-w-0">
        <a
          href="#finder"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('finder');
          }}
          className="text-base lg:text-lg font-bold tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
          <span><span className="text-orange-600">Leads</span>Arrow</span>
        </a>

        {/* Zone 2: Navigation links */}
        <nav className="hidden lg:flex items-center gap-3.5 xl:gap-4.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => handleNavClick('finder')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeView === 'finder' && !onlyCustom
                ? 'text-slate-900 dark:text-white border-b-2 border-orange-600 font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Lead Finder
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('lists')}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5"
          >
            Saved Lists
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('custom')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeView === 'finder' && onlyCustom
                ? 'text-slate-900 dark:text-white border-b-2 border-orange-600 font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Custom Leads
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
              <span>Superadmin</span>
            </button>
          )}
          {onToggleLanding && (
            <button
              type="button"
              onClick={onToggleLanding}
              title="View Public Landing Page"
              className="px-2.5 py-1 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 rounded-lg shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Landing Page</span>
            </button>
          )}
        </nav>
      </div>

      {/* Zone 3: Credits Meter, Theme Toggle, Actions & User Profile */}
      <div className="flex items-center gap-2 lg:gap-2.5 shrink-0">
        {/* Dark / Light Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-amber-300 transition-colors cursor-pointer shrink-0 flex items-center justify-center shadow-xs"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* View Landing Page Mobile Button */}
        {onToggleLanding && (
          <button
            type="button"
            onClick={onToggleLanding}
            title="View Landing Page"
            className="lg:hidden px-2.5 py-1 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Landing</span>
          </button>
        )}

        {user ? (
          <>
            {/* Unified Credits & Plan Badge */}
            <div
              title={`Plan: ${userPlanName} · ${isUnlimited ? 'Unlimited Daily Credits' : `${user.creditsRemaining ?? 100} / ${user.dailyCreditsLimit || 100} daily credits`}`}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 shrink-0 ${
                isUnlimited
                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                  : 'bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span>
                {isUnlimited ? (
                  'Unlimited'
                ) : (
                  <>
                    <strong>{user.creditsRemaining ?? 100}</strong>
                    <span className="text-[10px] opacity-75 font-normal"> / {user.dailyCreditsLimit || 100}</span>
                  </>
                )}
              </span>
            </div>

            {/* Upgrade Button (Only for non-unlimited plans) */}
            {!isUnlimited && (
              <button
                type="button"
                onClick={() => dispatch(openUpgradeModal())}
                className="px-2.5 py-1 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 rounded-lg shadow-xs transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upgrade</span>
              </button>
            )}

            {/* Profile Button */}
            <button
              type="button"
              onClick={() => dispatch(openProfileModal())}
              title={`Profile: ${user.name || user.email} (${userPlanName})`}
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer shrink-0"
            >
              {user.photoUrl || user.photoURL || user.photo_url ? (
                <img
                  src={user.photoUrl || user.photoURL || user.photo_url}
                  alt={user.name || 'User'}
                  className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-slate-600 shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden md:inline max-w-[80px] truncate">{userFirstName}</span>
              <UserIcon className="w-3 h-3 text-slate-400" />
            </button>

            {/* Sign Out */}
            <button
              type="button"
              onClick={() => dispatch(logoutUser())}
              title="Click to sign out"
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-red-700 dark:hover:text-red-400 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => dispatch(openAuthModal('login'))}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sign In / Google Auth
          </button>
        )}
      </div>
    </header>
  );
}
