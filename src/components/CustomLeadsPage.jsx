import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Download,
  Building2,
  Mail,
  Phone,
  MapPin,
  Shield,
  Lock,
  UserCheck,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Database,
  ChevronLeft,
  ChevronRight,
  Folder,
  Layers,
  FolderPlus,
  CheckCircle2,
  X
} from 'lucide-react';
import { setAddLeadModalOpen } from '../store/leadsSlice.js';
import { openAuthModal } from '../store/authSlice.js';
import {
  fetchCustomLeadsFromServerApi,
  deleteCustomLeadOnServerApi,
  createCustomClusterOnServerApi,
  deleteCustomClusterOnServerApi
} from '../services/api.js';
import ConfirmDeleteModal from './ConfirmDeleteModal.jsx';

export default function CustomLeadsPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const userId = user?.id || null;
  const customLeadsVersion = useSelector((state) => state.leads.customLeadsVersion);

  const [leads, setLeads] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(() => {
    try {
      const saved = localStorage.getItem('leadsarrow_custom_selected_cluster');
      if (saved) return saved;
    } catch (e) {}
    return 'all';
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('leadsarrow_custom_leads_page_size'));
      if ([25, 50, 100].includes(saved)) return saved;
    } catch (e) {}
    return 25;
  });

  // Modals state
  const [deletingTarget, setDeletingTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [deleteClusterTarget, setDeleteClusterTarget] = useState(null);
  const [isDeletingCluster, setIsDeletingCluster] = useState(false);

  const [isCreateClusterModalOpen, setIsCreateClusterModalOpen] = useState(false);
  const [newClusterName, setNewClusterName] = useState('');
  const [newClusterDesc, setNewClusterDesc] = useState('');
  const [isCreatingCluster, setIsCreatingCluster] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Persist cluster selection
  useEffect(() => {
    try {
      localStorage.setItem('leadsarrow_custom_selected_cluster', selectedCluster);
    } catch (e) {}
    setPage(1);
  }, [selectedCluster]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const totalLeadsCount = leads.length;
  const totalPages = Math.max(1, Math.ceil(totalLeadsCount / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedLeads = useMemo(() => {
    const start = (page - 1) * pageSize;
    return leads.slice(start, start + pageSize);
  }, [leads, page, pageSize]);

  const startIdx = totalLeadsCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(totalLeadsCount, page * pageSize);

  const loadCustomLeads = useCallback(async () => {
    if (!userId) {
      setLeads([]);
      setClusters([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCustomLeadsFromServerApi(searchQuery, selectedCluster);
      setLeads(response.leads || []);
      if (response.clusters) {
        setClusters(response.clusters);
      }
    } catch (err) {
      console.error('Failed to load user custom leads:', err);
      setError(err.message || 'Failed to fetch your custom leads');
    } finally {
      setLoading(false);
    }
  }, [userId, searchQuery, selectedCluster]);

  useEffect(() => {
    loadCustomLeads();
  }, [loadCustomLeads, customLeadsVersion]);

  // Handle lead deletion
  const handleDeleteClick = (leadId, companyName) => {
    setDeletingTarget({ id: leadId, name: companyName });
  };

  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    setIsDeleting(true);
    try {
      await deleteCustomLeadOnServerApi(deletingTarget.id);
      setLeads((prev) => prev.filter((l) => l.id !== deletingTarget.id));
      setFeedbackMessage(`Permanently deleted "${deletingTarget.name}" from your custom leads database.`);
      setTimeout(() => setFeedbackMessage(null), 4000);
      setDeletingTarget(null);
      // Reload cluster counts
      loadCustomLeads();
    } catch (err) {
      alert(err.message || 'Failed to delete custom lead from database');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle cluster creation
  const handleCreateCluster = async (e) => {
    e.preventDefault();
    const trimmed = newClusterName.trim();
    if (!trimmed) return;
    setIsCreatingCluster(true);
    try {
      await createCustomClusterOnServerApi({
        name: trimmed,
        description: newClusterDesc.trim() || `${trimmed} lead cluster`
      });
      setFeedbackMessage(`Cluster "${trimmed}" created successfully!`);
      setTimeout(() => setFeedbackMessage(null), 4000);
      setNewClusterName('');
      setNewClusterDesc('');
      setIsCreateClusterModalOpen(false);
      setSelectedCluster(trimmed);
      loadCustomLeads();
    } catch (err) {
      alert(err.message || 'Failed to create cluster');
    } finally {
      setIsCreatingCluster(false);
    }
  };

  // Handle cluster deletion
  const handleConfirmDeleteCluster = async () => {
    if (!deleteClusterTarget) return;
    setIsDeletingCluster(true);
    try {
      await deleteCustomClusterOnServerApi(deleteClusterTarget.name);
      setFeedbackMessage(`Cluster "${deleteClusterTarget.name}" and its associated custom leads have been removed.`);
      setTimeout(() => setFeedbackMessage(null), 4000);
      setDeleteClusterTarget(null);
      if (selectedCluster === deleteClusterTarget.name) {
        setSelectedCluster('all');
      }
      loadCustomLeads();
    } catch (err) {
      alert(err.message || 'Failed to delete cluster');
    } finally {
      setIsDeletingCluster(false);
    }
  };

  const handleExportCsv = () => {
    if (!leads.length) return;
    const headers = [
      'Cluster / Group',
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
      'Buying Intent Score'
    ];

    const rows = leads.map((l) => [
      l.clusterName || 'General',
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
    a.download = `custom_leads_${selectedCluster}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalAllClusterLeads = useMemo(() => {
    return clusters.reduce((sum, c) => sum + (c.leadCount || 0), 0);
  }, [clusters]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
                    My Custom Leads
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <Lock className="w-3 h-3" />
                    Private Profile Workspace
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Organized into target clusters & groups. Isolated securely in Database 4. Strictly invisible to any other account.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Profile Owner: </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {user ? `${user.name || 'User'} (${user.email})` : 'Guest'}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Total Clusters: </span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {clusters.length}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/60 text-xs">
              <span className="text-orange-700 dark:text-orange-400">Total Leads: </span>
              <span className="font-bold text-orange-600 dark:text-orange-400 font-mono">
                {totalAllClusterLeads}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!user) {
                  dispatch(openAuthModal('login'));
                  return;
                }
                setIsCreateClusterModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded-xl transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ New Cluster</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!user) {
                  dispatch(openAuthModal('login'));
                  return;
                }
                dispatch(setAddLeadModalOpen({
                  open: true,
                  cluster: selectedCluster !== 'all' ? selectedCluster : 'General'
                }));
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Lead</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span>{feedbackMessage}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-emerald-600 hover:text-emerald-900 font-bold ml-2">×</button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 p-6 space-y-6">
        {!user ? (
          // Unauthenticated State
          <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-8 text-center shadow-lg">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display mb-1.5">
              Sign In to Access Your Private Leads
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Custom leads and clusters are strictly isolated to your individual profile in Database 4. Please sign in or create an account to view and create your private custom lead clusters.
            </p>
            <button
              type="button"
              onClick={() => dispatch(openAuthModal('login'))}
              className="w-full py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Sign In / Create Account
            </button>
          </div>
        ) : (
          <>
            {/* 1. CLUSTERS / GROUPS COMPONENTS SECTION ("First show components and their some add the custom leads") */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>Lead Clusters & Target Groups</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Segment custom leads into dedicated clusters instead of mixing all leads together. Add leads directly to any cluster below.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCluster !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCluster('all')}
                      className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-semibold cursor-pointer"
                    >
                      View All Clusters ({totalAllClusterLeads})
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of Cluster Components / Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Cluster Card 0: All Custom Leads */}
                <div
                  onClick={() => setSelectedCluster('all')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    selectedCluster === 'all'
                      ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 shadow-md ring-2 ring-orange-400/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                      <Layers className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {totalAllClusterLeads} leads
                    </span>
                  </div>

                  <div className="mt-3">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                      All Custom Leads
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      Aggregate view across all private clusters
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className={`font-semibold ${selectedCluster === 'all' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500'}`}>
                      {selectedCluster === 'all' ? '● Currently Active' : 'Select to view'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(setAddLeadModalOpen({ open: true, cluster: 'General' }));
                      }}
                      className="inline-flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Lead</span>
                    </button>
                  </div>
                </div>

                {/* Individual Cluster Cards */}
                {clusters.map((cluster) => {
                  const isSelected = selectedCluster === cluster.name;
                  const isDefaultGeneral = cluster.name.toLowerCase() === 'general';

                  return (
                    <div
                      key={cluster.id || cluster.name}
                      onClick={() => setSelectedCluster(cluster.name)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 shadow-md ring-2 ring-orange-400/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-9 h-9 rounded-lg bg-orange-100/70 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                          <Folder className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                            {cluster.leadCount || 0} leads
                          </span>
                          {!isDefaultGeneral && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteClusterTarget(cluster);
                              }}
                              title={`Delete cluster "${cluster.name}"`}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate" title={cluster.name}>
                          {cluster.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1" title={cluster.description}>
                          {cluster.description || 'Target account cluster'}
                        </p>
                      </div>

                      {/* Cluster Actions on the Card */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className={`font-semibold ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500'}`}>
                          {isSelected ? '● Viewing Leads' : 'Click to view'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(setAddLeadModalOpen({ open: true, cluster: cluster.name }));
                          }}
                          className="inline-flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 hover:underline"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add to Cluster</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Card: + Create New Cluster */}
                <div
                  onClick={() => setIsCreateClusterModalOpen(true)}
                  className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 bg-white/60 dark:bg-slate-900/60 hover:bg-orange-50/20 dark:hover:bg-orange-950/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[140px]"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                    + Create New Cluster
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Group custom leads by campaign or niche
                  </span>
                </div>
              </div>
            </div>

            {/* 2. LEADS TOOLBAR & TABLE FOR ACTIVE CLUSTER */}
            <div className="space-y-3">
              {/* Active Cluster Title & Search Controls */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 font-bold text-xs">
                    <Folder className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    <span>
                      Cluster: {selectedCluster === 'all' ? 'All Custom Leads' : selectedCluster}
                    </span>
                    <span className="font-mono text-[10px] ml-1 opacity-75">
                      ({leads.length} leads)
                    </span>
                  </div>

                  {selectedCluster !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCluster('all')}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline"
                    >
                      Clear filter
                    </button>
                  )}
                </div>

                {/* Search in this cluster */}
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search within ${selectedCluster === 'all' ? 'all clusters' : selectedCluster}...`}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-orange-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={loadCustomLeads}
                    disabled={loading}
                    title="Refresh leads"
                    className="p-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {leads.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Export CSV ({leads.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      dispatch(setAddLeadModalOpen({
                        open: true,
                        cluster: selectedCluster !== 'all' ? selectedCluster : 'General'
                      }));
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer shadow-xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {selectedCluster !== 'all' ? `+ Add to ${selectedCluster}` : '+ Add Custom Lead'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Table / Empty State Container */}
              {loading && leads.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : error ? (
                <div className="max-w-md mx-auto my-8 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">Unable to load cluster leads</h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{error}</p>
                  <button
                    type="button"
                    onClick={loadCustomLeads}
                    className="mt-4 px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded-lg hover:bg-rose-50"
                  >
                    Try Again
                  </button>
                </div>
              ) : leads.length === 0 ? (
                /* Empty Cluster Leads */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-3 border border-orange-200/50 dark:border-orange-800/50">
                    <Folder className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    No custom leads in {selectedCluster === 'all' ? 'your workspace' : `cluster "${selectedCluster}"`} yet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                    {selectedCluster === 'all'
                      ? 'Add your first custom lead to organize decision makers into custom clusters.'
                      : `You can add targeted B2B decision makers directly into cluster "${selectedCluster}".`}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(setAddLeadModalOpen({
                        open: true,
                        cluster: selectedCluster !== 'all' ? selectedCluster : 'General'
                      }));
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {selectedCluster !== 'all' ? `+ Add First Lead to "${selectedCluster}"` : '+ Create Custom Lead'}
                    </span>
                  </button>
                </div>
              ) : (
                /* Leads Table */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Company & Domain</th>
                          <th className="py-3 px-4">Cluster / Group</th>
                          <th className="py-3 px-4">Decision Maker</th>
                          <th className="py-3 px-4">Direct Contact & Verification</th>
                          <th className="py-3 px-4">Employees</th>
                          <th className="py-3 px-4">Annual Revenue</th>
                          <th className="py-3 px-4">HQ Location</th>
                          <th className="py-3 px-4 text-center">Intent</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                        {paginatedLeads.map((lead) => (
                          <tr
                            key={lead.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            {/* Column 1: Company & Sector */}
                            <td className="py-3.5 px-4 min-w-[180px]">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{lead.companyName}</span>
                                {lead.domain && (
                                  <a
                                    href={`https://${lead.domain.replace(/^https?:\/\//, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 inline-flex items-center"
                                    title="Visit domain"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <span>{lead.industry || 'Enterprise'}</span>
                                {lead.fundingStage && (
                                  <span className="ml-1.5 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                                    {lead.fundingStage}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Column 2: Cluster / Group Pill */}
                            <td className="py-3.5 px-4 min-w-[130px]">
                              <button
                                type="button"
                                onClick={() => setSelectedCluster(lead.clusterName || 'General')}
                                title={`Filter by cluster "${lead.clusterName || 'General'}"`}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100/80 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/70 hover:bg-orange-200 transition-colors cursor-pointer"
                              >
                                <Folder className="w-2.5 h-2.5 text-orange-600" />
                                <span>{lead.clusterName || 'General'}</span>
                              </button>
                            </td>

                            {/* Column 3: Decision Maker */}
                            <td className="py-3.5 px-4 min-w-[160px]">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {lead.contactName || '—'}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {lead.contactTitle || 'Decision Maker'}
                                {lead.seniority && (
                                  <span className="ml-1 text-[10px] text-slate-400">
                                    • {lead.seniority}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Column 4: Direct Contact */}
                            <td className="py-3.5 px-4 min-w-[190px]">
                              <div className="font-mono text-[11px] text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{lead.contactEmail || '—'}</span>
                              </div>
                              <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{lead.contactPhone || '—'}</span>
                                <span className="ml-auto px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/50 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                                  Verified
                                </span>
                              </div>
                            </td>

                            {/* Column 5: Employees */}
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              {lead.employeeRange || (lead.employeeCount ? `${lead.employeeCount}` : '51-200')}
                            </td>

                            {/* Column 6: Annual Revenue */}
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              {lead.revenueRange || '$10M - $50M'}
                            </td>

                            {/* Column 7: HQ Location */}
                            <td className="py-3.5 px-4 text-[11px] text-slate-700 dark:text-slate-300 min-w-[140px]">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{lead.city ? `${lead.city}, ` : ''}{lead.country || 'USA'}</span>
                              </div>
                            </td>

                            {/* Column 8: Intent */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-block px-2 py-0.5 rounded-full font-mono text-[11px] font-bold bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
                                {lead.buyingIntentScore || 88}
                              </span>
                            </td>

                            {/* Column 9: Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(lead.id, lead.companyName)}
                                title="Delete from custom leads"
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer with Pagination Controls */}
                  <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-3">
                      <span>
                        Showing <strong className="font-mono tabular-nums text-slate-900 dark:text-white">{startIdx} - {endIdx}</strong> of{' '}
                        <strong className="font-mono tabular-nums text-slate-900 dark:text-white">{totalLeadsCount}</strong> lead{totalLeadsCount !== 1 ? 's' : ''}
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
                              localStorage.setItem('leadsarrow_custom_leads_page_size', String(val));
                            } catch (err) {}
                          }}
                          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-orange-600 cursor-pointer"
                        >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </label>
                      <span>·</span>
                      <div className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Database className="w-3 h-3 text-emerald-500" />
                        <span>Isolated DB4 Storage</span>
                      </div>
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
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal for Deleting Single Private Lead */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingTarget)}
        onClose={() => !isDeleting && setDeletingTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Delete Custom Lead?"
        message="Are you sure you want to permanently delete this custom lead from your private workspace? This record will be erased from Database 4."
        itemName={deletingTarget?.name}
        confirmText="Yes, Delete Lead"
        cancelText="Cancel"
        dangerNote="This lead will be permanently deleted from the database and cannot be recovered."
      />

      {/* Confirmation Modal for Deleting Cluster */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteClusterTarget)}
        onClose={() => !isDeletingCluster && setDeleteClusterTarget(null)}
        onConfirm={handleConfirmDeleteCluster}
        loading={isDeletingCluster}
        title={`Delete Cluster "${deleteClusterTarget?.name}"?`}
        message={`Are you sure you want to delete cluster "${deleteClusterTarget?.name}"? All custom leads inside this cluster will also be deleted from Database 4.`}
        itemName={deleteClusterTarget?.name}
        confirmText="Yes, Delete Cluster"
        cancelText="Cancel"
        dangerNote="All custom leads grouped inside this cluster will be permanently deleted."
      />

      {/* Modal: Create New Custom Cluster */}
      {isCreateClusterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => !isCreatingCluster && setIsCreateClusterModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                  Create Lead Cluster
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateClusterModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCluster} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cluster Name *
                </label>
                <input
                  type="text"
                  required
                  value={newClusterName}
                  onChange={(e) => setNewClusterName(e.target.value)}
                  placeholder="e.g. Enterprise SaaS, FinTech, Q4 Targets..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-orange-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Campaign Goal (Optional)
                </label>
                <input
                  type="text"
                  value={newClusterDesc}
                  onChange={(e) => setNewClusterDesc(e.target.value)}
                  placeholder="e.g. Outreach campaign for VP and Director level decision makers"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-orange-600"
                />
              </div>

              <div className="p-3 rounded-lg bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-800/40 text-[11px] text-orange-900 dark:text-orange-300">
                Clusters group your custom leads so they stay separated and organized by accounts, niches, or outreach campaigns.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateClusterModalOpen(false)}
                  disabled={isCreatingCluster}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newClusterName.trim() || isCreatingCluster}
                  className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isCreatingCluster ? 'Creating...' : 'Create Cluster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
