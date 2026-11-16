import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Bookmark,
  Plus,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Database,
  Layers,
  RefreshCw,
  CheckSquare,
  Download
} from 'lucide-react';
import {
  appendLeadsToSavedList,
  clearTargetListForAdding,
  incrementTargetListCount,
  fetchSavedLists,
  setSavedListsModalOpen
} from '../store/savedListsSlice.js';
import { clearSelectedLeads, setExportModalOpen } from '../store/leadsSlice.js';
import { showToast } from '../store/toastSlice.js';

export default function TargetListModeBanner({ activeView, setActiveView, onReturnToList }) {
  const dispatch = useDispatch();
  const { targetListForAdding, lists = [], firestoreLists = [] } = useSelector((state) => state.savedLists);
  const { selectedLeadIds = [] } = useSelector((state) => state.leads);
  const [isAdding, setIsAdding] = useState(false);

  // Set of lead IDs already in the target list
  const targetListLeadIds = useMemo(() => {
    if (!targetListForAdding?.id) return new Set();
    const liveList = (lists || []).find((l) => l.id === targetListForAdding.id) ||
                     (firestoreLists || []).find((l) => l.id === targetListForAdding.id);
    const ids = (liveList?.leadIds && liveList.leadIds.length > 0)
      ? liveList.leadIds
      : (targetListForAdding.leadIds || []);
    return new Set(ids.map((id) => String(id)));
  }, [targetListForAdding, lists, firestoreLists]);

  // Selected lead IDs that are eligible to be added (excluding already in list)
  const eligibleSelectedIds = useMemo(() => {
    if (!targetListForAdding) return selectedLeadIds;
    return selectedLeadIds.filter((id) => !targetListLeadIds.has(String(id)));
  }, [selectedLeadIds, targetListForAdding, targetListLeadIds]);

  // If not in Target List Mode and no leads are selected, do not render anything
  if (!targetListForAdding && (!selectedLeadIds.length || (activeView !== 'finder' && activeView !== 'custom'))) {
    return null;
  }

  const handleAddSelected = async () => {
    if (!eligibleSelectedIds.length || !targetListForAdding) {
      if (selectedLeadIds.length > 0) {
        dispatch(
          showToast({
            message: `Selected lead(s) are already in "${targetListForAdding?.name}".`,
            type: 'info'
          })
        );
      }
      return;
    }
    setIsAdding(true);
    try {
      const action = await dispatch(
        appendLeadsToSavedList({
          listId: targetListForAdding.id,
          leadIds: eligibleSelectedIds
        })
      );
      if (appendLeadsToSavedList.fulfilled.match(action)) {
        const addedCount = action.payload?.addedCount !== undefined
          ? action.payload.addedCount
          : eligibleSelectedIds.length;
        if (addedCount > 0) {
          dispatch(incrementTargetListCount(addedCount));
        }
        dispatch(clearSelectedLeads());
        await dispatch(fetchSavedLists());
        // Skip success toast on small screens to avoid taking space and covering the dock
        if (typeof window !== 'undefined' && window.innerWidth >= 640) {
          dispatch(
            showToast({
              message: addedCount > 0
                ? `Added ${addedCount} lead(s) to "${targetListForAdding.name}"!`
                : `Selected leads are already in "${targetListForAdding.name}".`,
              type: addedCount > 0 ? 'success' : 'info'
            })
          );
        }
      } else {
        throw new Error(action.payload || 'Failed to add leads to target list');
      }
    } catch (err) {
      dispatch(
        showToast({
          message: err?.message || 'Failed to add leads to target list',
          type: 'error'
        })
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleFinish = () => {
    if (!targetListForAdding) return;
    const listId = targetListForAdding.id;
    dispatch(clearTargetListForAdding());
    if (onReturnToList) {
      onReturnToList(listId);
    }
    if (setActiveView) {
      setActiveView('lists');
    }
  };

  return (
    <>
      {/* Top Context Banner - Rendered when Target List Mode is active */}
      {targetListForAdding && (
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white border-b border-orange-500/40 px-3 sm:px-6 py-2 sm:py-2.5 shadow-md relative z-30 transition-all animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
            {/* Left: Target List Details */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-xs">
                <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[11px] sm:text-xs font-semibold text-orange-100">Target List:</span>
                  <span className="text-xs sm:text-xs font-bold bg-black/25 px-2 py-0.5 rounded-md font-mono tracking-wide truncate max-w-[160px] sm:max-w-[220px]">
                    "{targetListForAdding.name}"
                  </span>
                  <span className="text-[10px] sm:text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-medium">
                    {targetListForAdding.leadCount || 0} leads
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-orange-100/90 truncate mt-0.5 hidden sm:block">
                  {activeView === 'custom'
                    ? 'Select any custom leads below with checkboxes to add to this target list.'
                    : 'Filter and select any verified B2B leads below with checkboxes to add to this target list.'}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Add Selected Leads button (also available in top banner) */}
              {selectedLeadIds.length > 0 && (
                <button
                  type="button"
                  disabled={isAdding || eligibleSelectedIds.length === 0}
                  onClick={handleAddSelected}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-orange-700 bg-white hover:bg-orange-50 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  {isAdding ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-600" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-orange-600" />
                  )}
                  <span>
                    {eligibleSelectedIds.length > 0
                      ? `Add ${eligibleSelectedIds.length} Selected`
                      : 'Already in List'}
                  </span>
                </button>
              )}

              {/* Quick toggle between Lead Finder and Custom Leads */}
              {activeView === 'finder' && (
                <button
                  type="button"
                  onClick={() => setActiveView('custom')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-black/20 hover:bg-black/35 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  title="Add leads from your Custom Leads workspace"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Custom Leads</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}

              {activeView === 'custom' && (
                <button
                  type="button"
                  onClick={() => setActiveView('finder')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-black/20 hover:bg-black/35 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  title="Add leads from Core Lead Finder"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <Database className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Core Lead Finder</span>
                </button>
              )}

              {/* Done / Return to List */}
              <button
                type="button"
                onClick={handleFinish}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-black/35 hover:bg-black/50 active:scale-95 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Action Dock: Always sticky at the bottom of the viewport so users never need to scroll back up */}
      <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/95 dark:bg-slate-900/95 text-white backdrop-blur-md border border-orange-500/40 rounded-2xl shadow-2xl p-2 sm:p-2.5 flex items-center justify-between gap-2 sm:gap-3 max-w-xl w-full sm:w-auto animate-in slide-in-from-bottom-3 duration-200">
          {targetListForAdding ? (
            /* Scenario A: Target List Mode is Active */
            selectedLeadIds.length > 0 ? (
              <>
                <div className="flex items-center gap-2 min-w-0 pl-1">
                  <Bookmark className="w-4 h-4 text-orange-400 shrink-0" />
                  <div className="min-w-0 hidden sm:block">
                    <div className="text-xs font-semibold text-white truncate max-w-[120px] sm:max-w-[160px]">
                      Target: <span className="font-mono text-orange-300">"{targetListForAdding.name}"</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={isAdding || eligibleSelectedIds.length === 0}
                    onClick={handleAddSelected}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-orange-950/40 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {isAdding ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>
                      {eligibleSelectedIds.length > 0
                        ? `Add ${eligibleSelectedIds.length} to "${targetListForAdding.name}"`
                        : `Already in "${targetListForAdding.name}"`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFinish}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                    title="Done adding leads and return to list"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Done</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => dispatch(clearSelectedLeads())}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Deselect all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              /* Scenario A2: Target List Mode is active, but 0 leads selected yet */
              <>
                <div className="flex items-center gap-2 min-w-0 pl-1">
                  <Bookmark className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="text-xs text-slate-200 truncate max-w-[200px] sm:max-w-none">
                    Adding to <strong className="text-white">"{targetListForAdding.name}"</strong>{' '}
                    <span className="text-slate-400 font-mono">({targetListForAdding.leadCount || 0} leads)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    · Check boxes below
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Done</span>
                  </button>
                </div>
              </>
            )
          ) : (
            /* Scenario B: Normal Browsing (Not in target list mode) with selected leads */
            <>
              <div className="flex items-center gap-2 min-w-0 pl-1">
                <CheckSquare className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="font-mono font-bold text-white text-xs">{selectedLeadIds.length}</span>
                <span className="text-xs text-slate-300">selected</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => dispatch(setSavedListsModalOpen(true))}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 active:scale-95 rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Add to List</span>
                </button>

                <button
                  type="button"
                  onClick={() => dispatch(setExportModalOpen(true))}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>

                <button
                  type="button"
                  onClick={() => dispatch(clearSelectedLeads())}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Deselect all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
