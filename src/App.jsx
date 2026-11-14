import React, { useState, useEffect } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import store from './store/store.js';
import { fetchLeads, setFirestoreCustomLeads, fetchRevealedLeads } from './store/leadsSlice.js';
import { fetchSavedLists, setFirestoreSavedLists } from './store/savedListsSlice.js';
import { syncFirebaseSession, refreshCurrentUserProfile } from './store/authSlice.js';
import {
  auth,
  onAuthStateChanged,
  subscribeUserFirestoreData
} from './firebase.js';
import { syncGoogleAuthWithBackendApi, persistAuthSession } from './services/api.js';

import Navbar from './components/Navbar.jsx';
import FilterSidebar from './components/FilterSidebar.jsx';
import AnalyticsBar from './components/AnalyticsBar.jsx';
import LeadsTable from './components/LeadsTable.jsx';
import LeadDetailDrawer from './components/LeadDetailDrawer.jsx';
import AuthModal from './components/AuthModal.jsx';
import SavedListsModal from './components/SavedListsModal.jsx';
import AddLeadModal from './components/AddLeadModal.jsx';
import ExportModal from './components/ExportModal.jsx';
import SqlArchitectureView from './components/SqlArchitectureView.jsx';
import LandingPage from './components/LandingPage.jsx';
import PlanUpgradeModal from './components/PlanUpgradeModal.jsx';
import SuperadminPanel from './components/SuperadminPanel.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import ProfileSettingsPage from './components/ProfileSettingsPage.jsx';
import CustomLeadsPage from './components/CustomLeadsPage.jsx';
import SavedListsPage from './components/SavedListsPage.jsx';
import SignOutModal from './components/SignOutModal.jsx';
import TargetListModeBanner from './components/TargetListModeBanner.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

function WorkspaceContent({ activeView, setActiveView, onToggleLanding }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const filters = useSelector((state) => state.filters);
  const [focusedSavedListId, setFocusedSavedListId] = useState(null);
  const isSuperAdmin = Boolean(user && (user.isSuperAdmin || user.role === 'superadmin' || user.email === 'alex@leadsarrow.io' || user.email === 'alex@nexuslead.io'));

  // If non-superadmin tries to access superadmin view, fallback to finder
  useEffect(() => {
    if (activeView === 'superadmin' && !isSuperAdmin) {
      setActiveView('finder');
    }
  }, [activeView, isSuperAdmin, setActiveView]);

  // Fetch B2B leads whenever any filter, sort, or pagination state changes in Redux
  useEffect(() => {
    dispatch(fetchLeads(filters));
  }, [
    dispatch,
    filters.searchQuery,
    filters.industries,
    filters.employeeRanges,
    filters.revenueRanges,
    filters.countries,
    filters.seniorities,
    filters.departments,
    filters.verificationStatuses,
    filters.fundingStages,
    filters.techStack,
    filters.minIntentScore,
    filters.hasVerifiedEmail,
    filters.hasDirectPhone,
    filters.onlyCustom,
    filters.savedListLeadIds,
    filters.sortBy,
    filters.sortOrder,
    filters.page,
    filters.pageSize
  ]);

  // Initial load of saved lists & real-time user profile sync
  useEffect(() => {
    dispatch(fetchSavedLists());
    if (user?.id) {
      dispatch(refreshCurrentUserProfile());
      dispatch(fetchRevealedLeads());
    }

    // Keep active user's credit balance and plan status synchronized in real time from database
    const profileInterval = setInterval(() => {
      if (user?.id) {
        dispatch(refreshCurrentUserProfile());
      }
    }, 5000);

    return () => clearInterval(profileInterval);
  }, [dispatch, user?.id]);

  // Listen to Firebase Auth state & attach Firestore real-time listeners when authenticated
  useEffect(() => {
    let unsubscribeFirestore = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      unsubscribeFirestore();
      if (fbUser) {
        try {
          const synced = await syncGoogleAuthWithBackendApi({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            rememberMe: true
          });
          const mergedUser = { ...synced.user, uid: fbUser.uid };
          persistAuthSession({
            user: mergedUser,
            token: synced.token,
            rememberMe: true
          });
          dispatch(syncFirebaseSession({ user: mergedUser, token: synced.token }));
        } catch (err) {
          console.warn('Backend JWT sync warning:', err);
        }

        unsubscribeFirestore = subscribeUserFirestoreData(
          fbUser.uid,
          (customLeads) => {
            dispatch(setFirestoreCustomLeads(customLeads));
          },
          (savedLists) => {
            dispatch(setFirestoreSavedLists(savedLists));
          }
        );
      } else {
        dispatch(setFirestoreCustomLeads([]));
        dispatch(setFirestoreSavedLists([]));
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFirestore();
    };
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onToggleLanding={onToggleLanding}
      />

      <TargetListModeBanner
        activeView={activeView}
        setActiveView={setActiveView}
        onReturnToList={(id) => setFocusedSavedListId(id)}
      />

      {activeView === 'schema' ? (
        <main className="flex-1">
          <SqlArchitectureView onBack={() => setActiveView('finder')} />
        </main>
      ) : activeView === 'profile' ? (
        <main className="flex-1">
          <ProfileSettingsPage onBack={() => setActiveView('finder')} />
        </main>
      ) : activeView === 'lists' ? (
        <main className="flex-1 flex flex-col min-w-0">
          <SavedListsPage
            setActiveView={setActiveView}
            initialSelectedListId={focusedSavedListId}
          />
        </main>
      ) : activeView === 'custom' ? (
        <main className="flex-1 flex flex-col min-w-0">
          <CustomLeadsPage />
        </main>
      ) : activeView === 'superadmin' ? (
        isSuperAdmin ? (
          <main className="flex-1">
            <SuperadminPanel onBack={() => setActiveView('finder')} />
          </main>
        ) : (
          <div className="flex-1 flex min-w-0">
            <FilterSidebar />
            <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
              <AnalyticsBar />
              <LeadsTable />
            </main>
          </div>
        )
      ) : (
        <div className="flex-1 flex min-w-0">
          <FilterSidebar />
          <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
            <AnalyticsBar />
            <LeadsTable />
          </main>
        </div>
      )}

      {/* Slide-over Dossier & Interactive Modals */}
      <LeadDetailDrawer />
      <AuthModal />
      <SavedListsModal
        setActiveView={setActiveView}
        onSelectFullPageList={(id) => setFocusedSavedListId(id)}
      />
      <AddLeadModal />
      <ExportModal />
      <PlanUpgradeModal />
      <ProfileModal onOpenFullProfile={() => setActiveView('profile')} />
      <SignOutModal />
    </div>
  );
}

const VALID_VIEWS = ['finder', 'lists', 'custom', 'superadmin', 'profile', 'schema'];

function getInitialActiveView() {
  // 1. Try URL hash first (e.g. #custom, #lists, #superadmin, #finder)
  try {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
      if (VALID_VIEWS.includes(hash)) {
        return hash;
      }
    }
  } catch (e) {}

  // 2. Try localStorage persistence
  try {
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('leadsarrow_active_nav_view');
      if (savedView && VALID_VIEWS.includes(savedView)) {
        return savedView;
      }
    }
  } catch (e) {}

  return 'finder';
}

