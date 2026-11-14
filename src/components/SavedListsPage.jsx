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
  UserPlus,
  ArrowUpDown,
  Check,
  Copy,
  ShieldCheck
} from 'lucide-react';
import {
  fetchSavedLists,
  removeSavedList,
  createSavedList,
  appendLeadsToSavedList,
  removeLeadFromSavedList,
  removeBatchLeadsFromSavedList,
  setTargetListForAdding
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
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('leadsarrow_saved_lists_sidebar_page_size'));
      if ([10, 25, 50].includes(saved)) return saved;
    } catch (e) {}
    return 10;
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('leadsarrow_saved_lists_page_size'));
      if ([10, 25, 50, 100].includes(saved)) return saved;
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
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState(null);
  const [isRemovingBulk, setIsRemovingBulk] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Sorting state matching Lead Finder Data Grid
  const [sortBy, setSortBy] = useState('buyingIntentScore');
  const [sortOrder, setSortOrder] = useState('desc');

  // Multi-lead selection state in this list
  const [selectedInListIds, setSelectedInListIds] = useState([]);
  const [copiedKey, setCopiedKey] = useState(null);

  // Clear selections whenever active list changes
  useEffect(() => {
    setSelectedInListIds([]);
  }, [selectedListId]);

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

  // Reset sidebar list pagination to page 1 when search changes
  useEffect(() => {
    setListPage(1);
  }, [listSearchQuery]);

  const totalFilteredLists = filteredLists.length;
  const totalListPages = Math.max(1, Math.ceil(totalFilteredLists / listPageSize));

  // Keep list page within bounds
  useEffect(() => {
    if (listPage > totalListPages) {
      setListPage(totalListPages);
    }
  }, [listPage, totalListPages]);

  // Paginated lists for left sidebar (active when lists exceed 10 or page size)
  const paginatedLists = useMemo(() => {
    if (filteredLists.length <= 10 && listPageSize === 10) return filteredLists;
    const start = (listPage - 1) * listPageSize;
    return filteredLists.slice(start, start + listPageSize);
  }, [filteredLists, listPage, listPageSize]);

  const handleListPageSizeChange = (newSize) => {
    setListPageSize(newSize);
    setListPage(1);
    try {
      localStorage.setItem('leadsarrow_saved_lists_sidebar_page_size', String(newSize));
    } catch (e) {}
  };

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

  // Sort leads matching Lead Finder
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder(column === 'companyName' || column === 'contactName' ? 'asc' : 'desc');
    }
  };

  const sortedLeads = useMemo(() => {
    if (!sortBy) return filteredLeads;
    return [...filteredLeads].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'employeeCount') {
        valA = Number(valA || a.employeeRange?.match(/\d+/)?.[0] || 0);
        valB = Number(valB || b.employeeRange?.match(/\d+/)?.[0] || 0);
      } else if (sortBy === 'annualRevenueUsd') {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else if (sortBy === 'buyingIntentScore') {
        valA = Number(valA ?? 0);
        valB = Number(valB ?? 0);
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredLeads, sortBy, sortOrder]);

  // Reset pagination to page 1 when active list or search query changes
  useEffect(() => {
    setPage(1);
  }, [selectedListId, leadSearchQuery]);

  const totalFilteredLeads = sortedLeads.length;
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
    return sortedLeads.slice(start, start + pageSize);
  }, [sortedLeads, page, pageSize]);

  const startIdx = totalFilteredLeads === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(totalFilteredLeads, page * pageSize);

  // Current page IDs for selection
  const pageIds = useMemo(() => paginatedLeads.map((l) => l.id), [paginatedLeads]);
  const allCurrentSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedInListIds.includes(id));

  const handleToggleSelectLead = (leadId) => {
    setSelectedInListIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const handleSelectAllCurrentPage = () => {
    if (allCurrentSelected) {
      setSelectedInListIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedInListIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedInListIds([]);
  };

  const handleCopy = (e, text, key) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1600);
  };

  // Executive KPI metrics matching Lead Finder Analytics Bar
  const listMetrics = useMemo(() => {
    if (!listLeads.length) {
      return { total: 0, verifiedDeliverability: '100% Verified', avgIntent: '—' };
    }
    const verifiedCount = listLeads.filter(
      (l) => !l.verificationStatus || l.verificationStatus === 'Verified'
    ).length;
    const verifiedRatio = Math.round((verifiedCount / listLeads.length) * 100);
    const totalIntent = listLeads.reduce((acc, l) => acc + (l.buyingIntentScore || 85), 0);
    const avgIntent = Math.round(totalIntent / listLeads.length);
    return {
      total: listLeads.length,
      verifiedDeliverability: `${verifiedRatio}% Verified`,
      avgIntent: `${avgIntent} / 100`
    };
  }, [listLeads]);

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

  const handleQuickAppendSelected = async () => {
    if (!selectedList || !selectedLeadIds || selectedLeadIds.length === 0) return;
    setIsAppendingSelected(true);
    try {
      await dispatch(
        appendLeadsToSavedList({
          listId: selectedList.id,
          leadIds: selectedLeadIds
        })
      ).unwrap();
      setFeedback(`Successfully added ${selectedLeadIds.length} lead(s) to "${selectedList.name}"!`);
      setTimeout(() => setFeedback(null), 3500);
      await dispatch(fetchSavedLists());
      const updatedList = {
        ...selectedList,
        leadIds: Array.from(new Set([...(selectedList.leadIds || []), ...selectedLeadIds]))
      };
      await loadLeadsForSelectedList(updatedList);
    } catch (err) {
      alert(err?.message || 'Failed to add selected leads to list');
    } finally {
      setIsAppendingSelected(false);
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

  const handleStartAddingInMainPage = (targetView) => {
    if (!selectedList) return;
    dispatch(
      setTargetListForAdding({
        id: selectedList.id,
        name: selectedList.name,
        leadCount: selectedList.leadCount || (selectedList.leadIds ? selectedList.leadIds.length : 0)
      })
    );
    if (setActiveView) {
      setActiveView(targetView);
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
        setListPage(1);
      }
      setFeedback('New list created successfully.');
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const exportLeadsToCsv = (leadsToExport, filename) => {
    if (!leadsToExport.length) return;
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

    const rows = leadsToExport.map((l) => [
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
    a.download = filename || `saved_list_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportListCsv = () => {
    exportLeadsToCsv(
      listLeads,
      `saved_list_${(selectedList?.name || 'export').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.csv`
    );
  };

  const handleExportSelectedCsv = () => {
    const selectedLeads = listLeads.filter((l) => selectedInListIds.includes(l.id));
    if (!selectedLeads.length) return;
    exportLeadsToCsv(
      selectedLeads,
      `saved_list_${(selectedList?.name || 'export').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_selected_${Date.now()}.csv`
    );
  };

  const handleConfirmBulkRemove = async () => {
    if (!selectedList || !selectedInListIds.length) return;
    setIsRemovingBulk(true);
    try {
      await dispatch(
        removeBatchLeadsFromSavedList({
          listId: selectedList.id,
          leadIds: selectedInListIds
        })
      ).unwrap();
      const removeSet = new Set(selectedInListIds);
      setListLeads((prev) => prev.filter((l) => !removeSet.has(l.id)));
      setFeedback(`Removed ${selectedInListIds.length} lead(s) from "${selectedList.name}".`);
      setTimeout(() => setFeedback(null), 3500);
      setSelectedInListIds([]);
      setBulkDeleteTarget(null);
    } catch (err) {
      alert(err?.message || 'Failed to remove selected leads');
    } finally {
      setIsRemovingBulk(false);
    }
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
            {paginatedLists.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                No saved lists found.
              </div>
            ) : (
              paginatedLists.map((list) => {
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

          {/* Sidebar Pagination when total filtered lists exceed 10 */}
          {filteredLists.length > 10 && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 select-none">
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                  {(listPage - 1) * listPageSize + 1}–{Math.min(filteredLists.length, listPage * listPageSize)}
                </span>
                <span className="text-slate-400">of {filteredLists.length}</span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <label className="inline-flex items-center gap-1">
                  <span className="text-[10px] text-slate-400">Rows:</span>
                  <select
                    value={listPageSize}
                    onChange={(e) => handleListPageSizeChange(Number(e.target.value))}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-[11px] font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-600 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-auto">
                <button
                  type="button"
                  disabled={listPage <= 1}
                  onClick={() => setListPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                  title="Previous lists page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalListPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (totalListPages <= 5) return true;
                      return p === 1 || p === totalListPages || Math.abs(p - listPage) <= 1;
                    })
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && p - prev > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && <span className="text-[10px] text-slate-400 px-0.5 select-none">…</span>}
                          <button
                            type="button"
                            onClick={() => setListPage(p)}
                            className={`min-w-6 h-6 px-1 rounded-md text-[11px] font-mono font-medium flex items-center justify-center transition-colors cursor-pointer ${
                              p === listPage
                                ? 'bg-orange-600 text-white font-bold shadow-2xs'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  type="button"
                  disabled={listPage >= totalListPages}
                  onClick={() => setListPage((p) => Math.min(totalListPages, p + 1))}
                  className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                  title="Next lists page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Right Pane: Detailed List Content & Leads Table */}
        <main className="flex-1 flex flex-col min-w-0 p-6 overflow-x-hidden">
          {selectedList ? (
            <div className="flex-1 flex flex-col min-w-0 space-y-4">
              {/* Selected List Hero Header */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
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
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                      <span>Segment: <strong className="text-slate-700 dark:text-slate-300">{selectedList.filterSummary || 'Custom Curated Leads'}</strong></span>
                      {selectedList.createdAt && (
                        <span>Created: {new Date(selectedList.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions for this list */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Add from Core Lead Finder (Full Database with filters and pagination) */}
                    <button
                      type="button"
                      onClick={() => handleStartAddingInMainPage('finder')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 rounded-lg transition-all cursor-pointer shadow-2xs"
                      title="Open Lead Finder in Target List mode to search, filter, and append core database leads"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>+ Add from Lead Finder</span>
                    </button>

                    {/* Add from Custom Leads Workspace */}
                    <button
                      type="button"
                      onClick={() => handleStartAddingInMainPage('custom')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 rounded-lg transition-all cursor-pointer shadow-2xs"
                      title="Open Custom Leads workspace to select and append custom cluster leads"
                    >
                      <Layers className="w-3.5 h-3.5 text-orange-500" />
                      <span>+ Add from Custom Leads</span>
                    </button>

                    {/* Quick Modal Option */}
                    <button
                      type="button"
                      onClick={() => setIsAddLeadsModalOpen(true)}
                      className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
                      title="Open scrollable modal with search and pagination"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
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

                {/* Analytics Bar KPIs matching Lead Finder */}
                {listLeads.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-6">
                    <div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Curated B2B Leads</div>
                      <div className="text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                        {listLeads.length.toLocaleString()}
                      </div>
                    </div>

                    <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                    <div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Verified Deliverability</div>
                      <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-0.5 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{listMetrics.verifiedDeliverability}</span>
                      </div>
                    </div>

                    <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

                    <div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Avg. Buying Intent</div>
                      <div className="text-sm font-semibold text-orange-600 dark:text-orange-400 font-mono tabular-nums mt-0.5">
                        {listMetrics.avgIntent}
                      </div>
                    </div>

                    <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block" />

                    {/* Filter / Search Bar inside list */}
                    <div className="flex-1 min-w-[240px] max-w-md ml-auto">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={leadSearchQuery}
                          onChange={(e) => setLeadSearchQuery(e.target.value)}
                          placeholder="Filter leads in this list by company, contact, or email..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-600 transition-colors"
                        />
                        {leadSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setLeadSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bulk Selection Toolbar */}
              {selectedInListIds.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 px-4 py-2.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="font-semibold text-orange-900 dark:text-orange-200">
                      {selectedInListIds.length} lead{selectedInListIds.length === 1 ? '' : 's'} selected in this list
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportSelectedCsv}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Selected ({selectedInListIds.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkDeleteTarget(selectedInListIds)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Selected ({selectedInListIds.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              )}

              {/* High-Density Enterprise Data Grid matching Lead Finder */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex-1 flex flex-col">
                {leadsLoading ? (
                  <div className="p-8 space-y-3">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
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
                ) : totalFilteredLeads === 0 ? (
                  <div className="p-12 text-center">
                    <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      No Leads Found Matching "{leadSearchQuery}"
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Try adjusting your search query or clear the filter to view all list leads.
                    </p>
                    <button
                      type="button"
                      onClick={() => setLeadSearchQuery('')}
                      className="mt-4 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 dark:bg-orange-950/40 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  <div className="overflow-auto flex-1 min-h-0 bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse table-fixed min-w-[1240px]">
                      <colgroup>
                        <col style={{ width: '48px' }} />
                        <col style={{ width: '280px' }} />
                        <col style={{ width: '240px' }} />
                        <col style={{ width: '280px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '150px' }} />
                        <col style={{ width: '110px' }} />
                        <col style={{ width: '48px' }} />
                      </colgroup>
                      <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/90 shadow-xs border-b border-slate-200 dark:border-slate-800 backdrop-blur-xs">
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
                          {/* Checkbox */}
                          <th className="py-2.5 pl-6 pr-3 bg-slate-50 dark:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={allCurrentSelected}
                              onChange={handleSelectAllCurrentPage}
                              className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-orange-600 focus:ring-orange-500 cursor-pointer"
                            />
                          </th>
                          {/* Company & Sector */}
                          <th className="py-2.5 px-3 bg-slate-50 dark:bg-slate-900">
                            <button
                              type="button"
                              onClick={() => handleSort('companyName')}
                              className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer whitespace-nowrap"
                            >
                              <span>Company & Sector</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-400" />
                            </button>
                          </th>
                          {/* Decision Maker */}
                          <th className="py-2.5 px-3 bg-slate-50 dark:bg-slate-900">
                            <button
                              type="button"
                              onClick={() => handleSort('contactName')}
                              className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer whitespace-nowrap"
                            >
                              <span>Decision Maker</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-400" />
                            </button>
                          </th>
                          {/* Direct Contact & Verification */}
                          <th className="py-2.5 px-3 bg-slate-50 dark:bg-slate-900">Direct Contact & Verification</th>
                          {/* Employees */}
                          <th className="py-2.5 px-3 text-right bg-slate-50 dark:bg-slate-900">
                            <button
                              type="button"
                              onClick={() => handleSort('employeeCount')}
                              className="inline-flex items-center justify-end gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer whitespace-nowrap ml-auto"
                            >
                              <span>Employees</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-400" />
                            </button>
                          </th>
                          {/* Annual Revenue */}
                          <th className="py-2.5 px-3 text-right bg-slate-50 dark:bg-slate-900">
                            <button
                              type="button"
                              onClick={() => handleSort('annualRevenueUsd')}
                              className="inline-flex items-center justify-end gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer whitespace-nowrap ml-auto"
                            >
                              <span>Annual Revenue</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-400" />
                            </button>
                          </th>
                          {/* HQ Location */}
                          <th className="py-2.5 px-3 bg-slate-50 dark:bg-slate-900">
                            <button
                              type="button"
                              onClick={() => handleSort('country')}
                              className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer whitespace-nowrap"
                            >
                              <span>HQ Location</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-400" />
                            </button>
                          </th>
                          {/* Buying Intent Score */}
                          <th className="py-2.5 px-3 text-right bg-slate-50 dark:bg-slate-900">
                            <button
                              type="button"
                              onClick={() => handleSort('buyingIntentScore')}
                              className="inline-flex items-center justify-end gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer whitespace-nowrap ml-auto"
                            >
                              <span>Intent Score</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-400" />
                            </button>
                          </th>
                          {/* Actions */}
                          <th className="py-2.5 pl-3 pr-6 text-right bg-slate-50 dark:bg-slate-900">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                        {paginatedLeads.map((lead) => {
                          const isSelected = selectedInListIds.includes(lead.id);
                          return (
                            <tr
                              key={lead.id}
                              onClick={() => dispatch(setActiveLead(lead))}
                              className={`group transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-orange-50/50 dark:bg-orange-950/30 hover:bg-orange-50 dark:hover:bg-orange-950/50'
                                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              {/* Checkbox */}
                              <td
                                className="py-2.5 pl-6 pr-3 align-middle"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectLead(lead.id)}
                                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                />
                              </td>

                              {/* Company & Sector */}
                              <td className="py-2.5 px-3 align-middle">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-semibold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                                    {lead.companyName}
                                  </span>
                                  {lead.domain && (
                                    <a
                                      href={lead.domain.startsWith('http') ? lead.domain : `https://${lead.domain}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0 inline-flex items-center"
                                      title={`Open ${lead.domain}`}
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  <span className="truncate max-w-[180px]">{lead.industry || 'Technology'}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{lead.fundingStage || 'Series B'}</span>
                                </div>
                              </td>

                              {/* Decision Maker */}
                              <td className="py-2.5 px-3 align-middle">
                                <div className="font-medium text-slate-900 dark:text-white">{lead.contactName || 'Decision Maker'}</div>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  <span className="truncate max-w-[190px]">{lead.contactTitle || 'Executive'}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{lead.seniority || 'C-Level'}</span>
                                </div>
                              </td>

                              {/* Direct Contact & Verification */}
                              <td className="py-2.5 px-3 align-middle w-[270px] min-w-[270px]" onClick={(e) => e.stopPropagation()}>
                                <div className="space-y-0.5 max-w-[270px]">
                                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                                    <span className="truncate">{lead.contactEmail || '—'}</span>
                                    {lead.contactEmail && (
                                      <button
                                        type="button"
                                        onClick={(e) => handleCopy(e, lead.contactEmail, `${lead.id}_email`)}
                                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer shrink-0"
                                        title="Copy email"
                                      >
                                        {copiedKey === `${lead.id}_email` ? (
                                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                                    <span>{lead.contactPhone || '—'}</span>
                                    <span aria-hidden="true">·</span>
                                    <span
                                      className={
                                        lead.verificationStatus === 'Catch-All'
                                          ? 'text-amber-700 dark:text-amber-400 font-sans font-medium'
                                          : 'text-emerald-700 dark:text-emerald-400 font-sans font-medium'
                                      }
                                    >
                                      {lead.verificationStatus || 'Verified'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Employees */}
                              <td className="py-2.5 px-3 align-middle text-right font-mono tabular-nums">
                                <div className="font-medium text-slate-900 dark:text-white">
                                  {(lead.employeeCount || 250).toLocaleString()}
                                </div>
                                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                                  {lead.employeeRange || '100 - 500'}
                                </div>
                              </td>

                              {/* Annual Revenue */}
                              <td className="py-2.5 px-3 align-middle text-right font-mono tabular-nums">
                                <div className="font-medium text-slate-900 dark:text-white">
                                  {lead.revenueRange || '$10 - $50M'}
                                </div>
                                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                                  ${((lead.annualRevenueUsd || 25000000) / 1000000).toFixed(1)}M est.
                                </div>
                              </td>

                              {/* HQ Location */}
                              <td className="py-2.5 px-3 align-middle">
                                <div className="text-slate-800 dark:text-slate-200">
                                  {lead.city ? `${lead.city} · ${lead.country || 'USA'}` : lead.country || 'USA'}
                                </div>
                              </td>

                              {/* Buying Intent Score */}
                              <td className="py-2.5 px-3 align-middle text-right font-mono tabular-nums">
                                <div>
                                  <div
                                    className={`font-semibold ${
                                      (lead.buyingIntentScore ?? 85) >= 80
                                        ? 'text-emerald-700 dark:text-emerald-400'
                                        : (lead.buyingIntentScore ?? 85) >= 65
                                        ? 'text-orange-600 dark:text-orange-400'
                                        : 'text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {lead.buyingIntentScore ?? 85} / 100
                                  </div>
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">
                                    {(lead.buyingIntentScore ?? 85) >= 80
                                      ? 'High Intent'
                                      : (lead.buyingIntentScore ?? 85) >= 65
                                      ? 'Active Research'
                                      : 'Baseline'}
                                  </div>
                                </div>
                              </td>

                              {/* Actions: Remove single lead from this list */}
                              <td className="py-2.5 pl-3 pr-6 align-middle text-right" onClick={(e) => e.stopPropagation()}>
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
                          );
                        })}
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
                          <option value={10}>10</option>
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
        onRedirectToFinder={() => handleStartAddingInMainPage('finder')}
        onRedirectToCustom={() => handleStartAddingInMainPage('custom')}
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

      {/* Confirmation Modal for Removing Bulk Leads from Saved List */}
      <ConfirmDeleteModal
        isOpen={Boolean(bulkDeleteTarget)}
        onClose={() => !isRemovingBulk && setBulkDeleteTarget(null)}
        onConfirm={handleConfirmBulkRemove}
        loading={isRemovingBulk}
        title="Remove Selected Leads from List?"
        message={`Are you sure you want to remove ${selectedInListIds.length} selected lead(s) from "${selectedList?.name}"? This will update the list in the database.`}
        itemName={`${selectedInListIds.length} Selected Leads`}
        confirmText="Yes, Remove Leads"
        cancelText="Cancel"
        dangerNote="The selected leads will be removed from this list segment in the database."
      />
    </div>
  );
}
