import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  message: null,
  type: 'success', // 'success' | 'warning' | 'error' | 'info'
  id: null,
  duration: 3800
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast: (state, action) => {
      if (typeof action.payload === 'string') {
        state.message = action.payload;
        state.type = 'success';
        state.duration = 3800;
      } else if (action.payload && typeof action.payload === 'object') {
        state.message = action.payload.message || '';
        state.type = action.payload.type || 'success';
        state.duration = action.payload.duration || 3800;
      }
      state.id = Date.now();
    },
    hideToast: (state) => {
      state.message = null;
      state.id = null;
    }
  }
});

export const { showToast, hideToast } = toastSlice.actions;
export default toastSlice.reducer;
