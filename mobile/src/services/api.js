import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  TOKEN: 'leadsarrow_mobile_token',
  USER: 'leadsarrow_mobile_user',
  BASE_URL: 'leadsarrow_mobile_base_url'
};

// Default Backend URL based on platform
const getDefaultBaseUrl = () => {
  // If running in Android Emulator, 10.0.2.2 maps to host PC localhost
  if (Platform.OS === 'android') {
    return 'http://192.168.18.4:3000'; // LAN IP for device/emulator, fallback to 10.0.2.2
  }
  return 'http://192.168.18.4:3000';
};

class ApiService {
  constructor() {
    this.baseUrl = getDefaultBaseUrl();
    this.token = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    try {
      const [savedToken, savedUrl] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.BASE_URL)
      ]);
      if (savedToken) this.token = savedToken;
      if (savedUrl) this.baseUrl = savedUrl;
    } catch (e) {
      console.warn('[ApiService] Error loading stored credentials:', e);
    }
    this.initialized = true;
  }

  async setBaseUrl(newUrl) {
    let cleanUrl = String(newUrl || '').trim().replace(/\/+$/, '');
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `http://${cleanUrl}`;
    }
    this.baseUrl = cleanUrl;
    await AsyncStorage.setItem(STORAGE_KEYS.BASE_URL, cleanUrl);
  }

  async setToken(token) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  }

  async request(endpoint, options = {}) {
    await this.init();

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        data = { error: text || 'Invalid server response' };
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Request failed`);
      }

      return data;
    } catch (error) {
      console.warn(`[ApiService Error] ${config.method || 'GET'} ${url}:`, error.message);
      throw error;
    }
  }

  // --- AUTHENTICATION ---
  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      await this.setToken(data.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    }
    return data;
  }

  async register(name, email, password, company) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, company })
    });
    if (data.token) {
      await this.setToken(data.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    }
    return data;
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  async logout() {
    await this.setToken(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  }

  // --- LEADS EXPLORATION ---
  async fetchTaxonomy() {
    return this.request('/api/leads/taxonomy');
  }

  async fetchLeads(filters = {}) {
    const params = new URLSearchParams();
    if (filters.searchQuery) params.set('searchQuery', filters.searchQuery);
    if (filters.industry && filters.industry !== 'All') params.set('industry', filters.industry);
    if (filters.employeeRange && filters.employeeRange !== 'All') params.set('employeeRange', filters.employeeRange);
    if (filters.revenueRange && filters.revenueRange !== 'All') params.set('revenueRange', filters.revenueRange);
    if (filters.country && filters.country !== 'All') params.set('country', filters.country);
    if (filters.intentScore && filters.intentScore > 0) params.set('intentScore', filters.intentScore);
    params.set('page', filters.page || 1);
    params.set('limit', filters.limit || 20);

    return this.request(`/api/leads?${params.toString()}`);
  }

  async fetchRevealedLeads() {
    return this.request('/api/leads/revealed');
  }

  async revealLead(leadId) {
    return this.request('/api/leads/reveal', {
      method: 'POST',
      body: JSON.stringify({ leadId })
    });
  }

  // --- CUSTOM LEADS & CLUSTERS ---
  async fetchCustomLeads(cluster = '', query = '') {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (cluster && cluster !== 'all') params.set('cluster', cluster);
    return this.request(`/api/leads/custom?${params.toString()}`);
  }

  async createCustomCluster(name, description = '') {
    return this.request('/api/leads/custom/clusters', {
      method: 'POST',
      body: JSON.stringify({ name, description })
    });
  }

  async createCustomLead(leadData) {
    return this.request('/api/leads/custom', {
      method: 'POST',
      body: JSON.stringify(leadData)
    });
  }

  async deleteCustomLead(leadId) {
    return this.request(`/api/leads/custom/${leadId}`, {
      method: 'DELETE'
    });
  }

  // --- SAVED LISTS ---
  async fetchSavedLists() {
    return this.request('/api/lists');
  }

  async createSavedList(name, description = '', leadIds = []) {
    return this.request('/api/lists', {
      method: 'POST',
      body: JSON.stringify({ name, description, leadIds })
    });
  }

  async addLeadsToSavedList(listId, leadIds = []) {
    return this.request(`/api/lists/${listId}/leads`, {
      method: 'POST',
      body: JSON.stringify({ leadIds })
    });
  }

  async removeLeadFromSavedList(listId, leadId) {
    return this.request(`/api/lists/${listId}/leads/${leadId}`, {
      method: 'DELETE'
    });
  }

  async deleteSavedList(listId) {
    return this.request(`/api/lists/${listId}`, {
      method: 'DELETE'
    });
  }
}

export const api = new ApiService();
export default api;
