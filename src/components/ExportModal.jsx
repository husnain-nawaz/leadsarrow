import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Download, AlertTriangle, Zap, Sparkles, Loader2 } from 'lucide-react';
import { setExportModalOpen } from '../store/leadsSlice.js';
import { decrementExportCredits, consumeCredits, openUpgradeModal } from '../store/authSlice.js';
import { fetchLeadsByIdsApi } from '../services/api.js';

export default function ExportModal() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isExportModalOpen, items, selectedLeadIds } = useSelector(
    (state) => state.leads
  );
  const [format, setFormat] = useState('csv');
  const [fetchedFullLeads, setFetchedFullLeads] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  // 1. Daily limits and single-batch export constraints:
  // - Maximum 5,000 at once hard cap even with unlimited plan
  // - No more than 50% of daily limit at once
  // - Never exceed remaining daily credits
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
  const dailyLimit = isUnlimited ? 10000 : (user?.dailyCreditsLimit ?? 100);
  const userCreditsRemaining = isUnlimited ? 999999 : (user?.creditsRemaining ?? 100);

  const fiftyPercentDailyLimit = Math.max(1, Math.floor(dailyLimit * 0.5));
  const maxAllowedBatch = Math.min(5000, fiftyPercentDailyLimit, userCreditsRemaining);

  // If selected leads exceed limit, only export the 1st selected leads up to the limit
  const isCapped = selectedLeadIds.length > maxAllowedBatch;
  const targetIds = selectedLeadIds.slice(0, maxAllowedBatch);

  // Fetch full lead objects for all selected lead IDs across multiple pages
  useEffect(() => {
    if (!isExportModalOpen || targetIds.length === 0) {
      setFetchedFullLeads([]);
      return;
    }

    // Check which ones we already have in local page items
    const localMap = new Map(items.map((it) => [it.id, it]));
    const missingIds = targetIds.filter((id) => !localMap.has(id));

    if (missingIds.length === 0) {
      setFetchedFullLeads(targetIds.map((id) => localMap.get(id)).filter(Boolean));
      return;
    }

    setIsLoadingLeads(true);
    fetchLeadsByIdsApi(targetIds)
      .then((res) => {
        const fetched = res.leads || [];
        const fetchedMap = new Map(fetched.map((l) => [l.id, l]));
        const fullList = targetIds
          .map((id) => localMap.get(id) || fetchedMap.get(id))
          .filter(Boolean);
        setFetchedFullLeads(fullList);
      })
      .catch((err) => {
        console.error('Failed to load full lead details for export:', err);
        setFetchedFullLeads(targetIds.map((id) => localMap.get(id)).filter(Boolean));
      })
      .finally(() => {
        setIsLoadingLeads(false);
      });
  }, [isExportModalOpen, selectedLeadIds]);

  if (!isExportModalOpen) return null;

  const targetLeads = fetchedFullLeads.length > 0
    ? fetchedFullLeads
    : items.filter((l) => targetIds.includes(l.id));

  const handleDownload = () => {
    if (selectedLeadIds.length === 0) return;
    if (targetLeads.length === 0 || (!isUnlimited && userCreditsRemaining <= 0)) {
      dispatch(setExportModalOpen(false));
      dispatch(openUpgradeModal('starter'));
      return;
    }
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(targetLeads, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leadsarrow_b2b_export_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = [
        'Company Name',
        'Domain',
        'Industry',
        'Employees',
        'Revenue Range',
        'Country',
        'City',
        'Contact Name',
        'Job Title',
        'Seniority',
        'Department',
        'Work Email',
        'Direct Phone',
        'Verification Status',
        'Funding Stage',
        'Buying Intent Score',
        'Tech Stack'
      ];
      const rows = targetLeads.map((l) => [
        l.companyName,
        l.domain,
        l.industry,
        l.employeeCount || l.employeeRange,
        l.revenueRange,
        l.country,
        l.city,
        l.contactName,
        l.contactTitle,
        l.seniority,
        l.department,
        l.contactEmail,
        l.contactPhone,
        l.verificationStatus,
        l.fundingStage,
        l.buyingIntentScore,
        (l.techStack || []).join('; ')
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((r) =>
          r.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leadsarrow_b2b_export_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    dispatch(decrementExportCredits(targetLeads.length));
    dispatch(consumeCredits(targetLeads.length));
    dispatch(setExportModalOpen(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50"
        onClick={() => dispatch(setExportModalOpen(false))}
      />

      <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Export B2B Leads Dataset
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedLeadIds.length === 0
                ? 'No leads selected for export'
                : isLoadingLeads
                ? 'Preparing lead details...'
                : `Ready to export ${targetLeads.length} selected record${targetLeads.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(setExportModalOpen(false))}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {selectedLeadIds.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Please Select Leads First</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Exports only download leads you have selected. Check the checkboxes next to the leads in the table you want to export.
              </p>
            </div>
          ) : (
            <>
              {/* Daily Limit & Batch Rules Notice */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center justify-between font-medium text-slate-900">
                  <span>Selected for Export:</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900">{selectedLeadIds.length} leads</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Single Export Limit (Max 50% daily limit or 5,000):</span>
                  <span className="font-mono tabular-nums">{maxAllowedBatch.toLocaleString()} leads</span>
                </div>
                {!isUnlimited && (
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Remaining Daily Credits:</span>
                    <span className="font-mono tabular-nums text-orange-600 font-semibold">{userCreditsRemaining.toLocaleString()}</span>
                  </div>
                )}
                {isCapped && (
                  <div className="pt-1.5 border-t border-slate-200 text-amber-700 font-medium">
                    ⚠️ Selected count exceeds batch limit. Only the first {maxAllowedBatch.toLocaleString()} selected leads will be exported in this batch.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block font-medium text-slate-700">Export Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormat('csv')}
                    className={`p-3 border rounded-lg text-left transition-colors cursor-pointer ${
                      format === 'csv'
                        ? 'border-orange-600 bg-orange-50/50 text-slate-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div>CSV Spreadsheet</div>
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                      Compatible with Salesforce, HubSpot, Excel
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('json')}
                    className={`p-3 border rounded-lg text-left transition-colors cursor-pointer ${
                      format === 'json'
                        ? 'border-orange-600 bg-orange-50/50 text-slate-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div>JSON Objects</div>
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                      Structured array for API & webhook ingestion
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                Includes verified decision-maker emails, direct phones, verification status, and company firmographics.
              </div>
            </>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => dispatch(setExportModalOpen(false))}
              className="px-4 py-2 font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedLeadIds.length === 0 || isLoadingLeads}
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none rounded-lg cursor-pointer"
            >
              {isLoadingLeads ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download {format.toUpperCase()} ({targetLeads.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
