import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import filtersReducer from './filtersSlice.js';
import leadsReducer from './leadsSlice.js';
import savedListsReducer from './savedListsSlice.js';
import toastReducer from './toastSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    filters: filtersReducer,
    leads: leadsReducer,
    savedLists: savedListsReducer,
    toast: toastReducer
  }
});

export default store;
