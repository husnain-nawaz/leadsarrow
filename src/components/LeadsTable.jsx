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
  Sparkles
} from 'lucide-react';
import {
  toggleSelectLead,
  selectAllCurrentPageLeads,
  revealLeadContact,
  setActiveLead,
  deleteCustomLead
} from '../store/leadsSlice.js';
import {
  setSortConfig,
  setPage,
  setPageSize,
  resetAllFilters
} from '../store/filtersSlice.js';
import { decrementExportCredits, openUpgradeModal } from '../store/authSlice.js';

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
  const { sortBy, sortOrder } = useSelector((state) => state.filters);
  const [copiedKey, setCopiedKey] = useState(null);

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
    const isUnlimited = user?.planId === 'unlimited' || user?.plan?.toLowerCase().includes('unlimited');
    if (!isUnlimited && (user?.creditsRemaining ?? 100) <= 0) {
      dispatch(openUpgradeModal('starter'));
      return;
    }
    dispatch(revealLeadContact(leadId));
    dispatch(decrementExportCredits(1));
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

  const isFirstLoad = loading && items.length === 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden relative">
      {/* Subtle top loading progress bar when switching pages smoothly */}
      {loading && items.length > 0 && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-100 z-30 overflow-hidden">
          <div className="h-full bg-orange-600 animate-pulse w-full" />
        </div>
      )}

      {/* High-Density Enterprise Data Grid */}
      <div className="overflow-auto flex-1 min-h-0">
        <table className={`w-full text-left border-collapse transition-opacity duration-150 ${loading && items.length > 0 ? 'opacity-60' : 'opacity-100'}`}>
          <thead className="sticky top-0 z-10 bg-slate-50 shadow-xs">
            <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-600 bg-slate-50">
              <th className="py-2.5 pl-6 pr-3 w-10 bg-slate-50">
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
              <th className="py-2.5 px-3 bg-slate-50 w-[260px] min-w-[260px]">Direct Contact & Verification</th>
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
              <th className="py-2.5 px-3 bg-slate-50">HQ Location & Tech</th>
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
            {isFirstLoad ? (
              Array.from({ length: 12 }).map((_, idx) => (
                <tr key={idx} className="h-11 animate-pulse">
                  <td className="pl-6 pr-3">
                    <div className="w-3.5 h-3.5 bg-slate-200 rounded" />
                  </td>
                  <td className="px-3">
                    <div className="h-3.5 w-36 bg-slate-200 rounded mb-1" />
                    <div className="h-2.5 w-48 bg-slate-100 rounded" />
                  </td>
                  <td className="px-3">
                    <div className="h-3.5 w-32 bg-slate-200 rounded mb-1" />
                    <div className="h-2.5 w-40 bg-slate-100 rounded" />
                  </td>
                  <td className="px-3">
                    <div className="h-3.5 w-44 bg-slate-200 rounded mb-1" />
                    <div className="h-2.5 w-28 bg-slate-100 rounded" />
                  </td>
                  <td className="px-3 text-right">
                    <div className="h-3.5 w-16 bg-slate-200 rounded ml-auto" />
                  </td>
                  <td className="px-3 text-right">
                    <div className="h-3.5 w-20 bg-slate-200 rounded ml-auto" />
                  </td>
                  <td className="px-3">
                    <div className="h-3.5 w-36 bg-slate-200 rounded" />
                  </td>
                  <td className="pl-3 pr-6 text-right">
                    <div className="h-3.5 w-12 bg-slate-200 rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="text-base font-semibold text-slate-900 font-display">
                      No matching B2B companies found
                    </div>
                    <p className="text-xs text-slate-500">
                      Your current filter combination returned zero records. Try broadening your
                      headcount, revenue, or technology stack criteria.
                    </p>
                    <button
                      type="button"
                      onClick={() => dispatch(resetAllFilters())}
                      className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors cursor-pointer"
                    >
                      Reset All Filters
                    </button>
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
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                          {lead.companyName}
                        </span>
                        <a
                          href={`https://${lead.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-slate-700"
                          title={`Open ${lead.domain}`}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {isNewLead(lead) && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>NEW</span>
                          </span>
                        )}
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
                    <td className="py-2.5 px-3 align-middle w-[260px] min-w-[260px]" onClick={(e) => e.stopPropagation()}>
                      {isRevealed ? (
                        <div className="space-y-0.5 max-w-[260px]">
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
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-[11px] text-slate-500 truncate">
                              {maskEmail(lead.contactEmail)}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono tabular-nums truncate">
                              {maskPhone(lead.contactPhone)} · {lead.verificationStatus}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleReveal(e, lead.id)}
                            className="inline-flex items-center justify-center gap-1 w-[72px] py-1 text-[11px] font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer text-center"
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

                    {/* Location & Tech Stack (Zero-Pill Unboxed Text) */}
                    <td className="py-2.5 px-3 align-middle">
                      <div className="text-slate-800">
                        {lead.city} · {lead.country}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[210px] mt-0.5">
                        {(lead.techStack || []).join(' · ')}
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
            of{' '}
            <strong className="font-mono tabular-nums text-slate-900">
              {pagination.totalPages}
            </strong>{' '}
            ({(pagination.estimatedGlobalMatches || 0).toLocaleString()} total matches)
          </span>
          <span>·</span>
          <label className="inline-flex items-center gap-1.5">
            <span>Rows:</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => dispatch(setPageSize(Number(e.target.value)))}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:border-orange-600"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
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
            const pages = [];

            if (total <= 7) {
              for (let i = 1; i <= total; i++) pages.push(i);
            } else {
              // Always show first page
              pages.push(1);

              if (current > 3) {
                pages.push('...');
              }

              // Range around current page
              const start = Math.max(2, current - 1);
              const end = Math.min(total - 1, current + 1);

              for (let i = start; i <= end; i++) {
                pages.push(i);
              }

              if (current < total - 2) {
                pages.push('....');
              }

              // Always show last page
              pages.push(total);
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
