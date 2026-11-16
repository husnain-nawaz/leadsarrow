import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { theme } from '../config/theme';

export default function ProfileScreen({ navigation }) {
  const { user, isLoggedIn, logout, refreshUser, revealedLeadIds } = useAuth();
  const [serverUrl, setServerUrl] = useState(api.baseUrl || 'http://192.168.18.4:3000');
  const [testingConnection, setTestingConnection] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isUnlimited = user?.role === 'superadmin' || user?.plan === 'unlimited';
  const creditsText = isUnlimited ? 'Unlimited' : `${user?.credits ?? 100} Credits`;

  const handleSaveAndTestServer = async () => {
    setTestingConnection(true);
    try {
      await api.setBaseUrl(serverUrl);
      const res = await api.getHealth();
      Alert.alert(
        'Server Connected! ✅',
        `Successfully reached LeadsArrow backend.\nStatus: ${res.status || 'OK'}\nHost: ${api.baseUrl}`
      );
      if (isLoggedIn) {
        await refreshUser();
      }
    } catch (err) {
      Alert.alert(
        'Connection Warning ⚠️',
        `Could not reach server at:\n${serverUrl}\n\nError: ${err.message}\n\nPlease check your WiFi network or IP address.`
      );
    } finally {
      setTestingConnection(false);
    }
  };

  const handleRefreshProfile = async () => {
    if (!isLoggedIn) return;
    setRefreshing(true);
    try {
      await refreshUser();
      Alert.alert('Refreshed', 'User profile and credits updated.');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of LeadsArrow?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Hero Card */}
      {isLoggedIn ? (
        <View style={styles.heroCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user?.name || 'Workspace Member'}</Text>
              <View style={styles.planBadge}>
                <Ionicons name="sparkles" size={12} color="#ffffff" style={{ marginRight: 3 }} />
                <Text style={styles.planBadgeText}>
                  {user?.role === 'superadmin' ? 'SUPERADMIN' : (user?.plan || 'PRO').toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {user?.company && (
              <Text style={styles.userCompany}>🏢 {user.company}</Text>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.guestCard}>
          <View style={styles.guestIcon}>
            <Ionicons name="person-circle-outline" size={44} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.guestTitle}>Explore LeadsArrow</Text>
            <Text style={styles.guestSub}>
              Sign in to save leads, reveal verified direct contacts, and organize custom clusters.
            </Text>
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => navigation.navigate('Auth')}
            >
              <Text style={styles.signInBtnText}>Sign In or Register</Text>
              <Ionicons name="arrow-forward" size={14} color="#ffffff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Credits & Stats Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="flash" size={18} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Credits & Usage</Text>
          </View>
          {isLoggedIn && (
            <TouchableOpacity onPress={handleRefreshProfile} disabled={refreshing}>
              {refreshing ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons name="refresh" size={16} color={theme.colors.textMuted} />
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{creditsText}</Text>
            <Text style={styles.statLabel}>Current Balance</Text>
            <Text style={styles.statSub}>100 Daily replenishment</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{revealedLeadIds?.size || 0}</Text>
            <Text style={styles.statLabel}>Revealed Contacts</Text>
            <Text style={styles.statSub}>Unlocked emails & phones</Text>
          </View>
        </View>
      </View>

      {/* Backend API Configuration */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="server-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Backend Server Endpoint</Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.livePillText}>REST API</Text>
          </View>
        </View>

        <Text style={styles.configDesc}>
          Points to the LeadsArrow Express REST API running on your PC or production server.
        </Text>

        <TextInput
          style={styles.serverInput}
          value={serverUrl}
          onChangeText={setServerUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="http://192.168.18.4:3000"
          placeholderTextColor={theme.colors.textMuted}
        />

        <TouchableOpacity
          style={styles.testBtn}
          onPress={handleSaveAndTestServer}
          disabled={testingConnection}
        >
          {testingConnection ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="swap-horizontal" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.testBtnText}>Save & Test Connection</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Database & App Info */}
      <View style={styles.sectionCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Platform Database</Text>
          <Text style={styles.infoVal}>10,383,428 Decision Makers</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Deliverability Rate</Text>
          <Text style={[styles.infoVal, { color: theme.colors.success }]}>99.4% Verified SMTP</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Mobile App Version</Text>
          <Text style={styles.infoVal}>v1.0.0 (Expo SDK 58)</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Architecture</Text>
          <Text style={styles.infoVal}>Pure REST / No-Redundant Inodes</Text>
        </View>
      </View>

      {/* Logout button */}
      {isLoggedIn && (
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Sign Out from Device</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800'
  },
  heroInfo: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginRight: 8
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  planBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  userEmail: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2
  },
  userCompany: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2
  },
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16
  },
  guestIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  guestTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700'
  },
  guestSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  signInBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
    marginRight: 5
  },
  livePillText: {
    color: theme.colors.success,
    fontSize: 10,
    fontWeight: '700'
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '800'
  },
  statLabel: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2
  },
  statSub: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 2
  },
  configDesc: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10
  },
  serverInput: {
    backgroundColor: theme.colors.background,
    color: theme.colors.textPrimary,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10
  },
  testBtn: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  testBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6
  },
  infoKey: {
    color: theme.colors.textSecondary,
    fontSize: 12
  },
  infoVal: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600'
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 4
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700'
  }
});
