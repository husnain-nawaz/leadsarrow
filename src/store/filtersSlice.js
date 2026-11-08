import { createSlice } from '@reduxjs/toolkit';

const initialState = {
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
    },
    setMinIntentScore(state, action) {
      state.minIntentScore = Number(action.payload) || 0;
      state.page = 1;
      state.activePresetName = null;
    },
    setHasVerifiedEmail(state, action) {
      state.hasVerifiedEmail = Boolean(action.payload);
      state.page = 1;
      state.activePresetName = null;
    },
    setHasDirectPhone(state, action) {
      state.hasDirectPhone = Boolean(action.payload);
      state.page = 1;
      state.activePresetName = null;
    },
    setOnlyCustom(state, action) {
      state.onlyCustom = Boolean(action.payload);
      state.savedListLeadIds = null;
      state.page = 1;
    },
    setSavedListFilter(state, action) {
      const { leadIds, name } = action.payload || {};
      state.savedListLeadIds = Array.isArray(leadIds) ? leadIds : null;
      state.activePresetName = name || null;
      state.onlyCustom = false;
      state.page = 1;
    },
    applyQuickSegmentPreset(state, action) {
      const preset = action.payload;
      Object.assign(state, {
        ...initialState,
        searchQuery: state.searchQuery,
        isMobileFilterOpen: state.isMobileFilterOpen,
        ...(preset.filters || {}),
        activePresetName: preset.name || null,
        page: 1
      });
    },
    setSortConfig(state, action) {
      const { sortBy, sortOrder } = action.payload;
      if (sortBy) state.sortBy = sortBy;
      if (sortOrder) state.sortOrder = sortOrder;
      state.page = 1;
    },
    setPage(state, action) {
      state.page = Math.max(1, Number(action.payload) || 1);
    },
    setPageSize(state, action) {
      state.pageSize = Number(action.payload) || 25;
      state.page = 1;
    },
    setMobileFilterOpen(state, action) {
      state.isMobileFilterOpen = Boolean(action.payload);
    },
    resetAllFilters(state) {
      return {
        ...initialState,
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
