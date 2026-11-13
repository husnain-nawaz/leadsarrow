import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  X,
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
  KeyRound
} from 'lucide-react';
import { closeProfileModal, updateCurrentUserProfile } from '../store/authSlice.js';

export default function ProfileModal() {
  const dispatch = useDispatch();
  const { user, isProfileModalOpen, loading, error } = useSelector((state) => state.auth);

  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'security'
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && isProfileModalOpen) {
      setName(user.name || '');
      setCompany(user.company || '');
      const existingPhoto = user.photoUrl || user.photo_url || '';
      setPhotoUrl(existingPhoto);
      setPhotoPreview(existingPhoto);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFormSuccess('');
      setFormError('');
    }
  }, [user, isProfileModalOpen]);

  if (!isProfileModalOpen || !user) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    // Limit to 2.5MB to keep database payload healthy
    if (file.size > 2.5 * 1024 * 1024) {
      setFormError('Image size should be less than 2.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result;
      setPhotoPreview(base64Data);
      setPhotoUrl(base64Data);
      setFormError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    setPhotoPreview('');
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');
    setIsSubmitting(true);

    try {
      const result = await dispatch(
        updateCurrentUserProfile({
          name: name.trim(),
          company: company.trim(),
          photoUrl: photoUrl
        })
      ).unwrap();

      setFormSuccess('Profile details successfully updated and saved to Database 4.');
    } catch (err) {
      setFormError(typeof err === 'string' ? err : err?.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');

    if (!newPassword || newPassword.length < 6) {
      setFormError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('New password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(
        updateCurrentUserProfile({
          currentPassword,
          newPassword
        })
      ).unwrap();

      setFormSuccess('Password successfully changed and re-encrypted.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setFormError(typeof err === 'string' ? err : err?.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Account Profile</h3>
              <p className="text-xs text-slate-500">Manage your profile, picture & security credentials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => dispatch(closeProfileModal())}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/30">
          <button
            type="button"
            onClick={() => {
              setActiveTab('general');
              setFormSuccess('');
              setFormError('');
            }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'general'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile Details</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('security');
              setFormSuccess('');
              setFormError('');
            }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Password & Security</span>
          </button>
        </div>

        {/* Status Alerts */}
        <div className="px-6 pt-4">
          {formSuccess && (
            <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}
          {(formError || error) && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError || error}</span>
            </div>
          )}
        </div>

        {/* Tab 1: General Profile */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneral} className="p-6 pt-2 space-y-5">
            {/* Profile Avatar / Photo Upload */}
            <div className="flex items-center gap-5 pb-2">
              <div className="relative group">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={name || user.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-orange-500 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-2xl border-2 border-orange-200 shadow-sm">
                    {(name || user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload profile picture"
                  className="absolute bottom-0 right-0 p-1.5 bg-orange-600 text-white rounded-full shadow hover:bg-orange-700 transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-800">Profile Picture</div>
                <p className="text-xs text-slate-500">
                  Upload your avatar. Saved directly to Database 4 for this account.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                  >
                    Change photo
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
                Account ID: <span className="font-mono text-slate-600">{user.id}</span> (Database 4 Isolated Record)
              </p>
            </div>

            {/* Name */}
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
                  placeholder="e.g. Alex Rivera"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-800"
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
                  placeholder="e.g. Acme Corp"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-800"
                />
              </div>
            </div>

            {/* Active Plan summary */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-600" />
                <span className="font-semibold text-slate-700">Current Plan:</span>
                <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-bold">
                  {user.plan || 'Free Starter'}
                </span>
              </div>
              <span className="text-slate-500 font-medium">
                {user.planId === 'unlimited' ? 'Unlimited Credits' : `${user.creditsRemaining ?? 100} credits available`}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => dispatch(closeProfileModal())}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Profile</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Password & Security */}
        {activeTab === 'security' && (
          <form onSubmit={handleSavePassword} className="p-6 pt-2 space-y-4">
            <div className="text-xs text-slate-500">
              Change your login password. Passwords are encrypted with bcrypt before saving to your profile in Database 4.
            </div>

            {/* Current Password (optional for OAuth / initial accounts) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Password <span className="text-slate-400 font-normal">(Leave blank if set up with Google)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-800"
                />
              </div>
            </div>

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
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-800"
                />
              </div>
            </div>

            {/* Confirm New Password */}
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
                  placeholder="Re-enter new password"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-800"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Passwords are strictly salted and hashed with bcrypt. Never share your password with anyone.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => dispatch(closeProfileModal())}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

