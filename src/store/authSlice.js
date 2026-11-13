import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getStoredToken,
  getStoredUser,
  persistAuthSession,
  clearAuthSession,
  saveRememberedCredentials,
  getRememberedCredentials,
  loginWithJwtApi,
  registerWithJwtApi,
  syncGoogleAuthWithBackendApi,
  upgradeUserPlanApi,
  decrementCreditsApi,
  fetchCurrentUserProfileApi
} from '../services/api.js';
import { auth, googleProvider, signInWithPopup, firebaseSignOut } from '../firebase.js';

export const refreshCurrentUserProfile = createAsyncThunk(
  'auth/refreshCurrentUserProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const response = await fetchCurrentUserProfileApi();
      if (response?.user) {
        const { auth } = getState();
        persistAuthSession({
          user: response.user,
          token: auth.token || getStoredToken(),
          rememberMe: true
        });
        return response.user;
      }
      return null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const consumeCredits = createAsyncThunk(
  'auth/consumeCredits',
  async (amount, { getState, rejectWithValue }) => {
    try {
      const response = await decrementCreditsApi(amount);
      if (response?.user) {
        const { auth } = getState();
        persistAuthSession({
          user: response.user,
          token: auth.token || getStoredToken(),
          rememberMe: true
        });
        return response.user;
      }
      return null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const loginWithJwt = createAsyncThunk(
  'auth/loginWithJwt',
  async ({ email, password, rememberMe = true }, { rejectWithValue }) => {
    try {
      const response = await loginWithJwtApi({ email, password, rememberMe });
      persistAuthSession({
        user: response.user,
        token: response.token,
        rememberMe
      });
      saveRememberedCredentials({ email, password, rememberMe });
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Sign in failed');
    }
  }
);

export const registerWithJwt = createAsyncThunk(
  'auth/registerWithJwt',
  async ({ name, email, password, company, rememberMe = true }, { rejectWithValue }) => {
    try {
      const response = await registerWithJwtApi({
        name,
        email,
        password,
        company,
        rememberMe
      });
      persistAuthSession({
        user: response.user,
        token: response.token,
        rememberMe
      });
      saveRememberedCredentials({ email, password, rememberMe });
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const loginWithGooglePopup = createAsyncThunk(
  'auth/loginWithGooglePopup',
  async ({ rememberMe = true } = {}, { rejectWithValue }) => {
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const fbUser = credential.user;
      const response = await syncGoogleAuthWithBackendApi({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
        rememberMe
      });

      persistAuthSession({
        user: { ...response.user, uid: fbUser.uid },
        token: response.token,
        rememberMe
      });

      if (rememberMe && fbUser.email) {
        saveRememberedCredentials({
          email: fbUser.email,
          password: '',
          rememberMe: true
        });
      }

      return {
        user: { ...response.user, uid: fbUser.uid },
        token: response.token,
        rememberMe
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Google sign-in was cancelled or failed');
    }
  }
);

export const upgradeUserPlanThunk = createAsyncThunk(
  'auth/upgradeUserPlan',
  async ({ planId }, { getState, rejectWithValue }) => {
    try {
      const response = await upgradeUserPlanApi({ planId });
      const { auth } = getState();
      persistAuthSession({
        user: response.user,
        token: response.token || auth.token,
        rememberMe: true
      });
      return response;
    } catch (error) {
      // Local fallback for offline/demo simulation
      const planSpecs = {
        starter: { name: 'Growth Starter', credits: 2000, limit: 2000 },
        pro: { name: 'Scale Pro', credits: 10000, limit: 10000 },
        unlimited: { name: 'Enterprise Unlimited', credits: 999999, limit: 999999 },
        free: { name: 'Free Starter', credits: 100, limit: 100 }
      };
      const spec = planSpecs[planId] || planSpecs.free;
      const { auth } = getState();
      if (auth.user) {
        const updatedUser = {
          ...auth.user,
          plan: spec.name,
          planId,
          creditsRemaining: spec.credits,
          dailyCreditsLimit: spec.limit
        };
        persistAuthSession({
          user: updatedUser,
          token: auth.token || 'demo_token',
          rememberMe: true
        });
        return { user: updatedUser, success: true };
      }
      return rejectWithValue(error.message || 'Upgrade failed');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await firebaseSignOut(auth);
  } catch {
    // Ignore if not signed into Firebase
  }
  clearAuthSession();
  return true;
});

const initialState = {
  user: getStoredUser(),
  token: getStoredToken(),
  rememberedCredentials: getRememberedCredentials(),
  isAuthModalOpen: false,
  authModalInitialTab: 'login',
  isUpgradeModalOpen: false,
  upgradeTargetPlan: null,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    openAuthModal(state, action) {
      state.isAuthModalOpen = true;
      state.authModalInitialTab = action.payload || 'login';
      state.error = null;
    },
    closeAuthModal(state) {
      state.isAuthModalOpen = false;
      state.error = null;
    },
    openUpgradeModal(state, action) {
      state.isUpgradeModalOpen = true;
      state.upgradeTargetPlan = action.payload || null;
    },
    closeUpgradeModal(state) {
      state.isUpgradeModalOpen = false;
      state.upgradeTargetPlan = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
    syncFirebaseSession(state, action) {
      const { user, token } = action.payload || {};
      if (user) {
        state.user = user;
        if (token) state.token = token;
      }
    },
    decrementExportCredits(state, action) {
      const amount = Number(action.payload) || 1;
      if (state.user) {
        // Unlimited plan doesn't decrement credits
        if (state.user.planId === 'unlimited' || state.user.plan === 'Enterprise Unlimited') {
          return;
        }
        if (typeof state.user.creditsRemaining === 'number') {
          state.user.creditsRemaining = Math.max(0, state.user.creditsRemaining - amount);
          persistAuthSession({
            user: state.user,
            token: state.token || '',
            rememberMe: true
          });
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshCurrentUserProfile.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
        }
      })
      .addCase(consumeCredits.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
        }
      })
      .addCase(loginWithJwt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithJwt.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.rememberedCredentials = getRememberedCredentials();
        state.isAuthModalOpen = false;
      })
      .addCase(loginWithJwt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerWithJwt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerWithJwt.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.rememberedCredentials = getRememberedCredentials();
        state.isAuthModalOpen = false;
      })
      .addCase(registerWithJwt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(loginWithGooglePopup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGooglePopup.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.rememberedCredentials = getRememberedCredentials();
        state.isAuthModalOpen = false;
      })
      .addCase(loginWithGooglePopup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(upgradeUserPlanThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(upgradeUserPlanThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.user) {
          state.user = { ...state.user, ...action.payload.user };
        }
        state.isUpgradeModalOpen = false;
      })
      .addCase(upgradeUserPlanThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
      });
  }
});

export const {
  openAuthModal,
  closeAuthModal,
  openUpgradeModal,
  closeUpgradeModal,
  clearAuthError,
  syncFirebaseSession,
  decrementExportCredits
} = authSlice.actions;

export default authSlice.reducer;
