import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  X,
  Plus,
  Filter,
  ExternalLink,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserPlus,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import {
  setSavedListsModalOpen,
  createSavedList,
  fetchSavedLists,
  appendLeadsToSavedList
} from '../store/savedListsSlice.js';
import { setSavedListFilter } from '../store/filtersSlice.js';
import AddLeadsToSavedListModal from './AddLeadsToSavedListModal.jsx';

export default function SavedListsModal({ setActiveView, onSelectFullPageList }) {
  const dispatch = useDispatch();
  const { isSavedListsModalOpen, lists, firestoreLists } = useSelector(
    (state) => state.savedLists
  );
  const { selectedLeadIds, items } = useSelector((state) => state.leads);
  const filters = useSelector((state) => state.filters);

  const [listName, setListName] = useState('');
  const [listDesc, setListDesc] = useState('');
  const [includeSelectedLeads, setIncludeSelectedLeads] = useState(selectedLeadIds.length > 0);
  const [targetAppendListId, setTargetAppendListId] = useState('');
  const [isAppending, setIsAppending] = useState(false);
  const [appendFeedback, setAppendFeedback] = useState(null);
  const [addLeadsModalTarget, setAddLeadsModalTarget] = useState(null);

  // Custom searchable dropdown states for Option 1
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const dropdownRef = useRef(null);

  // Main list search and pagination states (5 per page)
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [modalPage, setModalPage] = useState(1);
  const PAGE_SIZE = 5;

  // Handle click outside to close custom dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Always refresh saved lists from MySQL whenever modal opens
  useEffect(() => {
    if (isSavedListsModalOpen) {
      dispatch(fetchSavedLists());
      setIncludeSelectedLeads(selectedLeadIds.length > 0);
      setModalPage(1);
      setListSearchQuery('');
      setDropdownSearch('');
      setIsDropdownOpen(false);
    }
  }, [isSavedListsModalOpen, dispatch, selectedLeadIds.length]);

  // Robustly combine server lists and user Firestore lists, strictly prioritizing authoritative MySQL server lists
  const mergedLists = useMemo(() => {
    const map = new Map();

    // 1. Authoritative MySQL server lists first
    (lists || []).forEach((sl) => {
      if (sl?.id) {
        const rawIds = sl.leadIds || sl.lead_ids || [];
        const resolvedLeadIds = Array.isArray(rawIds)
          ? rawIds
          : (typeof rawIds === 'string'
              ? (() => {
                  try { return JSON.parse(rawIds); } catch { return rawIds.split(',').map((s) => s.trim()).filter(Boolean); }
                })()
              : []);
        map.set(sl.id, {
          ...sl,
          leadIds: resolvedLeadIds,
          leadCount: sl.leadCount !== undefined && sl.leadCount !== null ? sl.leadCount : resolvedLeadIds.length
        });
      }
    });

    // 2. Augment with Firestore lists without overwriting complete server leadIds
    (firestoreLists || []).forEach((fl) => {
      if (!fl?.id) return;
      const rawFsIds = fl.leadIds || fl.lead_ids || (fl.leadIdsCsv ? fl.leadIdsCsv.split(',').map((s) => s.trim()).filter(Boolean) : []);
      const resolvedFsIds = Array.isArray(rawFsIds)
        ? rawFsIds
        : (typeof rawFsIds === 'string'
            ? (() => {
                try { return JSON.parse(rawFsIds); } catch { return rawFsIds.split(',').map((s) => s.trim()).filter(Boolean); }
              })()
            : []);

      if (map.has(fl.id)) {
        const existing = map.get(fl.id);
        const mergedIds = (existing.leadIds && existing.leadIds.length > 0)
          ? (resolvedFsIds.length > existing.leadIds.length
              ? Array.from(new Set([...existing.leadIds, ...resolvedFsIds]))
              : existing.leadIds)
          : resolvedFsIds;
        map.set(fl.id, {
          ...fl,
          ...existing,
          leadIds: mergedIds,
          leadCount: Math.max(existing.leadCount || 0, fl.leadCount || 0, mergedIds.length)
        });
      } else {
        map.set(fl.id, {
          ...fl,
          leadIds: resolvedFsIds,
          leadCount: fl.leadCount !== undefined && fl.leadCount !== null ? fl.leadCount : resolvedFsIds.length
        });
      }
    });

    return Array.from(map.values());
  }, [lists, firestoreLists]);

  const selectedTargetList = useMemo(() => {
    return mergedLists.find((l) => l.id === targetAppendListId) || null;
  }, [mergedLists, targetAppendListId]);

  const dropdownFilteredLists = useMemo(() => {
    if (!dropdownSearch.trim()) return mergedLists;
    const q = dropdownSearch.toLowerCase().trim();
    return mergedLists.filter(
      (l) =>
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.description && l.description.toLowerCase().includes(q))
    );
  }, [mergedLists, dropdownSearch]);

  const filteredLists = useMemo(() => {
    if (!listSearchQuery.trim()) return mergedLists;
    const q = listSearchQuery.toLowerCase().trim();
    return mergedLists.filter(
      (l) =>
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.description && l.description.toLowerCase().includes(q)) ||
        (l.filterSummary && l.filterSummary.toLowerCase().includes(q))
    );
  }, [mergedLists, listSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredLists.length / PAGE_SIZE));
  const paginatedLists = useMemo(() => {
    const start = (modalPage - 1) * PAGE_SIZE;
    return filteredLists.slice(start, start + PAGE_SIZE);
  }, [filteredLists, modalPage]);

  if (!isSavedListsModalOpen) return null;

  const handleCreateList = (e) => {
    e.preventDefault();
    if (!listName.trim()) return;

    // STRICT: Only save leads if user explicitly selected them and chose to include them.
    // If empty or unchecked, save strictly empty [] (0 leads) - NEVER inject 10 random leads!
    const leadIdsToSave =
      selectedLeadIds.length > 0 && includeSelectedLeads
        ? selectedLeadIds
        : [];

    const activeSummaryParts = [];
    if (filters.industries.length) activeSummaryParts.push(`Industry: ${filters.industries.join(', ')}`);
    if (filters.employeeRanges.length) activeSummaryParts.push(`Size: ${filters.employeeRanges.join(', ')}`);
    if (filters.countries.length) activeSummaryParts.push(`Country: ${filters.countries.join(', ')}`);
    const filterSummary = activeSummaryParts.length
      ? activeSummaryParts.join(' · ')
      : (leadIdsToSave.length > 0 ? 'Custom Selected B2B Leads' : 'Empty Curated List');

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

  const handleAppendSelectedLeads = async (listId) => {
    const targetId = listId || targetAppendListId;
    if (!targetId || !selectedLeadIds.length) return;
    setIsAppending(true);
    setAppendFeedback(null);
    try {
      await dispatch(appendLeadsToSavedList({ listId: targetId, leadIds: selectedLeadIds })).unwrap();
      const target = mergedLists.find((l) => l.id === targetId);
      setAppendFeedback({
        type: 'success',
        text: `Added ${selectedLeadIds.length} lead${selectedLeadIds.length > 1 ? 's' : ''} to "${target?.name || 'list'}" successfully!`
      });
      setTimeout(() => setAppendFeedback(null), 4000);
    } catch (err) {
      setAppendFeedback({
        type: 'error',
        text: err?.message || 'Failed to add leads to list'
      });
    } finally {
      setIsAppending(false);
    }
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
          {/* Append Feedback Alert */}
          {appendFeedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                appendFeedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {appendFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{appendFeedback.text}</span>
            </div>
          )}

          {/* Quick Option 1: Add Selected Leads to an Already Saved List */}
          {mergedLists.length > 0 && (
            <div className="p-4 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-800/60 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span>Add Selected Leads to an Existing List</span>
                </div>
                {selectedLeadIds.length > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-600 text-white shadow-2xs">
                    {selectedLeadIds.length} lead{selectedLeadIds.length > 1 ? 's' : ''} selected
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    (No leads selected in table yet)
                  </span>
                )}
              </div>

              {/* Custom Searchable List Selector (Modern UI replacing browser native select) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border rounded-xl transition-all cursor-pointer text-left ${
                      isDropdownOpen
                        ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-orange-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Bookmark className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                      {selectedTargetList ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {selectedTargetList.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 shrink-0">
                            {selectedTargetList.leadCount || (selectedTargetList.leadIds ? selectedTargetList.leadIds.length : 0)} leads
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">
                          Choose an already saved list to add to...
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isDropdownOpen ? 'rotate-180 text-orange-600' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Popover */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      {/* Search Inside Dropdown */}
                      <div className="p-2 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/60">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={dropdownSearch}
                            onChange={(e) => setDropdownSearch(e.target.value)}
                            placeholder="Type to filter lists..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Options List */}
                      <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-100/80 dark:divide-slate-700/40">
                        {dropdownFilteredLists.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-400">
                            No lists found matching "{dropdownSearch}"
                          </div>
                        ) : (
                          dropdownFilteredLists.map((l) => {
                            const isSelected = l.id === targetAppendListId;
                            const count = l.leadCount || (l.leadIds ? l.leadIds.length : 0);
                            return (
                              <button
                                key={l.id}
                                type="button"
                                onClick={() => {
                                  setTargetAppendListId(l.id);
                                  setIsDropdownOpen(false);
                                  setDropdownSearch('');
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                                  isSelected
                                    ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-semibold'
                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Bookmark
                                    className={`w-3.5 h-3.5 shrink-0 ${
                                      isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'
                                    }`}
                                  />
                                  <span className="truncate">{l.name}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300">
                                    {count} leads
                                  </span>
                                  {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!targetAppendListId || selectedLeadIds.length === 0 || isAppending}
                  onClick={() => handleAppendSelectedLeads(targetAppendListId)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap"
                >
                  {isAppending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add {selectedLeadIds.length > 0 ? `${selectedLeadIds.length} ` : ''}Leads</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Option 2: Create New List Form */}
          <form
            onSubmit={handleCreateList}
            className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Create New Saved List
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedLeadIds.length > 0 && includeSelectedLeads
                  ? `With ${selectedLeadIds.length} selected leads`
                  : 'Empty list (0 leads)'}
              </span>
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

            {/* Checkbox option if leads are selected */}
            {selectedLeadIds.length > 0 ? (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={includeSelectedLeads}
                  onChange={(e) => setIncludeSelectedLeads(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 accent-orange-600 cursor-pointer"
                />
                <span>Include {selectedLeadIds.length} currently selected leads in this new list</span>
              </label>
            ) : (
              <p className="text-[11px] text-slate-400">
                No leads selected in table. This will be created as an <strong>empty list (0 leads)</strong>. You can add leads to it anytime.
              </p>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save New List {selectedLeadIds.length > 0 && includeSelectedLeads ? `(${selectedLeadIds.length} leads)` : '(0 leads)'}</span>
              </button>
            </div>
          </form>

          {/* Section 3: Existing Saved Lists with Search & Pagination */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>Your Saved Lists</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {filteredLists.length}
                </span>
              </div>

              {/* Search Option */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={listSearchQuery}
                  onChange={(e) => {
                    setListSearchQuery(e.target.value);
                    setModalPage(1);
                  }}
                  placeholder="Search saved lists by name..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
                />
                {listSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setListSearchQuery('');
                      setModalPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {filteredLists.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Search className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {listSearchQuery ? `No lists matching "${listSearchQuery}"` : 'No saved lists created yet.'}
                  </div>
                  {listSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setListSearchQuery('');
                        setModalPage(1);
                      }}
                      className="px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                paginatedLists.map((list) => (
                  <div
                    key={list.id}
                    className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {list.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 shrink-0">
                          {list.leadCount || (list.leadIds ? list.leadIds.length : 0)} leads
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {list.description || list.filterSummary}
                      </div>
                      <div className="text-[10px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
                        {list.filterSummary}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {selectedLeadIds.length > 0 && (
                        <button
                          type="button"
                          disabled={isAppending}
                          onClick={() => handleAppendSelectedLeads(list.id)}
                          className="p-2 text-white bg-orange-600 hover:bg-orange-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-all cursor-pointer shadow-2xs"
                          title={`Add ${selectedLeadIds.length} selected leads to "${list.name}"`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setAddLeadsModalTarget(list)}
                        className="p-2 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer shadow-2xs"
                        title="Search and add leads to this list"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLoadList(list)}
                        className="p-2 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 border border-orange-200/60 dark:border-orange-800/60 rounded-lg transition-all cursor-pointer shadow-2xs"
                        title="Filter Lead Finder table by this list"
                      >
                        <Filter className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenFullPage(list.id)}
                        className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer shadow-2xs"
                        title="Open in full Saved Lists manager & details page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Pagination Bar for More Than 5 Lists */}
              {filteredLists.length > PAGE_SIZE && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <div className="text-[11px] font-medium">
                    Showing <strong className="font-mono text-slate-800 dark:text-slate-200">{(modalPage - 1) * PAGE_SIZE + 1}</strong>–<strong className="font-mono text-slate-800 dark:text-slate-200">{Math.min(modalPage * PAGE_SIZE, filteredLists.length)}</strong> of <strong className="font-mono text-slate-800 dark:text-slate-200">{filteredLists.length}</strong> lists
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={modalPage <= 1}
                      onClick={() => setModalPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      <span>Prev</span>
                    </button>

                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      const isActive = pageNum === modalPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setModalPage(pageNum)}
                          className={`w-6 h-6 rounded-md text-[11px] font-mono font-medium flex items-center justify-center transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-orange-600 text-white font-bold shadow-2xs'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      disabled={modalPage >= totalPages}
                      onClick={() => setModalPage((p) => Math.min(totalPages, p + 1))}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
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

      {/* Modal to Search and Add Leads to Any Already Saved List */}
      <AddLeadsToSavedListModal
        isOpen={Boolean(addLeadsModalTarget)}
        targetList={addLeadsModalTarget}
        onClose={() => setAddLeadsModalTarget(null)}
        onSuccess={() => {
          dispatch(fetchSavedLists());
        }}
      />
    </div>
  );
}
