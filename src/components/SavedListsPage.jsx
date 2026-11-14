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
  Eye,
  ChevronLeft,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import {
  fetchSavedLists,
  removeSavedList,
  createSavedList,
  appendLeadsToSavedList,
  removeLeadFromSavedList
} from '../store/savedListsSlice.js';
import { setSavedListFilter } from '../store/filtersSlice.js';
import { setActiveLead } from '../store/leadsSlice.js';
import { fetchLeadsByIdsApi } from '../services/api.js';
import ConfirmDeleteModal from './ConfirmDeleteModal.jsx';
import AddLeadsToSavedListModal from './AddLeadsToSavedListModal.jsx';

export default function SavedListsPage({ setActiveView, initialSelectedListId }) {
  const dispatch = useDispatch();
  const { lists, firestoreLists, loading: listsLoading } = useSelector(
    (state) => state.savedLists
  );
  const { user } = useSelector((state) => state.auth);
  const { selectedLeadIds = [] } = useSelector((state) => state.leads);

  // Combine server lists and user Firestore lists without duplicates
  const seenIds = new Set();
  const mergedLists = useMemo(() => {
    return [...firestoreLists, ...lists].filter((l) => {
      if (!l || seenIds.has(l.id)) return false;
      seenIds.add(l.id);
      return true;
    });
  }, [lists, firestoreLists]);

  const [selectedListId, setSelectedListId] = useState(() => {
    if (initialSelectedListId) return initialSelectedListId;
    try {
      const saved = localStorage.getItem('leadsarrow_selected_saved_list_id');
      if (saved) return saved;
    } catch (e) {}
    return null;
  });
  const [listLeads, setListLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('leadsarrow_saved_lists_page_size'));
      if ([25, 50, 100].includes(saved)) return saved;
    } catch (e) {}
    return 25;
  });
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [isAddLeadsModalOpen, setIsAddLeadsModalOpen] = useState(false);
  const [isAppendingSelected, setIsAppendingSelected] = useState(false);
  const [deleteListTarget, setDeleteListTarget] = useState(null);
  const [isDeletingList, setIsDeletingList] = useState(false);
  const [deleteSingleLeadTarget, setDeleteSingleLeadTarget] = useState(null);
  const [isRemovingSingleLead, setIsRemovingSingleLead] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Set default selection when lists load or restore saved list selection
  useEffect(() => {
    if (mergedLists.length > 0) {
      const exists = selectedListId && mergedLists.some((l) => l.id === selectedListId);
      if (!exists) {
        try {
          const saved = localStorage.getItem('leadsarrow_selected_saved_list_id');
          const savedMatch = saved && mergedLists.find((l) => l.id === saved);
          if (savedMatch) {
            setSelectedListId(savedMatch.id);
            return;
          }
        } catch (e) {}
        setSelectedListId(mergedLists[0].id);
      }
    }
  }, [mergedLists, selectedListId]);

  // Persist selected list ID across browser refreshes
  useEffect(() => {
    if (selectedListId) {
      try {
        localStorage.setItem('leadsarrow_selected_saved_list_id', selectedListId);
      } catch (e) {}
    }
  }, [selectedListId]);

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

  // Reset pagination to page 1 when active list or search query changes
  useEffect(() => {
    setPage(1);
  }, [selectedListId, leadSearchQuery]);

  const totalFilteredLeads = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredLeads / pageSize));

  // Keep page within bounds if count changes
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Sliced leads for current page
  const paginatedLeads = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, page, pageSize]);

  const startIdx = totalFilteredLeads === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(totalFilteredLeads, page * pageSize);

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

  const handleDeleteListClick = (listId, name) => {
    setDeleteListTarget({ id: listId, name });
  };

  const handleConfirmDeleteList = async () => {
    if (!deleteListTarget) return;
    setIsDeletingList(true);
    try {
      await dispatch(removeSavedList(deleteListTarget.id));
      if (selectedListId === deleteListTarget.id) {
        const remaining = mergedLists.filter((l) => l.id !== deleteListTarget.id);
        const nextId = remaining[0]?.id || null;
        setSelectedListId(nextId);
        try {
          if (nextId) {
            localStorage.setItem('leadsarrow_selected_saved_list_id', nextId);
          } else {
            localStorage.removeItem('leadsarrow_selected_saved_list_id');
          }
        } catch (e) {}
      }
      setFeedback(`Permanently deleted list "${deleteListTarget.name}" from database.`);
      setTimeout(() => setFeedback(null), 3500);
      setDeleteListTarget(null);
    } catch (err) {
      alert(err.message || 'Failed to delete saved list');
    } finally {
      setIsDeletingList(false);
    }
  };

  const handleConfirmRemoveLead = async () => {
    if (!deleteSingleLeadTarget) return;
    setIsRemovingSingleLead(true);
    try {
      await dispatch(
        removeLeadFromSavedList({
          listId: deleteSingleLeadTarget.listId,
          leadId: deleteSingleLeadTarget.leadId
        })
      ).unwrap();
      setListLeads((prev) => prev.filter((l) => l.id !== deleteSingleLeadTarget.leadId));
      setFeedback(`Removed "${deleteSingleLeadTarget.leadName}" from "${deleteSingleLeadTarget.listName}".`);
      setTimeout(() => setFeedback(null), 3500);
      setDeleteSingleLeadTarget(null);
    } catch (err) {
      alert(err?.message || 'Failed to remove lead from list');
    } finally {
      setIsRemovingSingleLead(false);
    }
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
                          handleDeleteListClick(list.id, list.name);
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
                    {/* Add Leads Button */}
                    <button
                      type="button"
                      onClick={() => setIsAddLeadsModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 rounded-lg transition-all cursor-pointer shadow-2xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Leads to List</span>
                    </button>

                    {/* Quick Add Selected Leads if any selected in Lead Finder */}
                    {selectedLeadIds.length > 0 && (
                      <button
                        type="button"
                        disabled={isAppendingSelected}
                        onClick={handleQuickAppendSelected}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 border border-orange-300 dark:border-orange-800 rounded-lg transition-colors cursor-pointer shadow-2xs"
                        title={`Append ${selectedLeadIds.length} leads selected in Lead Finder`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add {selectedLeadIds.length} Selected Leads</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleApplyToFinder(selectedList)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
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
                      onClick={() => handleDeleteListClick(selectedList.id, selectedList.name)}
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
                      This List is Currently Empty (0 Leads)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Search and append leads from the 10.3M database or your custom leads, or browse in Lead Finder.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => setIsAddLeadsModalOpen(true)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Leads Now</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveView && setActiveView('finder')}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg shadow-xs cursor-pointer"
                      >
                        Browse Lead Finder
                      </button>
                    </div>
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
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {paginatedLeads.map((lead) => (
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

                            {/* Column 8: Actions */}
                            <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteSingleLeadTarget({
                                    leadId: lead.id,
                                    leadName: lead.companyName,
                                    listId: selectedList.id,
                                    listName: selectedList.name
                                  })
                                }
                                title="Remove lead from this list"
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Table Footer with Pagination & Page Size Controls */}
                {listLeads.length > 0 && (
                  <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-3">
                      <span>
                        Showing <strong className="font-mono tabular-nums text-slate-900 dark:text-white">{startIdx} - {endIdx}</strong> of{' '}
                        <strong className="font-mono tabular-nums text-slate-900 dark:text-white">{totalFilteredLeads}</strong> leads
                        {totalFilteredLeads !== listLeads.length && (
                          <span className="text-slate-400 ml-1">({listLeads.length} total in list)</span>
                        )}
                      </span>
                      <span>·</span>
                      <label className="inline-flex items-center gap-1.5">
                        <span className="text-slate-500 dark:text-slate-400">Rows:</span>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setPageSize(val);
                            setPage(1);
                            try {
                              localStorage.setItem('leadsarrow_saved_lists_page_size', String(val));
                            } catch (err) {}
                          }}
                          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-orange-600 cursor-pointer"
                        >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </label>
                    </div>

                    {/* Numbered Pagination & Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer whitespace-nowrap transition-colors mr-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Previous
                      </button>

                      {(() => {
                        const pages = [];
                        if (totalPages <= 7) {
                          for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          if (page > 3) pages.push('...');
                          const start = Math.max(2, page - 1);
                          const end = Math.min(totalPages - 1, page + 1);
                          for (let i = start; i <= end; i++) pages.push(i);
                          if (page < totalPages - 2) pages.push('....');
                          pages.push(totalPages);
                        }

                        return pages.map((p, idx) => {
                          if (typeof p === 'string') {
                            return (
                              <span
                                key={`ellipsis-${idx}`}
                                className="min-w-6 h-7 px-1 flex items-center justify-center text-xs text-slate-400 select-none font-mono"
                              >
                                ...
                              </span>
                            );
                          }

                          const isActive = p === page;
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPage(p)}
                              className={`min-w-7 h-7 px-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer flex items-center justify-center whitespace-nowrap ${
                                isActive
                                  ? 'bg-orange-600 text-white shadow-xs font-semibold'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {p}
                            </button>
                          );
                        });
                      })()}

                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer whitespace-nowrap transition-colors ml-1"
                      >
                        Next
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
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
      {/* Confirmation Modal for Deleting Saved List */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteListTarget)}
        onClose={() => !isDeletingList && setDeleteListTarget(null)}
        onConfirm={handleConfirmDeleteList}
        loading={isDeletingList}
        title="Delete Saved List?"
        message="Are you sure you want to permanently delete this saved list? This will remove the list segment from the database."
        itemName={deleteListTarget?.name}
        confirmText="Yes, Delete List"
        cancelText="Cancel"
        dangerNote="This list will be erased from the database and cannot be recovered."
      />

      {/* Modal to Search and Add Leads directly to this list */}
      <AddLeadsToSavedListModal
        isOpen={isAddLeadsModalOpen}
        targetList={selectedList}
        onClose={() => setIsAddLeadsModalOpen(false)}
        onSuccess={async () => {
          if (selectedList) {
            await dispatch(fetchSavedLists());
            await loadLeadsForSelectedList(selectedList);
          }
        }}
      />

      {/* Confirmation Modal for Removing Single Lead from Saved List */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteSingleLeadTarget)}
        onClose={() => !isRemovingSingleLead && setDeleteSingleLeadTarget(null)}
        onConfirm={handleConfirmRemoveLead}
        loading={isRemovingSingleLead}
        title="Remove Lead from List?"
        message={`Are you sure you want to remove this lead from "${deleteSingleLeadTarget?.listName}"? This will update the list in the database.`}
        itemName={deleteSingleLeadTarget?.leadName}
        confirmText="Yes, Remove Lead"
        cancelText="Cancel"
        dangerNote="The lead will be removed from this list segment in the database."
      />
    </div>
  );
}
