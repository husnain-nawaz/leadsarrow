import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Download, AlertTriangle, Zap, Sparkles } from 'lucide-react';
import { setExportModalOpen } from '../store/leadsSlice.js';
import { decrementExportCredits, openUpgradeModal } from '../store/authSlice.js';

export default function ExportModal() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isExportModalOpen, items, selectedLeadIds } = useSelector(
    (state) => state.leads
  );
  const [format, setFormat] = useState('csv');

  if (!isExportModalOpen) return null;

  const targetLeads =
    selectedLeadIds.length > 0
      ? items.filter((l) => selectedLeadIds.includes(l.id))
      : items;

  const isUnlimited = user?.planId === 'unlimited' || user?.plan?.toLowerCase().includes('unlimited');
  const userCredits = user?.creditsRemaining ?? 100;
  const neededCredits = targetLeads.length;
  const hasInsufficientCredits = !isUnlimited && userCredits < neededCredits;

  const handleDownload = () => {
    if (hasInsufficientCredits) {
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
              Ready to export {targetLeads.length} verified records
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
            Includes full firmographics, decision-maker contact emails, direct dial phones,
            SMTP verification status, and tech stack signals.
          </div>

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
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download {format.toUpperCase()} ({targetLeads.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
