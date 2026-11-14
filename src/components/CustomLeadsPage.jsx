import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  AlertTriangle,
  Database,
  ChevronLeft,
  ChevronRight,
  Folder,
  Layers,
  FolderPlus,
  CheckCircle2,
  X
} from 'lucide-react';
import {
  setAddLeadModalOpen,
  toggleSelectLead,
  selectAllCurrentPageLeads
} from '../store/leadsSlice.js';
import { openAuthModal, openUpgradeModal } from '../store/authSlice.js';
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
  const { selectedLeadIds = [] } = useSelector((state) => state.leads);

  // Check if current user is on Free Starter tier (max 5 active clusters)
  const isFreeUser =
    user?.role !== 'superadmin' &&
    (!user?.planId ||
      user?.planId === 'free' ||
      user?.plan?.toLowerCase().includes('free'));

  const [leads, setLeads] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(() => {
    try {
      const saved = localStorage.getItem('leadsarrow_custom_selected_cluster');
      if (saved && saved !== 'all') return saved;
    } catch (e) {}
    return null;
  });

  // Display limit for horizontal clusters (loads 5 at a time, adds +5 on click)
  const [clusterDisplayLimit, setClusterDisplayLimit] = useState(5);
  const [isClusterLimitModalOpen, setIsClusterLimitModalOpen] = useState(false);

  // Horizontal scroll refs and controls
  const clustersScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('leadsarrow_custom_leads_page_size'));
      if ([10, 25, 50, 100].includes(saved)) return saved;
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
      if (selectedCluster) {
        localStorage.setItem('leadsarrow_custom_selected_cluster', selectedCluster);
      } else {
        localStorage.removeItem('leadsarrow_custom_selected_cluster');
      }
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

  const loadCustomLeads = useCallback(async (clusterOverride) => {
    if (!userId) {
      setLeads([]);
      setClusters([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const activeCls = clusterOverride !== undefined ? clusterOverride : selectedCluster;
      const response = await fetchCustomLeadsFromServerApi(searchQuery, activeCls || '');
      const fetchedClusters = response.clusters || [];
      setClusters(fetchedClusters);
      setLeads(response.leads || []);

      if (fetchedClusters.length > 0) {
        const clusterNames = fetchedClusters.map((c) => c.name);
        if (!activeCls || !clusterNames.includes(activeCls)) {
          const nextActive = response.activeCluster || clusterNames[0];
          setSelectedCluster(nextActive);
        }
      } else {
        setSelectedCluster(null);
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

  // Handle opening cluster creation modal (with 5-cluster limit check for free users)
  const handleOpenCreateCluster = () => {
    if (!user) {
      dispatch(openAuthModal('login'));
      return;
    }
    if (isFreeUser && clusters.length >= 5) {
      setIsClusterLimitModalOpen(true);
      return;
    }
    setIsCreateClusterModalOpen(true);
  };

  // Handle cluster creation
  const handleCreateCluster = async (e) => {
    e.preventDefault();
    const trimmed = newClusterName.trim();
    if (!trimmed) return;
    if (isFreeUser && clusters.length >= 5) {
      setIsCreateClusterModalOpen(false);
      setIsClusterLimitModalOpen(true);
      return;
    }
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
      loadCustomLeads(trimmed);
    } catch (err) {
      alert(err.message || 'Failed to create cluster');
    } finally {
      setIsCreatingCluster(false);
    }
  };

  // Handle cluster deletion (all clusters can be deleted, including their leads)
  const handleConfirmDeleteCluster = async () => {
    if (!deleteClusterTarget) return;
    setIsDeletingCluster(true);
    try {
      await deleteCustomClusterOnServerApi(deleteClusterTarget.name);
      setFeedbackMessage(`Cluster "${deleteClusterTarget.name}" and its associated custom leads have been removed.`);
      setTimeout(() => setFeedbackMessage(null), 4000);
      
      const remainingClusters = clusters.filter((c) => c.name !== deleteClusterTarget.name);
      setClusters(remainingClusters);
      const nextCluster = remainingClusters[0]?.name || null;
      setSelectedCluster(nextCluster);
      setDeleteClusterTarget(null);
      loadCustomLeads(nextCluster);
    } catch (err) {
      alert(err.message || 'Failed to delete cluster');
    } finally {
      setIsDeletingCluster(false);
    }
  };

  // Displayed slice of clusters (starting with 5, loading +5 progressively)
  const displayedClusters = useMemo(() => {
    return clusters.slice(0, clusterDisplayLimit);
  }, [clusters, clusterDisplayLimit]);

  const hasMoreClusters = clusters.length > clusterDisplayLimit;
  const remainingClustersCount = Math.max(0, clusters.length - clusterDisplayLimit);

  // Horizontal scroll buttons detection
  const checkScroll = useCallback(() => {
    const el = clustersScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = clustersScrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [checkScroll, displayedClusters]);

  const handleScrollClusters = (dir) => {
    const el = clustersScrollRef.current;
    if (!el) return;
    const distance = 280 * 2;
    el.scrollBy({ left: dir === 'left' ? -distance : distance, behavior: 'smooth' });
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
              onClick={handleOpenCreateCluster}
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
                if (clusters.length === 0) {
                  handleOpenCreateCluster();
                  return;
                }
                dispatch(
                  setAddLeadModalOpen({
                    open: true,
                    cluster: selectedCluster || clusters[0]?.name || ''
                  })
                );
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
            {/* 1. CLUSTERS / GROUPS COMPONENTS SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>Lead Clusters & Target Groups</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Segment custom leads into dedicated clusters. Every custom lead belongs to a cluster. Free plan limit: 5 active clusters.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {clusters.length} {clusters.length === 1 ? 'Cluster' : 'Clusters'}
                  </span>
                  <span>·</span>
                  <span>{totalAllClusterLeads} Total Private Leads</span>
                </div>
              </div>

              {/* Cluster Components Row: First Card (+ Create New Cluster) is Pinned / Non-scrollable */}
              <div className="flex items-stretch gap-3.5">
                {/* PINNED FIRST CARD: + Create New Cluster */}
                <div
                  onClick={handleOpenCreateCluster}
                  className={`shrink-0 w-64 p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col justify-between group min-h-[155px] ${
                    isFreeUser && clusters.length >= 5
                      ? 'border-amber-400 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-500'
                      : 'border-slate-300 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 bg-white dark:bg-slate-900 hover:bg-orange-50/20 dark:hover:bg-orange-950/20 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                      <FolderPlus className="w-4 h-4" />
                    </div>
                    {isFreeUser ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          clusters.length >= 5
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {clusters.length} / 5 Used
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {clusters.length} Clusters
                      </span>
                    )}
                  </div>

                  <div className="my-2 text-left">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      + Create New Cluster
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Group custom leads by campaign or niche
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    {isFreeUser && clusters.length >= 5 ? (
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Limit reached · Upgrade</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                        + Click to add cluster
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      Private DB4
                    </span>
                  </div>
                </div>

                {/* SCROLLABLE TRACK FOR CLUSTERS */}
                <div className="relative flex-1 min-w-0 flex items-stretch">
                  {canScrollLeft && (
                    <button
                      type="button"
                      onClick={() => handleScrollClusters('left')}
                      className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-700 cursor-pointer"
                      title="Scroll left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  {canScrollRight && (
                    <button
                      type="button"
                      onClick={() => handleScrollClusters('right')}
                      className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-700 cursor-pointer"
                      title="Scroll right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  <div
                    ref={clustersScrollRef}
                    className="flex items-stretch gap-3.5 overflow-x-auto scroll-smooth py-1 px-1 scrollbar-thin flex-1"
                  >
                    {displayedClusters.map((cluster) => {
                      const isSelected = selectedCluster === cluster.name;
                      return (
                        <div
                          key={cluster.id || cluster.name}
                          onClick={() => setSelectedCluster(cluster.name)}
                          className={`shrink-0 w-64 p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 shadow-md ring-2 ring-orange-400/20'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="w-9 h-9 rounded-lg bg-orange-100/70 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                              <Folder className="w-4 h-4" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                                {cluster.leadCount || 0} leads
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteClusterTarget(cluster);
                                }}
                                title={`Delete cluster "${cluster.name}"`}
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-2.5 text-left">
                            <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate" title={cluster.name}>
                              {cluster.name}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1" title={cluster.description}>
                              {cluster.description || 'Target account cluster'}
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                            <span className={`font-semibold ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500'}`}>
                              {isSelected ? '● Active' : 'Click to view'}
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
                              <span>Add Lead</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Load Next 5 Clusters Card */}
                    {hasMoreClusters && (
                      <div
                        onClick={() => setClusterDisplayLimit((prev) => prev + 5)}
                        className="shrink-0 w-64 p-4 rounded-xl border-2 border-dashed border-orange-300 dark:border-orange-800/80 bg-orange-50/40 dark:bg-orange-950/20 hover:bg-orange-100/60 dark:hover:bg-orange-900/40 transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[155px]"
                      >
                        <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Plus className="w-4 h-4 font-bold" />
                        </div>
                        <span className="font-bold text-xs text-orange-700 dark:text-orange-300 group-hover:underline">
                          + Load Next 5 Clusters
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          {Math.min(5, remainingClustersCount)} more ({remainingClustersCount} remaining)
                        </span>
                      </div>
                    )}

                    {clusters.length === 0 && (
                      <div className="flex-1 min-h-[140px] flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 text-center">
                        <Folder className="w-6 h-6 text-slate-400 mb-1.5" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          No clusters created yet
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Click "+ Create New Cluster" on the left to start organizing your custom leads.
                        </p>
                      </div>
                    )}
                  </div>
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
                      Cluster: {selectedCluster || 'No Cluster Selected'}
                    </span>
                    <span className="font-mono text-[10px] ml-1 opacity-75">
                      ({leads.length} leads)
                    </span>
                  </div>
                </div>

                {/* Search in this cluster */}
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={selectedCluster ? `Search within cluster "${selectedCluster}"...` : 'Search custom leads...'}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-orange-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => loadCustomLeads()}
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
                      if (clusters.length === 0) {
                        handleOpenCreateCluster();
                        return;
                      }
                      dispatch(
                        setAddLeadModalOpen({
                          open: true,
                          cluster: selectedCluster || clusters[0]?.name || ''
                        })
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer shadow-xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {selectedCluster ? `+ Add to ${selectedCluster}` : '+ Add Custom Lead'}
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
                    onClick={() => loadCustomLeads()}
                    className="mt-4 px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded-lg hover:bg-rose-50 cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : clusters.length === 0 ? (
                /* No Clusters Yet Empty State */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-3 border border-orange-200/50 dark:border-orange-800/50">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    No custom clusters created yet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                    Custom leads are organized strictly into clusters. Create your first cluster to start adding targeted decision makers.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenCreateCluster}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Create First Cluster</span>
                  </button>
                </div>
              ) : leads.length === 0 ? (
                /* Empty Cluster Leads */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-3 border border-orange-200/50 dark:border-orange-800/50">
                    <Folder className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    No custom leads in cluster "{selectedCluster}" yet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                    You can add targeted B2B decision makers directly into cluster "{selectedCluster}".
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(
                        setAddLeadModalOpen({
                          open: true,
                          cluster: selectedCluster
                        })
                      );
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add First Lead to "{selectedCluster}"</span>
                  </button>
                </div>
              ) : (
                /* Leads Table */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={paginatedLeads.length > 0 && paginatedLeads.every((l) => selectedLeadIds.includes(l.id))}
                              onChange={() => {
                                const pageIds = paginatedLeads.map((l) => l.id);
                                dispatch(selectAllCurrentPageLeads(pageIds));
                              }}
                              className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-orange-600 focus:ring-orange-500 cursor-pointer"
                              title="Select all on this page"
                            />
                          </th>
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
                            className={`transition-colors ${
                              selectedLeadIds.includes(lead.id)
                                ? 'bg-orange-50/50 dark:bg-orange-950/25'
                                : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            {/* Checkbox Column */}
                            <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedLeadIds.includes(lead.id)}
                                onChange={() => dispatch(toggleSelectLead(lead.id))}
                                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-orange-600 focus:ring-orange-500 cursor-pointer"
                              />
                            </td>

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
                          <option value={10}>10</option>
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

      {/* Modal: Free Tier Cluster Limit Reached */}
      {isClusterLimitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsClusterLimitModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-center text-slate-900 dark:text-slate-100 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3.5">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Free Plan Cluster Limit Reached (5/5)
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Free Starter accounts can create up to <strong>5 active lead clusters</strong>. You currently have 5 clusters.
            </p>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              To create a new cluster, you can <strong>delete an existing cluster</strong> to free up a slot (allowing you to create up to 5 again), or <strong>upgrade your plan</strong> for unlimited clusters.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setIsClusterLimitModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel / Keep Existing
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsClusterLimitModalOpen(false);
                  dispatch(openUpgradeModal('starter'));
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Upgrade to Growth ($10/mo)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
