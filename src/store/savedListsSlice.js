import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchSavedListsFromServerApi,
  createSavedListOnServerApi,
  deleteSavedListOnServerApi,
  addLeadsToSavedListOnServerApi,
  removeLeadFromSavedListOnServerApi
} from '../services/api.js';
import {
  saveLeadListToFirestore,
  deleteLeadListFromFirestore
} from '../firebase.js';

export const fetchSavedLists = createAsyncThunk(
  'savedLists/fetchSavedLists',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchSavedListsFromServerApi();
      return data.lists || [];
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to load saved lists');
    }
  }
);

export const createSavedList = createAsyncThunk(
  'savedLists/createSavedList',
  async (listInput, { rejectWithValue }) => {
    try {
      let firestoreList = null;
      try {
        firestoreList = await saveLeadListToFirestore(listInput);
      } catch (err) {
        console.warn('Firestore saved list sync skipped or failed:', err);
      }

      try {
        const response = await createSavedListOnServerApi({
          ...listInput,
          id: firestoreList?.id || undefined
        });
        return response.list;
      } catch (serverErr) {
        if (firestoreList) {
          return firestoreList;
        }
        // Fallback local list object if both network syncs had an issue
        return {
          id: `list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: listInput.name,
          description: listInput.description,
          leadIds: Array.isArray(listInput.leadIds) ? listInput.leadIds : [],
          filterSummary: listInput.filterSummary || 'Custom Selected B2B Leads',
          leadCount: Array.isArray(listInput.leadIds) ? listInput.leadIds.length : (listInput.leadCount || 0),
          createdAt: new Date().toISOString()
        };
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to save list');
    }
  }
);

export const appendLeadsToSavedList = createAsyncThunk(
  'savedLists/appendLeadsToSavedList',
  async ({ listId, leadIds }, { getState, rejectWithValue }) => {
    try {
      if (!listId || !Array.isArray(leadIds) || !leadIds.length) {
        return rejectWithValue('No lead IDs provided');
      }

      const response = await addLeadsToSavedListOnServerApi(listId, leadIds);

      // Also sync to Firestore if signed in
      try {
        const state = getState();
        const existing = [...state.savedLists.firestoreLists, ...state.savedLists.lists].find((l) => l.id === listId);
        if (existing) {
          const merged = Array.from(new Set([...(existing.leadIds || []), ...leadIds]));
          await saveLeadListToFirestore({
            ...existing,
            id: listId,
            leadIds: merged,
            leadCount: merged.length
          });
        }
      } catch (e) {
        console.warn('Firestore append sync skipped:', e);
      }

      return response.list;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add leads to list');
    }
  }
);

export const removeLeadFromSavedList = createAsyncThunk(
  'savedLists/removeLeadFromSavedList',
  async ({ listId, leadId }, { getState, rejectWithValue }) => {
    try {
      const response = await removeLeadFromSavedListOnServerApi(listId, leadId);

      // Also sync to Firestore if signed in
      try {
        const state = getState();
        const existing = [...state.savedLists.firestoreLists, ...state.savedLists.lists].find((l) => l.id === listId);
        if (existing) {
          const updatedIds = (existing.leadIds || []).filter((id) => String(id) !== String(leadId));
          await saveLeadListToFirestore({
            ...existing,
            id: listId,
            leadIds: updatedIds,
            leadCount: updatedIds.length
          });
        }
      } catch (e) {
        console.warn('Firestore remove lead sync skipped:', e);
      }

      return response.list;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to remove lead from list');
    }
  }
);

export const removeSavedList = createAsyncThunk(
  'savedLists/removeSavedList',
  async (listId, { rejectWithValue }) => {
    try {
      try {
        await deleteLeadListFromFirestore(listId);
      } catch {
        // Ignore if not in Firestore
      }
      await deleteSavedListOnServerApi(listId);
      return listId;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete list');
    }
  }
);

const initialState = {
  lists: [],
  firestoreLists: [],
  isSavedListsModalOpen: false,
  targetListForAdding: null, // { id: string, name: string, leadCount: number }
  loading: false,
  error: null
};

const savedListsSlice = createSlice({
  name: 'savedLists',
  initialState,
  reducers: {
    setSavedListsModalOpen(state, action) {
      state.isSavedListsModalOpen = Boolean(action.payload);
    },
    setFirestoreSavedLists(state, action) {
      state.firestoreLists = Array.isArray(action.payload) ? action.payload : [];
    },
    setTargetListForAdding(state, action) {
      state.targetListForAdding = action.payload || null;
    },
    clearTargetListForAdding(state) {
      state.targetListForAdding = null;
    },
    incrementTargetListCount(state, action) {
      const addedCount = Number(action.payload) || 0;
      if (state.targetListForAdding) {
        state.targetListForAdding.leadCount = (state.targetListForAdding.leadCount || 0) + addedCount;
      }
    },
    addLeadsToExistingList(state, action) {
      const { listId, leadIds } = action.payload;
      const target = state.lists.find((l) => l.id === listId);
      if (target && Array.isArray(leadIds)) {
        const merged = Array.from(new Set([...(target.leadIds || []), ...leadIds]));
        target.leadIds = merged;
        target.leadCount = merged.length;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSavedLists.fulfilled, (state, action) => {
        state.lists = action.payload;
      })
      .addCase(createSavedList.fulfilled, (state, action) => {
        if (action.payload) {
          state.lists.unshift(action.payload);
        }
      })
      .addCase(removeSavedList.fulfilled, (state, action) => {
        const id = action.payload;
        state.lists = state.lists.filter((l) => l.id !== id);
        state.firestoreLists = state.firestoreLists.filter((l) => l.id !== id);
      })
      .addCase(appendLeadsToSavedList.fulfilled, (state, action) => {
        const updated = action.payload;
        if (!updated) return;
        const idx = state.lists.findIndex((l) => l.id === updated.id);
        if (idx >= 0) {
          state.lists[idx] = { ...state.lists[idx], ...updated };
        } else {
          state.lists.unshift(updated);
        }
        const fsIdx = state.firestoreLists.findIndex((l) => l.id === updated.id);
        if (fsIdx >= 0) {
          state.firestoreLists[fsIdx] = { ...state.firestoreLists[fsIdx], ...updated };
        }
      })
      .addCase(removeLeadFromSavedList.fulfilled, (state, action) => {
        const updated = action.payload;
        if (!updated) return;
        const idx = state.lists.findIndex((l) => l.id === updated.id);
        if (idx >= 0) {
          state.lists[idx] = { ...state.lists[idx], ...updated };
        }
        const fsIdx = state.firestoreLists.findIndex((l) => l.id === updated.id);
        if (fsIdx >= 0) {
          state.firestoreLists[fsIdx] = { ...state.firestoreLists[fsIdx], ...updated };
        }
      });
  }
});

export const {
  setSavedListsModalOpen,
  setFirestoreSavedLists,
  setTargetListForAdding,
  clearTargetListForAdding,
  incrementTargetListCount,
  addLeadsToExistingList
} = savedListsSlice.actions;

export default savedListsSlice.reducer;
