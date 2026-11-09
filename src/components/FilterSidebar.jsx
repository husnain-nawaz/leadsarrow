import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';
import {
  setSearchQuery,
  toggleArrayFilter,
  setMinIntentScore,
  setHasVerifiedEmail,
  setHasDirectPhone,
  resetAllFilters,
  setMobileFilterOpen
} from '../store/filtersSlice.js';

const TAXONOMY_SECTIONS = [
  {
    id: 'industries',
    label: 'Industry Sector',
    options: [
      'Business Services',
      'Real Estate & Construction',
      'Retail',
      'Manufacturing',
      'Media & Entertainment',
      'Software & Internet',
      'Healthcare',
      'Financial Services',
      'Non-Profit',
      'Computers & Electronics',
      'Travel, Recreation, and Leisure',
      'Education',
      'Telecommunications',
      'Consumer Services',
      'Transportation & Storage',
      'Wholesale & Distribution',
      'Enterprise Software & SaaS',
      'Energy & Utilities',
      'Government',
      'Agriculture & Mining'
    ]
  },
  {
    id: 'employeeRanges',
    label: 'Company Headcount',
    options: [
      '0 - 25',
      '25 - 100',
      '100 - 250',
      '250 - 1000',
      '1K - 10K',
      '10K - 50K',
      '50K - 100K',
      '> 100K'
    ]
  },
  {
    id: 'revenueRanges',
    label: 'Annual Revenue (USD)',
    options: [
      '$0 - $1M',
      '$1 - $10M',
      '$10 - $50M',
      '$50 - $100M',
      '$100 - $250M',
      '$250 - $500M',
      '$500M - $1B',
      '> $1B'
    ]
  },
  {
    id: 'countries',
    label: 'HQ Country & Region',
    options: [
      'USA',
      'Canada'
    ]
  },
  {
    id: 'seniorities',
    label: 'Decision-Maker Seniority',
    options: [
      'C-Level / Founder',
      'Director',
      'Senior Manager',
      'VP'
    ]
  },
  {
    id: 'departments',
    label: 'Job Department',
    options: [
      'Executive Leadership',
      'Marketing & Growth',
      'Sales & Revenue',
      'Operations & Supply Chain',
      'Engineering & Technical',
      'Finance & Procurement',
      'Information Security',
      'Product Management'
    ]
  },
  {
    id: 'fundingStages',
    label: 'Funding Stage',
    options: [
      'Series B',
      'Public / IPO',
      'Series C+'
    ]
  },
  {
    id: 'verificationStatuses',
    label: 'Email Deliverability Status',
    options: ['Verified']
  }
];

