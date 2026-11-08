import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Lock, Mail, User, Building2, Zap } from 'lucide-react';
import {
  closeAuthModal,
  loginWithJwt,
  registerWithJwt,
  loginWithGooglePopup,
  clearAuthError
} from '../store/authSlice.js';

export default function AuthModal() {
  const dispatch = useDispatch();
  const {
    isAuthModalOpen,
    authModalInitialTab,
    rememberedCredentials,
    loading,
    error
  } = useSelector((state) => state.auth);

  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (isAuthModalOpen) {
      setMode(authModalInitialTab || 'login');
      if (rememberedCredentials?.email) {
        setEmail(rememberedCredentials.email);
        setPassword(rememberedCredentials.password || '');
        setRememberMe(rememberedCredentials.rememberMe ?? true);
      }
    }
  }, [isAuthModalOpen, authModalInitialTab, rememberedCredentials]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') {
      dispatch(loginWithJwt({ email, password, rememberMe }));
    } else {
      dispatch(registerWithJwt({ name, email, password, company, rememberMe }));
    }
  };

  const handleGoogleLogin = () => {
    dispatch(loginWithGooglePopup({ rememberMe }));
  };

  const fillDemoCredentials = () => {
    setEmail('alex@leadsarrow.io');
    setPassword('LeadsArrow2026!');
    setRememberMe(true);
    dispatch(clearAuthError());
  };

  const fillFreeUserCredentials = () => {
    setEmail('elena@rossiconsulting.eu');
    setPassword('Password123!');
    setRememberMe(true);
    dispatch(clearAuthError());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50"
        onClick={() => dispatch(closeAuthModal())}
      />

      <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              {mode === 'login' ? 'Sign In to LeadsArrow' : 'Create Enterprise Account'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              JWT session security & one-click Google authentication
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(closeAuthModal())}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* One-Tap / One-Click Google Authentication Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
              />
            </svg>
            <span>Continue with Google (One-Click Auth)</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] text-slate-400 whitespace-nowrap">
              or sign in with JWT credentials
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                dispatch(clearAuthError());
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In (JWT)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                dispatch(clearAuthError());
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-900 text-xs font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-600 shrink-0" />
            <span>
              <strong>Free Plan Included:</strong> 100 free credits are automatically assigned daily to your workspace.
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-orange-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="LeadsArrow Growth Ops"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-orange-600"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">Work Email</label>
                {mode === 'login' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fillDemoCredentials}
                      className="text-[11px] text-orange-600 hover:underline cursor-pointer font-medium"
                    >
                      Fill Superadmin
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={fillFreeUserCredentials}
                      className="text-[11px] text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                    >
                      Fill Free User
                    </button>
                  </div>
                )}
              </div>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@leadsarrow.io"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-orange-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-orange-600"
                />
              </div>
            </div>

            {/* Remember Login Credentials Checkbox */}
            <label className="flex items-center justify-between py-1 text-xs text-slate-700 cursor-pointer">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <span>Remember login credentials (30-day JWT)</span>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading
                ? 'Authenticating...'
                : mode === 'login'
                ? 'Sign In with JWT'
                : 'Create Account & Issue JWT'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
