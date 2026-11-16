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
} from '../../store/filtersSlice.js';
import {
  setAddLeadModalOpen,
  setExportModalOpen,
  clearSelectedLeads
} from '../../store/leadsSlice.js';
import { setSavedListsModalOpen } from '../../store/savedListsSlice.js';
import { openAuthModal } from '../../store/authSlice.js';

const QUICK_SEGMENTS = [
  {
    id: 'all',
    name: 'All Global Businesses',
    filters: {}
  },
  {
    id: 'very_recent',
    name: '✨ High Intent Verified',
    filters: {
      minIntentScore: 90,
      hasVerifiedEmail: true
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
  const { pagination, metrics, selectedLeadIds, loading } = useSelector((state) => state.leads);
  const filters = useSelector((state) => state.filters);
  const { user } = useSelector((state) => state.auth);

  const activePreset = filters.activePresetName || (metrics.activeFiltersCount === 0 && !filters.onlyCustom ? 'All Global Businesses' : null);

  const hasLoaded = pagination.totalDatabaseRecords > 0 || (pagination.estimatedGlobalMatches === 0 && !loading);

  return (
    <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 px-3 sm:px-6 py-2.5 sm:py-3.5 space-y-2.5 sm:space-y-3 z-10 shadow-xs transition-colors">
      {/* Row 1: Database Scale KPIs & Primary Workspace Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          <div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Matched B2B Leads</div>
            <div className={`text-base sm:text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums transition-opacity duration-150 ${loading ? 'opacity-70' : 'opacity-100'}`}>
              {(pagination.estimatedGlobalMatches || 10363428).toLocaleString()}
            </div>
          </div>

          <div className="h-7 sm:h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Total Indexed Businesses</div>
            <div className={`text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums mt-0.5 transition-opacity duration-150 ${loading ? 'opacity-70' : 'opacity-100'}`}>
              {(pagination.totalDatabaseRecords || 10363428).toLocaleString()}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

          <div className="hidden md:block">
            <div className="text-xs text-slate-500 dark:text-slate-400">Verified Deliverability</div>
            <div className={`text-sm font-semibold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums mt-0.5 transition-opacity duration-150 ${loading ? 'opacity-70' : 'opacity-100'}`}>
              {`${metrics.verifiedRatio || 100}% Verified`}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden xl:block" />

          <div className="hidden xl:block">
            <div className="text-xs text-slate-500 dark:text-slate-400">Avg. Buying Intent</div>
            <div className={`text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums mt-0.5 transition-opacity duration-150 ${loading ? 'opacity-70' : 'opacity-100'}`}>
              {`${metrics.avgIntentScore || 88} / 100`}
            </div>
          </div>

          {user && (
            <>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden xl:block" />
              <div className="hidden xl:block">
                <div className="text-xs text-slate-500 dark:text-slate-400">Export Credits</div>
                <div className="text-sm font-semibold text-orange-600 dark:text-orange-400 font-mono tabular-nums mt-0.5">
                  {(user.creditsRemaining ?? 25000).toLocaleString()}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Workspace Toolbar Controls - Responsive Icon/Text on Mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => dispatch(setMobileFilterOpen(true))}
            className="lg:hidden inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Open Database Filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span className="hidden sm:inline">Filters</span>
            <span className="text-[11px] sm:text-xs">({metrics.activeFiltersCount})</span>
          </button>

          <button
            type="button"
            onClick={() => dispatch(setSavedListsModalOpen(true))}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Saved Lists & Target Segments"
          >
            <Bookmark className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Save / Load List</span>
            <span className="sm:hidden text-xs">Lists</span>
            {selectedLeadIds.length > 0 && (
              <span className="ml-0.5 sm:ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 font-bold font-mono">
                {selectedLeadIds.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => dispatch(setExportModalOpen(true))}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-orange-600 hover:bg-slate-800 dark:hover:bg-orange-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs active:scale-95"
            title="Export Selected Leads to CSV / JSON"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Export CSV / JSON</span>
            <span className="sm:hidden text-xs">Export</span>
            {selectedLeadIds.length > 0 && (
              <span className="font-mono text-[11px] sm:text-xs">({selectedLeadIds.length})</span>
            )}
          </button>
        </div>
      </div>

      {/* Row 2: Interactive Segment Filter Controls & Bulk Selection Notice */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pt-0.5 sm:pt-1">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto max-w-full">
          {filters.savedListLeadIds && (
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-md bg-orange-600 text-white shadow-xs shrink-0">
              <Bookmark className="w-3.5 h-3.5" />
              <span className="truncate max-w-[140px] sm:max-w-none">List: {filters.activePresetName || 'Saved Segment'}</span>
              <button
                type="button"
                onClick={() => dispatch(resetAllFilters())}
                className="ml-1 p-0.5 hover:bg-orange-700 rounded-sm cursor-pointer"
                title="Clear saved list filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {QUICK_SEGMENTS.map((seg) => {
            const isActive = !filters.savedListLeadIds && activePreset === seg.name;
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
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {seg.name}
              </button>
            );
          })}
        </div>

        {selectedLeadIds.length > 0 && (
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-700 dark:text-slate-300">
            <span className="font-mono tabular-nums font-semibold text-orange-600">
              {selectedLeadIds.length} <span className="hidden sm:inline">leads</span> selected
            </span>
            <span>·</span>
            <button
              type="button"
              onClick={() => dispatch(setSavedListsModalOpen(true))}
              className="text-orange-600 hover:underline font-medium cursor-pointer whitespace-nowrap"
            >
              <span className="hidden sm:inline">Add to Saved List</span>
              <span className="sm:hidden">Add to List</span>
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => dispatch(clearSelectedLeads())}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer whitespace-nowrap"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
