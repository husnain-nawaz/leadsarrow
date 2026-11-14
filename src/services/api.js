// API Client Service for Node.js Express Backend & JWT Authorization

const STORAGE_TOKEN_KEY = 'leadsarrow_jwt_token';
const STORAGE_USER_KEY = 'leadsarrow_user_profile';
const STORAGE_REMEMBER_KEY = 'leadsarrow_remembered_credentials';

export function getStoredToken() {
  return (
    localStorage.getItem(STORAGE_TOKEN_KEY) ||
    sessionStorage.getItem(STORAGE_TOKEN_KEY) ||
    null
  );
}

export function getStoredUser() {
  try {
    const raw =
      localStorage.getItem(STORAGE_USER_KEY) ||
      sessionStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function persistAuthSession({ user, token, rememberMe = true }) {
  if (rememberMe) {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    sessionStorage.removeItem(STORAGE_TOKEN_KEY);
    sessionStorage.removeItem(STORAGE_USER_KEY);
  } else {
    sessionStorage.setItem(STORAGE_TOKEN_KEY, token);
    sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
  }
}

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
  sessionStorage.removeItem(STORAGE_TOKEN_KEY);
  sessionStorage.removeItem(STORAGE_USER_KEY);
}

export function saveRememberedCredentials({ email, password, rememberMe }) {
  if (rememberMe && email) {
    localStorage.setItem(
      STORAGE_REMEMBER_KEY,
      JSON.stringify({ email, password: password || '', rememberMe: true })
    );
  } else {
    localStorage.removeItem(STORAGE_REMEMBER_KEY);
  }
}

export function getRememberedCredentials() {
  try {
    const raw = localStorage.getItem(STORAGE_REMEMBER_KEY);
    if (!raw) {
      return {
        email: 'alex@leadsarrow.io',
        password: 'LeadsArrow2026!',
        rememberMe: true
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      email: 'alex@leadsarrow.io',
      password: 'LeadsArrow2026!',
      rememberMe: true
    };
  }
}

async function apiRequest(url, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

export async function fetchLeadsFromServer(filters) {
  const params = new URLSearchParams();
  if (filters.searchQuery) params.set('q', filters.searchQuery);
  if (filters.industries?.length) params.set('industries', filters.industries.join('|'));
  if (filters.employeeRanges?.length) params.set('employeeRanges', filters.employeeRanges.join('|'));
  if (filters.revenueRanges?.length) params.set('revenueRanges', filters.revenueRanges.join('|'));
  if (filters.countries?.length) params.set('countries', filters.countries.join('|'));
  if (filters.seniorities?.length) params.set('seniorities', filters.seniorities.join('|'));
  if (filters.departments?.length) params.set('departments', filters.departments.join('|'));
  if (filters.verificationStatuses?.length) params.set('verificationStatuses', filters.verificationStatuses.join('|'));
  if (filters.fundingStages?.length) params.set('fundingStages', filters.fundingStages.join('|'));
  if (filters.techStack?.length) params.set('techStack', filters.techStack.join('|'));
  if (filters.minIntentScore > 0) params.set('minIntentScore', String(filters.minIntentScore));
  if (filters.hasVerifiedEmail) params.set('hasVerifiedEmail', 'true');
  if (filters.hasDirectPhone) params.set('hasDirectPhone', 'true');
  if (filters.onlyCustom) params.set('onlyCustom', 'true');
  if (filters.savedListLeadIds?.length) params.set('savedListLeadIds', filters.savedListLeadIds.join('|'));
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
  params.set('page', String(filters.page || 1));
  params.set('pageSize', String(filters.pageSize || 25));

  return apiRequest(`/api/leads?${params.toString()}`);
}

export async function fetchLeadsByIdsApi(ids) {
  return apiRequest('/api/leads/by-ids', {
    method: 'POST',
    body: JSON.stringify({ ids })
  });
}

export async function fetchCurrentUserProfileApi() {
  return apiRequest('/api/auth/me');
}

export async function loginWithJwtApi(payload) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function registerWithJwtApi(payload) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function syncGoogleAuthWithBackendApi(payload) {
  return apiRequest('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function upgradeUserPlanApi(payload) {
  return apiRequest('/api/auth/upgrade-plan', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateProfileApi(payload) {
  return apiRequest('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function decrementCreditsApi(amount) {
  return apiRequest('/api/auth/decrement-credits', {
    method: 'POST',
    body: JSON.stringify({ amount })
  });
}

export async function fetchRevealedLeadsApi() {
  return apiRequest('/api/leads/revealed');
}

export async function revealLeadContactApi(leadId) {
  return apiRequest('/api/leads/reveal', {
    method: 'POST',
    body: JSON.stringify({ leadId })
  });
}

export async function fetchCustomLeadsFromServerApi(searchQuery = '') {
  const query = new URLSearchParams();
  if (searchQuery) query.set('q', searchQuery);
  return apiRequest(`/api/leads/custom?${query.toString()}`);
}

export async function createCustomLeadOnServerApi(payload) {
  return apiRequest('/api/leads/custom', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function deleteCustomLeadOnServerApi(id) {
  return apiRequest(`/api/leads/custom/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

export async function fetchSavedListsFromServerApi() {
  return apiRequest('/api/lists');
}

export async function createSavedListOnServerApi(payload) {
  return apiRequest('/api/lists', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function deleteSavedListOnServerApi(id) {
  return apiRequest(`/api/lists/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

export async function addLeadsToSavedListOnServerApi(id, leadIds) {
  return apiRequest(`/api/lists/${encodeURIComponent(id)}/leads`, {
    method: 'POST',
    body: JSON.stringify({ leadIds })
  });
}

export async function removeLeadFromSavedListOnServerApi(listId, leadId) {
  return apiRequest(`/api/lists/${encodeURIComponent(listId)}/leads/${encodeURIComponent(leadId)}`, {
    method: 'DELETE'
  });
}

// Superadmin API functions
export async function fetchAdminUsersApi() {
  return apiRequest('/api/admin/users');
}

export async function updateAdminUserApi(userId, updates) {
  return apiRequest(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function fetchAdminStatsApi() {
  return apiRequest('/api/admin/stats');
}

export async function batchIngestLeadsApi({ leads, source, createList, listName }) {
  return apiRequest('/api/admin/leads/batch', {
    method: 'POST',
    body: JSON.stringify({ leads, source, createList, listName })
  });
}

export async function uploadStreamLeadsApi({ fileName, fileBase64, createList, listName }) {
  return apiRequest('/api/admin/leads/upload-stream', {
    method: 'POST',
    body: JSON.stringify({ fileName, fileBase64, createList, listName })
  });
}

export async function fetchUploadProgressApi(jobId) {
  return apiRequest(`/api/admin/leads/upload-progress/${encodeURIComponent(jobId)}`);
}

export async function cancelUploadStreamApi(jobId) {
  return apiRequest(`/api/admin/leads/upload-cancel/${encodeURIComponent(jobId)}`, {
    method: 'POST'
  });
}
