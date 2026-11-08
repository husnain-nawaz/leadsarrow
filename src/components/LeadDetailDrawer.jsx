import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Bookmark,
  Sparkles
} from 'lucide-react';
import {
  setActiveLead,
  revealLeadContact
} from '../store/leadsSlice.js';
import { decrementExportCredits, openUpgradeModal } from '../store/authSlice.js';
import { addLeadsToExistingList } from '../store/savedListsSlice.js';
import { isNewLead } from './LeadsTable.jsx';

export default function LeadDetailDrawer() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { activeLead, revealedLeadIds } = useSelector((state) => state.leads);
  const { lists } = useSelector((state) => state.savedLists);
  const [copiedField, setCopiedField] = useState(null);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!activeLead) return null;

  const isRevealed = revealedLeadIds.includes(activeLead.id);

  const handleCopy = (value, key) => {
    navigator.clipboard.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1600);
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

      <div className="relative z-10 w-full max-w-lg bg-white h-full border-l border-slate-200 flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            {isNewLead(activeLead) && (
              <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>NEW</span>
              </div>
            )}
            <div className="text-xs text-slate-500">
              {activeLead.industry} · {activeLead.fundingStage}
            </div>
            <h2 className="text-lg font-bold text-slate-900 font-display mt-0.5 flex items-center gap-2">
              <span>{activeLead.companyName}</span>
              <a
                href={`https://${activeLead.domain}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-normal text-orange-600 hover:underline inline-flex items-center gap-1"
              >
                <span>{activeLead.domain}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </h2>
          </div>

          <button
            type="button"
            onClick={() => dispatch(setActiveLead(null))}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Section 1: Decision Maker Profile */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 font-display">
              Primary Decision Maker
            </h3>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {activeLead.contactName}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {activeLead.contactTitle} · {activeLead.seniority} · {activeLead.department}
                </div>
              </div>

              {isRevealed ? (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Work Email</span>
                    <div className="flex items-center gap-2 font-mono text-slate-900">
                      <span>{activeLead.contactEmail}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeLead.contactEmail, 'email')}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {copiedField === 'email' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Direct Phone</span>
                    <div className="flex items-center gap-2 font-mono tabular-nums text-slate-900">
                      <span>{activeLead.contactPhone}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeLead.contactPhone, 'phone')}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {copiedField === 'phone' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">SMTP Verification</span>
                    <span className="font-medium text-emerald-700">
                      {activeLead.verificationStatus} (Checked {activeLead.lastVerifiedDaysAgo || 2}d ago)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500">
                    Direct work email & phone verified
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const isUnlimited = user?.planId === 'unlimited' || user?.plan?.toLowerCase().includes('unlimited');
                      if (!isUnlimited && (user?.creditsRemaining ?? 100) <= 0) {
                        dispatch(openUpgradeModal('starter'));
                        return;
                      }
                      dispatch(revealLeadContact(activeLead.id));
                      dispatch(decrementExportCredits(1));
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Unlock Direct Contact
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Firmographic Metrics */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 font-display">
              Company Firmographics
            </h3>
            <div className="grid grid-cols-2 gap-3 border border-slate-200 rounded-lg p-4">
              <div>
                <div className="text-slate-500">Global Headcount</div>
                <div className="text-sm font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
                  {(activeLead.employeeCount || 150).toLocaleString()} ({activeLead.employeeRange})
                </div>
              </div>
              <div>
                <div className="text-slate-500">Annual Revenue</div>
                <div className="text-sm font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
                  {activeLead.revenueRange}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Headquarters</div>
                <div className="text-sm font-medium text-slate-900 mt-0.5">
                  {activeLead.city}, {activeLead.country}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Founded / Codes</div>
                <div className="text-sm font-mono tabular-nums text-slate-900 mt-0.5">
                  {activeLead.foundedYear || 2016} · SIC {activeLead.sicCode || '7372'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Buying Intent & Tech Signals */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 font-display">
              Buying Intent & Technology Footprint
            </h3>
            <div className="border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Composite Buying Intent Score</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {activeLead.buyingIntentScore} / 100
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-600 rounded-full"
                  style={{ width: `${activeLead.buyingIntentScore}%` }}
                />
              </div>
              <div className="text-slate-600 pt-1">
                <span className="font-medium text-slate-900">Latest Signal: </span>
                {activeLead.recentSignal || 'Active evaluation of enterprise B2B infrastructure'}
              </div>
              <div className="pt-2 border-t border-slate-100">
                <div className="text-slate-500 mb-1">Detected Tech Stack</div>
                <div className="text-slate-800 font-medium">
                  {(activeLead.techStack || []).join(' · ')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleAddToList}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5" />
            {savedNotice ? 'Saved to Default List!' : 'Save to Target List'}
          </button>

          <button
            type="button"
            onClick={() => dispatch(setActiveLead(null))}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
