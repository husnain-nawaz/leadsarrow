import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  X,
  Search,
  Plus,
  Check,
  Building2,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Database,
  Layers,
  ArrowRight
} from 'lucide-react';
import { appendLeadsToSavedList } from '../store/savedListsSlice.js';
import { fetchLeadsFromServer, fetchCustomLeadsFromServerApi } from '../services/api.js';

export default function AddLeadsToSavedListModal({
  isOpen,
  onClose,
  targetList,
  onSuccess,
  onRedirectToFinder,
  onRedirectToCustom
}) {
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState('');
  const [sourceTab, setSourceTab] = useState('all'); // 'all' | 'custom'
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Pagination inside modal
  const [modalPage, setModalPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(10);
  const [serverTotal, setServerTotal] = useState(0);

  const existingLeadIds = useMemo(() => {
    return new Set(Array.isArray(targetList?.leadIds) ? targetList.leadIds : []);
  }, [targetList]);

  const performSearch = useCallback(async (query, tab, pageNum = 1, pageSizeNum = 10) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      if (tab === 'custom') {
        const res = await fetchCustomLeadsFromServerApi(query);
        const leads = res.leads || [];
        setServerTotal(leads.length);
        setSearchResults(leads);
      } else {
        const res = await fetchLeadsFromServer({
          searchQuery: query.trim(),
          pageSize: pageSizeNum,
          page: pageNum
        });
        setSearchResults(res.leads || []);
        setServerTotal(res.pagination?.totalCatalogRows || res.pagination?.estimatedGlobalMatches || (res.leads || []).length);
      }
    } catch (err) {
      console.error('Failed to search leads for list:', err);
      setSearchResults([]);
      setServerTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search when modal opens or tab/page changes
  useEffect(() => {
    if (isOpen) {
      performSearch(searchQuery, sourceTab, modalPage, modalPageSize);
    } else {
      setSelectedIds([]);
      setSearchQuery('');
      setModalPage(1);
      setStatusMessage(null);
    }
  }, [isOpen, sourceTab, modalPage, modalPageSize]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setModalPage(1);
    performSearch(searchQuery, sourceTab, 1, modalPageSize);
  };

  const toggleSelect = (id) => {
    if (existingLeadIds.has(id)) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Slice if custom tab, or use direct results if core
  const displayedLeads = useMemo(() => {
    if (sourceTab === 'custom') {
      const start = (modalPage - 1) * modalPageSize;
      return searchResults.slice(start, start + modalPageSize);
    }
    return searchResults;
  }, [searchResults, sourceTab, modalPage, modalPageSize]);

  const totalPages = Math.max(1, Math.ceil(serverTotal / modalPageSize));

  const handleSelectAllOnPage = () => {
    const selectable = displayedLeads
      .map((l) => l.id)
      .filter((id) => !existingLeadIds.has(id));

    const allSelected = selectable.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !selectable.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...selectable])));
    }
  };

  const handleAddLeads = async () => {
    if (!targetList || !selectedIds.length) return;
    setIsSubmitting(true);
    try {
      await dispatch(
        appendLeadsToSavedList({
          listId: targetList.id,
          leadIds: selectedIds
        })
      ).unwrap();

      setStatusMessage({
        type: 'success',
        text: `Successfully added ${selectedIds.length} lead${selectedIds.length > 1 ? 's' : ''} to "${targetList.name}".`
      });

      if (onSuccess) {
        onSuccess(selectedIds);
      }

      setTimeout(() => {
        onClose();
      }, 1100);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to add leads to list'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !targetList) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={() => !isSubmitting && onClose()} />

      <div className="relative z-10 w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-slate-100 transition-colors">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Add Leads to "{targetList.name}"
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
                  {existingLeadIds.size} Leads in List
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Search, filter, and append decision makers from either the global database or your private custom leads.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comfortable Redirect Action Bar */}
        <div className="px-6 py-2.5 bg-orange-50/60 dark:bg-orange-950/20 border-b border-orange-200/50 dark:border-orange-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-600 dark:text-slate-300 font-medium">
            💡 Prefer full-screen browsing with industry filters and sorting?
          </span>
          <div className="flex items-center gap-2">
            {onRedirectToFinder && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRedirectToFinder();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-bold text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-800 border border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Browse in Lead Finder</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            {onRedirectToCustom && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRedirectToCustom();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-orange-500" />
                <span>Browse Custom Leads</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Source Tabs & Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSourceTab('all');
                setModalPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                sourceTab === 'all'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Core Global Leads (10.3M+)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSourceTab('custom');
                setModalPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                sourceTab === 'custom'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>My Custom Leads (DB4)</span>
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by company, contact name, domain, email..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-600"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`px-4 py-2.5 text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-b border-rose-200 dark:border-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Scrollable Data Table Container */}
        <div className="flex-1 overflow-auto min-h-0 bg-white dark:bg-slate-900">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
              <span className="text-xs">Loading database leads...</span>
            </div>
          ) : displayedLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs">No leads found matching your search. Try different terms or switch tabs.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase">
                <tr>
                  <th className="py-2.5 px-4 w-12 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAllOnPage}
                      className="text-orange-600 dark:text-orange-400 hover:underline font-bold text-[10px]"
                      title="Select / deselect all on page"
                    >
                      All
                    </button>
                  </th>
                  <th className="py-2.5 px-4">Company & Domain</th>
                  <th className="py-2.5 px-4">Decision Maker</th>
                  <th className="py-2.5 px-4">Direct Contact & Verification</th>
                  <th className="py-2.5 px-4 text-right">Employees</th>
                  <th className="py-2.5 px-4 text-right">Annual Revenue</th>
                  <th className="py-2.5 px-4">HQ Location</th>
                  <th className="py-2.5 px-4 text-center">Intent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                {displayedLeads.map((lead) => {
                  const isAlreadyInList = existingLeadIds.has(lead.id);
                  const isChecked = selectedIds.includes(lead.id);

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => !isAlreadyInList && toggleSelect(lead.id)}
                      className={`transition-colors cursor-pointer ${
                        isAlreadyInList
                          ? 'opacity-50 bg-slate-50/50 dark:bg-slate-800/30 cursor-not-allowed'
                          : isChecked
                          ? 'bg-orange-50/70 dark:bg-orange-950/30'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          disabled={isAlreadyInList}
                          checked={isChecked}
                          onChange={() => toggleSelect(lead.id)}
                          className="w-4 h-4 rounded text-orange-600 accent-orange-600 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>

                      {/* Company & Domain */}
                      <td className="py-3 px-4 min-w-[180px]">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="truncate">{lead.companyName}</span>
                          {lead.domain && (
                            <a
                              href={`https://${lead.domain.replace(/^https?:\/\//, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-400 hover:text-orange-600 dark:hover:text-orange-400"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          <span>{lead.industry || 'Enterprise'}</span>
                          {lead.fundingStage && <span> · {lead.fundingStage}</span>}
                        </div>
                      </td>

                      {/* Decision Maker */}
                      <td className="py-3 px-4 min-w-[160px]">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {lead.contactName || 'Executive'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          <span>{lead.contactTitle || 'Decision Maker'}</span>
                          {lead.seniority && <span> · {lead.seniority}</span>}
                        </div>
                      </td>

                      {/* Contact & Verification */}
                      <td className="py-3 px-4 min-w-[180px]">
                        <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
                          {lead.contactEmail || 'Verified Work Email'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <span>{lead.contactPhone || '+1 Direct Dial'}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                            {lead.verificationStatus || 'Verified'}
                          </span>
                        </div>
                      </td>

                      {/* Employees */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <div className="text-slate-900 dark:text-white">
                          {(lead.employeeCount || 100).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">{lead.employeeRange}</div>
                      </td>

                      {/* Revenue */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <div className="text-slate-900 dark:text-white">{lead.revenueRange || '$10M - $50M'}</div>
                      </td>

                      {/* HQ Location */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 min-w-[130px]">
                        {lead.city ? `${lead.city}, ` : ''}{lead.country || 'USA'}
                      </td>

                      {/* Intent */}
                      <td className="py-3 px-4 text-center">
                        {isAlreadyInList ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            In List
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
                            {lead.buyingIntentScore || 88}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination & Footer Controls */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-600 dark:text-slate-300">
              <strong className="font-mono text-slate-900 dark:text-white">{selectedIds.length}</strong> lead{selectedIds.length !== 1 ? 's' : ''} selected
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <label className="inline-flex items-center gap-1.5 text-slate-500">
              <span>Rows:</span>
              <select
                value={modalPageSize}
                onChange={(e) => {
                  setModalPageSize(Number(e.target.value));
                  setModalPage(1);
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono text-slate-900 dark:text-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </label>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-slate-500">
              Page <strong className="font-mono text-slate-800 dark:text-slate-200">{modalPage}</strong> of{' '}
              <strong className="font-mono text-slate-800 dark:text-slate-200">{totalPages}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Modal Pagination buttons */}
            <div className="flex items-center gap-1 mr-2">
              <button
                type="button"
                disabled={modalPage <= 1}
                onClick={() => setModalPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={modalPage >= totalPages}
                onClick={() => setModalPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!selectedIds.length || isSubmitting}
              onClick={handleAddLeads}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-all shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding Leads...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add {selectedIds.length > 0 ? `${selectedIds.length} ` : ''}Selected Leads</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
