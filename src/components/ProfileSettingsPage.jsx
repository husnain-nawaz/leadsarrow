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

    if (file.size > 2.5 * 1024 * 1024) {
      setGeneralError('Image size must be less than 2.5MB.');
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
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {/* Top Header / Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors cursor-pointer mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Lead Finder</span>
                </button>
              )}
              <h1 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight flex items-center gap-2.5">
                <span>Account Profile & Workspace Settings</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                  DB4 Isolated
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 text-center space-y-4">
              <div className="relative inline-block mx-auto">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={user.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-orange-500 shadow-md mx-auto"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-3xl border-4 border-orange-200 shadow-md mx-auto">
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
                    isPhotoChangeBlocked ? 'bg-slate-400 hover:bg-slate-500' : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{user.name || 'User'}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-700">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>{user.company || 'Enterprise Workspace'}</span>
                </div>
              </div>

              {/* Policy Restriction Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2">
                <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                  <span>Photo Policy Restrictions:</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    isYearlyLimitReached ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {effectiveYearlyCount}/2 Used in {currentYear}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 leading-snug">
                  • <strong>30-Day Cooldown:</strong> 1 change every 30 days. <br />
                  • <strong>Yearly Cap:</strong> Max 2 changes per calendar year.
                </div>

                {cooldownDaysRemaining > 0 && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Cooldown active: {cooldownDaysRemaining} day(s) left (Eligible: {nextEligibleDate})</span>
                  </div>
                )}
                {isYearlyLimitReached && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-800 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>2 of 2 changes reached for {currentYear}.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Plan & Quota Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-orange-600" />
                  <span>Active Subscription</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-orange-100 text-orange-800">
                  {user.plan || 'Free Starter'}
                </span>
              </div>

              <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50/40 border border-orange-200/70 rounded-xl space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-slate-600">Daily Allowance</span>
                  <span className="text-lg font-extrabold text-orange-700">
                    {isUnlimited ? 'Unlimited' : `${user.creditsRemaining ?? 100} / ${user.dailyCreditsLimit || 100}`}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Credits refresh automatically every 24 hours at midnight UTC.
                </div>
              </div>

              <button
                type="button"
                onClick={() => dispatch(openUpgradeModal())}
                className="w-full py-2.5 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors cursor-pointer text-center block"
              >
                Change or Upgrade Plan →
              </button>
            </div>

            {/* Database 4 Isolation Audit Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Database 4 Isolation Guarantee</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Your profile, bcrypt password hash, credits quota, and reveal logs reside strictly on dedicated <strong>Database 4 (<code className="text-slate-700">u340392193_leadsarrow4</code>)</strong>. No customer data is shared or mixed.
              </p>
            </div>
          </div>

          {/* Right Columns: Edit Profile & Password Form Cards */}
          <div className="space-y-8 lg:col-span-2">
            {/* Card 1: Edit Profile Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <User className="w-4 h-4 text-orange-600" />
                  <span>Profile Information</span>
                </div>
                <span className="text-[11px] text-slate-400">Database 4 Synced</span>
              </div>

              <form onSubmit={handleSaveGeneral} className="p-6 space-y-5">
                {generalSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{generalSuccess}</span>
                  </div>
                )}
                {generalError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{generalError}</span>
                  </div>
                )}

                {/* Profile Picture Actions */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt={name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-orange-500 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-lg border-2 border-orange-200 shrink-0">
                      {(name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 space-y-1">
                    <div className="text-xs font-bold text-slate-800">Account Avatar</div>
                    <p className="text-[11px] text-slate-500">
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
                          isPhotoChangeBlocked ? 'text-slate-400' : 'text-orange-600 hover:text-orange-700'
                        }`}
                      >
                        {isPhotoChangeBlocked ? 'Change photo (Locked)' : 'Upload new photo'}
                      </button>
                      {photoPreview && (
                        <>
                          <span className="text-slate-300">·</span>
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="text-xs font-medium text-slate-500 hover:text-red-600 cursor-pointer"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Company / Organization
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Company name"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Email (Read only) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Account ID: <span className="font-mono text-slate-700 font-semibold">{user.id}</span>
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <KeyRound className="w-4 h-4 text-orange-600" />
                  <span>Password & Security</span>
                </div>
                <span className="text-[11px] text-slate-400">bcrypt Hash Encryption</span>
              </div>

              <form onSubmit={handleSaveSecurity} className="p-6 space-y-4">
                {securitySuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{securitySuccess}</span>
                  </div>
                )}
                {securityError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{securityError}</span>
                  </div>
                )}

                {/* Current Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Password <span className="text-slate-400 font-normal">(Leave empty if signed up via Google)</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
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
