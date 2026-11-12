import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
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
  Star
} from 'lucide-react';
import { openAuthModal } from '../store/authSlice.js';
import { PRICING_PLANS } from '../data/plans.js';

export default function LandingPage() {
  const dispatch = useDispatch();
  const [openFaq, setOpenFaq] = useState(0);
  const [previewLeads, setPreviewLeads] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(true);

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

    // Check & rotate every 30 minutes
    const interval = setInterval(fetchPreviewLeads, 30 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleOpenAuth = (planId = 'free') => {
    dispatch(openAuthModal('register'));
  };

  const faqs = [
    {
      q: 'How do the 100 free daily credits work?',
      a: 'When you create an account, you are automatically enrolled in our Free Starter plan. You receive 100 verified credits every day at midnight at absolutely zero cost. Use them to search companies, inspect executive profiles, and reveal verified contacts.'
    },
    {
      q: 'What happens when I upgrade to a paid plan?',
      a: 'Upgrading unlocks higher daily credit allowances: 2,000 credits/day on the $10 Starter plan, 10,000 credits/day on the $39 Scale Pro plan, or unlimited daily credits on the $79 Enterprise plan. Upgrades activate instantly with no waiting period.'
    },
    {
      q: 'Can I switch or cancel my plan at any time?',
      a: 'Yes, absolutely. You can upgrade, downgrade, or switch plans anytime from your workspace dashboard in one click. You retain whatever credits your active plan provides.'
    },
    {
      q: 'How accurate is the B2B contact intelligence data?',
      a: 'Our database of 50M+ global enterprise contacts is verified via real-time SMTP handshakes, MX record checks, and LinkedIn/web synchronization, maintaining an industry-leading 99.4% email deliverability rate.'
    },
    {
      q: 'Can I access the dashboard without logging in?',
      a: 'No. To maintain security, protect enterprise data, and track your daily credits quota, access to the Lead Intelligence Workspace requires creating a free account or logging in with Google.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-orange-600 selection:text-white">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>New: Sign up today and get <strong>100 Free Credits every single day</strong> automatically. No credit card required.</span>
        <button
          type="button"
          onClick={() => handleOpenAuth('free')}
          className="underline font-bold hover:text-orange-100 ml-1 cursor-pointer"
        >
          Claim 100 Credits →
        </button>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <a href="#" className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 font-display">
              <span className="w-3 h-3 rounded-full bg-orange-600 shadow-sm" />
              <span><span className="text-orange-600">Nexus</span>Lead</span>
            </a>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
              <a href="#preview" className="hover:text-slate-900 transition-colors">Intelligence Database</a>
              <a href="#pricing" className="hover:text-slate-900 transition-colors font-semibold text-orange-600">Pricing & Plans</a>
              <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => dispatch(openAuthModal('login'))}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleOpenAuth('free')}
              className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Start Free (100 Credits/Day)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 overflow-hidden bg-gradient-to-b from-white via-orange-50/30 to-slate-50">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 border border-orange-200 text-orange-800 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
            <span>100 Free Daily Credits Included on Free Plan</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 font-display tracking-tight leading-[1.12]">
            The B2B Lead Intelligence Engine <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Built for Modern Revenue Teams
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
            Search 50M+ verified global decision makers, filter by intent signals, funding stages, and technographics. Sign in to automatically get 100 credits a day, or scale with flexible daily plans up to unlimited.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleOpenAuth('free')}
              className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get 100 Free Credits / Day</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#pricing"
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-center"
            >
              View Pricing ($10 / $39 / $79)
            </a>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>99.4% Verified Deliverability</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-orange-600" />
              <span>50M+ Global B2B Contacts</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Zero-friction daily refresh</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Preview Mockup */}
        <div id="preview" className="max-w-6xl mx-auto mt-12 px-2">
          <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Mock Window Header */}
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-400 font-mono ml-2">leadsarrow.io/workspace — Live Database Preview</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-orange-400 font-semibold bg-orange-950/60 border border-orange-800/60 px-2.5 py-0.5 rounded-full">
                <Zap className="w-3 h-3 text-orange-400" />
                <span>100 Credits Daily Mode Available</span>
              </div>
            </div>

            {/* Table Mockup */}
            <div className="p-4 sm:p-6">
              <div className="max-h-[480px] overflow-y-auto overflow-x-auto rounded-lg border border-slate-100 shadow-inner scrollbar-thin scrollbar-thumb-slate-300">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 shadow-xs z-10">
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Company & Domain</th>
                      <th className="py-2.5 px-3">Decision Maker</th>
                      <th className="py-2.5 px-3">Industry</th>
                      <th className="py-2.5 px-3">Intent Signal</th>
                      <th className="py-2.5 px-3">Verified Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {previewLoading ? (
                      [...Array(6)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-3 px-3">
                            <div className="h-4 bg-slate-200 rounded w-28 mb-1.5" />
                            <div className="h-3 bg-slate-100 rounded w-20" />
                          </td>
                          <td className="py-3 px-3">
                            <div className="h-4 bg-slate-200 rounded w-24 mb-1.5" />
                            <div className="h-3 bg-slate-100 rounded w-32" />
                          </td>
                          <td className="py-3 px-3">
                            <div className="h-5 bg-slate-200 rounded w-20" />
                          </td>
                          <td className="py-3 px-3">
                            <div className="h-4 bg-orange-100 rounded w-24" />
                          </td>
                          <td className="py-3 px-3">
                            <div className="h-4 bg-slate-200 rounded w-36" />
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
                        buyingIntentScore: 94,
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
                        buyingIntentScore: 89,
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
                        buyingIntentScore: 97,
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
                        <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900 truncate max-w-[190px]">
                              {lead.companyName}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[190px]">
                              {lead.domain} · {lead.employeeRange}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-slate-900 truncate max-w-[180px]">
                              {lead.contactName}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                              {lead.contactTitle}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium whitespace-nowrap">
                              {lead.industry || 'Business Services'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 font-bold text-orange-600 whitespace-nowrap">
                              <TrendingUp className="w-3.5 h-3.5" /> {lead.buyingIntentScore || 88}% High Intent
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-0.5 font-mono text-[11px] text-emerald-700">
                              <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                                <Mail className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{maskedEmail}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] truncate max-w-[200px]">
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

              {/* Login Gated Overlay Teaser */}
              <div className="mt-4 p-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Sign In to Access Full Live Intelligence Workspace</h4>
                    <p className="text-xs text-slate-600">
                      Sign in or create an account to instantly receive <strong>100 free credits / day</strong> and unlock direct emails and phone numbers.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAuth('free')}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm whitespace-nowrap cursor-pointer transition-colors"
                >
                  Sign In / Unlock 100 Free Credits →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section id="pricing" className="py-20 px-6 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-orange-600" />
              <span>Transparent Daily Credit Pricing</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
              Flexible Plans with Daily Replenished Credits
            </h2>
            <p className="text-base text-slate-600">
              Start completely free with <strong>100 credits refreshed every single day</strong>. Scale your prospecting with $10 for 2,000/day, $39 for 10,000/day, or $79 for uncapped unlimited access.
            </p>
          </div>

          {/* 4 Plans Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 sm:p-7 border-2 flex flex-col justify-between transition-all hover:shadow-xl ${
                  plan.popular
                    ? 'border-orange-500 bg-orange-50/20 shadow-lg ring-2 ring-orange-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-orange-600 text-white shadow-sm whitespace-nowrap">
                    Most Popular 🔥
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-slate-900 font-display">
                      {plan.name}
                    </h3>
                  </div>

                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border mb-4 ${plan.badgeColor}`}>
                    {plan.badge}
                  </span>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-slate-900 font-display">
                        {plan.priceDisplay}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {plan.billingPeriod}
                      </span>
                    </div>

                    <div className="mt-2 py-1.5 px-2.5 rounded-lg bg-orange-100/80 border border-orange-200 text-orange-900 text-xs font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span>{plan.dailyCreditsDisplay}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                    {plan.tagline}
                  </p>

                  <div className="border-t border-slate-100 pt-5 space-y-3 text-xs text-slate-700">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 leading-snug">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  {plan.id === 'free' && (
                    <div className="text-[11px] text-center text-slate-400 mb-2 font-medium">
                      No credit card required
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenAuth(plan.id)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                      plan.popular
                        ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20'
                        : plan.id === 'unlimited'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
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

      {/* Feature Highlights Section */}
      <section id="features" className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 font-display">
              Enterprise Lead Intelligence Capabilities
            </h2>
            <p className="text-sm text-slate-600">
              Built from the ground up for high conversion prospecting, sales outbound, and revenue ops.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-display">Deep Intent Signals</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Identify accounts in active buying cycles through real-time hiring velocity, funding rounds, and product expansion triggers.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-display">99.4% Deliverable Emails</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zero bounce-backs. Every email is validated with dynamic SMTP testing, domain MX verification, and spam shield filters.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-display">Instant CSV & CRM Exports</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Export lead lists, custom tags, and complete firmographic dossiers directly to CSV, Excel, or sync with your revenue stack.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 font-display">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-600">
              Everything you need to know about plans, daily credits, and workspace access.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  className="w-full px-5 py-4 text-left font-semibold text-sm text-slate-900 flex items-center justify-between gap-4 hover:bg-slate-50 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      openFaq === idx ? 'rotate-180 text-orange-600' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 px-6 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 text-white text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display">
            Ready to Supercharge Your B2B Outbound?
          </h2>
          <p className="text-sm sm:text-base text-orange-100 max-w-xl mx-auto">
            Get 100 free verified credits every day on our Free plan. Log in or create an account to start exploring verified decision makers right away.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleOpenAuth('free')}
              className="px-8 py-3.5 text-sm font-bold text-orange-700 bg-white hover:bg-orange-50 rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Get Started Free — 100 Credits/Day</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-white font-bold font-display text-base">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
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

          <div>
            © {new Date().getFullYear()} LeadsArrow Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

