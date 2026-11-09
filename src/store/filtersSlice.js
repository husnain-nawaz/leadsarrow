import { createSlice } from '@reduxjs/toolkit';

const STORAGE_FILTER_KEY = 'leadsarrow_user_filter_state';

// Load persisted filters and page state from localStorage across page refreshes
function loadPersistedState() {
  const fallback = {
    searchQuery: '',
    industries: [],
    employeeRanges: [],
    revenueRanges: [],
    countries: [],
    seniorities: [],
    departments: [],
    verificationStatuses: [],
    fundingStages: [],
    techStack: [],
    minIntentScore: 0,
    hasVerifiedEmail: false,
    hasDirectPhone: false,
    onlyCustom: false,
    savedListLeadIds: null,
    activePresetName: null,
    sortBy: 'buyingIntentScore',
    sortOrder: 'desc',
    page: 1,
    pageSize: 25,
    isMobileFilterOpen: false
  };

  try {
    const raw = localStorage.getItem(STORAGE_FILTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...fallback,
        ...parsed,
        page: Math.max(1, Number(parsed.page) || 1),
        pageSize: [25, 50, 100].includes(Number(parsed.pageSize)) ? Number(parsed.pageSize) : 25,
        isMobileFilterOpen: false
      };
    }
  } catch (e) {
    console.warn('Could not parse persisted filters from localStorage', e);
  }

  // Backwards compatibility with previous active saved list storage
  try {
    const cached = localStorage.getItem('leadsarrow_active_saved_list');
    if (cached) {
      const parsedList = JSON.parse(cached);
      if (parsedList?.leadIds) {
        fallback.savedListLeadIds = parsedList.leadIds;
        fallback.activePresetName = parsedList.name || null;
      }
    }
  } catch (e) {}

  return fallback;
}

function persistCurrentFilterState(state) {
  try {
    const stateToSave = {
      searchQuery: state.searchQuery,
      industries: state.industries,
      employeeRanges: state.employeeRanges,
      revenueRanges: state.revenueRanges,
      countries: state.countries,
      seniorities: state.seniorities,
      departments: state.departments,
      verificationStatuses: state.verificationStatuses,
      fundingStages: state.fundingStages,
      techStack: state.techStack,
      minIntentScore: state.minIntentScore,
      hasVerifiedEmail: state.hasVerifiedEmail,
      hasDirectPhone: state.hasDirectPhone,
      onlyCustom: state.onlyCustom,
      savedListLeadIds: state.savedListLeadIds,
      activePresetName: state.activePresetName,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
      page: state.page,
      pageSize: state.pageSize
    };
    localStorage.setItem(STORAGE_FILTER_KEY, JSON.stringify(stateToSave));
  } catch (e) {
    console.warn('Could not save filters to localStorage', e);
  }
}

const initialState = loadPersistedState();

const defaultResetState = {
  searchQuery: '',
  industries: [],
  employeeRanges: [],
  revenueRanges: [],
  countries: [],
  seniorities: [],
  departments: [],
  verificationStatuses: [],
  fundingStages: [],
  techStack: [],
  minIntentScore: 0,
  hasVerifiedEmail: false,
  hasDirectPhone: false,
  onlyCustom: false,
  savedListLeadIds: null,
  activePresetName: null,
  sortBy: 'buyingIntentScore',
  sortOrder: 'desc',
  page: 1,
  pageSize: 25,
  isMobileFilterOpen: false
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
      state.page = 1;
      state.activePresetName = null;
      persistCurrentFilterState(state);
    },
    toggleArrayFilter(state, action) {
      const { category, value } = action.payload;
      if (!Array.isArray(state[category])) return;
      const idx = state[category].indexOf(value);
      if (idx === -1) {
        state[category].push(value);
      } else {
        state[category].splice(idx, 1);
      }
      state.page = 1;
      state.activePresetName = null;
      persistCurrentFilterState(state);
    },
    setMinIntentScore(state, action) {
      state.minIntentScore = Number(action.payload) || 0;
      state.page = 1;
      state.activePresetName = null;
      persistCurrentFilterState(state);
    },
    setHasVerifiedEmail(state, action) {
      state.hasVerifiedEmail = Boolean(action.payload);
      state.page = 1;
      state.activePresetName = null;
      persistCurrentFilterState(state);
    },
    setHasDirectPhone(state, action) {
      state.hasDirectPhone = Boolean(action.payload);
      state.page = 1;
      state.activePresetName = null;
      persistCurrentFilterState(state);
    },
    setOnlyCustom(state, action) {
      state.onlyCustom = Boolean(action.payload);
      state.savedListLeadIds = null;
      state.page = 1;
      persistCurrentFilterState(state);
    },
    setSavedListFilter(state, action) {
      const { leadIds, name } = action.payload || {};
      state.savedListLeadIds = Array.isArray(leadIds) ? leadIds : null;
      state.activePresetName = name || null;
      state.onlyCustom = false;
      state.page = 1;
      persistCurrentFilterState(state);
    },
    applyQuickSegmentPreset(state, action) {
      const preset = action.payload;
      Object.assign(state, {
        ...defaultResetState,
        searchQuery: state.searchQuery,
        pageSize: state.pageSize,
        isMobileFilterOpen: state.isMobileFilterOpen,
        ...(preset.filters || {}),
        activePresetName: preset.name || null,
        page: 1
      });
      persistCurrentFilterState(state);
    },
    setSortConfig(state, action) {
      const { sortBy, sortOrder } = action.payload;
      if (sortBy) state.sortBy = sortBy;
      if (sortOrder) state.sortOrder = sortOrder;
      state.page = 1;
      persistCurrentFilterState(state);
    },
    setPage(state, action) {
      state.page = Math.max(1, Number(action.payload) || 1);
      persistCurrentFilterState(state);
    },
    setPageSize(state, action) {
      state.pageSize = Number(action.payload) || 25;
      state.page = 1;
      persistCurrentFilterState(state);
    },
    setMobileFilterOpen(state, action) {
      state.isMobileFilterOpen = Boolean(action.payload);
    },
    resetAllFilters(state) {
      try {
        localStorage.removeItem(STORAGE_FILTER_KEY);
        localStorage.removeItem('leadsarrow_active_saved_list');
      } catch (e) {}
      return {
        ...defaultResetState,
        pageSize: state.pageSize,
        isMobileFilterOpen: state.isMobileFilterOpen
      };
    }
  }
});

export const {
  setSearchQuery,
  toggleArrayFilter,
  setMinIntentScore,
  setHasVerifiedEmail,
  setHasDirectPhone,
  setOnlyCustom,
  setSavedListFilter,
  applyQuickSegmentPreset,
  setSortConfig,
  setPage,
  setPageSize,
  setMobileFilterOpen,
  resetAllFilters
} = filtersSlice.actions;

export default filtersSlice.reducer;
