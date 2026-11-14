import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  User,
  Building2,
  Mail,
  Lock,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Zap,
  KeyRound,
  ArrowLeft,
  Calendar,
  Clock,
  Database,
  Sparkles,
  ExternalLink,
  Shield,
  Check,
  Layers
} from 'lucide-react';
import { updateCurrentUserProfile, openUpgradeModal } from '../store/authSlice.js';
import { PRESET_AVATARS } from '../data/avatars.js';

export default function ProfileSettingsPage({ onBack }) {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);

  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [generalSuccess, setGeneralSuccess] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');

  const getTimeUntilReset = (nextResetAt) => {
    if (!nextResetAt) return '24h';
    const diffMs = new Date(nextResetAt).getTime() - Date.now();
    if (diffMs <= 0) return 'Refilling now...';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };
  const [securityError, setSecurityError] = useState('');
  const [isSubmittingGeneral, setIsSubmittingGeneral] = useState(false);
  const [isSubmittingSecurity, setIsSubmittingSecurity] = useState(false);

  // Sync initial user data once mounted or when user ID changes
  const loadedUserIdRef = useRef(null);
  useEffect(() => {
    if (user && loadedUserIdRef.current !== user.id) {
      setName(user.name || '');
      setCompany(user.company || '');
      const existingPhoto = user.photoUrl || user.photoURL || user.photo_url || '';
      setPhotoUrl(existingPhoto);
      setPhotoPreview(existingPhoto);
      loadedUserIdRef.current = user.id;
    }
  }, [user]);

  if (!user) {
    return (
      <div className="p-8 text-center text-slate-500">
        Please sign in to view your profile settings.
      </div>
    );
  }

  // Calculate 30-Day and 2x/Year Restrictions
  const photoUpdatedAt = user.photoUpdatedAt || user.photo_updated_at;
  const photoUpdatesCount = Number(user.photoUpdatesCount ?? user.photo_updates_count ?? 0);
  const photoUpdatesYear = Number(user.photoUpdatesYear ?? user.photo_updates_year ?? 0);
  const currentYear = new Date().getFullYear();

  const effectiveYearlyCount = photoUpdatesYear === currentYear ? photoUpdatesCount : 0;
  const isYearlyLimitReached = effectiveYearlyCount >= 2;

  let cooldownDaysRemaining = 0;
  let nextEligibleDate = null;
  if (photoUpdatedAt) {
    const lastUpdated = new Date(photoUpdatedAt).getTime();
    const diffMs = Date.now() - lastUpdated;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (diffMs < thirtyDaysMs) {
      cooldownDaysRemaining = Math.ceil((thirtyDaysMs - diffMs) / (24 * 60 * 60 * 1000));
      nextEligibleDate = new Date(lastUpdated + thirtyDaysMs).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }

  const isPhotoChangeBlocked = isYearlyLimitReached || cooldownDaysRemaining > 0;

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isPhotoChangeBlocked) {
      if (isYearlyLimitReached) {
        setGeneralError(`Profile picture can only be changed up to 2 times per calendar year. You have already changed it 2 times in ${currentYear}.`);
      } else {
        setGeneralError(`Profile picture can only be changed once every 30 days. Next change eligible in ${cooldownDaysRemaining} day(s) (${nextEligibleDate}).`);
      }
      return;
    }

    if (!file.type.startsWith('image/')) {
      setGeneralError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 300 * 1024) {
      setGeneralError('Image size must not be greater than 300 KB. Please upload a smaller image or select one of the 3 preset avatars below.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result;
      setPhotoPreview(base64Data);
      setPhotoUrl(base64Data);
      setGeneralError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    setPhotoPreview('');
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setGeneralSuccess('');
    setGeneralError('');
    setIsSubmittingGeneral(true);

    try {
      await dispatch(
        updateCurrentUserProfile({
          name: name.trim(),
          company: company.trim(),
          photoUrl: photoUrl
        })
      ).unwrap();

      setGeneralSuccess('Profile details and photo saved successfully in Database 4.');
    } catch (err) {
      setGeneralError(typeof err === 'string' ? err : err?.message || 'Failed to update profile.');
    } finally {
      setIsSubmittingGeneral(false);
    }
  };

  const handleSaveSecurity = async (e) => {
    e.preventDefault();
    setSecuritySuccess('');
    setSecurityError('');

    if (!newPassword || newPassword.length < 6) {
      setSecurityError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError('New password and confirmation do not match.');
      return;
    }

    setIsSubmittingSecurity(true);
    try {
      await dispatch(
        updateCurrentUserProfile({
          currentPassword,
          newPassword
        })
      ).unwrap();

      setSecuritySuccess('Password successfully updated and re-encrypted with bcrypt.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setSecurityError(typeof err === 'string' ? err : err?.message || 'Failed to update password.');
    } finally {
      setIsSubmittingSecurity(false);
    }
  };

  const isUnlimited = user.planId === 'unlimited' || user.plan?.toLowerCase().includes('unlimited');

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 transition-colors">
      {/* Top Header / Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Lead Finder</span>
                </button>
              )}
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight flex items-center gap-2.5">
                <span>Account Profile & Workspace Settings</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                  DB4 Isolated
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manage your credentials, custom avatar, security settings, and credits quota.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => dispatch(openUpgradeModal())}
                className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upgrade Plan</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Card & Plan Overview */}
          <div className="space-y-6 lg:col-span-1">
            {/* User Overview Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 text-center space-y-4 transition-colors">
              <div className="relative inline-block mx-auto">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={user.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-orange-500 shadow-md mx-auto"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-bold flex items-center justify-center text-3xl border-4 border-orange-200 dark:border-orange-800 shadow-md mx-auto">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (isPhotoChangeBlocked) {
                      if (isYearlyLimitReached) {
                        setGeneralError(`Profile picture can only be changed up to 2 times per calendar year. You have used your limit for ${currentYear}.`);
                      } else {
                        setGeneralError(`Profile picture can only be changed once every 30 days. Next change eligible in ${cooldownDaysRemaining} day(s).`);
                      }
                      return;
                    }
                    fileInputRef.current?.click();
                  }}
                  title={isPhotoChangeBlocked ? 'Photo change currently locked' : 'Upload custom photo'}
                  className={`absolute bottom-0 right-0 p-2 rounded-full text-white shadow-md transition-colors cursor-pointer ${
                    isPhotoChangeBlocked ? 'bg-slate-400 dark:bg-slate-600 hover:bg-slate-500' : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{user.name || 'User'}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{user.email}</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <Building2 className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  <span>{user.company || 'Enterprise Workspace'}</span>
                </div>
              </div>

              {/* Policy Restriction Box */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-left space-y-2">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Photo Policy Restrictions:</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    isYearlyLimitReached ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {effectiveYearlyCount}/2 Used in {currentYear}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  • <strong>30-Day Cooldown:</strong> 1 change every 30 days. <br />
                  • <strong>Yearly Cap:</strong> Max 2 changes per calendar year.
                </div>

                {cooldownDaysRemaining > 0 && (
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Cooldown active: {cooldownDaysRemaining} day(s) left (Eligible: {nextEligibleDate})</span>
                  </div>
                )}
                {isYearlyLimitReached && (
                  <div className="p-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-[11px] text-red-800 dark:text-red-300 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                    <span>2 of 2 changes reached for {currentYear}.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Plan & Quota Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span>Active Subscription</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300">
                  {user.plan || 'Free Starter'}
                </span>
              </div>

              <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50/40 dark:from-orange-950/30 dark:to-amber-950/20 border border-orange-200/70 dark:border-orange-800/60 rounded-xl space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Daily Quota</span>
                  <span className="text-lg font-extrabold text-orange-700 dark:text-orange-400 font-mono">
                    {isUnlimited ? 'Unlimited' : `${user.creditsRemaining ?? 100} / ${user.dailyCreditsLimit || 100}`}
                  </span>
                </div>
                {!isUnlimited && (
                  <div className="w-full bg-orange-200/50 dark:bg-orange-900/40 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-orange-600 dark:bg-orange-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, (((user.creditsRemaining ?? 100) / (user.dailyCreditsLimit || 100)) * 100)))}%` }}
                    />
                  </div>
                )}
                <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between pt-1 border-t border-orange-200/60 dark:border-orange-800/50">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    <span>24h Replenishment:</span>
                  </span>
                  <span className="font-bold text-orange-700 dark:text-orange-400 font-mono">
                    {isUnlimited ? 'Uncapped Daily' : (user.nextCreditResetAt ? `Full refill in ${getTimeUntilReset(user.nextCreditResetAt)}` : 'Every 24 Hours')}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Credits refill automatically to full daily capacity ({isUnlimited ? 'Unlimited' : (user.dailyCreditsLimit || 100).toLocaleString()}) every 24 hours, whether you used all credits or none.
                </div>
              </div>

              <button
                type="button"
                onClick={() => dispatch(openUpgradeModal())}
                className="w-full py-2.5 text-xs font-bold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 border border-orange-200 dark:border-orange-800/70 rounded-xl transition-colors cursor-pointer text-center block"
              >
                Change or Upgrade Plan →
              </button>
            </div>

            {/* Database 4 Isolation Audit Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-2.5 text-xs transition-colors">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Database 4 Isolation Guarantee</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                Your profile, bcrypt password hash, credits quota, and reveal logs reside strictly on dedicated <strong>Database 4 (<code className="text-slate-700 dark:text-slate-300 font-mono">u340392193_leadsarrow4</code>)</strong>. No customer data is shared or mixed.
              </p>
            </div>
          </div>

          {/* Right Columns: Edit Profile & Password Form Cards */}
          <div className="space-y-8 lg:col-span-2">
            {/* Card 1: Edit Profile Details */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                  <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span>Profile Information</span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Database 4 Synced</span>
              </div>

              <form onSubmit={handleSaveGeneral} className="p-6 space-y-5">
                {generalSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{generalSuccess}</span>
                  </div>
                )}
                {generalError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                    <span>{generalError}</span>
                  </div>
                )}

                {/* Profile Picture Actions */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt={name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-orange-500 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-bold flex items-center justify-center text-lg border-2 border-orange-200 dark:border-orange-800 shrink-0">
                      {(name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 space-y-1">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Account Avatar</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Supports JPG, PNG, WebP up to 2.5MB. Stored directly in your Database 4 profile.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (isPhotoChangeBlocked) {
                            if (isYearlyLimitReached) {
                              setGeneralError(`Profile picture can only be changed up to 2 times per calendar year. You have already changed it 2 times in ${currentYear}.`);
                            } else {
                              setGeneralError(`Profile picture can only be changed once every 30 days. Next change eligible in ${cooldownDaysRemaining} day(s).`);
                            }
                            return;
                          }
                          fileInputRef.current?.click();
                        }}
                        className={`text-xs font-bold cursor-pointer ${
                          isPhotoChangeBlocked ? 'text-slate-400 dark:text-slate-600' : 'text-orange-600 dark:text-orange-400 hover:text-orange-700'
                        }`}
                      >
                        {isPhotoChangeBlocked ? 'Change photo (Locked)' : 'Upload new photo'}
                      </button>
                      {photoPreview && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                  />
                </div>

                {/* 3 Preset Avatar Selection */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Or choose from 3 curated avatars:</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Max 300KB applied</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {PRESET_AVATARS.map((av) => {
                      const isSelected = photoPreview === av.dataUrl;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => {
                            if (isPhotoChangeBlocked) {
                              if (isYearlyLimitReached) {
                                setGeneralError(`Profile picture can only be changed up to 2 times per calendar year. You have used your limit for ${currentYear}.`);
                              } else {
                                setGeneralError(`Profile picture can only be changed once every 30 days. Next change eligible in ${cooldownDaysRemaining} day(s).`);
                              }
                              return;
                            }
                            setPhotoPreview(av.dataUrl);
                            setPhotoUrl(av.dataUrl);
                            setGeneralError('');
                          }}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/40 ring-2 ring-orange-500/20 shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <img src={av.dataUrl} alt={av.label} className="w-8 h-8 rounded-full shrink-0 shadow-xs" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{av.label}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{av.badge}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Company / Organization
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Company name"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Email (Read only) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Account ID: <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{user.id}</span>
                  </p>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingGeneral}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmittingGeneral ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <span>Save Profile Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Card 2: Password & Security */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                  <KeyRound className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span>Password & Security</span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">bcrypt Hash Encryption</span>
              </div>

              <form onSubmit={handleSaveSecurity} className="p-6 space-y-4">
                {securitySuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{securitySuccess}</span>
                  </div>
                )}
                {securityError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                    <span>{securityError}</span>
                  </div>
                )}

                {/* Current Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Password <span className="text-slate-400 dark:text-slate-500 font-normal">(Leave empty if signed up via Google)</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Your password will be encrypted with 10 salt rounds of bcrypt before being written to Database 4.
                  </span>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingSecurity}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmittingSecurity ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

