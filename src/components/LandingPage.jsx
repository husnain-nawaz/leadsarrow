import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Sparkles,
  Zap,
  Check,
  ShieldCheck,
  Search,
  Filter,
  Users,
  Database,
  ArrowRight,
  TrendingUp,
  Mail,
  Phone,
  Building2,
  Lock,
  ChevronDown,
  Star,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Activity,
  Layers,
  Flame,
  Globe,
  SlidersHorizontal,
  Download,
  ShieldAlert,
  BadgeCheck,
  Sun,
  Moon
} from 'lucide-react';
import { openAuthModal, openSignOutModal, openProfileModal, openUpgradeModal } from '../store/authSlice.js';
import { PRICING_PLANS } from '../data/plans.js';
import { useTheme } from '../context/ThemeContext.jsx';

export default function LandingPage({ onReturnDashboard, onOpenProfile }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [openFaq, setOpenFaq] = useState(0);
  const [previewLeads, setPreviewLeads] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(true);

  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    let isMounted = true;
    const fetchPreviewLeads = async () => {
      try {
        const res = await fetch('/api/leads/landing-preview');
        const data = await res.json();
        if (isMounted && Array.isArray(data?.leads) && data.leads.length > 0) {
          setPreviewLeads(data.leads);
        }
      } catch (err) {
        console.warn('Could not fetch dynamic landing preview:', err);
      } finally {
        if (isMounted) setPreviewLoading(false);
      }
    };
    fetchPreviewLeads();

    // Check & rotate preview every 30 minutes
    const interval = setInterval(fetchPreviewLeads, 30 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleOpenAuth = (planId = 'free') => {
    if (user) {
      if (planId && planId !== 'free') {
        dispatch(openUpgradeModal());
      } else if (onReturnDashboard) {
        onReturnDashboard();
      }
      return;
    }
    dispatch(openAuthModal('register'));
  };

  const faqs = [
    {
      q: 'How does the 100 Free Daily Credits allowance work?',
      a: 'Every free user account receives 100 verified lead unlock credits automatically each day. Credits refresh at midnight UTC every single day so you can consistently prospect without paying anything upfront.'
    },
    {
      q: 'How accurate is the LeadsArrow B2B contact intelligence data?',
      a: 'Our cluster of 10.3M+ global enterprise contacts is verified via real-time SMTP handshakes, MX record validation, and continuous web intelligence updates, ensuring an industry-leading 99.4% email deliverability rate.'
    },
    {
      q: 'Can I scale up to unlimited credits when needed?',
      a: 'Yes! You can upgrade instantly to the Enterprise Unlimited plan ($79/mo) with uncapped daily credits, or choose our Growth Starter ($10/mo for 2,000 credits/day) and Scale Pro ($39/mo for 10,000 credits/day).'
    },
    {
      q: 'Can I export contacts to CSV or Excel?',
      a: 'Absolutely. With a single click, you can export your selected leads, customized lists, and complete contact dossiers to formatted CSV or JSON files ready for outreach in Apollo, HubSpot, Salesforce, or Instantly.'
    },
    {
      q: 'Is customer profile data isolated and secure?',
      a: 'Yes. All non-lead application records, passwords (hashed with bcrypt), profiles, and custom lists reside strictly on a dedicated Database 4 storage node with complete account-level isolation.'
    }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col selection:bg-orange-600 selection:text-white font-sans antialiased overflow-x-hidden transition-colors duration-300`}>
      {/* Top Ambient Glow Effect */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] ${isDark ? 'bg-gradient-to-tr from-orange-600/20 via-amber-500/15 to-transparent blur-[120px]' : 'bg-gradient-to-tr from-orange-400/20 via-amber-300/15 to-transparent blur-[100px]'} pointer-events-none -z-10`} />

      {/* Top Announcement Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        {user ? (
          <>
            <span>
              Signed in as <strong>{user.name}</strong> ({user.plan || 'Free Starter'} · {user.planId === 'unlimited' ? 'Unlimited Credits' : `${user.creditsRemaining ?? 100} credits available today`})
            </span>
            {onReturnDashboard && (
              <button
                type="button"
                onClick={onReturnDashboard}
                className="underline font-bold hover:text-orange-100 ml-1.5 cursor-pointer"
              >
                Go to Workspace Dashboard →
              </button>
            )}
          </>
        ) : (
          <>
            <span>Launch Offer: Get <strong>100 Free Verified Credits every single day</strong> automatically. No credit card required.</span>
            <button
              type="button"
              onClick={() => handleOpenAuth('free')}
              className="underline font-bold hover:text-orange-100 ml-1.5 cursor-pointer"
            >
              Claim 100 Credits →
            </button>
          </>
        )}
      </div>

      {/* Navigation Header */}
      <header className={`sticky top-0 z-40 ${isDark ? 'bg-slate-900/90 border-slate-800/80 text-white' : 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'} backdrop-blur-xl border-b transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <a href="#" className={`flex items-center gap-2.5 text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} font-display`}>
              <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
              <span><span className="text-orange-500">Leads</span>Arrow</span>
            </a>

            <nav className={`hidden md:flex items-center gap-6 text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <a href="#features" className={`hover:${isDark ? 'text-white' : 'text-slate-900'} transition-colors`}>Features</a>
              <a href="#preview" className={`hover:${isDark ? 'text-white' : 'text-slate-900'} transition-colors`}>10M+ Database</a>
              <a href="#pricing" className="hover:text-orange-500 transition-colors text-orange-500 font-bold">Pricing & Daily Plans</a>
              <a href="#faq" className={`hover:${isDark ? 'text-white' : 'text-slate-900'} transition-colors`}>FAQ</a>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Dark / Light Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700 text-amber-400 hover:bg-slate-800 hover:text-amber-300 shadow-inner'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-xs'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {user ? (
              <>
                {/* Profile Button */}
                <button
                  type="button"
                  onClick={() => dispatch(openProfileModal())}
                  title="Manage Profile & Settings"
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    isDark
                      ? 'text-slate-200 bg-slate-800/90 border-slate-700 hover:border-slate-600'
                      : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {user.photoUrl || user.photoURL || user.photo_url ? (
                    <img
                      src={user.photoUrl || user.photoURL || user.photo_url}
                      alt={user.name || 'User'}
                      className="w-5 h-5 rounded-full object-cover border border-slate-600"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-[10px]">
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline max-w-[120px] truncate">{user.name?.split(' ')[0] || 'Profile'}</span>
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Sign Out Button */}
                <button
                  type="button"
                  onClick={() => dispatch(openSignOutModal())}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isDark
                      ? 'text-slate-400 hover:text-red-400 hover:bg-slate-800'
                      : 'text-slate-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>

                {/* Dashboard Button */}
                <button
                  type="button"
                  onClick={onReturnDashboard}
                  className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-sm shadow-orange-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => dispatch(openAuthModal('login'))}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAuth('free')}
                  className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-md shadow-orange-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Start Free (100 Credits/Day)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          {/* Eyebrow Pill */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold shadow-inner ${
            isDark
              ? 'bg-slate-900 border border-orange-500/30 text-orange-300'
              : 'bg-orange-100/90 border border-orange-200 text-orange-900'
          }`}>
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span>10,363,428 Verified Global Decision Makers Ready to Outreach</span>
          </div>

          {/* Main Headline */}
          <h1 className={`text-4xl sm:text-5xl md:text-6xl font-black font-display tracking-tight leading-[1.12] ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            The High-Velocity B2B Intelligence Engine <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 bg-clip-text text-transparent">
              Built for Modern Outbound Teams
            </span>
          </h1>

          {/* Subtitle */}
          <p className={`max-w-2xl mx-auto text-base sm:text-lg leading-relaxed font-normal ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Filter 10M+ decision makers by intent signals, funding stages, technographics, and verified emails. Get <strong>100 free credits refreshed every single day</strong> automatically.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            <button
              type="button"
              onClick={() => handleOpenAuth('free')}
              className="w-full sm:w-auto px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-xl shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>{user ? 'Open Workspace Dashboard' : 'Claim 100 Free Daily Credits'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#preview"
              className={`w-full sm:w-auto px-7 py-4 text-sm font-semibold rounded-xl transition-all text-center border ${
                isDark
                  ? 'text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border-slate-700/80'
                  : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border-slate-200 shadow-xs'
              }`}
            >
              Preview Live Database
            </a>
          </div>

          {/* Trust Value Badges */}
          <div className={`pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-emerald-500" />
              <span>99.4% Verified SMTP Deliverability</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-orange-500" />
              <span>10.3M+ Multi-Cluster Indexed Records</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Daily Auto-Replenished Credits</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Preview Card */}
        <div id="preview" className="max-w-6xl mx-auto mt-16 px-2">
          <div className={`relative rounded-2xl border shadow-2xl overflow-hidden ${
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-white'
          }`}>
            {/* Mock Window Top Bar */}
            <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs text-slate-400 font-mono ml-2">leadsarrow.io/workspace — Live Cluster Intelligence</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Cluster Online: 10,363,428 Records</span>
              </div>
            </div>

            {/* Table Mockup */}
            <div className={`p-4 sm:p-6 ${isDark ? 'bg-slate-900/60' : 'bg-slate-50/50'}`}>
              <div className={`max-h-[460px] overflow-y-auto overflow-x-auto rounded-xl border shadow-inner ${
                isDark ? 'border-slate-800' : 'border-slate-200 bg-white'
              }`}>
                <table className="w-full text-left text-xs">
                  <thead className={`sticky top-0 uppercase tracking-wider text-[10px] z-10 border-b ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
                    <tr>
                      <th className="py-3 px-3.5 font-bold">Company & Domain</th>
                      <th className="py-3 px-3.5 font-bold">Executive Decision Maker</th>
                      <th className="py-3 px-3.5 font-bold">Industry Sector</th>
                      <th className="py-3 px-3.5 font-bold">Intent Score</th>
                      <th className="py-3 px-3.5 font-bold">Verified Contact Info</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/60 text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
                    {previewLoading ? (
                      [...Array(6)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-3.5 px-3.5">
                            <div className={`h-4 rounded w-28 mb-1.5 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
                            <div className={`h-3 rounded w-20 ${isDark ? 'bg-slate-800/60' : 'bg-slate-100'}`} />
                          </td>
                          <td className="py-3.5 px-3.5">
                            <div className={`h-4 rounded w-24 mb-1.5 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
                            <div className={`h-3 rounded w-32 ${isDark ? 'bg-slate-800/60' : 'bg-slate-100'}`} />
                          </td>
                          <td className="py-3.5 px-3.5">
                            <div className={`h-5 rounded w-20 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
                          </td>
                          <td className="py-3.5 px-3.5">
                            <div className={`h-4 rounded w-24 ${isDark ? 'bg-orange-950/50' : 'bg-orange-100'}`} />
                          </td>
                          <td className="py-3.5 px-3.5">
                            <div className={`h-4 rounded w-36 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
                          </td>
                        </tr>
                      ))
                    ) : (previewLeads.length > 0 ? previewLeads : [
                      {
                        id: 'fallback_1',
                        companyName: 'Databricks Global',
                        domain: 'databricks.com',
                        employeeRange: 'Enterprise (5000+)',
                        contactName: 'Sarah Jenkins',
                        contactTitle: 'VP of Revenue Operations',
                        industry: 'SaaS & Cloud',
                        buyingIntentScore: 96,
                        contactEmail: 's.jenkins@databricks.com',
                        contactPhone: '+1 (415) 892-1200'
                      },
                      {
                        id: 'fallback_2',
                        companyName: 'Vercel Inc.',
                        domain: 'vercel.com',
                        employeeRange: 'Scaleup (500-1000)',
                        contactName: 'Marcus Sterling',
                        contactTitle: 'Chief Marketing Officer',
                        industry: 'DevTools / AI',
                        buyingIntentScore: 92,
                        contactEmail: 'marcus@vercel.com',
                        contactPhone: '+1 (415) 892-XXXX'
                      },
                      {
                        id: 'fallback_3',
                        companyName: 'Ramp Financial',
                        domain: 'ramp.com',
                        employeeRange: 'Series D ($750M+)',
                        contactName: 'Elena Rostova',
                        contactTitle: 'Head of Growth Partnerships',
                        industry: 'Fintech',
                        buyingIntentScore: 98,
                        contactEmail: 'elena.r@ramp.com',
                        contactPhone: '+1 (212) 555-0199'
                      }
                    ]).map((lead) => {
                      const maskedEmail = lead.contactEmail
                        ? lead.contactEmail.replace(/^([^@]{2})[^@]+(@.*)$/, '$1••••$2')
                        : 'verified••••@domain.com';
                      const maskedPhone = lead.contactPhone
                        ? lead.contactPhone.slice(0, -4) + 'XXXX'
                        : '+1 (555) •••-XXXX';

                      return (
                        <tr key={lead.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                          <td className="py-3.5 px-3.5">
                            <div className={`font-bold truncate max-w-[190px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {lead.companyName}
                            </div>
                            <div className={`text-[11px] truncate max-w-[190px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {lead.domain} · {lead.employeeRange}
                            </div>
                          </td>
                          <td className="py-3.5 px-3.5">
                            <div className={`font-semibold truncate max-w-[180px] ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                              {lead.contactName}
                            </div>
                            <div className={`text-[11px] truncate max-w-[180px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {lead.contactTitle}
                            </div>
                          </td>
                          <td className="py-3.5 px-3.5">
                            <span className={`px-2.5 py-0.5 rounded-md border text-[11px] font-medium whitespace-nowrap ${
                              isDark ? 'bg-slate-800 text-slate-300 border-slate-700/60' : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {lead.industry || 'Enterprise SaaS'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5">
                            <span className="inline-flex items-center gap-1 font-extrabold text-orange-500 whitespace-nowrap">
                              <TrendingUp className="w-3.5 h-3.5" /> {lead.buyingIntentScore || 88}% Intent
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5">
                            <div className={`flex flex-col gap-1 font-mono text-[11px] ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                              <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                                <Mail className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{maskedEmail}</span>
                              </div>
                              <div className={`flex items-center gap-1.5 text-[10px] truncate max-w-[200px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                <Phone className="w-3 h-3 shrink-0 text-slate-400" />
                                <span>{maskedPhone}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Login Gated Teaser Banner */}
              <div className={`mt-5 p-5 border rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isDark
                  ? 'bg-gradient-to-r from-orange-950/60 via-slate-900 to-slate-950 border-orange-500/30'
                  : 'bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/50 border-orange-200 shadow-xs'
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Access Complete 10,363,428 Decision Maker Database</h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Sign in or create an account to instantly receive <strong>100 free credits / day</strong> and reveal phone numbers and verified emails.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAuth('free')}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl shadow-md whitespace-nowrap cursor-pointer transition-colors"
                >
                  {user ? 'Go to Dashboard →' : 'Sign In / Claim 100 Free Credits →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className={`py-24 px-6 border-t ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
              isDark ? 'bg-slate-800 text-orange-400 border border-slate-700' : 'bg-white text-orange-600 border border-slate-200 shadow-xs'
            }`}>
              <Layers className="w-3.5 h-3.5" />
              <span>Engineered for Revenue Velocity</span>
            </div>
            <h2 className={`text-3xl sm:text-4xl font-extrabold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Enterprise Lead Intelligence Capabilities
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Modern search and filter infrastructure built to eliminate bounce-backs and power repeatable pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className={`p-7 rounded-2xl border transition-all space-y-4 ${
              isDark ? 'bg-slate-950/70 border-slate-800 hover:border-orange-500/40' : 'bg-white border-slate-200 hover:border-orange-400 shadow-sm'
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-orange-950/70 border border-orange-800/50 text-orange-400' : 'bg-orange-100 text-orange-600'
              }`}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>Deep Intent & Buying Signals</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Filter prospect lists by active buying velocity, recent hiring growth, Series funding rounds, and technographic changes.
              </p>
            </div>

            {/* Card 2 */}
            <div className={`p-7 rounded-2xl border transition-all space-y-4 ${
              isDark ? 'bg-slate-950/70 border-slate-800 hover:border-orange-500/40' : 'bg-white border-slate-200 hover:border-orange-400 shadow-sm'
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-orange-950/70 border border-orange-800/50 text-orange-400' : 'bg-orange-100 text-orange-600'
              }`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>99.4% Deliverable Work Emails</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Zero bounce-backs. Every email address is verified via dynamic SMTP pinging, MX integrity testing, and anti-spam filters.
              </p>
            </div>

            {/* Card 3 */}
            <div className={`p-7 rounded-2xl border transition-all space-y-4 ${
              isDark ? 'bg-slate-950/70 border-slate-800 hover:border-orange-500/40' : 'bg-white border-slate-200 hover:border-orange-400 shadow-sm'
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-orange-950/70 border border-orange-800/50 text-orange-400' : 'bg-orange-100 text-orange-600'
              }`}>
                <Download className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>Instant CSV & CRM Exports</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Download filtered decision maker lists to formatted CSV with full contact names, direct dials, company revenues, and intent scores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section id="pricing" className={`py-24 px-6 border-t ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isDark ? 'bg-orange-950/80 border border-orange-800/70 text-orange-400' : 'bg-orange-100 border border-orange-200 text-orange-800'
            }`}>
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Transparent Daily Replenished Credits</span>
            </div>
            <h2 className={`text-3xl sm:text-4xl font-extrabold font-display tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Predictable Pricing with Daily Refreshed Credits
            </h2>
            <p className={`text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Start free with <strong>100 verified credits every 24 hours</strong>. Scale effortlessly with daily allowances from $10/mo up to unlimited.
            </p>
          </div>

          {/* 4 Plans Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 sm:p-7 border flex flex-col justify-between transition-all hover:shadow-2xl ${
                  isDark
                    ? plan.popular
                      ? 'border-orange-500 bg-slate-900/95 ring-2 ring-orange-500/30 shadow-xl'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    : plan.popular
                      ? 'border-orange-500 bg-orange-50/20 ring-2 ring-orange-500/20 shadow-lg'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-orange-600 text-white shadow-md whitespace-nowrap">
                    Most Popular 🔥
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className={`text-lg font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {plan.name}
                    </h3>
                  </div>

                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border mb-4 ${plan.badgeColor}`}>
                    {plan.badge}
                  </span>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-extrabold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {plan.priceDisplay}
                      </span>
                      <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {plan.billingPeriod}
                      </span>
                    </div>

                    <div className={`mt-2.5 py-1.5 px-2.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${
                      isDark ? 'bg-orange-950/60 border-orange-800/60 text-orange-300' : 'bg-orange-100/80 border-orange-200 text-orange-900'
                    }`}>
                      <Zap className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span>{plan.dailyCreditsDisplay}</span>
                    </div>
                  </div>

                  <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {plan.tagline}
                  </p>

                  <div className={`border-t pt-5 space-y-3 text-xs ${isDark ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-700'}`}>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 leading-snug">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  {plan.id === 'free' && (
                    <div className={`text-[11px] text-center mb-2 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      No credit card required
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenAuth(plan.id)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                      plan.popular
                        ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/30'
                        : plan.id === 'unlimited'
                        ? 'bg-purple-600 hover:bg-purple-500 text-white'
                        : isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className={`py-24 px-6 border-t ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className={`text-3xl font-extrabold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Frequently Asked Questions
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Clear answers regarding daily credit allowances, exports, and data accuracy.
            </p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`border rounded-xl overflow-hidden transition-all ${
                  isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-white shadow-xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  className={`w-full px-5 py-4 text-left font-semibold text-sm flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                    isDark ? 'text-slate-200 hover:bg-slate-900/60' : 'text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      openFaq === idx ? 'rotate-180 text-orange-500' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className={`px-5 pb-4 pt-1 text-xs leading-relaxed border-t ${
                    isDark ? 'text-slate-400 border-slate-800/60 bg-slate-900/30' : 'text-slate-600 border-slate-100 bg-slate-50/50'
                  }`}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 px-6 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 text-white text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight">
            Ready to Supercharge Your B2B Outbound?
          </h2>
          <p className="text-sm sm:text-base text-orange-100 max-w-xl mx-auto leading-relaxed">
            Get 100 free verified credits every day on our Free plan. Sign in to start exploring 10M+ decision makers right now.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleOpenAuth('free')}
              className="px-9 py-4 text-sm font-extrabold text-orange-700 bg-white hover:bg-orange-50 rounded-xl shadow-xl transition-all cursor-pointer inline-flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <span>{user ? 'Open Workspace Dashboard' : 'Get Started Free — 100 Credits/Day'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 text-white font-bold font-display text-base">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-xs" />
            <span>LeadsArrow B2B Intelligence</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing Plans</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <button
              type="button"
              onClick={() => dispatch(openAuthModal('login'))}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>

          <div className="text-slate-500">
            &copy; {new Date().getFullYear()} LeadsArrow Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
