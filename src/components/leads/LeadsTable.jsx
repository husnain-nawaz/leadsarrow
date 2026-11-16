import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  ArrowUpDown,
  Eye,
  Copy,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Sparkles,
  Loader2,
  SearchX,
  FilterX,
  CheckCircle2,
  X,
  Layers
} from 'lucide-react';
import {
  toggleSelectLead,
  selectAllCurrentPageLeads,
  revealLeadContact,
  performRevealLead,
  setActiveLead,
  deleteCustomLead,
  deleteCoreLeadByAdmin
} from '../../store/leadsSlice.js';
import { showToast } from '../../store/toastSlice.js';
import TopLoadingBar from '../layout/TopLoadingBar.jsx';
import {
  setSortConfig,
  setPage,
  setPageSize,
  resetAllFilters
} from '../../store/filtersSlice.js';
import { decrementExportCredits, consumeCredits, openUpgradeModal } from '../../store/authSlice.js';
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal.jsx';

// 4 weeks limit in milliseconds: 4 * 7 * 24 * 60 * 60 * 1000
const FOUR_WEEKS_MS = 28 * 24 * 60 * 60 * 1000;

export function isNewLead(lead) {
  if (!lead) return false;
  // If lead has a createdAt timestamp, check if it's within 4 weeks
  if (lead.createdAt) {
    const age = Date.now() - new Date(lead.createdAt).getTime();
    return age >= 0 && age <= FOUR_WEEKS_MS;
  }
  // Fallback for custom or recent flag without explicit date
  return Boolean(lead.isRecent || lead.isCustom);
}

