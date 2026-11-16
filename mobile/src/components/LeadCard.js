import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function LeadCard({ lead, onAddToList, onAuthRequired }) {
  const { isLoggedIn, isLeadRevealed, markLeadRevealed, user } = useAuth();
  const [revealing, setRevealing] = useState(false);

  // Check if revealed either from AuthContext Set or lead record itself
  const revealed = isLeadRevealed(lead.id) || lead.isRevealed;

  const handleReveal = async () => {
    if (!isLoggedIn) {
      if (onAuthRequired) onAuthRequired();
      return;
    }

    const isUnlimited = user?.planId === 'unlimited' || user?.role === 'superadmin';
    if (!isUnlimited && (user?.creditsRemaining ?? 0) <= 0) {
      Alert.alert(
        'Insufficient Credits',
        'You have used all your daily credits. Daily credits refresh automatically every 24 hours.'
      );
      return;
    }

    setRevealing(true);
    try {
      const res = await api.revealLead(lead.id);
      if (res.success) {
        markLeadRevealed(lead.id, res.user);
      }
    } catch (err) {
      Alert.alert('Reveal Failed', err.message || 'Could not reveal contact details');
    } finally {
      setRevealing(false);
    }
  };

  const openEmail = (email) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`);
  };

  const openPhone = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const openWebsite = (domain) => {
    if (!domain) return;
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    Linking.openURL(url);
  };

  // Masking helpers
  const maskEmail = (email) => {
    if (!email) return '•••••••••@company.io';
    const parts = email.split('@');
    if (parts.length < 2) return '•••••••@••••.com';
    const name = parts[0];
    const visiblePrefix = name.slice(0, 2);
    return `${visiblePrefix}•••••••@${parts[1]}`;
  };

  const maskPhone = (phone) => {
    if (!phone) return '+1 (•••) •••-••••';
    return phone.slice(0, 4) + ' ••• ••••';
  };

  const intentScore = Number(lead.buyingIntentScore) || 88;

  return (
    <View style={styles.card}>
      {/* Top Row: Company & Intent Score */}
      <View style={styles.topRow}>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName} numberOfLines={1}>
            {lead.companyName || 'Enterprise Account'}
          </Text>
          {lead.domain ? (
            <TouchableOpacity
              onPress={() => openWebsite(lead.domain)}
              style={styles.domainRow}
              activeOpacity={0.7}
            >
              <Ionicons name="globe-outline" size={11} color={COLORS.textMutedDark} />
              <Text style={styles.domainText} numberOfLines={1}>
                {lead.domain}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Buying Intent Badge */}
        <View style={styles.intentBadge}>
          <Ionicons name="trending-up" size={11} color="#f97316" />
          <Text style={styles.intentScore}>{intentScore}</Text>
        </View>
      </View>

      {/* Meta Pills: Industry & Employee count */}
      <View style={styles.pillsRow}>
        <View style={styles.pill}>
          <Text style={styles.pillText} numberOfLines={1}>
            {lead.industry || 'Business Services'}
          </Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {lead.employeeRange || '51-200'}
          </Text>
        </View>
        {lead.revenueRange ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>{lead.revenueRange}</Text>
          </View>
        ) : null}
      </View>

      {/* Decision Maker Section */}
      <View style={styles.executiveSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {(lead.contactName || 'E')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.executiveDetails}>
          <Text style={styles.contactName} numberOfLines={1}>
            {lead.contactName || 'Executive Decision Maker'}
          </Text>
          <Text style={styles.contactTitle} numberOfLines={1}>
            {lead.contactTitle || 'Director of Operations'}
          </Text>
          <Text style={styles.locationText} numberOfLines={1}>
            <Ionicons name="location-outline" size={11} color={COLORS.textMutedDark} />{' '}
            {lead.city ? `${lead.city}, ` : ''}{lead.country || 'United States'}
          </Text>
        </View>
      </View>

      {/* Contact & Verification Box */}
      <View style={styles.contactBox}>
        {revealed ? (
          // UNLOCKED VIEW: Full details with 1-tap dial / email
          <View style={styles.unlockedContainer}>
            <View style={styles.verifiedHeader}>
              <View style={styles.verifiedTag}>
                <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                <Text style={styles.verifiedTagText}>SMTP Verified</Text>
              </View>
              <Text style={styles.unlockedNote}>Unlocked</Text>
            </View>

            {lead.contactEmail ? (
              <TouchableOpacity
                onPress={() => openEmail(lead.contactEmail)}
                style={styles.contactLinkRow}
                activeOpacity={0.7}
              >
                <Ionicons name="mail" size={13} color="#f97316" />
                <Text style={styles.unlockedLinkText} numberOfLines={1}>
                  {lead.contactEmail}
                </Text>
              </TouchableOpacity>
            ) : null}

            {lead.contactPhone ? (
              <TouchableOpacity
                onPress={() => openPhone(lead.contactPhone)}
                style={styles.contactLinkRow}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={13} color="#10b981" />
                <Text style={styles.unlockedLinkText} numberOfLines={1}>
                  {lead.contactPhone}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          // LOCKED VIEW: Masked details + Instant Reveal button
          <View style={styles.lockedContainer}>
            <View style={styles.maskedRows}>
              <View style={styles.maskedRow}>
                <Ionicons name="mail-outline" size={12} color={COLORS.textMutedDark} />
                <Text style={styles.maskedText}>
                  {maskEmail(lead.contactEmail)}
                </Text>
              </View>
              <View style={styles.maskedRow}>
                <Ionicons name="call-outline" size={12} color={COLORS.textMutedDark} />
                <Text style={styles.maskedText}>
                  {maskPhone(lead.contactPhone)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.revealBtn}
              onPress={handleReveal}
              disabled={revealing}
              activeOpacity={0.8}
            >
              <Ionicons name="flash" size={13} color="#ffffff" />
              <Text style={styles.revealBtnText}>
                {revealing ? 'Revealing...' : 'Reveal (1 Credit)'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Card Footer: Add to list button */}
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.addToListBtn}
          onPress={() => onAddToList && onAddToList(lead)}
          activeOpacity={0.7}
        >
          <Ionicons name="bookmark-outline" size={14} color="#f97316" />
          <Text style={styles.addToListText}>Save to List</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorderDark,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  companyInfo: {
    flex: 1,
    marginRight: 10
  },
  companyName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.2
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  domainText: {
    fontSize: 11,
    color: COLORS.textMutedDark
  },
  intentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)'
  },
  intentScore: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f97316'
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12
  },
  pill: {
    backgroundColor: COLORS.surfaceDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  pillText: {
    fontSize: 10,
    color: COLORS.textSecondaryDark,
    fontWeight: '600'
  },
  executiveSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    marginBottom: 10
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f97316'
  },
  executiveDetails: {
    flex: 1
  },
  contactName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  },
  contactTitle: {
    fontSize: 11,
    color: COLORS.textMutedDark,
    marginTop: 1
  },
  locationText: {
    fontSize: 10,
    color: COLORS.textMutedDark,
    marginTop: 2
  },
  contactBox: {
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 10
  },
  unlockedContainer: {
    gap: 6
  },
  verifiedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981'
  },
  unlockedNote: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMutedDark,
    textTransform: 'uppercase'
  },
  contactLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  unlockedLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f8fafc'
  },
  lockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  maskedRows: {
    flex: 1,
    gap: 3
  },
  maskedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  maskedText: {
    fontSize: 11,
    color: COLORS.textMutedDark,
    fontFamily: 'monospace'
  },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ea580c',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2
  },
  revealBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  addToListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(249, 115, 22, 0.08)'
  },
  addToListText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f97316'
  }
});