export default function FilterSidebar() {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.filters);
  const { facets, metrics } = useSelector((state) => state.leads);
  const [searchInput, setSearchInput] = useState(filters.searchQuery || '');

  // Keep local search input synchronized if reset from outside
  useEffect(() => {
    setSearchInput(filters.searchQuery || '');
  }, [filters.searchQuery]);

  // Debounce search query dispatch by 300ms to avoid firing un-debounced keystroke race conditions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.searchQuery) {
        dispatch(setSearchQuery(searchInput));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters.searchQuery, dispatch]);

  const [expandedSections, setExpandedSections] = useState({
    industries: true,
    employeeRanges: true,
    revenueRanges: true,
    countries: true,
    seniorities: true,
    departments: false,
    fundingStages: false,
    verificationStatuses: false
  });

  const [facetSearch, setFacetSearch] = useState({});

  const toggleSection = (id) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 select-none">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-700" />
          <span className="text-sm font-semibold text-slate-900 font-display">
            Database Filters
          </span>
          {metrics.activeFiltersCount > 0 && (
            <span className="text-xs font-mono tabular-nums text-orange-600 font-semibold">
              ({metrics.activeFiltersCount})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => dispatch(resetAllFilters())}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          {filters.isMobileFilterOpen && (
            <button
              type="button"
              onClick={() => dispatch(setMobileFilterOpen(false))}
              className="lg:hidden p-1 text-slate-500 hover:text-slate-900"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Global Keyword Search Input */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <label className="block text-xs font-semibold text-slate-700">
          Company, Executive, or Domain
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="e.g. Vanguard, CTO, .io, Munich..."
            className="w-full pl-9 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-orange-600 transition-colors"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                dispatch(setSearchQuery(''));
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* High-Intent & Deliverability Toggles */}
        <div className="pt-1 space-y-2">
          <label className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer">
            <span>Verified Work Email Only</span>
            <input
              type="checkbox"
              checked={filters.hasVerifiedEmail}
              onChange={(e) => dispatch(setHasVerifiedEmail(e.target.checked))}
              className="w-3.5 h-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer">
            <span>Direct Dial Phone Available</span>
            <input
              type="checkbox"
              checked={filters.hasDirectPhone}
              onChange={(e) => dispatch(setHasDirectPhone(e.target.checked))}
              className="w-3.5 h-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
            />
          </label>
        </div>

        {/* Buying Intent Slider */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-700">Min Buying Intent Score</span>
            <span className="font-mono tabular-nums font-semibold text-orange-600">
              {filters.minIntentScore > 0 ? `≥ ${filters.minIntentScore}` : 'Any (70+)'}
            </span>
          </div>
          <input
            type="range"
            min="70"
            max="95"
            step="5"
            value={filters.minIntentScore || 70}
            onChange={(e) => {
              const val = Number(e.target.value);
              dispatch(setMinIntentScore(val <= 70 ? 0 : val));
            }}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
          />
          <div className="flex justify-between text-[10px] font-mono tabular-nums text-slate-400 mt-1">
            <span>Any (70)</span>
            <span>75</span>
            <span>80</span>
            <span>85</span>
            <span>90</span>
            <span>95+</span>
          </div>
        </div>
      </div>

      {/* Scrollable Accordion Filter Facets */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
        {TAXONOMY_SECTIONS.map((section) => {
          const isOpen = Boolean(expandedSections[section.id]);
          const selectedValues = filters[section.id] || [];
          const sectionFacets = facets[section.id] || {};
          const localQuery = (facetSearch[section.id] || '').toLowerCase();

          const visibleOptions = section.options.filter((opt) =>
            opt.toLowerCase().includes(localQuery)
          );

          return (
            <div key={section.id} className="py-2.5 px-4">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between py-1 text-left cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950 truncate">
                    {section.label}
                  </span>
                </div>
                {selectedValues.length > 0 && (
                  <span className="text-xs font-mono tabular-nums font-semibold text-orange-600">
                    {selectedValues.length}
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="mt-2 space-y-1.5 pl-1">
                  {section.options.length > 7 && (
                    <input
                      type="text"
                      value={facetSearch[section.id] || ''}
                      onChange={(e) =>
                        setFacetSearch((prev) => ({
                          ...prev,
                          [section.id]: e.target.value
                        }))
                      }
                      placeholder={`Filter ${section.label.toLowerCase()}...`}
                      className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-600 mb-1.5"
                    />
                  )}

                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {visibleOptions.map((option) => {
                      const isChecked = selectedValues.includes(option);
                      const count = sectionFacets[option] || 0;

                      return (
                        <label
                          key={option}
                          className="flex items-center justify-between gap-2 py-1 text-xs text-slate-700 hover:text-slate-950 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                dispatch(
                                  toggleArrayFilter({
                                    category: section.id,
                                    value: option
                                  })
                                )
                              }
                              className="w-3.5 h-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 shrink-0"
                            />
                            <span
                              className={`truncate ${
                                isChecked ? 'font-semibold text-slate-900' : ''
                              }`}
                            >
                              {option}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                            {count.toLocaleString()}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Filter Sidebar (280px width) */}
      <aside className="hidden lg:block w-[280px] shrink-0 h-screen sticky top-0 self-start">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Filter Drawer */}
      {filters.isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => dispatch(setMobileFilterOpen(false))}
          />
          <div className="relative w-80 max-w-[85vw] h-full bg-white z-10 shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
