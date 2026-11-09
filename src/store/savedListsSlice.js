import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchSavedListsFromServerApi,
  createSavedListOnServerApi,
  deleteSavedListOnServerApi
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
      });
  }
});

export const {
  setSavedListsModalOpen,
  setFirestoreSavedLists,
  addLeadsToExistingList
} = savedListsSlice.actions;

export default savedListsSlice.reducer;
