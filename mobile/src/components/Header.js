import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../config/theme';

export default function Header({ title, onProfilePress }) {
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useAuth();

  const isUnlimited = user?.planId === 'unlimited' || user?.role === 'superadmin';
  const credits = user?.creditsRemaining ?? 100;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
      <View style={styles.content}>
        {/* Brand */}
        <View style={styles.brandRow}>
          <View style={styles.dot} />
          <Text style={styles.brandTitle}>
            Leads<Text style={styles.brandAccent}>Arrow</Text>
          </Text>
        </View>

        {/* Right Actions: Credits Badge & User Button */}
        <View style={styles.rightActions}>
          {isLoggedIn ? (
            <View style={styles.creditsBadge}>
              <Ionicons name="flash" size={13} color="#f97316" />
              <Text style={styles.creditsText}>
                {isUnlimited ? 'Unlimited' : `${credits} Credits`}
              </Text>
            </View>
          ) : (
            <View style={styles.freeTrialBadge}>
              <Text style={styles.freeTrialText}>100 Free/Day</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={onProfilePress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isLoggedIn ? 'person-circle' : 'person-circle-outline'}
              size={28}
              color={isLoggedIn ? COLORS.primary : COLORS.textMutedDark}
            />
          </TouchableOpacity>
        </View>
      </View>
      {title && <Text style={styles.pageTitle}>{title}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorderDark,
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#f97316'
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5
  },
  brandAccent: {
    color: '#f97316'
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)'
  },
  creditsText: {
    color: '#fb923c',
    fontSize: 11,
    fontWeight: '700'
  },
  freeTrialBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  freeTrialText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '700'
  },
  profileBtn: {
    padding: 2
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 8,
    letterSpacing: -0.3
  }
});
