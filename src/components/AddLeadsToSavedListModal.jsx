import React, { useState, useEffect, useCallback } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { appendLeadsToSavedList } from '../store/savedListsSlice.js';
import { fetchLeadsFromServer, fetchCustomLeadsFromServerApi } from '../services/api.js';

export default function AddLeadsToSavedListModal({
  isOpen,
  onClose,
  targetList,
  onSuccess
}) {
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState('');
  const [sourceTab, setSourceTab] = useState('all'); // 'all' | 'custom'
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const existingLeadIds = new Set(
    Array.isArray(targetList?.leadIds) ? targetList.leadIds : []
  );

  const performSearch = useCallback(async (query, tab) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      if (tab === 'custom') {
        const res = await fetchCustomLeadsFromServerApi(query);
        setSearchResults(res.leads || []);
      } else {
        const res = await fetchLeadsFromServer({
          searchQuery: query.trim(),
          pageSize: 25,
          page: 1
        });
        setSearchResults(res.leads || []);
      }
    } catch (err) {
      console.error('Failed to search leads for list:', err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search on open or when tab changes
  useEffect(() => {
    if (isOpen) {
      performSearch(searchQuery, sourceTab);
    } else {
      setSelectedIds([]);
      setSearchQuery('');
      setStatusMessage(null);
    }
  }, [isOpen, sourceTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(searchQuery, sourceTab);
  };

  const toggleSelect = (id) => {
    if (existingLeadIds.has(id)) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllNew = () => {
    const selectable = searchResults
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
      }, 1200);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={() => !isSubmitting && onClose()}
      />

      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Add Leads to "{targetList.name}"
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Currently has {existingLeadIds.size} leads. Search and select leads to append to this list.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Tabs & Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSourceTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                sourceTab === 'all'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Global Database Leads (10.3M)
            </button>
            <button
              type="button"
              onClick={() => setSourceTab('custom')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                sourceTab === 'custom'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              My Custom Leads (DB4)
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads by company name, contact, domain, email..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-600"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`px-4 py-2 text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-b border-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-b border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Search Results List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2 text-xs">
          {loading ? (
            <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
              <span>Searching leads...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No leads found. Try a different search term above.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1">
                <span>Select leads to add:</span>
                <button
                  type="button"
                  onClick={handleSelectAllNew}
                  className="text-orange-600 dark:text-orange-400 hover:underline font-semibold cursor-pointer"
                >
                  Select / Deselect All New
                </button>
              </div>

              {searchResults.map((lead) => {
                const isAlreadyInList = existingLeadIds.has(lead.id);
                const isChecked = selectedIds.includes(lead.id);

                return (
                  <div
                    key={lead.id}
                    onClick={() => !isAlreadyInList && toggleSelect(lead.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      isAlreadyInList
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                        : isChecked
                        ? 'bg-orange-50/80 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800/80 cursor-pointer'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        disabled={isAlreadyInList}
                        checked={isChecked}
                        onChange={() => toggleSelect(lead.id)}
                        className="w-4 h-4 rounded text-orange-600 accent-orange-600 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                          <span>{lead.companyName}</span>
                          {lead.domain && (
                            <span className="text-[11px] font-normal text-slate-400">
                              ({lead.domain})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 truncate">
                          <span>{lead.contactName || 'Executive'}</span>
                          {lead.contactTitle && <span>• {lead.contactTitle}</span>}
                          {lead.contactEmail && <span>• {lead.contactEmail}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isAlreadyInList ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          Already in list
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
                          Score: {lead.buyingIntentScore || 88}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            <strong className="font-mono text-slate-900 dark:text-white">{selectedIds.length}</strong> lead{selectedIds.length !== 1 ? 's' : ''} selected to add
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!selectedIds.length || isSubmitting}
              onClick={handleAddLeads}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-all shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding Leads...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add {selectedIds.length > 0 ? `${selectedIds.length} ` : ''}Leads to List</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
