import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [revealedLeadIds, setRevealedLeadIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load session from AsyncStorage on app launch
  const loadSession = useCallback(async () => {
    try {
      await api.init();
      const [savedToken, savedUserStr] = await Promise.all([
        AsyncStorage.getItem('leadsarrow_mobile_token'),
        AsyncStorage.getItem('leadsarrow_mobile_user')
      ]);

      if (savedToken && savedUserStr) {
        const parsedUser = JSON.parse(savedUserStr);
        setToken(savedToken);
        setUser(parsedUser);

        // Fetch fresh profile & revealed lead IDs from backend
        try {
          const [profileRes, revealedRes] = await Promise.all([
            api.getMe(),
            api.fetchRevealedLeads()
          ]);
          if (profileRes?.user) {
            setUser(profileRes.user);
            await AsyncStorage.setItem('leadsarrow_mobile_user', JSON.stringify(profileRes.user));
          }
          if (revealedRes?.leadIds) {
            setRevealedLeadIds(new Set(revealedRes.leadIds));
          }
        } catch (syncErr) {
          console.warn('[AuthContext] Background sync warning:', syncErr.message);
        }
      }
    } catch (err) {
      console.error('[AuthContext] Session load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    setToken(res.token);
    setUser(res.user);

    // Fetch revealed leads
    try {
      const revealed = await api.fetchRevealedLeads();
      if (revealed?.leadIds) {
        setRevealedLeadIds(new Set(revealed.leadIds));
      }
    } catch (_) {}

    return res;
  };

  const register = async (name, email, password, company) => {
    const res = await api.register(name, email, password, company);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    await api.logout();
    setToken(null);
    setUser(null);
    setRevealedLeadIds(new Set());
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res?.user) {
        setUser(res.user);
        await AsyncStorage.setItem('leadsarrow_mobile_user', JSON.stringify(res.user));
      }
    } catch (e) {
      console.warn('[AuthContext] Refresh user error:', e);
    }
  };

  const markLeadRevealed = (leadId, updatedUser) => {
    setRevealedLeadIds((prev) => new Set([...prev, String(leadId)]));
    if (updatedUser) {
      setUser(updatedUser);
      AsyncStorage.setItem('leadsarrow_mobile_user', JSON.stringify(updatedUser)).catch(() => {});
    }
  };

  const isLeadRevealed = (leadId) => {
    return revealedLeadIds.has(String(leadId));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: Boolean(token && user),
        isLoading,
        revealedLeadIds,
        isLeadRevealed,
        markLeadRevealed,
        login,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
