import React, { useState } from 'react';
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
  FilterX
} from 'lucide-react';
import {
  toggleSelectLead,
  selectAllCurrentPageLeads,
  revealLeadContact,
  performRevealLead,
  setActiveLead,
  deleteCustomLead
} from '../store/leadsSlice.js';
import {
  setSortConfig,
  setPage,
  setPageSize,
  resetAllFilters
} from '../store/filtersSlice.js';
import { decrementExportCredits, consumeCredits, openUpgradeModal } from '../store/authSlice.js';

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
  const [copiedKey, setCopiedKey] = useState(null);

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
  if (filters.onlyCustom) activeFilterTags.push('New Leads Only');

  const pageIds = items.map((l) => l.id);
  const allCurrentSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedLeadIds.includes(id));

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
    <div className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden relative">
      {/* High-visibility top loading progress bar when retrieving/filtering data */}
      {loading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-orange-100 z-30 overflow-hidden shadow-xs">
          <div className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 animate-indeterminate w-1/2" />
        </div>
      )}

      {/* High-Density Enterprise Data Grid */}
      <div className="overflow-auto flex-1 min-h-0">
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
          <thead className="sticky top-0 z-10 bg-slate-50 shadow-xs">
            <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-600 bg-slate-50">
              <th className="py-2.5 pl-6 pr-3 bg-slate-50">
                <input
                  type="checkbox"
                  checked={allCurrentSelected}
                  onChange={() => dispatch(selectAllCurrentPageLeads(pageIds))}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => handleSort('companyName')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer whitespace-nowrap"
                >
                  <span>Company & Sector</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-2.5 px-3 bg-slate-50">Decision Maker</th>
              <th className="py-2.5 px-3 bg-slate-50">Direct Contact & Verification</th>
              <th className="py-2.5 px-3 text-right bg-slate-50">
                <button
                  type="button"
                  onClick={() => handleSort('employeeCount')}
                  className="inline-flex items-center justify-end gap-1 hover:text-slate-900 cursor-pointer whitespace-nowrap ml-auto"
                >
                  <span>Employees</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-right bg-slate-50">
                <button
                  type="button"
                  onClick={() => handleSort('annualRevenueUsd')}
                  className="inline-flex items-center justify-end gap-1 hover:text-slate-900 cursor-pointer whitespace-nowrap ml-auto"
                >
                  <span>Annual Revenue</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-2.5 px-3 bg-slate-50">HQ Location</th>
              <th className="py-2.5 pl-3 pr-6 text-right bg-slate-50">
                <button
                  type="button"
                  onClick={() => handleSort('buyingIntentScore')}
                  className="inline-flex items-center justify-end gap-1 hover:text-slate-900 cursor-pointer whitespace-nowrap ml-auto"
                >
                  <span>Intent Score</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 text-xs">
            {showSkeleton ? (
              Array.from({ length: filters.pageSize || 25 }).map((_, idx) => (
                <tr key={idx} className="h-[54px] animate-pulse">
                  <td className="pl-6 pr-3 align-middle">
                    <div className="w-3.5 h-3.5 bg-slate-200 rounded" />
                  </td>
                  <td className="px-3 align-middle">
                    <div className="h-4 w-44 bg-slate-200 rounded mb-1.5" />
                    <div className="h-3 w-32 bg-slate-100 rounded" />
                  </td>
                  <td className="px-3 align-middle">
                    <div className="h-4 w-36 bg-slate-200 rounded mb-1.5" />
                    <div className="h-3 w-28 bg-slate-100 rounded" />
                  </td>
                  <td className="px-3 align-middle">
                    <div className="h-4 w-48 bg-slate-200 rounded mb-1.5" />
                    <div className="h-3 w-36 bg-slate-100 rounded" />
                  </td>
                  <td className="px-3 align-middle text-right">
                    <div className="h-4 w-14 bg-slate-200 rounded ml-auto mb-1.5" />
                    <div className="h-3 w-10 bg-slate-100 rounded ml-auto" />
                  </td>
                  <td className="px-3 align-middle text-right">
                    <div className="h-4 w-16 bg-slate-200 rounded ml-auto mb-1.5" />
                    <div className="h-3 w-14 bg-slate-100 rounded ml-auto" />
                  </td>
                  <td className="px-3 align-middle">
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                  </td>
                  <td className="pl-3 pr-6 align-middle text-right">
                    <div className="h-4 w-14 bg-slate-200 rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 px-6 text-center">
                  <div className="max-w-lg mx-auto flex flex-col items-center">
                    {/* Visual Icon Badge */}
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-4 shadow-xs">
                      {filters.searchQuery ? <SearchX className="w-7 h-7" /> : <FilterX className="w-7 h-7" />}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 font-display">
                      No Leads Found For Your Filter Criteria
                    </h3>

                    <p className="text-xs text-slate-500 mt-1.5 max-w-md">
                      We searched through our database, but no leads currently match the specific combination of criteria you selected.
                    </p>

                    {/* Active Criteria Chips */}
                    {activeFilterTags.length > 0 && (
                      <div className="mt-4 w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Filters you are looking for ({activeFilterTags.length}):
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                          {activeFilterTags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
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
                const isRevealed = revealedLeadIds.includes(lead.id);

                return (
                  <tr
                    key={lead.id}
                    onClick={() => dispatch(setActiveLead(lead))}
                    className={`group transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-orange-50/50 hover:bg-orange-50'
                        : isNewLead(lead)
                        ? 'bg-emerald-50/20 hover:bg-emerald-50/40 border-l-2 border-emerald-500'
                        : 'hover:bg-slate-50'
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
                        onChange={() => dispatch(toggleSelectLead(lead.id))}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                    </td>

                    {/* Company & Unboxed Metadata */}
                    <td className="py-2.5 px-3 align-middle">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                          {lead.companyName}
                        </span>
                        <a
                          href={`https://${lead.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-slate-700 shrink-0 inline-flex items-center"
                          title={`Open ${lead.domain}`}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span className="truncate max-w-[180px]">{lead.industry}</span>
                        <span aria-hidden="true">·</span>
                        <span>{lead.fundingStage}</span>
                      </div>
                    </td>

                    {/* Executive Decision Maker */}
                    <td className="py-2.5 px-3 align-middle">
                      <div className="font-medium text-slate-900">{lead.contactName}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span className="truncate max-w-[190px]">{lead.contactTitle}</span>
                        <span aria-hidden="true">·</span>
                        <span>{lead.seniority}</span>
                      </div>
                    </td>

                    {/* Direct Contact & Verification */}
                    <td className="py-2.5 px-3 align-middle w-[270px] min-w-[270px]" onClick={(e) => e.stopPropagation()}>
                      {isRevealed ? (
                        <div className="space-y-0.5 max-w-[270px]">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800">
                            <span className="truncate">{lead.contactEmail}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(e, lead.contactEmail, `${lead.id}_email`)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
                              title="Copy email"
                            >
                              {copiedKey === `${lead.id}_email` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono tabular-nums">
                            <span>{lead.contactPhone}</span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                lead.verificationStatus === 'Verified'
                                  ? 'text-emerald-700 font-sans font-medium'
                                  : lead.verificationStatus === 'Catch-All'
                                  ? 'text-amber-700 font-sans font-medium'
                                  : 'text-slate-500 font-sans'
                              }
                            >
                              {lead.verificationStatus}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-[1fr_72px] items-center gap-3 w-full">
                          <div className="min-w-0 overflow-hidden">
                            <div className="font-mono text-[11px] text-slate-500 truncate" title={maskEmail(lead.contactEmail)}>
                              {maskEmail(lead.contactEmail)}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono tabular-nums truncate">
                              {maskPhone(lead.contactPhone)} · {lead.verificationStatus}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleReveal(e, lead.id)}
                            className="inline-flex items-center justify-center gap-1 w-[72px] py-1 text-[11px] font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer text-center justify-self-end"
                          >
                            <Eye className="w-3 h-3" />
                            Reveal
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Employees (Tabular Numerals) */}
                    <td className="py-2.5 px-3 align-middle text-right font-mono tabular-nums">
                      <div className="font-medium text-slate-900">
                        {(lead.employeeCount || 120).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400">{lead.employeeRange}</div>
                    </td>

                    {/* Annual Revenue (Tabular Numerals) */}
                    <td className="py-2.5 px-3 align-middle text-right font-mono tabular-nums">
                      <div className="font-medium text-slate-900">{lead.revenueRange}</div>
                      <div className="text-[11px] text-slate-400">
                        ${((lead.annualRevenueUsd || 15000000) / 1000000).toFixed(1)}M est.
                      </div>
                    </td>

                    {/* Location (Zero-Pill Unboxed Text) */}
                    <td className="py-2.5 px-3 align-middle">
                      <div className="text-slate-800">
                        {lead.city ? `${lead.city} · ${lead.country}` : lead.country}
                      </div>
                    </td>

                    {/* Buying Intent Score */}
                    <td className="py-2.5 pl-3 pr-6 align-middle text-right font-mono tabular-nums">
                      <div className="flex items-center justify-end gap-2">
                        <div>
                          <div
                            className={`font-semibold ${
                              lead.buyingIntentScore >= 80
                                ? 'text-emerald-700'
                                : lead.buyingIntentScore >= 65
                                ? 'text-orange-600'
                                : 'text-slate-700'
                            }`}
                          >
                            {lead.buyingIntentScore} / 100
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans">
                            {lead.buyingIntentScore >= 80
                              ? 'High Intent'
                              : lead.buyingIntentScore >= 65
                              ? 'Active Research'
                              : 'Baseline'}
                          </div>
                        </div>
                        {lead.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              dispatch(deleteCustomLead(lead.id));
                            }}
                            title="Delete custom lead"
                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
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

      {/* Pagination Footer Bar */}
      <div className="shrink-0 px-6 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <span>
            Showing page{' '}
            <strong className="font-mono tabular-nums text-slate-900">
              {pagination.page}
            </strong>{' '}
            {user?.role === 'superadmin' ? (
              <>
                of{' '}
                <strong className="font-mono tabular-nums text-slate-900">
                  {pagination.totalPages}
                </strong>{' '}
                ({(pagination.estimatedGlobalMatches || 0).toLocaleString()} total matches)
              </>
            ) : null}
          </span>
          <span>·</span>
          <label className="inline-flex items-center gap-1.5">
            <span>Rows:</span>
            <select
              value={filters.pageSize}
              onChange={(e) => dispatch(setPageSize(Number(e.target.value)))}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:border-orange-600"
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
            disabled={pagination.page <= 1}
            onClick={() => dispatch(setPage(pagination.page - 1))}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer whitespace-nowrap transition-colors mr-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          {(() => {
            const current = pagination.page;
            const total = pagination.totalPages;
            const isSuperAdmin = user?.role === 'superadmin';
            const pages = [];

            if (isSuperAdmin) {
              // Superadmin sees full pagination with last page jumps
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
              // Standard client users & customers: progressive window without jumping to the end
              const start = Math.max(1, current - 2);
              const end = Math.min(total, current + 2);
              for (let i = start; i <= end; i++) {
                pages.push(i);
              }
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

              const isActive = p === current;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => dispatch(setPage(p))}
                  className={`min-w-7 h-7 px-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer flex items-center justify-center whitespace-nowrap ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-xs font-semibold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {p.toLocaleString()}
                </button>
              );
            });
          })()}

          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => dispatch(setPage(pagination.page + 1))}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer whitespace-nowrap transition-colors ml-1"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
