import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Plus, Trash2, Filter } from 'lucide-react';
import {
  setSavedListsModalOpen,
  createSavedList,
  removeSavedList
} from '../store/savedListsSlice.js';
import { setSavedListFilter } from '../store/filtersSlice.js';

export default function SavedListsModal() {
  const dispatch = useDispatch();
  const { isSavedListsModalOpen, lists, firestoreLists } = useSelector(
    (state) => state.savedLists
  );
  const { selectedLeadIds, items } = useSelector((state) => state.leads);
  const filters = useSelector((state) => state.filters);

  const [listName, setListName] = useState('');
  const [listDesc, setListDesc] = useState('');

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50"
        onClick={() => dispatch(setSavedListsModalOpen(false))}
      />

      <div className="relative z-10 w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Saved B2B Lead Lists & Target Segments
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Save selected leads ({selectedLeadIds.length || 'current view'}) to a reusable list
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(setSavedListsModalOpen(false))}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Create New List Form */}
          <form
            onSubmit={handleCreateList}
            className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
          >
            <div className="text-xs font-semibold text-slate-900">
              Create New Lead List ({selectedLeadIds.length > 0 ? `${selectedLeadIds.length} selected leads` : 'Top 10 current results'})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="List Name (e.g. Q4 Enterprise SaaS Targets)"
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-orange-600"
              />
              <input
                type="text"
                value={listDesc}
                onChange={(e) => setListDesc(e.target.value)}
                placeholder="Optional note or campaign owner..."
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-orange-600"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Save List
              </button>
            </div>
          </form>

          {/* Existing Saved Lists */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-slate-800">
              Your Saved Lists ({mergedLists.length})
            </div>
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
              {mergedLists.map((list) => (
                <div
                  key={list.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-900">
                      {list.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {list.description || list.filterSummary}
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-slate-400">
                      {list.leadCount || (list.leadIds ? list.leadIds.length : 0)} leads · {list.filterSummary}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleLoadList(list)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Filter className="w-3 h-3" />
                      Filter Leads
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch(removeSavedList(list.id))}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                      title="Delete saved list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
