import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  SlidersHorizontal,
  Download,
  Plus,
  Bookmark,
  X
} from 'lucide-react';
import {
  applyQuickSegmentPreset,
  resetAllFilters,
  setMobileFilterOpen
} from '../store/filtersSlice.js';
import {
  setAddLeadModalOpen,
  setExportModalOpen,
  clearSelectedLeads
} from '../store/leadsSlice.js';
import { setSavedListsModalOpen } from '../store/savedListsSlice.js';

const QUICK_SEGMENTS = [
  {
    id: 'all',
    name: 'All Global Businesses',
    filters: {}
  },
  {
    id: 'very_recent',
    name: '✨ New Leads',
    filters: {
      onlyCustom: true
    }
  },
  {
    id: 'high_revenue',
    name: '$100M+ Enterprise Accounts',
    filters: {
      revenueRanges: ['> $1B', '$500M - $1B', '$250 - $500M', '$100 - $250M', '$100M - $500M', '$1B+']
    }
  }
];

export default function AnalyticsBar() {
  const dispatch = useDispatch();
  const { pagination, metrics, selectedLeadIds } = useSelector((state) => state.leads);
  const filters = useSelector((state) => state.filters);
  const { user } = useSelector((state) => state.auth);

  const activePreset = filters.activePresetName || (metrics.activeFiltersCount === 0 && !filters.onlyCustom ? 'All Global Businesses' : null);

  return (
    <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-3.5 space-y-3 z-10 shadow-xs">
      {/* Row 1: Database Scale KPIs & Primary Workspace Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <div className="text-xs text-slate-500">Matched B2B Leads</div>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {(pagination.estimatedGlobalMatches || 0).toLocaleString()}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <div>
            <div className="text-xs text-slate-500">Total Indexed Businesses</div>
            <div className="text-sm font-semibold text-slate-800 font-mono tabular-nums mt-0.5">
              {(pagination.totalDatabaseRecords || 0).toLocaleString()}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden md:block" />

          <div className="hidden md:block">
            <div className="text-xs text-slate-500">Verified Deliverability</div>
            <div className="text-sm font-semibold text-emerald-700 font-mono tabular-nums mt-0.5">
              {metrics.verifiedRatio}% Verified
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden xl:block" />

          <div className="hidden xl:block">
            <div className="text-xs text-slate-500">Avg. Buying Intent</div>
            <div className="text-sm font-semibold text-slate-800 font-mono tabular-nums mt-0.5">
              {metrics.avgIntentScore} / 100
            </div>
          </div>

          {user && (
            <>
              <div className="h-8 w-px bg-slate-200 hidden xl:block" />
              <div className="hidden xl:block">
                <div className="text-xs text-slate-500">Export Credits</div>
                <div className="text-sm font-semibold text-orange-600 font-mono tabular-nums mt-0.5">
                  {(user.creditsRemaining ?? 25000).toLocaleString()}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Workspace Toolbar Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => dispatch(setMobileFilterOpen(true))}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters ({metrics.activeFiltersCount})
          </button>

          <button
            type="button"
            onClick={() => dispatch(setSavedListsModalOpen(true))}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5 text-slate-500" />
            Save / Load List
          </button>

          <button
            type="button"
            onClick={() => dispatch(setAddLeadModalOpen(true))}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            Add B2B Lead
          </button>

          <button
            type="button"
            onClick={() => dispatch(setExportModalOpen(true))}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV / JSON
            {selectedLeadIds.length > 0 ? ` (${selectedLeadIds.length})` : ''}
          </button>
        </div>
      </div>

      {/* Row 2: Interactive Segment Filter Controls & Bulk Selection Notice */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
          {QUICK_SEGMENTS.map((seg) => {
            const isActive = activePreset === seg.name;
            return (
              <button
                key={seg.id}
                type="button"
                onClick={() => {
                  if (seg.id === 'all') {
                    dispatch(resetAllFilters());
                  } else {
                    dispatch(applyQuickSegmentPreset(seg));
                  }
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {seg.name}
              </button>
            );
          })}
        </div>

        {selectedLeadIds.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-slate-700">
            <span className="font-mono tabular-nums font-semibold text-orange-600">
              {selectedLeadIds.length} leads selected
            </span>
            <span>·</span>
            <button
              type="button"
              onClick={() => dispatch(setSavedListsModalOpen(true))}
              className="text-orange-600 hover:underline font-medium cursor-pointer whitespace-nowrap"
            >
              Add to Saved List
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => dispatch(clearSelectedLeads())}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 cursor-pointer whitespace-nowrap"
            >
              <X className="w-3 h-3" />
              Clear Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
