import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

// Use environment variables if set, otherwise fallback to local applet config
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  oAuthClientId: import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID || firebaseConfigJson.oAuthClientId
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write'
};

export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot as required
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Sanitize string helper matching firebase-blueprint.json bounds
function sanitizeStr(val, fallback, maxLen) {
  const str = String(val ?? fallback).trim();
  if (!str) return fallback;
  return str.slice(0, maxLen);
}

export async function saveCustomLeadToFirestore(leadInput) {
  if (!auth.currentUser) return null;
  const uid = auth.currentUser.uid;
  const leadId = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = 'custom_leads';

  const payload = {
    ownerId: uid,
    companyName: sanitizeStr(leadInput.companyName, 'Untitled Corp', 160),
    domain: sanitizeStr(leadInput.domain, 'example.com', 160),
    industry: sanitizeStr(leadInput.industry, 'Enterprise Software & SaaS', 100),
    employeeRange: sanitizeStr(leadInput.employeeRange, '51-200', 50),
    revenueRange: sanitizeStr(leadInput.revenueRange, '$10M - $50M', 60),
    country: sanitizeStr(leadInput.country, 'United States', 80),
    city: sanitizeStr(leadInput.city, 'San Francisco', 80),
    contactName: sanitizeStr(leadInput.contactName, 'Alex Morgan', 120),
    contactTitle: sanitizeStr(leadInput.contactTitle, 'VP of Engineering', 120),
    seniority: sanitizeStr(leadInput.seniority, 'VP', 60),
    department: sanitizeStr(leadInput.department, 'Engineering & Technical', 80),
    contactEmail: sanitizeStr(leadInput.contactEmail, 'contact@example.com', 160),
    contactPhone: sanitizeStr(leadInput.contactPhone, '+1 (415) 555-0199', 60),
    verificationStatus: ['Verified', 'Catch-All', 'Pending'].includes(leadInput.verificationStatus)
      ? leadInput.verificationStatus
      : 'Verified',
    fundingStage: sanitizeStr(leadInput.fundingStage, 'Series B', 60),
    techStack: sanitizeStr(
      Array.isArray(leadInput.techStack) ? leadInput.techStack.join(', ') : leadInput.techStack,
      'AWS, Salesforce, React',
      300
    ),
    buyingIntentScore: Math.max(0, Math.min(100, Math.round(Number(leadInput.buyingIntentScore) || 85))),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, path, leadId), payload);
    return { id: leadId, ...payload };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeCustomLeadFromFirestore(leadId) {
  if (!auth.currentUser) return;
  const path = 'custom_leads';
  try {
    await deleteDoc(doc(db, path, leadId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveLeadListToFirestore(listInput) {
  if (!auth.currentUser) return null;
  const uid = auth.currentUser.uid;
  const listId = listInput.id && /^[a-zA-Z0-9_\-]+$/.test(listInput.id)
    ? listInput.id
    : `list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = 'saved_lists';

  const leadIdsArray = Array.isArray(listInput.leadIds) ? listInput.leadIds : [];
  const leadIdsCsv = leadIdsArray.join(',').slice(0, 2000);

  const payload = {
    ownerId: uid,
    name: sanitizeStr(listInput.name, 'Target Accounts List', 120),
    description: String(listInput.description ?? '').trim().slice(0, 300),
    leadIdsCsv,
    filterSummary: String(listInput.filterSummary ?? 'All B2B Segments').trim().slice(0, 500),
    leadCount: Math.max(0, Math.min(100000, leadIdsArray.length || Number(listInput.leadCount) || 0)),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, path, listId), payload);
    return {
      id: listId,
      ...payload,
      leadIds: leadIdsArray
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteLeadListFromFirestore(listId) {
  if (!auth.currentUser) return;
  const path = 'saved_lists';
  try {
    await deleteDoc(doc(db, path, listId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserFirestoreData(uid, onCustomLeads, onSavedLists) {
  if (!uid) return () => {};

  const leadsQuery = query(collection(db, 'custom_leads'), where('ownerId', '==', uid));
  const listsQuery = query(collection(db, 'saved_lists'), where('ownerId', '==', uid));

  const unsubLeads = onSnapshot(
    leadsQuery,
    (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          techStack: typeof data.techStack === 'string'
            ? data.techStack.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          isCustom: true,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString()
        };
      });
      onCustomLeads(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'custom_leads');
    }
  );

  const unsubLists = onSnapshot(
    listsQuery,
    (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        const leadIds = data.leadIdsCsv
          ? data.leadIdsCsv.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
        return {
          id: d.id,
          ...data,
          leadIds,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString()
        };
      });
      onSavedLists(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'saved_lists');
    }
  );

  return () => {
    unsubLeads();
    unsubLists();
  };
}

export { signInWithPopup, firebaseSignOut, onAuthStateChanged };
