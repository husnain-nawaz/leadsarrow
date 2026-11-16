import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/theme';
import { api } from '../services/api';
import LeadCard from '../components/LeadCard';

export default function SavedListDetailScreen({ route, navigation }) {
  const { list } = route.params;
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadListLeads = useCallback(async () => {
    setLoading(true);
    try {
      const ids = list.leadIds || [];
      if (ids.length === 0) {
        setLeads([]);
        return;
      }
      const res = await api.request('/api/leads/by-ids', {
        method: 'POST',
        body: JSON.stringify({ ids })
      });
      setLeads(res.leads || []);
    } catch (err) {
      console.warn('Failed to load leads for list:', err);
    } finally {
      setLoading(false);
    }
  }, [list]);

  useEffect(() => {
    loadListLeads();
  }, [loadListLeads]);

  const handleRemoveLead = (leadId, companyName) => {
    Alert.alert(
      'Remove Lead',
      `Remove ${companyName || 'this lead'} from "${list.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.removeLeadFromSavedList(list.id, leadId);
              setLeads((prev) => prev.filter((l) => l.id !== leadId));
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to remove lead');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {list.name}
          </Text>
          <Text style={styles.headerSubtitle}>
            {leads.length} Target Decision Makers
          </Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item, index) => `${item.id || index}`}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.leadWrapper}>
              <LeadCard
                lead={item}
                onAuthRequired={() => navigation.navigate('Auth')}
              />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveLead(item.id, item.companyName)}
              >
                <Ionicons name="close-circle" size={14} color={COLORS.danger} />
                <Text style={styles.removeBtnText}>Remove from list</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="document-text-outline" size={44} color={COLORS.textMutedDark} />
              <Text style={styles.emptyTitle}>This list is currently empty</Text>
              <Text style={styles.emptySubtitle}>
                Browse the Lead Finder tab and tap "Save to List" on any accounts you want to add.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    backgroundColor: COLORS.cardDark,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorderDark
  },
  backBtn: {
    padding: 6
  },
  headerTitleBox: {
    flex: 1
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff'
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMutedDark,
    marginTop: 1
  },
  listContent: {
    padding: 16,
    paddingBottom: 40
  },
  leadWrapper: {
    marginBottom: 6
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: -8,
    marginBottom: 12,
    marginRight: 6
  },
  removeBtnText: {
    fontSize: 10,
    color: COLORS.danger,
    fontWeight: '600'
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff'
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textMutedDark,
    textAlign: 'center',
    paddingHorizontal: 30
  }
});
