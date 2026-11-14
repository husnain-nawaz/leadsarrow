import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Bookmark,
  List,
  Search,
  Trash2,
  Filter,
  Download,
  ExternalLink,
  Plus,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Layers,
  Database,
  Eye
} from 'lucide-react';
import {
  fetchSavedLists,
  removeSavedList,
  createSavedList
} from '../store/savedListsSlice.js';
import { setSavedListFilter } from '../store/filtersSlice.js';
import { setActiveLead } from '../store/leadsSlice.js';
import { fetchLeadsByIdsApi } from '../services/api.js';

export default function SavedListsPage({ setActiveView, initialSelectedListId }) {
  const dispatch = useDispatch();
  const { lists, firestoreLists, loading: listsLoading } = useSelector(
    (state) => state.savedLists
  );
  const { user } = useSelector((state) => state.auth);

  // Combine server lists and user Firestore lists without duplicates
  const seenIds = new Set();
  const mergedLists = useMemo(() => {
    return [...firestoreLists, ...lists].filter((l) => {
      if (!l || seenIds.has(l.id)) return false;
      seenIds.add(l.id);
      return true;
    });
  }, [lists, firestoreLists]);

  const [selectedListId, setSelectedListId] = useState(
    initialSelectedListId || (mergedLists[0]?.id || null)
  );
  const [listLeads, setListLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Set default selection when lists load
  useEffect(() => {
    if (!selectedListId && mergedLists.length > 0) {
      setSelectedListId(mergedLists[0].id);
    }
  }, [mergedLists, selectedListId]);

  const selectedList = useMemo(() => {
    return mergedLists.find((l) => l.id === selectedListId) || null;
  }, [mergedLists, selectedListId]);

  // Fetch full leads details whenever selected list changes
  const loadLeadsForSelectedList = useCallback(async (list) => {
    if (!list || !Array.isArray(list.leadIds) || list.leadIds.length === 0) {
      setListLeads([]);
      return;
    }
    setLeadsLoading(true);
    try {
      const response = await fetchLeadsByIdsApi(list.leadIds);
      setListLeads(response.leads || []);
    } catch (err) {
      console.error('Failed to load leads for list:', err);
      setListLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedList) {
      loadLeadsForSelectedList(selectedList);
    } else {
      setListLeads([]);
    }
  }, [selectedList, loadLeadsForSelectedList]);

  // Filter lists in left sidebar
  const filteredLists = useMemo(() => {
    const q = listSearchQuery.toLowerCase().trim();
    if (!q) return mergedLists;
    return mergedLists.filter(
      (l) =>
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.description && l.description.toLowerCase().includes(q)) ||
        (l.filterSummary && l.filterSummary.toLowerCase().includes(q))
    );
  }, [mergedLists, listSearchQuery]);

  // Filter leads in right table
  const filteredLeads = useMemo(() => {
    const q = leadSearchQuery.toLowerCase().trim();
    if (!q) return listLeads;
    return listLeads.filter(
      (lead) =>
        (lead.companyName && lead.companyName.toLowerCase().includes(q)) ||
        (lead.contactName && lead.contactName.toLowerCase().includes(q)) ||
        (lead.contactEmail && lead.contactEmail.toLowerCase().includes(q)) ||
        (lead.domain && lead.domain.toLowerCase().includes(q)) ||
        (lead.industry && lead.industry.toLowerCase().includes(q))
    );
  }, [listLeads, leadSearchQuery]);

  const handleApplyToFinder = (list) => {
    dispatch(
      setSavedListFilter({
        leadIds: list.leadIds || [],
        name: list.name
      })
    );
    if (setActiveView) {
      setActiveView('finder');
    }
  };

  const handleDeleteList = async (listId, name) => {
    if (!window.confirm(`Delete saved list "${name}"? This cannot be undone.`)) return;
    await dispatch(removeSavedList(listId));
    if (selectedListId === listId) {
      const remaining = mergedLists.filter((l) => l.id !== listId);
      setSelectedListId(remaining[0]?.id || null);
    }
    setFeedback(`Deleted list "${name}".`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const action = await dispatch(
      createSavedList({
        name: newListName.trim(),
        description: newListDesc.trim() || 'Custom curated target list',
        leadIds: [],
        filterSummary: 'Custom Created List',
        leadCount: 0
      })
    );
    if (createSavedList.fulfilled.match(action)) {
      setNewListName('');
      setNewListDesc('');
      setIsCreatingList(false);
      if (action.payload?.id) {
        setSelectedListId(action.payload.id);
      }
      setFeedback('New list created successfully.');
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleExportListCsv = () => {
    if (!listLeads.length) return;
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
      'Work Email',
      'Direct Phone',
      'Verification Status',
      'Funding Stage',
      'Buying Intent Score'
    ];

    const rows = listLeads.map((l) => [
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
      l.contactEmail,
      l.contactPhone,
      l.verificationStatus,
      l.fundingStage,
      l.buyingIntentScore
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saved_list_${(selectedList?.name || 'export').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalLeadsCount = useMemo(() => {
    return mergedLists.reduce((acc, l) => acc + (l.leadCount || (l.leadIds ? l.leadIds.length : 0)), 0);
  }, [mergedLists]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4.5 transition-colors">
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setActiveView && setActiveView('finder')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Lead Finder</span>
          </button>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
                  Saved B2B Lists & Target Segments
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
                  {mergedLists.length} Lists
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Curated B2B account segments, target lists, and saved leads ready for review and multi-channel outreach.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Total Curated Leads: </span>
              <span className="font-bold text-orange-600 dark:text-orange-400 font-mono">
                {totalLeadsCount.toLocaleString()}
              </span>
            </div>

            <button
              type="button"
              onClick={() => dispatch(fetchSavedLists())}
              disabled={listsLoading}
              title="Refresh lists"
              className="p-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${listsLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsCreatingList(!isCreatingList)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create List</span>
            </button>
          </div>
        </div>

        {/* Inline Create List Drawer */}
        {isCreatingList && (
          <form
            onSubmit={handleCreateList}
            className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Create New Empty Target List
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List Name (e.g. Q4 FinTech Growth Targets)"
                className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-orange-600"
              />
              <input
                type="text"
                value={newListDesc}
                onChange={(e) => setNewListDesc(e.target.value)}
                placeholder="Description or campaign objective..."
                className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-orange-600"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingList(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg cursor-pointer shadow-xs"
              >
                Save List
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Master-Detail Explorer Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0">
        {/* Left Pane: Saved Lists Selector */}
        <aside className="w-full lg:w-80 xl:w-96 bg-white dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={listSearchQuery}
                onChange={(e) => setListSearchQuery(e.target.value)}
                placeholder="Search saved lists..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-600"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
            {filteredLists.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                No saved lists found.
              </div>
            ) : (
              filteredLists.map((list) => {
                const isSelected = list.id === selectedListId;
                const leadCount = list.leadCount || (list.leadIds ? list.leadIds.length : 0);
                return (
                  <div
                    key={list.id}
                    onClick={() => setSelectedListId(list.id)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60 shadow-2xs'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Bookmark className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`} />
                          <h3 className={`text-xs font-bold truncate ${isSelected ? 'text-orange-900 dark:text-orange-200' : 'text-slate-900 dark:text-white'}`}>
                            {list.name}
                          </h3>
                        </div>
                        {list.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {list.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {leadCount} leads
                          </span>
                          {list.filterSummary && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                              {list.filterSummary}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(list.id, list.name);
                        }}
                        title="Delete list"
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Pane: Detailed List Content & Leads Table */}
        <main className="flex-1 flex flex-col min-w-0 p-6 overflow-x-hidden">
          {selectedList ? (
            <div className="flex-1 flex flex-col min-w-0 space-y-4">
              {/* Selected List Hero Header */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                        {selectedList.name}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                        {selectedList.leadCount || (selectedList.leadIds ? selectedList.leadIds.length : 0)} Leads
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {selectedList.description || 'Target account segment'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span>Filter: <strong className="text-slate-700 dark:text-slate-300">{selectedList.filterSummary || 'Custom Leads'}</strong></span>
                      {selectedList.createdAt && (
                        <span>Created: {new Date(selectedList.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions for this list */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyToFinder(selectedList)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 border border-orange-200/60 dark:border-orange-800/60 rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>Filter in Lead Finder</span>
                    </button>

                    {listLeads.length > 0 && (
                      <button
                        type="button"
                        onClick={handleExportListCsv}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Export CSV</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteList(selectedList.id, selectedList.name)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="Delete this saved list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Search Bar for Leads inside this list */}
                {listLeads.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="relative max-w-md">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={leadSearchQuery}
                        onChange={(e) => setLeadSearchQuery(e.target.value)}
                        placeholder="Filter leads in this list by company, contact, or email..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Leads Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex-1 flex flex-col">
                {leadsLoading ? (
                  <div className="p-8 space-y-3">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : listLeads.length === 0 ? (
                  <div className="p-12 text-center">
                    <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      No Leads in this List Yet
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Go to Lead Finder, select leads from the table or search results, and click "Save / Load List" to add them here.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveView && setActiveView('finder')}
                      className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs cursor-pointer"
                    >
                      Go to Lead Finder
                    </button>
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No leads matching "{leadSearchQuery}" in this list.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Company & Sector</th>
                          <th className="py-3 px-4">Decision Maker</th>
                          <th className="py-3 px-4">Direct Contact & Verification</th>
                          <th className="py-3 px-4">Employees</th>
                          <th className="py-3 px-4">Annual Revenue</th>
                          <th className="py-3 px-4">HQ Location</th>
                          <th className="py-3 px-4 text-center">Intent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {filteredLeads.map((lead) => (
                          <tr
                            key={lead.id}
                            onClick={() => dispatch(setActiveLead(lead))}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                          >
                            {/* Column 1: Company */}
                            <td className="py-3 px-4 min-w-[200px]">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{lead.companyName}</span>
                                {lead.domain && (
                                  <span className="text-[11px] font-normal text-slate-400">
                                    ({lead.domain})
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {lead.industry || 'Enterprise'}
                                {lead.fundingStage && (
                                  <span className="ml-1 text-[10px] text-slate-400">
                                    • {lead.fundingStage}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Column 2: Decision Maker */}
                            <td className="py-3 px-4 min-w-[170px]">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {lead.contactName || 'Decision Maker'}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {lead.contactTitle || 'Executive'}
                                {lead.seniority && (
                                  <span className="ml-1 text-[10px] text-slate-400">
                                    • {lead.seniority}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Column 3: Contact */}
                            <td className="py-3 px-4 min-w-[200px]">
                              <div className="font-mono text-[11px] text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{lead.contactEmail || '—'}</span>
                              </div>
                              <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{lead.contactPhone || '—'}</span>
                                <span className="ml-auto px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/50 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                                  {lead.verificationStatus || 'Verified'}
                                </span>
                              </div>
                            </td>

                            {/* Column 4: Employees */}
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              {lead.employeeRange || (lead.employeeCount ? `${lead.employeeCount}` : '—')}
                            </td>

                            {/* Column 5: Revenue */}
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              {lead.revenueRange || '$10M - $50M'}
                            </td>

                            {/* Column 6: HQ Location */}
                            <td className="py-3 px-4 text-[11px] text-slate-700 dark:text-slate-300 min-w-[130px]">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{lead.city ? `${lead.city}, ` : ''}{lead.country || 'USA'}</span>
                              </div>
                            </td>

                            {/* Column 7: Intent */}
                            <td className="py-3 px-4 text-center">
                              <span className="inline-block px-2 py-0.5 rounded-full font-mono text-[11px] font-bold bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
                                {lead.buyingIntentScore || 88}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Table Footer */}
                {listLeads.length > 0 && (
                  <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div>
                      Showing <strong className="text-slate-800 dark:text-slate-200">{filteredLeads.length}</strong> of {listLeads.length} leads in list "{selectedList.name}"
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Click any row to view full dossier</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="max-w-md">
                <Bookmark className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No Saved List Selected
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                  Select a list from the sidebar to inspect its target accounts, export leads to CSV, or launch the filter in Lead Finder.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreatingList(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Create Your First List
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