function MainApp() {
  const { user } = useSelector((state) => state.auth);
  const [showLandingForLoggedIn, setShowLandingForLoggedIn] = useState(false);

  // Persist current active navbar view across browser refreshes via both localStorage and URL hash
  const [activeView, setActiveView] = useState(getInitialActiveView);

  const handleSetActiveView = (viewKey) => {
    if (!VALID_VIEWS.includes(viewKey)) return;
    setActiveView(viewKey);
    try {
      localStorage.setItem('leadsarrow_active_nav_view', viewKey);
      if (window.location.hash !== `#${viewKey}`) {
        window.history.replaceState(null, '', `#${viewKey}`);
      }
    } catch (e) {}
  };

  // Synchronize hash with activeView and listen to hashchange / popstate
  useEffect(() => {
    const onHashChange = () => {
      try {
        const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
        if (VALID_VIEWS.includes(hash)) {
          setActiveView(hash);
          localStorage.setItem('leadsarrow_active_nav_view', hash);
        }
      } catch (e) {}
    };

    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);

    // Initial sync of hash if empty
    try {
      localStorage.setItem('leadsarrow_active_nav_view', activeView);
      if (!window.location.hash || window.location.hash === '#') {
        window.history.replaceState(null, '', `#${activeView}`);
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
    };
  }, [activeView]);

  const handleOpenProfileDirectly = () => {
    handleSetActiveView('profile');
    setShowLandingForLoggedIn(false);
  };

  // Automatically redirect directly to the dashboard whenever someone logs in
  useEffect(() => {
    if (user) {
      setShowLandingForLoggedIn(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [user?.id, user?.email]);

  // If user is not logged in: ALWAYS show Landing Page with 4 plans & 100 free credits daily info.
  // Gated: No one can access the workspace dashboard without logging in first.
  if (!user) {
    return (
      <div className="min-h-screen">
        <LandingPage />
        <AuthModal />
      </div>
    );
  }

  // If user is logged in, but clicked "View Landing Page", allow toggle
  if (showLandingForLoggedIn) {
    return (
      <div className="relative min-h-screen">
        <LandingPage
          onReturnDashboard={() => setShowLandingForLoggedIn(false)}
          onOpenProfile={handleOpenProfileDirectly}
        />
        <AuthModal />
        <PlanUpgradeModal />
        <ProfileModal onOpenFullProfile={handleOpenProfileDirectly} />
        <SignOutModal />
      </div>
    );
  }

  return (
    <WorkspaceContent
      activeView={activeView}
      setActiveView={handleSetActiveView}
      onToggleLanding={() => setShowLandingForLoggedIn(true)}
    />
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </Provider>
  );
}
