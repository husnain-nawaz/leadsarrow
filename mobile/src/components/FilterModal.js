import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/theme';

const INDUSTRIES = [
  'All',
  'Enterprise Software & SaaS',
  'Financial Services & Fintech',
  'Healthcare & Life Sciences',
  'E-Commerce & Digital Retail',
  'Cybersecurity & Network Defense',
  'Artificial Intelligence & Analytics',
  'Manufacturing & Industrial Automation'
];

const EMPLOYEE_RANGES = ['All', '1-10', '11-50', '51-200', '201-500', '501-1,000', '1,001-10,000'];
const REVENUE_RANGES = ['All', '$1M - $10M', '$10M - $50M', '$50M - $250M', '$250M - $1B+'];
const COUNTRIES = ['All', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany'];
const INTENT_LEVELS = [
  { label: 'All Intent', value: 0 },
  { label: '70+ Active', value: 70 },
  { label: '80+ High', value: 80 },
  { label: '90+ Surging', value: 90 }
];

export default function FilterModal({
  visible,
  filters,
  onApply,
  onReset,
  onClose
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  const selectFilter = (key, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const cleared = {
      industry: 'All',
      employeeRange: 'All',
      revenueRange: 'All',
      country: 'All',
      intentScore: 0
    };
    setLocalFilters(cleared);
    onReset(cleared);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Filter 10M+ Database</Text>
              <Text style={styles.modalSubtitle}>Narrow leads by firmographics & intent</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textMutedDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* 1. Buying Intent */}
            <Text style={styles.sectionTitle}>Buying Intent Score</Text>
            <View style={styles.chipsRow}>
              {INTENT_LEVELS.map((item) => {
                const isSelected = localFilters.intentScore === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => selectFilter('intentScore', item.value)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Industry */}
            <Text style={styles.sectionTitle}>Industry Sector</Text>
            <View style={styles.chipsRow}>
              {INDUSTRIES.map((ind) => {
                const isSelected = (localFilters.industry || 'All') === ind;
                return (
                  <TouchableOpacity
                    key={ind}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => selectFilter('industry', ind)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {ind}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. Company Size */}
            <Text style={styles.sectionTitle}>Company Headcount</Text>
            <View style={styles.chipsRow}>
              {EMPLOYEE_RANGES.map((range) => {
                const isSelected = (localFilters.employeeRange || 'All') === range;
                return (
                  <TouchableOpacity
                    key={range}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => selectFilter('employeeRange', range)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 4. Annual Revenue */}
            <Text style={styles.sectionTitle}>Annual Revenue</Text>
            <View style={styles.chipsRow}>
              {REVENUE_RANGES.map((rev) => {
                const isSelected = (localFilters.revenueRange || 'All') === rev;
                return (
                  <TouchableOpacity
                    key={rev}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => selectFilter('revenueRange', rev)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {rev}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 5. Country */}
            <Text style={styles.sectionTitle}>Headquarters Location</Text>
            <View style={styles.chipsRow}>
              {COUNTRIES.map((c) => {
                const isSelected = (localFilters.country || 'All') === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => selectFilter('country', c)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetText}>Reset All</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Ionicons name="funnel" size={14} color="#ffffff" />
              <Text style={styles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: COLORS.cardDark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.cardBorderDark
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff'
  },
  modalSubtitle: {
    fontSize: 11,
    color: COLORS.textMutedDark,
    marginTop: 2
  },
  closeBtn: {
    padding: 4
  },
  scrollBody: {
    marginBottom: 14
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fb923c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 8
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  chip: {
    backgroundColor: COLORS.surfaceDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorderDark
  },
  chipActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c'
  },
  chipText: {
    fontSize: 11,
    color: COLORS.textSecondaryDark,
    fontWeight: '600'
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '800'
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)'
  },
  resetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceDark
  },
  resetText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMutedDark
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f97316'
  },
  applyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff'
  }
});
