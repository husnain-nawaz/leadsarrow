import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { theme } from '../config/theme';

export default function AuthScreen({ navigation, route }) {
  const { login, register } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(
    api.baseUrl || 'https://aliceblue-kudu-967560.hostingersite.com'
  );

  const handleFillDemo = () => {
    setEmail('alex@leadsarrow.io');
    setPassword('LeadsArrow2026!');
    setErrorMessage('');
  };

  const handleSaveApiUrl = async () => {
    try {
      await api.setBaseUrl(customServerUrl);
      Alert.alert('Server Updated', `API endpoint set to:\n${api.baseUrl}`);
      setShowApiSettings(false);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }
    if (!isLoginMode && !name.trim()) {
      setErrorMessage('Please provide your full name.');
      return;
    }

    setLoading(true);
    try {
      if (isLoginMode) {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password, company.trim());
      }
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('MainTabs');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please check credentials or network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with Close */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('MainTabs');
              }
            }}
          >
            <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsIconBtn}
            onPress={() => setShowApiSettings(!showApiSettings)}
          >
            <Ionicons name="settings-outline" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Brand Logo & Headline */}
        <View style={styles.logoBlock}>
          <View style={styles.logoIcon}>
            <Ionicons name="arrow-forward-circle" size={40} color={theme.colors.primary} />
          </View>
          <Text style={styles.brandTitle}>
            Leads<Text style={{ color: theme.colors.primary }}>Arrow</Text>
          </Text>
          <Text style={styles.brandSubtitle}>
            High-Velocity B2B Intelligence & Contact Reveal Engine
          </Text>
        </View>

        {/* Server Config Dropdown (Useful for testing local vs LAN vs cloud) */}
        {showApiSettings && (
          <View style={styles.serverSettingsCard}>
            <Text style={styles.serverSettingsTitle}>Backend Server Host (API URL)</Text>
            <Text style={styles.serverSettingsSub}>
              Ensure your phone & PC share WiFi or use your deployed domain.
            </Text>
            <TextInput
              style={styles.serverInput}
              value={customServerUrl}
              onChangeText={setCustomServerUrl}
              autoCapitalize="none"
              placeholder="https://aliceblue-kudu-967560.hostingersite.com"
              placeholderTextColor={theme.colors.textMuted}
            />
            <TouchableOpacity style={styles.serverSaveBtn} onPress={handleSaveApiUrl}>
              <Text style={styles.serverSaveText}>Save Endpoint</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab Switcher: Sign In vs Register */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, isLoginMode && styles.modeTabActive]}
            onPress={() => {
              setIsLoginMode(true);
              setErrorMessage('');
            }}
          >
            <Text style={[styles.modeTabText, isLoginMode && styles.modeTabTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, !isLoginMode && styles.modeTabActive]}
            onPress={() => {
              setIsLoginMode(false);
              setErrorMessage('');
            }}
          >
            <Text style={[styles.modeTabText, !isLoginMode && styles.modeTabTextActive]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Demo Fill button */}
        {isLoginMode && (
          <TouchableOpacity style={styles.demoFillBtn} onPress={handleFillDemo}>
            <Ionicons name="flash" size={15} color={theme.colors.primary} />
            <Text style={styles.demoFillText}>Quick Fill Superadmin Demo</Text>
          </TouchableOpacity>
        )}

        {/* Error Banner */}
        {!!errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#ef4444" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Form Inputs */}
        <View style={styles.form}>
          {!isLoginMode && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Alex Miller"
                  placeholderTextColor={theme.colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <Text style={styles.label}>Company / Team (Optional)</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="business-outline" size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Acme Ventures"
                  placeholderTextColor={theme.colors.textMuted}
                  value={company}
                  onChangeText={setCompany}
                />
              </View>
            </>
          )}

          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="alex@leadsarrow.io"
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isLoginMode ? 'Sign In to Workspace' : 'Get Started Free (100 Credits)'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestBtn}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('MainTabs');
              }
            }}
          >
            <Text style={styles.guestBtnText}>Explore App Demo / Continue as Guest →</Text>
          </TouchableOpacity>
        </View>

        {/* Benefits Footnote */}
        <View style={styles.benefits}>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={styles.benefitText}>10.3M+ Verified Decision Maker Records</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={styles.benefitText}>100 Free Credits replenished daily</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={styles.benefitText}>Custom Cluster grouping & 1-tap contact reveal</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 40
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surface
  },
  settingsIconBtn: {
    padding: 8
  },
  logoBlock: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5
  },
  brandSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20
  },
  serverSettingsCard: {
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 18
  },
  serverSettingsTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4
  },
  serverSettingsSub: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginBottom: 10
  },
  serverInput: {
    backgroundColor: theme.colors.background,
    color: theme.colors.textPrimary,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8
  },
  serverSaveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  serverSaveText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9
  },
  modeTabActive: {
    backgroundColor: theme.colors.surfaceHover,
    borderWidth: 1,
    borderColor: theme.colors.borderLight
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary
  },
  modeTabTextActive: {
    color: theme.colors.primary,
    fontWeight: '700'
  },
  demoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 16
  },
  demoFillText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginLeft: 8,
    flex: 1
  },
  form: {
    marginBottom: 20
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48
  },
  inputIcon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 14
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4
  },
  submitBtnDisabled: {
    opacity: 0.7
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  guestBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  guestBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600'
  },
  benefits: {
    marginTop: 10,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  benefitText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginLeft: 8
  }
});
