import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Bookmark,
  Sparkles,
  Lock,
  Layers,
  Globe
} from 'lucide-react';
import {
  setActiveLead,
  revealLeadContact,
  performRevealLead
} from '../store/leadsSlice.js';
import { decrementExportCredits, openUpgradeModal } from '../store/authSlice.js';
import { addLeadsToExistingList } from '../store/savedListsSlice.js';
import { isNewLead } from './LeadsTable.jsx';

function maskEmail(email) {
  const [userPart, domainPart] = String(email || '').split('@');
  if (!domainPart) return '•••••@company.io';
  return `${userPart.slice(0, 2)}••••@${domainPart}`;
}

function maskPhone(phone) {
  const str = String(phone || '');
  if (str.length < 6) return '+1 •••-••••';
  return `${str.slice(0, 6)} •••-••${str.slice(-2)}`;
}

export default function LeadDetailDrawer() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { activeLead, revealedLeadIds = [] } = useSelector((state) => state.leads);
  const { lists } = useSelector((state) => state.savedLists);
  const [copiedField, setCopiedField] = useState(null);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!activeLead) return null;

  // Contact details are revealed ONLY if explicitly unlocked with credit, or if it is user's custom lead
  const isRevealed = Boolean(
    activeLead.isCustom ||
    String(activeLead.id || '').startsWith('custom_') ||
    activeLead.source === 'manual_custom_lead' ||
    activeLead.clusterName ||
    activeLead.isRevealed ||
    revealedLeadIds.includes(activeLead.id)
  );

  const handleCopy = (value, key) => {
    navigator.clipboard.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1600);
  };

  const handleUnlockContact = () => {
    const isSuperAdmin = Boolean(
      user && (
        user.isSuperAdmin ||
        user.is_super_admin ||
        user.role === 'superadmin' ||
        user.role === 'Superadmin' ||
        user.email === 'alex@leadsarrow.io' ||
        user.email === 'alex@nexuslead.io'
      )
    );
    const isUnlimited = isSuperAdmin || user?.planId === 'unlimited' || user?.plan?.toLowerCase().includes('unlimited');
    if (!isUnlimited && (user?.creditsRemaining ?? 100) <= 0) {
      dispatch(openUpgradeModal('starter'));
      return;
    }
    dispatch(revealLeadContact(activeLead.id));
    dispatch(decrementExportCredits(1));
    dispatch(performRevealLead(activeLead.id));
  };

  const handleAddToList = () => {
    const firstListId = lists[0]?.id;
    if (firstListId) {
      dispatch(addLeadsToExistingList({ listId: firstListId, leadIds: [activeLead.id] }));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-slate-900/40"
        onClick={() => dispatch(setActiveLead(null))}
      />

      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 h-full border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-colors">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {Boolean(activeLead.isCustom || String(activeLead.id || '').startsWith('custom_') || activeLead.source === 'manual_custom_lead' || activeLead.clusterName) ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold uppercase tracking-wide shadow-2xs">
                  <Layers className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Custom Lead{activeLead.clusterName ? ` · Cluster: ${activeLead.clusterName}` : ' · Private Workspace'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wide">
                  <Globe className="w-3 h-3 text-slate-500" />
                  <span>Core Global Database (10.3M Cluster)</span>
                </span>
              )}
              {isNewLead(activeLead) && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold shadow-2xs">
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>NEW</span>
                </div>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {activeLead.industry} · {activeLead.fundingStage}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display mt-0.5 flex items-center gap-2">
              <span>{activeLead.companyName}</span>
              <a
                href={`https://${activeLead.domain}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-normal text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1"
              >
                <span>{activeLead.domain}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </h2>
          </div>

          <button
            type="button"
            onClick={() => dispatch(setActiveLead(null))}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Section 1: Decision Maker Profile */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white font-display">
              Primary Decision Maker
            </h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {activeLead.contactName}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {activeLead.contactTitle} · {activeLead.seniority} · {activeLead.department}
                </div>
              </div>

              {isRevealed ? (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Work Email</span>
                    <div className="flex items-center gap-2 font-mono text-slate-900 dark:text-slate-100">
                      <span>{activeLead.contactEmail}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeLead.contactEmail, 'email')}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                        title="Copy email"
                      >
                        {copiedField === 'email' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Direct Phone</span>
                    <div className="flex items-center gap-2 font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      <span>{activeLead.contactPhone}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeLead.contactPhone, 'phone')}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                        title="Copy phone"
                      >
                        {copiedField === 'phone' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">SMTP Verification</span>
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      {activeLead.verificationStatus || 'Verified'} (Checked {activeLead.lastVerifiedDaysAgo || 2}d ago)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Work Email</span>
                      <div className="flex items-center gap-1.5 font-mono text-slate-500 dark:text-slate-400 select-none">
                        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{maskEmail(activeLead.contactEmail)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Direct Phone</span>
                      <div className="flex items-center gap-1.5 font-mono tabular-nums text-slate-500 dark:text-slate-400 select-none">
                        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{maskPhone(activeLead.contactPhone)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">SMTP Verification</span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        {activeLead.verificationStatus || 'Verified'} (Direct Dial & Verified Inbox)
                      </span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 bg-orange-50/70 dark:bg-orange-950/30 p-2.5 rounded-lg border border-orange-200/60 dark:border-orange-900/40">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                        <span>Direct contact locked</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        1 credit unlocks verified work email & phone
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleUnlockContact}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Reveal Contact</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Firmographic Metrics */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white font-display">
              Company Firmographics
            </h3>
            <div className="grid grid-cols-2 gap-3 border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <div className="text-slate-500 dark:text-slate-400">Global Headcount</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
                  {(activeLead.employeeCount || 150).toLocaleString()} ({activeLead.employeeRange})
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">Annual Revenue</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
                  {activeLead.revenueRange}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">Headquarters</div>
                <div className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">
                  {activeLead.city}, {activeLead.country}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">Founded / Codes</div>
                <div className="text-sm font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                  {activeLead.foundedYear || 2016} · SIC {activeLead.sicCode || '7372'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Buying Intent & Tech Signals */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white font-display">
              Buying Intent & Technology Footprint
            </h3>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Composite Buying Intent Score</span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                  {activeLead.buyingIntentScore} / 100
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-600 rounded-full"
                  style={{ width: `${activeLead.buyingIntentScore}%` }}
                />
              </div>
              <div className="text-slate-600 dark:text-slate-300 pt-1">
                <span className="font-medium text-slate-900 dark:text-white">Latest Signal: </span>
                {activeLead.recentSignal || 'Active evaluation of enterprise B2B infrastructure'}
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleAddToList}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5" />
            {savedNotice ? 'Saved to Default List!' : 'Save to Target List'}
          </button>

          <button
            type="button"
            onClick={() => dispatch(setActiveLead(null))}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-orange-600 hover:bg-slate-800 dark:hover:bg-orange-700 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
