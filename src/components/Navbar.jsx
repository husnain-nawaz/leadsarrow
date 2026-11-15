import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { openAuthModal, openSignOutModal, openUpgradeModal, openProfileModal } from '../store/authSlice.js';
import { setOnlyCustom, resetAllFilters } from '../store/filtersSlice.js';
import { setSavedListsModalOpen } from '../store/savedListsSlice.js';
import {
  Zap,
  Sparkles,
  Shield,
  User as UserIcon,
  Globe,
  Sun,
  Moon,
  LogOut,
  Clock,
  Menu,
  X,
  Search,
  Bookmark
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Navbar({ activeView, setActiveView, onToggleLanding }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { onlyCustom, savedListLeadIds } = useSelector((state) => state.filters);
  const { theme, toggleTheme, isDark } = useTheme();
  const [avatarError, setAvatarError] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (viewKey) => {
    if (viewKey === 'finder') {
      setActiveView('finder');
      if (onlyCustom || savedListLeadIds) {
        dispatch(resetAllFilters());
      }
    } else if (viewKey === 'lists') {
      setActiveView('lists');
    } else if (viewKey === 'custom') {
      setActiveView('custom');
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

  const getTimeUntilReset = (nextResetAt) => {
    if (!nextResetAt) return '24h';
    const diffMs = new Date(nextResetAt).getTime() - Date.now();
    if (diffMs <= 0) return 'Refilling now...';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <header className="relative z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 py-2.5">
        {/* Zone 1: Mobile Hamburger Toggle, Brand Wordmark & Navigation Links */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-6 shrink-0 min-w-0">
          {/* Mobile Navigation Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            className="lg:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0 flex items-center justify-center shadow-xs"
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4 text-orange-600" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>

          <a
            href="#finder"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('finder');
              setIsMobileMenuOpen(false);
            }}
            className="text-base lg:text-lg font-bold tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
            <span><span className="text-orange-600">Leads</span>Arrow</span>
          </a>

          {/* Zone 2: Desktop Navigation links */}
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-4.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => handleNavClick('finder')}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                activeView === 'finder'
                  ? 'text-slate-900 dark:text-white border-b-2 border-orange-600 font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Lead Finder
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('lists')}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                activeView === 'lists'
                  ? 'text-slate-900 dark:text-white border-b-2 border-orange-600 font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Saved Lists
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('custom')}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                activeView === 'custom'
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
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 shrink-0">
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

          {/* View Landing Page Mobile Button: compact icon on mobile */}
          {onToggleLanding && (
            <button
              type="button"
              onClick={onToggleLanding}
              title="View Public Landing Page"
              className="lg:hidden p-1.5 sm:px-2.5 sm:py-1 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Landing</span>
            </button>
          )}

          {user ? (
            <>
              {/* Unified Credits & Plan Badge */}
              <div
                title={`Plan: ${userPlanName} · ${
                  isUnlimited
                    ? 'Unlimited Daily Credits (No daily limits)'
                    : `${user.creditsRemaining ?? 100} / ${user.dailyCreditsLimit || 100} credits available · Full daily refill in ${getTimeUntilReset(user.nextCreditResetAt)} (Refills every 24 hours)`
                }`}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 sm:gap-1.5 shrink-0 ${
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
                      <span className="text-[10px] opacity-75 font-normal hidden sm:inline"> / {user.dailyCreditsLimit || 100}</span>
                    </>
                  )}
                </span>
              </div>

              {/* Upgrade Button (Only for non-unlimited plans) */}
              {!isUnlimited && (
                <button
                  type="button"
                  onClick={() => dispatch(openUpgradeModal())}
                  className="px-2 sm:px-2.5 py-1 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 rounded-lg shadow-xs transition-colors whitespace-nowrap flex items-center gap-1 sm:gap-1.5 cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upgrade</span>
                </button>
              )}

              {/* Profile Dropdown Button */}
              <div className="relative group shrink-0">
                <button
                  type="button"
                  onClick={() => dispatch(openProfileModal())}
                  title={`Profile: ${user.name || user.email} (${userPlanName})`}
                  className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer shrink-0"
                >
                  {(user.photoUrl || user.photoURL || user.photo_url) && !avatarError ? (
                    <img
                      src={user.photoUrl || user.photoURL || user.photo_url}
                      alt=""
                      onError={() => setAvatarError(true)}
                      className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-slate-600 shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:inline max-w-[80px] truncate">{userFirstName}</span>
                  <UserIcon className="w-3 h-3 text-slate-400 hidden sm:inline" />
                </button>

                {/* Hover Dropdown Menu showing Plan and Sign Out */}
                <div className="absolute right-0 top-full pt-1.5 opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto transition-all duration-150 z-50">
                  <div className="w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2.5 space-y-2 text-slate-900 dark:text-slate-100">
                    {/* User info & Plan */}
                    <div className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                        {user.name || 'User'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                        {user.email}
                      </div>
                      <div className="pt-1 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 mt-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Active Plan:</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                          {userPlanName}
                        </span>
                      </div>
                      {!isUnlimited && (
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                            <span>Daily Credits:</span>
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                              {user.creditsRemaining ?? 100} / {user.dailyCreditsLimit || 100}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-orange-500" />
                              <span>Refills every 24h:</span>
                            </span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400 font-mono">
                              {user.nextCreditResetAt ? `in ${getTimeUntilReset(user.nextCreditResetAt)}` : 'Daily'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions inside hover dropdown */}
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => dispatch(openProfileModal())}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-left"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>Account Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => dispatch(openSignOutModal())}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => dispatch(openAuthModal('login'))}
              className="px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer / Menu (Accessible on any mobile screen) */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="relative z-50 px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl lg:hidden animate-in slide-in-from-top-2 duration-150 space-y-3">
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-1">
                Workspace Navigation
              </div>

              {/* Lead Finder */}
              <button
                type="button"
                onClick={() => {
                  handleNavClick('finder');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeView === 'finder'
                    ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-bold border border-orange-200/60 dark:border-orange-800/60'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-orange-600" />
                  <span>Lead Finder</span>
                </div>
                {activeView === 'finder' && (
                  <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                )}
              </button>

              {/* Saved Lists */}
              <button
                type="button"
                onClick={() => {
                  handleNavClick('lists');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeView === 'lists'
                    ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-bold border border-orange-200/60 dark:border-orange-800/60'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bookmark className="w-4 h-4 text-orange-600" />
                  <span>Saved Lists</span>
                </div>
                {activeView === 'lists' && (
                  <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                )}
              </button>

              {/* Custom Leads */}
              <button
                type="button"
                onClick={() => {
                  handleNavClick('custom');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeView === 'custom'
                    ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-bold border border-orange-200/60 dark:border-orange-800/60'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span>Custom Leads</span>
                </div>
                {activeView === 'custom' && (
                  <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                )}
              </button>

              {/* Superadmin if applicable */}
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    handleNavClick('superadmin');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeView === 'superadmin'
                      ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-bold border border-orange-200/60 dark:border-orange-800/60'
                      : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-orange-600" />
                    <span>Superadmin Control</span>
                  </div>
                  {activeView === 'superadmin' && (
                    <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                  )}
                </button>
              )}

              {/* Landing Page */}
              {onToggleLanding && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleLanding();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-orange-600" />
                    <span>Public Landing Page</span>
                  </div>
                  <span className="text-[10px] text-slate-400">View</span>
                </button>
              )}
            </div>

            {/* Mobile Account Details & Shortcuts */}
            {user && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user.name || 'User'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                      {user.email}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 shrink-0">
                    {userPlanName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(openProfileModal());
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(openSignOutModal());
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}