export default function LeadsTable() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    items,
    pagination,
    selectedLeadIds,
    revealedLeadIds,
    loading
  } = useSelector((state) => state.leads);
  const filters = useSelector((state) => state.filters);
  const { sortBy, sortOrder } = filters;
  const { targetListForAdding, lists = [], firestoreLists = [] } = useSelector((state) => state.savedLists);
  const [copiedKey, setCopiedKey] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Target list lead IDs set for preventing duplicate additions & showing disabled/dimmed state in Lead Finder
  const targetListLeadIds = useMemo(() => {
    if (!targetListForAdding?.id) return new Set();
    const liveList = (lists || []).find((l) => l.id === targetListForAdding.id) ||
                     (firestoreLists || []).find((l) => l.id === targetListForAdding.id);
    const ids = (liveList?.leadIds && liveList.leadIds.length > 0)
      ? liveList.leadIds
      : (targetListForAdding.leadIds || []);
    return new Set(ids.map((id) => String(id)));
  }, [targetListForAdding, lists, firestoreLists]);

  const handleConfirmDeleteLead = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.isCore) {
        await dispatch(deleteCoreLeadByAdmin(deleteTarget.id)).unwrap();
        dispatch(
          showToast({
            message: `Permanently deleted "${deleteTarget.name}" from core database.`,
            type: 'success'
          })
        );
      } else {
        await dispatch(deleteCustomLead(deleteTarget.id)).unwrap();
        dispatch(
          showToast({
            message: `Removed "${deleteTarget.name}" from custom leads.`,
            type: 'success'
          })
        );
      }
      setDeleteTarget(null);
    } catch (err) {
      dispatch(
        showToast({
          message: err.message || 'Failed to delete lead from database',
          type: 'error'
        })
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const isSuperAdmin = Boolean(
    user && (
      user.isSuperAdmin ||
      user.is_super_admin ||
      user.role === 'superadmin' ||
      user.role === 'Superadmin' ||
      user.email === 'alex@leadsarrow.io' ||
      user.email === 'alex@nexuslead.io'
    )
  );

  const isPaidOrSuperadmin = Boolean(
    isSuperAdmin ||
    (user && (
      user.planId === 'starter' ||
      user.planId === 'pro' ||
      user.planId === 'unlimited' ||
      (user.plan && !user.plan.toLowerCase().includes('free'))
    ))
  );

  // If a non-superadmin profile has a page outside standard browsing range (or switched from superadmin last page), reset to page 1
  useEffect(() => {
    if (!isSuperAdmin && (filters.page > 100 || pagination.page > 100)) {
      dispatch(setPage(1));
    }
  }, [isSuperAdmin, filters.page, pagination.page, dispatch]);
  const activeFilterTags = [];
  if (filters.searchQuery) activeFilterTags.push(`Search: "${filters.searchQuery}"`);
  if (filters.industries?.length) activeFilterTags.push(...filters.industries);
  if (filters.countries?.length) activeFilterTags.push(...filters.countries);
  if (filters.seniorities?.length) activeFilterTags.push(...filters.seniorities);
  if (filters.departments?.length) activeFilterTags.push(...filters.departments);
  if (filters.employeeRanges?.length) activeFilterTags.push(...filters.employeeRanges);
  if (filters.revenueRanges?.length) activeFilterTags.push(...filters.revenueRanges);
  if (filters.fundingStages?.length) activeFilterTags.push(...filters.fundingStages);
  if (filters.verificationStatuses?.length) activeFilterTags.push(...filters.verificationStatuses);
  if (filters.minIntentScore > 0) activeFilterTags.push(`Intent Score ≥ ${filters.minIntentScore}`);
  if (filters.hasVerifiedEmail) activeFilterTags.push('Verified Email Only');
  if (filters.hasDirectPhone) activeFilterTags.push('Direct Phone Only');
  if (filters.onlyRevealed) activeFilterTags.push('Revealed Contacts Only');
  if (filters.onlyCustom) activeFilterTags.push('New Leads Only');

  const pageIds = items.map((l) => l.id);
  const selectablePageIds = useMemo(() => {
    if (!targetListForAdding) return pageIds;
    return items.filter((l) => !targetListLeadIds.has(String(l.id))).map((l) => l.id);
  }, [items, pageIds, targetListForAdding, targetListLeadIds]);

  const allCurrentSelected =
    selectablePageIds.length > 0 &&
    selectablePageIds.every((id) => selectedLeadIds.includes(id));

  const handleSort = (column) => {
    if (sortBy === column) {
      dispatch(
        setSortConfig({
          sortBy: column,
          sortOrder: sortOrder === 'asc' ? 'desc' : 'asc'
        })
      );
    } else {
      dispatch(
        setSortConfig({
          sortBy: column,
          sortOrder: 'desc'
        })
      );
    }
  };

  const handleCopy = (e, text, key) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1600);
  };

  const handleReveal = (e, leadId) => {
    e.stopPropagation();
    const isUnlimited = user?.planId === 'unlimited' || user?.plan?.toLowerCase().includes('unlimited') || user?.role === 'superadmin';
    if (!isUnlimited && (user?.creditsRemaining ?? 100) <= 0) {
      dispatch(openUpgradeModal('starter'));
      return;
    }
    dispatch(revealLeadContact(leadId));
    dispatch(decrementExportCredits(1));
    dispatch(performRevealLead(leadId));
  };

  const maskEmail = (email) => {
    const [userPart, domainPart] = String(email || '').split('@');
    if (!domainPart) return '•••@company.io';
    return `${userPart.slice(0, 2)}••••@${domainPart}`;
  };

  const maskPhone = (phone) => {
    const str = String(phone || '');
    if (str.length < 6) return '+1 •••-••••';
    return `${str.slice(0, 6)} •••-••${str.slice(-2)}`;
  };

  const showSkeleton = loading;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden relative transition-colors">
      {/* High-visibility active progressive loading runner */}
      <TopLoadingBar loading={loading} height="h-1" />

      {/* High-Density Enterprise Data Grid */}
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
          </colgroup>
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/90 shadow-xs border-b border-slate-200 dark:border-slate-800 backdrop-blur-xs">
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
              <th className="py-2.5 pl-6 pr-3 bg-slate-50 dark:bg-slate-900">
                <input
                  type="checkbox"
                  checked={allCurrentSelected}
                  disabled={selectablePageIds.length === 0}
                  onChange={() => dispatch(selectAllCurrentPageLeads(selectablePageIds))}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-orange-600 focus:ring-orange-500 cursor-pointer disabled:cursor-not-allowed"
                  title={
                    Boolean(targetListForAdding) && selectablePageIds.length === 0
                      ? `All leads on this page are already in "${targetListForAdding.name}"`
                      : 'Select all eligible leads on this page'
                  }
                />
              </th>
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
              <th className="py-2.5 px-3 bg-slate-50 dark:bg-slate-900">Decision Maker</th>
              <th className="py-2.5 px-3 bg-slate-50 dark:bg-slate-900">Direct Contact & Verification</th>
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
              <th className="py-2.5 px-3 bg-slate-50 dark:bg-slate-900">HQ Location</th>
              <th className="py-2.5 pl-3 pr-6 text-right bg-slate-50 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => handleSort('buyingIntentScore')}
                  className="inline-flex items-center justify-end gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer whitespace-nowrap ml-auto"
                >
                  <span>Intent Score</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {showSkeleton ? (
              Array.from({ length: filters.pageSize || 25 }).map((_, idx) => (
                <tr key={idx} className="h-[54px] animate-pulse">
                  <td className="pl-6 pr-3 align-middle">
                    <div className="w-3.5 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="px-3 align-middle">
                    <div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded mb-1.5" />
                    <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </td>
                  <td className="px-3 align-middle">
                    <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded mb-1.5" />
                    <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </td>
                  <td className="px-3 align-middle">
                    <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-1.5" />
                    <div className="h-3 w-36 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </td>
                  <td className="px-3 align-middle text-right">
                    <div className="h-4 w-14 bg-slate-200 dark:bg-slate-800 rounded ml-auto mb-1.5" />
                    <div className="h-3 w-10 bg-slate-100 dark:bg-slate-800/60 rounded ml-auto" />
                  </td>
                  <td className="px-3 align-middle text-right">
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto mb-1.5" />
                    <div className="h-3 w-14 bg-slate-100 dark:bg-slate-800/60 rounded ml-auto" />
                  </td>
                  <td className="px-3 align-middle">
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="pl-3 pr-6 align-middle text-right">
                    <div className="h-4 w-14 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 px-6 text-center">
                  <div className="max-w-lg mx-auto flex flex-col items-center">
                    {/* Visual Icon Badge */}
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-800/60 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-4 shadow-xs">
                      {filters.searchQuery ? <SearchX className="w-7 h-7" /> : <FilterX className="w-7 h-7" />}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                      No Leads Found For Your Filter Criteria
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md">
                      We searched through our database, but no leads currently match the specific combination of criteria you selected.
                    </p>

                    {/* Active Criteria Chips */}
                    {activeFilterTags.length > 0 && (
                      <div className="mt-4 w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-left">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                          Filters you are looking for ({activeFilterTags.length}):
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                          {activeFilterTags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => dispatch(resetAllFilters())}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors shadow-xs cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((lead) => {
                const isSelected = selectedLeadIds.includes(lead.id);
                const isAlreadyInList = Boolean(targetListForAdding) && targetListLeadIds.has(String(lead.id));
                const isChecked = !isAlreadyInList && isSelected;
                const isRevealed = Boolean(
                  lead.isCustom ||
                  String(lead.id || '').startsWith('custom_') ||
                  lead.source === 'manual_custom_lead' ||
                  lead.isRevealed ||
                  revealedLeadIds.includes(lead.id) ||
                  filters.onlyRevealed
                );

                return (
                  <tr
                    key={lead.id}
                    onClick={() => dispatch(setActiveLead(lead))}
                    className={`group transition-colors ${
                      isAlreadyInList
                        ? 'opacity-50 bg-slate-50/50 dark:bg-slate-800/30 cursor-not-allowed hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                        : isChecked
                        ? 'bg-orange-50/50 dark:bg-orange-950/30 hover:bg-orange-50 dark:hover:bg-orange-950/50 cursor-pointer'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/60 cursor-pointer'
                    }`}
                    title={isAlreadyInList ? `Already added to target list "${targetListForAdding?.name}"` : undefined}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-2.5 pl-6 pr-3 align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        disabled={isAlreadyInList}
                        checked={isChecked}
                        onChange={() => !isAlreadyInList && dispatch(toggleSelectLead(lead.id))}
                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-orange-600 focus:ring-orange-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                        title={isAlreadyInList ? `Already added to target list "${targetListForAdding?.name}"` : 'Select lead'}
                      />
                    </td>

                    {/* Company & Unboxed Metadata */}
                    <td className="py-2.5 px-3 align-middle">
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                          {lead.companyName}
                        </span>
                        {Boolean(lead.isCustom || String(lead.id || '').startsWith('custom_') || lead.source === 'manual_custom_lead') && (
                          <span
                            title="Custom Lead created by your profile"
                            className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/80 shrink-0 inline-flex items-center gap-1 shadow-2xs"
                          >
                            <Layers className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                            <span>Custom Lead</span>
                          </span>
                        )}
                        <a
                          href={`https://${lead.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0 inline-flex items-center"
                          title={`Open ${lead.domain}`}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="truncate max-w-[180px]">{lead.industry}</span>
                        <span aria-hidden="true">·</span>
                        <span>{lead.fundingStage}</span>
                      </div>
                    </td>

                    {/* Executive Decision Maker */}
                    <td className="py-2.5 px-3 align-middle">
                      <div className="font-medium text-slate-900 dark:text-white">{lead.contactName}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="truncate max-w-[190px]">{lead.contactTitle}</span>
                        <span aria-hidden="true">·</span>
                        <span>{lead.seniority}</span>
                      </div>
                    </td>

                    {/* Direct Contact & Verification */}
                    <td className="py-2.5 px-3 align-middle w-[270px] min-w-[270px]" onClick={(e) => e.stopPropagation()}>
                      {isRevealed ? (
                        <div className="space-y-0.5 max-w-[270px]">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                            <span className="truncate">{lead.contactEmail}</span>
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
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                            <span>{lead.contactPhone}</span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                lead.verificationStatus === 'Verified'
                                  ? 'text-emerald-700 dark:text-emerald-400 font-sans font-medium'
                                  : lead.verificationStatus === 'Catch-All'
                                  ? 'text-amber-700 dark:text-amber-400 font-sans font-medium'
                                  : 'text-slate-500 dark:text-slate-400 font-sans'
                              }
                            >
                              {lead.verificationStatus}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-[1fr_72px] items-center gap-3 w-full">
                          <div className="min-w-0 overflow-hidden">
                            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate" title={maskEmail(lead.contactEmail)}>
                              {maskEmail(lead.contactEmail)}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono tabular-nums truncate">
                              {maskPhone(lead.contactPhone)} · {lead.verificationStatus}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleReveal(e, lead.id)}
                            className="inline-flex items-center justify-center gap-1 w-[72px] py-1 text-[11px] font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 hover:bg-orange-100 dark:hover:bg-orange-900/60 border border-orange-200/60 dark:border-orange-800/60 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer text-center justify-self-end"
                          >
                            <Eye className="w-3 h-3" />
                            Reveal
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Employees (Tabular Numerals) */}
                    <td className="py-2.5 px-3 align-middle text-right font-mono tabular-nums">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {(lead.employeeCount || 120).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">{lead.employeeRange}</div>
                    </td>

                    {/* Annual Revenue (Tabular Numerals) */}
                    <td className="py-2.5 px-3 align-middle text-right font-mono tabular-nums">
                      <div className="font-medium text-slate-900 dark:text-white">{lead.revenueRange}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        ${((lead.annualRevenueUsd || 15000000) / 1000000).toFixed(1)}M est.
                      </div>
                    </td>

                    {/* Location (Zero-Pill Unboxed Text) */}
                    <td className="py-2.5 px-3 align-middle">
                      <div className="text-slate-800 dark:text-slate-200">
                        {lead.city ? `${lead.city} · ${lead.country}` : lead.country}
                      </div>
                    </td>

                    {/* Buying Intent Score */}
                    <td className="py-2.5 pl-3 pr-6 align-middle text-right font-mono tabular-nums">
                      <div className="flex items-center justify-end gap-2">
                        {isAlreadyInList ? (
                          <span
                            className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700/60"
                            title={`Already in target list "${targetListForAdding?.name}"`}
                          >
                            In List
                          </span>
                        ) : (
                          <div>
                            <div
                              className={`font-semibold ${
                                lead.buyingIntentScore >= 80
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : lead.buyingIntentScore >= 65
                                  ? 'text-orange-600 dark:text-orange-400'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {lead.buyingIntentScore} / 100
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">
                              {lead.buyingIntentScore >= 80
                                ? 'High Intent'
                                : lead.buyingIntentScore >= 65
                                ? 'Active Research'
                                : 'Baseline'}
                            </div>
                          </div>
                        )}
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({
                                id: lead.id,
                                name: lead.companyName,
                                isCore: true
                              });
                            }}
                            title="Delete core database lead (Superadmin Only)"
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Bar (Fully Responsive on All Screen Sizes) */}
      <div className="shrink-0 px-3 sm:px-6 py-2.5 sm:py-3 pb-20 sm:pb-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 text-xs text-slate-600 dark:text-slate-400 transition-colors">
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
          <span>
            Showing page{' '}
            <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
              {pagination.page}
            </strong>{' '}
            {isSuperAdmin ? (
              <>
                of{' '}
                <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                  {pagination.totalPages.toLocaleString()}
                </strong>{' '}
                <span className="hidden md:inline">({(pagination.estimatedGlobalMatches || 0).toLocaleString()} matches)</span>
              </>
            ) : null}
          </span>
          <span>·</span>
          <label className="inline-flex items-center gap-1.5 shrink-0">
            <span>Rows:</span>
            <select
              value={filters.pageSize}
              onChange={(e) => dispatch(setPageSize(Number(e.target.value)))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-orange-600 cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>

        {/* Numbered Pagination & Controls (Never overflows screen) */}
        <div className="flex items-center justify-center sm:justify-end gap-1 max-w-full overflow-x-auto py-0.5">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => dispatch(setPage(pagination.page - 1))}
            className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer whitespace-nowrap transition-colors shrink-0"
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {(() => {
            const current = pagination.page;
            const total = pagination.totalPages;
            const pages = [];

            if (isSuperAdmin) {
              // Superadmin sees full pagination with first page, surrounding pages, and last page jumps
              if (total <= 7) {
                for (let i = 1; i <= total; i++) pages.push(i);
              } else {
                pages.push(1);
                if (current > 3) pages.push('...');
                const start = Math.max(2, current - 1);
                const end = Math.min(total - 1, current + 1);
                for (let i = start; i <= end; i++) pages.push(i);
                if (current < total - 2) pages.push('....');
                pages.push(total);
              }
            } else {
              // Standard client users & all other profiles:
              // 1. FIRST PAGINATION (Page 1) MUST ALWAYS BE VISIBLE TO EVERYONE.
              // 2. LAST PAGINATIONS (e.g. 414,537 or the end of database) ARE NEVER SHOWN to non-superadmin.
              const maxBrowsePage = Math.min(total, 100);
              const safeCurrent = Math.min(Math.max(1, current), maxBrowsePage);

              if (total <= 5) {
                for (let i = 1; i <= total; i++) pages.push(i);
              } else if (safeCurrent <= 4) {
                // Show first pages: 1, 2, 3, 4, 5
                const count = Math.min(maxBrowsePage, 5);
                for (let i = 1; i <= count; i++) pages.push(i);
                if (maxBrowsePage > 5) pages.push('...');
              } else {
                // When navigating deeper (e.g. page 5, 6...):
                // Always keep Page 1 visible first!
                pages.push(1);
                pages.push('...');
                const start = Math.max(2, safeCurrent - 1);
                const end = Math.min(maxBrowsePage, safeCurrent + 2);
                for (let i = start; i <= end; i++) pages.push(i);
                if (end < maxBrowsePage) pages.push('....');
              }
            }

            return pages.map((p, idx) => {
              if (typeof p === 'string') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="min-w-5 sm:min-w-6 h-7 px-0.5 sm:px-1 flex items-center justify-center text-xs text-slate-400 select-none font-mono shrink-0"
                  >
                    ...
                  </span>
                );
              }

              const isActive = p === current;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => dispatch(setPage(p))}
                  className={`min-w-6 sm:min-w-7 h-7 px-1 sm:px-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer flex items-center justify-center whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-xs font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.toLocaleString()}
                </button>
              );
            });
          })()}

          <button
            type="button"
            disabled={
              isSuperAdmin
                ? pagination.page >= pagination.totalPages
                : (pagination.page >= pagination.totalPages || pagination.page >= 100)
            }
            onClick={() => dispatch(setPage(pagination.page + 1))}
            className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer whitespace-nowrap transition-colors shrink-0"
            title="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Superadmin Core Lead Deletion */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDeleteLead}
        loading={isDeleting}
        title={deleteTarget?.isCore ? "Delete Core Database Lead?" : "Delete Custom Lead?"}
        message={
          deleteTarget?.isCore
            ? "Are you sure you want to permanently delete this lead from the core database? Because you are Superadmin, this will erase the record from the main database (Database 2) and automatically remove it across all accounts on the entire platform."
            : "Are you sure you want to permanently delete this custom lead from your private workspace?"
        }
        itemName={deleteTarget?.name}
        confirmText={deleteTarget?.isCore ? "Yes, Permanently Delete from Database" : "Yes, Delete Lead"}
        cancelText="Cancel"
        dangerNote={
          deleteTarget?.isCore
            ? "This lead will be permanently deleted from the database. All accounts on LeadsArrow will no longer see this lead."
            : "This lead will be permanently erased from your private workspace."
        }
      />
    </div>
  );
}
