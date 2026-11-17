import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Lock,
  Mail,
  User,
  Building2,
  Zap,
  ArrowRight,
  ShieldCheck,
  Database,
  Sparkles,
  Sun,
  Moon,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import {
  loginWithJwt,
  registerWithJwt,
  loginWithGooglePopup,
  clearAuthError
} from '../../store/authSlice.js';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function LoginPage({ onExploreLanding }) {
  const dispatch = useDispatch();
  const { isDark, toggleTheme } = useTheme();
  const { loading, error, rememberedCredentials } = useSelector((state) => state.auth);

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Pre-fill remembered credentials if available
  useEffect(() => {
    if (rememberedCredentials?.email) {
      setEmail(rememberedCredentials.email);
      setPassword(rememberedCredentials.password || '');
      setRememberMe(rememberedCredentials.rememberMe ?? true);
    }
  }, [rememberedCredentials]);

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

  const handleQuickFillDemo = () => {
    setEmail('alex@leadsarrow.io');
    setPassword('SuperAdmin2026!');
    dispatch(clearAuthError());
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white font-display">
              Leads<span className="text-orange-500">Arrow</span>
            </span>
            <span className="hidden sm:inline-block ml-2.5 px-2 py-0.5 text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full uppercase tracking-wider">
              B2B Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onExploreLanding && (
            <button
              type="button"
              onClick={onExploreLanding}
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer py-1.5 px-3 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
            >
              <span>Explore Product & Pricing</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </header>

      {/* Main Login / Sign-up Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Brand Teaser (hidden on very small screens, visible on md+) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-center space-y-6 pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>10,363,428 Verified Contacts</span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight font-display">
              High-Velocity B2B Intelligence & Contact Reveal Engine.
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed">
              Find decision makers across 10M+ global enterprises, reveal direct verified work emails & phone numbers, and export targeted prospect clusters instantly.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100 free verified contact credits daily</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>94%+ deliverability on mobile & direct email</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Custom clusters & 1-click export to CSV / Excel</span>
              </div>
            </div>

            {onExploreLanding && (
              <div className="pt-4">
                <button
                  type="button"
                  onClick={onExploreLanding}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-orange-400 hover:text-orange-300 cursor-pointer group"
                >
                  <span>See full feature demo & pricing plans</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>

          {/* Right: Auth Card */}
          <div className="lg:col-span-7">
            <div className="w-full max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">
              
              {/* Card Header & Switcher */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white font-display">
                  {mode === 'login' ? 'Sign In to Workspace' : 'Create Free Account'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {mode === 'login'
                    ? 'Enter your credentials or use one-tap Google auth'
                    : '100 free reveal credits automatically provisioned daily'}
                </p>
              </div>

              {/* Mode Tabs */}
              <div className="flex p-1 bg-slate-950/80 border border-slate-800 rounded-xl mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    dispatch(clearAuthError());
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    dispatch(clearAuthError());
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Quick Fill Demo Button */}
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={handleQuickFillDemo}
                  className="w-full mb-4 py-2 px-3 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚡ Quick Fill Superadmin Demo (1-Click)</span>
                </button>
              )}

              {/* One-Click Google Authentication */}
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800/80 border border-slate-700/80 rounded-xl hover:bg-slate-700/80 transition-colors cursor-pointer disabled:opacity-50 mb-4"
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
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                  or continue with email
                </span>
                <div className="border-t border-slate-800 w-full" />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 mb-4 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-300">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Alex Miller"
                          className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Company Name (Optional)
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Acme Global Inc"
                          className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@leadsarrow.io"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Remember Login Credentials */}
                <label className="flex items-center justify-between py-1 text-xs text-slate-400 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-orange-600 focus:ring-orange-500"
                    />
                    <span>Remember login session (30 days)</span>
                  </div>
                </label>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-xl shadow-lg shadow-orange-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Sign In to Workspace' : 'Create Free Account (100 Credits)'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom links */}
              {onExploreLanding && (
                <div className="mt-6 pt-5 border-t border-slate-800 text-center">
                  <button
                    type="button"
                    onClick={onExploreLanding}
                    className="text-xs text-slate-400 hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    Want to see features and pricing plans first?{' '}
                    <span className="font-semibold text-orange-400 underline">View Landing Page</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        LeadsArrow &copy; {new Date().getFullYear()} &mdash; Enterprise High-Velocity B2B Intelligence.
      </footer>
    </div>
  );
}
