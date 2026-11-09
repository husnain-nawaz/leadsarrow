import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchLeadsFromServer,
  createCustomLeadOnServerApi,
  deleteCustomLeadOnServerApi
} from '../services/api.js';
import {
  saveCustomLeadToFirestore,
  removeCustomLeadFromFirestore
} from '../firebase.js';

export const fetchLeads = createAsyncThunk(
  'leads/fetchLeads',
  async (filters, { rejectWithValue }) => {
    try {
      const data = await fetchLeadsFromServer(filters);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to load B2B leads');
    }
  }
);

export const addCustomLead = createAsyncThunk(
  'leads/addCustomLead',
  async (leadInput, { rejectWithValue }) => {
    try {
      // Save to Firestore if signed into Firebase Auth
      let firestoreLead = null;
      try {
        firestoreLead = await saveCustomLeadToFirestore(leadInput);
      } catch (err) {
        console.warn('Firestore custom lead sync skipped or failed:', err);
      }

      const response = await createCustomLeadOnServerApi({
        ...leadInput,
        id: firestoreLead?.id || undefined
      });
      return response.lead;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create custom B2B lead');
    }
  }
);

export const deleteCustomLead = createAsyncThunk(
  'leads/deleteCustomLead',
  async (leadId, { rejectWithValue }) => {
    try {
      try {
        await removeCustomLeadFromFirestore(leadId);
      } catch {
        // Ignore if not stored in Firestore
      }
      await deleteCustomLeadOnServerApi(leadId);
      return leadId;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete custom lead');
    }
  }
);

const STORAGE_SELECTED_KEY = 'leadsarrow_selected_lead_ids';

function loadPersistedSelectedLeadIds() {
  try {
    const raw = localStorage.getItem(STORAGE_SELECTED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function persistSelectedLeadIds(ids) {
  try {
    localStorage.setItem(STORAGE_SELECTED_KEY, JSON.stringify(ids));
  } catch (e) {}
}

const initialState = {
  items: [],
  firestoreCustomLeads: [],
  pagination: {
    page: 1,
    pageSize: 25,
    totalCatalogRows: 600,
    totalPages: 24,
    estimatedGlobalMatches: 4824910,
    totalDatabaseRecords: 4824910
  },
  metrics: {
    verifiedRatio: 76,
    avgIntentScore: 75,
    activeFiltersCount: 0
  },
  facets: {
    industries: {},
    employeeRanges: {},
    revenueRanges: {},
    countries: {},
    seniorities: {},
    departments: {},
    verificationStatuses: {},
    fundingStages: {},
    techStack: {}
  },
  executedSql: '',
  selectedLeadIds: loadPersistedSelectedLeadIds(),
  revealedLeadIds: ['lead_100001', 'lead_100002'],
  activeLead: null,
  isAddLeadModalOpen: false,
  isExportModalOpen: false,
  loading: false,
  error: null
};

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    toggleSelectLead(state, action) {
      const id = action.payload;
      const idx = state.selectedLeadIds.indexOf(id);
      if (idx === -1) {
        state.selectedLeadIds.push(id);
      } else {
        state.selectedLeadIds.splice(idx, 1);
      }
      persistSelectedLeadIds(state.selectedLeadIds);
    },
    selectAllCurrentPageLeads(state, action) {
      const pageIds = action.payload || state.items.map((l) => l.id);
      const allSelected = pageIds.every((id) => state.selectedLeadIds.includes(id));
      if (allSelected) {
        state.selectedLeadIds = state.selectedLeadIds.filter((id) => !pageIds.includes(id));
      } else {
        for (const id of pageIds) {
          if (!state.selectedLeadIds.includes(id)) {
            state.selectedLeadIds.push(id);
          }
        }
      }
      persistSelectedLeadIds(state.selectedLeadIds);
    },
    clearSelectedLeads(state) {
      state.selectedLeadIds = [];
      persistSelectedLeadIds([]);
    },
    revealLeadContact(state, action) {
      const id = action.payload;
      if (!state.revealedLeadIds.includes(id)) {
        state.revealedLeadIds.push(id);
      }
    },
    setActiveLead(state, action) {
      state.activeLead = action.payload || null;
    },
    setAddLeadModalOpen(state, action) {
      state.isAddLeadModalOpen = Boolean(action.payload);
    },
    setExportModalOpen(state, action) {
      state.isExportModalOpen = Boolean(action.payload);
    },
    setFirestoreCustomLeads(state, action) {
      state.firestoreCustomLeads = Array.isArray(action.payload) ? action.payload : [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        const serverLeads = action.payload.leads || [];
        const requestedPageSize = action.payload.pagination?.pageSize || 25;
        
        // Merge any Firestore custom leads not yet in server memory, keeping total items capped to requested pageSize
        const existingIds = new Set(serverLeads.map((l) => l.id));
        const extraFirestore = state.firestoreCustomLeads.filter(
          (fl) => !existingIds.has(fl.id)
        );
        const combined = [...extraFirestore, ...serverLeads];
        state.items = combined.slice(0, requestedPageSize);
        state.pagination = action.payload.pagination || state.pagination;
        state.metrics = action.payload.metrics || state.metrics;
        state.facets = action.payload.facets || state.facets;
        state.executedSql = action.payload.executedSql || '';
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addCustomLead.fulfilled, (state, action) => {
        const newLead = action.payload;
        if (newLead && !state.items.some((i) => i.id === newLead.id)) {
          state.items.unshift(newLead);
          state.revealedLeadIds.push(newLead.id);
        }
        state.isAddLeadModalOpen = false;
      })
      .addCase(deleteCustomLead.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.items = state.items.filter((i) => i.id !== deletedId);
        state.firestoreCustomLeads = state.firestoreCustomLeads.filter((i) => i.id !== deletedId);
        if (state.activeLead?.id === deletedId) {
          state.activeLead = null;
        }
      });
  }
});

export const {
  toggleSelectLead,
  selectAllCurrentPageLeads,
  clearSelectedLeads,
  revealLeadContact,
  setActiveLead,
  setAddLeadModalOpen,
  setExportModalOpen,
  setFirestoreCustomLeads
} = leadsSlice.actions;

export default leadsSlice.reducer;
