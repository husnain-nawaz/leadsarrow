export const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free Starter',
    price: 0,
    priceDisplay: '$0',
    billingPeriod: 'forever',
    dailyCredits: 100,
    dailyCreditsDisplay: '100 Credits / day',
    badge: 'Automatic on Signup',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    tagline: 'Start prospecting instantly at zero cost with daily replenished credits.',
    popular: false,
    features: [
      '100 Free credits refreshed every 24 hours',
      'Search 50M+ verified global B2B leads',
      'Faceted company, revenue & seniority filters',
      'Contact card preview & basic export',
      'Community & email knowledge base'
    ],
    ctaText: 'Start Free (100 Credits/Day)',
    accentColor: 'orange'
  },
  {
    id: 'starter',
    name: 'Growth Starter',
    price: 10,
    priceDisplay: '$10',
    billingPeriod: '/ month',
    dailyCredits: 2000,
    dailyCreditsDisplay: '2,000 Credits / day',
    badge: 'Best for Solo Reps',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    tagline: 'High-velocity prospecting for individual SDRs and agency founders.',
    popular: false,
    features: [
      '2,000 Verified credits refreshed daily',
      'Direct mobile phone & email address reveals',
      'Bulk CSV & Excel data exports (up to 2,000/day)',
      'Custom saved lead lists & tags',
      'Intent score & funding stage filters',
      'Standard email support (within 12h)'
    ],
    ctaText: 'Get Starter ($10/mo)',
    accentColor: 'orange'
  },
  {
    id: 'pro',
    name: 'Scale Pro',
    price: 39,
    priceDisplay: '$39',
    billingPeriod: '/ month',
    dailyCredits: 10000,
    dailyCreditsDisplay: '10,000 Credits / day',
    badge: 'Most Popular 🔥',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
    tagline: 'Comprehensive intelligence engine for growing B2B sales teams.',
    popular: true,
    features: [
      '10,000 Verified credits refreshed daily',
      'Full technographic & software stack filters',
      'High-intent buying signals (0-100% score)',
      'Real-time SMTP validation & deliverability shield',
      'CRM integration hooks & custom lists',
      'Priority live chat support'
    ],
    ctaText: 'Get Scale Pro ($39/mo)',
    accentColor: 'orange'
  },
  {
    id: 'unlimited',
    name: 'Enterprise Unlimited',
    price: 79,
    priceDisplay: '$79',
    billingPeriod: '/ month',
    dailyCredits: 999999,
    dailyCreditsDisplay: 'Unlimited Everything',
    badge: 'Uncapped Access 🚀',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    tagline: 'Unrestricted enterprise powerhouse for aggressive pipeline scaling.',
    popular: false,
    features: [
      'Unlimited daily credits (Zero rate limits)',
      'Unlimited direct mobile & verified email reveals',
      'Unlimited bulk CSV data exports',
      'Full SQL architecture view & API query access',
      'Real-time custom lead injection & sync',
      'Dedicated Account Manager & 99.9% uptime SLA'
    ],
    ctaText: 'Get Unlimited ($79/mo)',
    accentColor: 'orange'
  }
];

export function getPlanById(planId) {
  return PRICING_PLANS.find((p) => p.id === planId) || PRICING_PLANS[0];
}

