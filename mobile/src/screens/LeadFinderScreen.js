import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/theme';
import { api } from '../services/api';
import Header from '../components/Header';
import LeadCard from '../components/LeadCard';
import FilterModal from '../components/FilterModal';
import AddToListModal from '../components/AddToListModal';

export default function LeadFinderScreen({ navigation }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalEstimated, setTotalEstimated] = useState(10363428);

  // Filters state
  const [filters, setFilters] = useState({
    industry: 'All',
    employeeRange: 'All',
    revenueRange: 'All',
    country: 'All',
    intentScore: 0
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Add to list modal
  const [selectedLeadForList, setSelectedLeadForList] = useState(null);

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => (k === 'intentScore' ? v > 0 : v !== 'All')
  ).length;

  const loadLeads = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      if (pageNum === 1 && !isRefresh) setLoading(true);
      try {
        const res = await api.fetchLeads({
          searchQuery,
          ...filters,
          page: pageNum,
          limit: 20
        });

        const fetched = res.leads || [];
        setTotalEstimated(res.pagination?.totalCatalogRows || res.pagination?.estimatedGlobalMatches || 10363428);

        if (pageNum === 1) {
          setLeads(fetched);
        } else {
          setLeads((prev) => [...prev, ...fetched]);
        }

        setHasMore(fetched.length >= 20);
        setPage(pageNum);
      } catch (err) {
        console.warn('Failed to load leads:', err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, filters]
  );

  useEffect(() => {
    loadLeads(1);
  }, [loadLeads]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLeads(1, true);
  };

  const handleEndReached = () => {
    if (!loading && hasMore) {
      loadLeads(page + 1);
    }
  };

  const handleSearchSubmit = () => {
    loadLeads(1);
  };

  return (
    <View style={styles.container}>
      <Header
        onProfilePress={() => navigation.navigate('Profile')}
      />

      {/* Search & Filter Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputBox}>
          <Ionicons name="search" size={16} color={COLORS.textMutedDark} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            placeholder="Search 10M+ leads by company, role..."
            placeholderTextColor={COLORS.textMutedDark}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMutedDark} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="funnel"
            size={16}
            color={activeFilterCount > 0 ? '#ffffff' : '#f97316'}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Metrics Banner */}
      <View style={styles.metricsBanner}>
        <Text style={styles.metricsText}>
          <Text style={styles.metricsHighlight}>
            {totalEstimated.toLocaleString()}
          </Text>{' '}
          Verified Global Decision Makers
        </Text>
      </View>

      {/* Leads List */}
      {loading && page === 1 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Searching 10.3M Leads...</Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item, index) => `${item.id || index}_${index}`}
          renderItem={({ item }) => (
            <LeadCard
              lead={item}
              onAddToList={(lead) => setSelectedLeadForList(lead)}
              onAuthRequired={() => navigation.navigate('Auth')}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#f97316"
              colors={['#f97316']}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            hasMore && leads.length > 0 ? (
              <ActivityIndicator style={{ paddingVertical: 20 }} color="#f97316" />
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyBox}>
                <Ionicons name="search-outline" size={44} color={COLORS.textMutedDark} />
                <Text style={styles.emptyTitle}>No matching accounts found</Text>
                <Text style={styles.emptySubtitle}>
                  Try relaxing your search terms or clearing active filters.
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        filters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
        onReset={(cleared) => setFilters(cleared)}
        onClose={() => setFilterModalVisible(false)}
      />

      {/* Add To List Modal */}
      <AddToListModal
        visible={Boolean(selectedLeadForList)}
        lead={selectedLeadForList}
        onClose={() => setSelectedLeadForList(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8
  },
  searchInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorderDark,
    paddingHorizontal: 10,
    height: 40
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    marginLeft: 6
  },
  clearBtn: {
    padding: 4
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.cardDark,
    borderWidth: 1,
    borderColor: COLORS.cardBorderDark,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  filterBtnActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c'
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ea580c'
  },
  metricsBanner: {
    paddingHorizontal: 16,
    paddingBottom: 8
  },
  metricsText: {
    fontSize: 11,
    color: COLORS.textMutedDark
  },
  metricsHighlight: {
    color: '#f97316',
    fontWeight: '800'
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  loadingText: {
    color: COLORS.textMutedDark,
    fontSize: 13,
    fontWeight: '600'
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
