import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Download, AlertTriangle, Zap, Sparkles, Loader2 } from 'lucide-react';
import { setExportModalOpen } from '../store/leadsSlice.js';
import { decrementExportCredits, consumeCredits, openUpgradeModal } from '../store/authSlice.js';
import { fetchLeadsByIdsApi } from '../services/api.js';
import ConfirmExportModal from './ConfirmExportModal.jsx';
import { showToast } from '../store/toastSlice.js';
import useBodyScrollLock from '../hooks/useBodyScrollLock.js';

export default function ExportModal() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isExportModalOpen, items, selectedLeadIds } = useSelector(
    (state) => state.leads
  );
  const [format, setFormat] = useState('csv');
  const [fetchedFullLeads, setFetchedFullLeads] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isConfirmingExport, setIsConfirmingExport] = useState(false);

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

  // Prevent background scrolling while the export modal is open
  useBodyScrollLock(isExportModalOpen);

  if (!isExportModalOpen) return null;

  const targetLeads = fetchedFullLeads.length > 0
    ? fetchedFullLeads
    : items.filter((l) => targetIds.includes(l.id));

  const handleOpenExportConfirm = () => {
    if (selectedLeadIds.length === 0) return;
    if (targetLeads.length === 0 || (!isUnlimited && userCreditsRemaining <= 0)) {
      dispatch(setExportModalOpen(false));
      dispatch(openUpgradeModal('starter'));
      return;
    }
    setIsConfirmingExport(true);
  };

  const handleExecuteDownload = () => {
    setIsConfirmingExport(false);
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
        'Buying Intent Score'
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
        l.buyingIntentScore
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
    dispatch(
      showToast({
        message: `Exported ${targetLeads.length} lead${targetLeads.length === 1 ? '' : 's'} to CSV spreadsheet!`,
        type: 'success'
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div
        className="fixed inset-0"
        onClick={() => dispatch(setExportModalOpen(false))}
      />

      <div className="relative z-10 w-full max-w-[calc(100vw-24px)] sm:max-w-md mx-auto my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/80 gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-display truncate">
              Export B2B Leads Dataset
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
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
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 text-xs overflow-y-auto max-h-[calc(85vh-80px)]">
          {selectedLeadIds.length === 0 ? (
            <div className="p-3.5 sm:p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-amber-900 dark:text-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Please Select Leads First</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Exports only download leads you have selected. Check the checkboxes next to the leads in the table you want to export.
              </p>
            </div>
          ) : (
            <>
              {/* Daily Limit & Batch Rules Notice */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between font-medium text-slate-900 dark:text-white">
                  <span>Selected for Export:</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">{selectedLeadIds.length} leads</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Single Export Limit (Max 50% or 5,000):</span>
                  <span className="font-mono tabular-nums">{maxAllowedBatch.toLocaleString()} leads</span>
                </div>
                {!isUnlimited && (
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Remaining Daily Credits:</span>
                    <span className="font-mono tabular-nums text-orange-600 dark:text-orange-400 font-semibold">{userCreditsRemaining.toLocaleString()}</span>
                  </div>
                )}
                {isCapped && (
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-400 font-medium">
                    ⚠️ Selected count exceeds batch limit. Only the first {maxAllowedBatch.toLocaleString()} selected leads will be exported in this batch.
                  </div>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs">Export Format</label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setFormat('csv')}
                    className={`p-2.5 sm:p-3 border rounded-xl text-left transition-colors cursor-pointer ${
                      format === 'csv'
                        ? 'border-orange-600 bg-orange-50/60 dark:bg-orange-950/40 text-slate-900 dark:text-white font-semibold'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-semibold truncate">CSV Spreadsheet</div>
                    <div className="text-[10px] sm:text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                      Salesforce, HubSpot, Excel
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('json')}
                    className={`p-2.5 sm:p-3 border rounded-xl text-left transition-colors cursor-pointer ${
                      format === 'json'
                        ? 'border-orange-600 bg-orange-50/60 dark:bg-orange-950/40 text-slate-900 dark:text-white font-semibold'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-semibold truncate">JSON Objects</div>
                    <div className="text-[10px] sm:text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                      Structured array for API ingestion
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
                Includes verified decision-maker emails, direct phones, verification status, and company firmographics.
              </div>
            </>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => dispatch(setExportModalOpen(false))}
              className="px-3 sm:px-4 py-2 font-semibold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedLeadIds.length === 0 || isLoadingLeads}
              onClick={handleOpenExportConfirm}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 font-bold text-xs text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-colors cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
            >
              {isLoadingLeads ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Download {format.toUpperCase()} ({targetLeads.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal before starting Export download */}
      <ConfirmExportModal
        isOpen={isConfirmingExport}
        onClose={() => setIsConfirmingExport(false)}
        onConfirm={handleExecuteDownload}
        title={`Confirm ${format.toUpperCase()} Export`}
        message={`Are you sure you want to download and export these ${targetLeads.length} leads as a ${format.toUpperCase()} file?`}
        exportCount={targetLeads.length}
        targetName="Selected B2B Leads"
        format={format}
        creditCost={isUnlimited ? 0 : targetLeads.length}
        remainingCredits={isUnlimited ? 'Unlimited' : userCreditsRemaining}
        confirmText={`Yes, Download ${format.toUpperCase()}`}
      />
    </div>
  );
}
