import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bookmark, Plus, Check, ArrowRight, ArrowLeft, X, Sparkles, Database, Layers } from 'lucide-react';
import {
  appendLeadsToSavedList,
  clearTargetListForAdding,
  incrementTargetListCount,
  fetchSavedLists
} from '../store/savedListsSlice.js';
import { clearSelectedLeads } from '../store/leadsSlice.js';

export default function TargetListModeBanner({ activeView, setActiveView, onReturnToList }) {
  const dispatch = useDispatch();
  const { targetListForAdding } = useSelector((state) => state.savedLists);
  const { selectedLeadIds = [] } = useSelector((state) => state.leads);
  const [isAdding, setIsAdding] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  if (!targetListForAdding) return null;

  const handleAddSelected = async () => {
    if (!selectedLeadIds.length) return;
    setIsAdding(true);
    try {
      await dispatch(
        appendLeadsToSavedList({
          listId: targetListForAdding.id,
          leadIds: selectedLeadIds
        })
      ).unwrap();
      const count = selectedLeadIds.length;
      dispatch(incrementTargetListCount(count));
      dispatch(clearSelectedLeads());
      await dispatch(fetchSavedLists());
      setSuccessToast(`Added ${count} lead(s) to "${targetListForAdding.name}"!`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      alert(err?.message || 'Failed to add leads to target list');
    } finally {
      setIsAdding(false);
    }
  };

  const handleFinish = () => {
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
    <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white border-b border-orange-500/40 px-4 sm:px-6 py-2.5 shadow-md relative z-30 transition-all animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Target List Details */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-xs">
            <Bookmark className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-orange-100">Target List Mode:</span>
              <span className="text-xs font-bold bg-black/25 px-2 py-0.5 rounded-md font-mono tracking-wide truncate max-w-[200px]">
                "{targetListForAdding.name}"
              </span>
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-medium">
                {targetListForAdding.leadCount || 0} leads in list
              </span>
            </div>
            <p className="text-[11px] text-orange-100/90 truncate mt-0.5">
              {activeView === 'custom'
                ? 'Select any custom leads below with checkboxes to add to this target list.'
                : 'Filter and select any verified B2B leads below with checkboxes to add to this target list.'}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Selected Leads button */}
          {selectedLeadIds.length > 0 && (
            <button
              type="button"
              disabled={isAdding}
              onClick={handleAddSelected}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-orange-700 bg-white hover:bg-orange-50 active:scale-95 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-orange-600" />
              <span>Add {selectedLeadIds.length} Selected Leads</span>
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
              <span>Custom Leads</span>
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
              <span>Core Lead Finder</span>
            </button>
          )}

          {/* Done / Return to List */}
          <button
            type="button"
            onClick={handleFinish}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-black/35 hover:bg-black/50 active:scale-95 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Done / Return to List</span>
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-md shadow-lg flex items-center gap-1 animate-in fade-in duration-150 z-50">
          <Check className="w-3.5 h-3.5" />
          <span>{successToast}</span>
        </div>
      )}
    </div>
  );
}
