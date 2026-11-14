import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Plus, Trash2, Filter, ExternalLink } from 'lucide-react';
import {
  setSavedListsModalOpen,
  createSavedList,
  removeSavedList,
  fetchSavedLists
} from '../store/savedListsSlice.js';
import { setSavedListFilter } from '../store/filtersSlice.js';

export default function SavedListsModal({ setActiveView, onSelectFullPageList }) {
  const dispatch = useDispatch();
  const { isSavedListsModalOpen, lists, firestoreLists } = useSelector(
    (state) => state.savedLists
  );
  const { selectedLeadIds, items } = useSelector((state) => state.leads);
  const filters = useSelector((state) => state.filters);

  const [listName, setListName] = useState('');
  const [listDesc, setListDesc] = useState('');

  // Always refresh saved lists from MySQL whenever modal opens
  useEffect(() => {
    if (isSavedListsModalOpen) {
      dispatch(fetchSavedLists());
    }
  }, [isSavedListsModalOpen, dispatch]);

  if (!isSavedListsModalOpen) return null;

  // Combine server lists and user Firestore lists without duplicates
  const seenIds = new Set();
  const mergedLists = [...firestoreLists, ...lists].filter((l) => {
    if (!l || seenIds.has(l.id)) return false;
    seenIds.add(l.id);
    return true;
  });

  const handleCreateList = (e) => {
    e.preventDefault();
    if (!listName.trim()) return;

    const leadIdsToSave =
      selectedLeadIds.length > 0
        ? selectedLeadIds
        : items.slice(0, 10).map((i) => i.id);

    const activeSummaryParts = [];
    if (filters.industries.length) activeSummaryParts.push(`Industry: ${filters.industries.join(', ')}`);
    if (filters.employeeRanges.length) activeSummaryParts.push(`Size: ${filters.employeeRanges.join(', ')}`);
    if (filters.countries.length) activeSummaryParts.push(`Country: ${filters.countries.join(', ')}`);
    const filterSummary = activeSummaryParts.length
      ? activeSummaryParts.join(' · ')
      : 'Custom Selected B2B Leads';

    dispatch(
      createSavedList({
        name: listName.trim(),
        description: listDesc.trim() || 'Curated B2B target account segment',
        leadIds: leadIdsToSave,
        filterSummary,
        leadCount: leadIdsToSave.length
      })
    );
    setListName('');
    setListDesc('');
  };

  const handleLoadList = (list) => {
    dispatch(
      setSavedListFilter({
        leadIds: list.leadIds || [],
        name: list.name
      })
    );
    dispatch(setSavedListsModalOpen(false));
  };

  const handleOpenFullPage = (targetListId = null) => {
    dispatch(setSavedListsModalOpen(false));
    if (onSelectFullPageList && targetListId) {
      onSelectFullPageList(targetListId);
    }
    if (setActiveView) {
      setActiveView('lists');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={() => dispatch(setSavedListsModalOpen(false))}
      />

      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-900 dark:text-slate-100 transition-colors">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Saved B2B Lead Lists & Target Segments
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Save selected leads ({selectedLeadIds.length > 0 ? `${selectedLeadIds.length} selected` : 'current view'}) to a reusable list or mix custom leads
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenFullPage()}
              title="Open full page detailed manager"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 border border-orange-200/60 dark:border-orange-800/60 rounded-lg transition-all cursor-pointer shadow-2xs"
            >
              <span>Full Page View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => dispatch(setSavedListsModalOpen(false))}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 overscroll-contain text-xs">
          {/* Create New List Form */}
          <form
            onSubmit={handleCreateList}
            className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-3"
          >
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Create New Lead List ({selectedLeadIds.length > 0 ? `${selectedLeadIds.length} selected leads` : 'Top 10 current results'})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="List Name (e.g. Q4 Enterprise SaaS Targets)"
                className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-orange-600"
              />
              <input
                type="text"
                value={listDesc}
                onChange={(e) => setListDesc(e.target.value)}
                placeholder="Optional note or campaign owner..."
                className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-orange-600"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save List</span>
              </button>
            </div>
          </form>

          {/* Existing Saved Lists */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Your Saved Lists ({mergedLists.length})
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {mergedLists.length === 0 ? (
                <div className="p-6 text-center text-slate-400 dark:text-slate-500">
                  No saved lists created yet. Select leads from the table or filters and save them here.
                </div>
              ) : (
                mergedLists.map((list) => (
                  <div
                    key={list.id}
                    className="p-4 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {list.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {list.description || list.filterSummary}
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
                        {list.leadCount || (list.leadIds ? list.leadIds.length : 0)} leads · {list.filterSummary}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenFullPage(list.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
                        title="Open detailed view of this saved list"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadList(list)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 border border-orange-200/60 dark:border-orange-800/60 rounded-lg transition-colors cursor-pointer"
                      >
                        <Filter className="w-3 h-3" />
                        <span>Filter Leads</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => dispatch(removeSavedList(list.id))}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="Delete saved list"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer with Direct Link to Full Details Page (Just like ProfileModal) */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenFullPage()}
            className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Full Saved Lists Manager & Details Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => dispatch(setSavedListsModalOpen(false))}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
