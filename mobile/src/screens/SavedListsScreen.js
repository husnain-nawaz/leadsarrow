import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/theme';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

export default function SavedListsScreen({ navigation }) {
  const { isLoggedIn } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Create list modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchSavedLists();
      setLists(res.lists || []);
    } catch (err) {
      console.warn('Failed to load saved lists:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLists();
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Required', 'Please enter a name for your list.');
      return;
    }
    setCreating(true);
    try {
      const res = await api.createSavedList(newListName.trim(), newListDesc.trim(), []);
      setCreateModalVisible(false);
      setNewListName('');
      setNewListDesc('');
      loadLists();
      Alert.alert('Success', `List "${res.list?.name || newListName}" created!`);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create list');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteList = (list) => {
    Alert.alert(
      'Delete Saved List',
      `Are you sure you want to delete "${list.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteSavedList(list.id);
              setLists((prev) => prev.filter((l) => l.id !== list.id));
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not delete list');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Saved Lists"
        onProfilePress={() => navigation.navigate('Profile')}
      />

      {/* Subheader action */}
      <View style={styles.actionRow}>
        <Text style={styles.subtitle}>
          {lists.length} Saved Target Lists
        </Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => {
            if (!isLoggedIn) {
              navigation.navigate('Auth');
              return;
            }
            setCreateModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#ffffff" />
          <Text style={styles.createBtnText}>New List</Text>
        </TouchableOpacity>
      </View>

      {/* Lists */}
      {loading && !refreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#f97316"
              colors={['#f97316']}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('SavedListDetail', { list: item })}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconBox}>
                  <Ionicons name="bookmark" size={18} color="#f97316" />
                </View>
                <View style={styles.titleBox}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {item.filterSummary || item.description || 'Target Accounts'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteList(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={16} color={COLORS.textMutedDark} />
                </TouchableOpacity>
              </View>

              <View style={styles.cardBottom}>
                <View style={styles.countBadge}>
                  <Ionicons name="people" size={12} color="#f97316" />
                  <Text style={styles.countText}>
                    {item.leadCount || (item.leadIds?.length || 0)} Accounts
                  </Text>
                </View>
                <View style={styles.viewRow}>
                  <Text style={styles.viewText}>View Leads</Text>
                  <Ionicons name="chevron-forward" size={12} color={COLORS.primary} />
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyBox}>
                <Ionicons name="folder-open-outline" size={44} color={COLORS.textMutedDark} />
                <Text style={styles.emptyTitle}>No saved lists yet</Text>
                <Text style={styles.emptySubtitle}>
                  Save accounts from Lead Finder or tap "+ New List" above to get started.
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Modal: Create List */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Create Saved List</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={20} color={COLORS.textMutedDark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>List Name *</Text>
            <TextInput
              style={styles.modalInput}
              value={newListName}
              onChangeText={setNewListName}
              placeholder="e.g. Q4 Fintech Decision Makers"
              placeholderTextColor={COLORS.textMutedDark}
              autoFocus
            />

            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]}
              value={newListDesc}
              onChangeText={setNewListDesc}
              placeholder="Target criteria or campaign goal..."
              placeholderTextColor={COLORS.textMutedDark}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={handleCreateList}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Create List</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMutedDark
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ea580c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  createBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff'
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40
  },
  card: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorderDark,
    padding: 14,
    marginBottom: 10
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleBox: {
    flex: 1
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff'
  },
  cardSubtitle: {
    fontSize: 11,
    color: COLORS.textMutedDark,
    marginTop: 2
  },
  deleteBtn: {
    padding: 4
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)'
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f97316'
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  viewText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorderDark,
    padding: 18
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff'
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondaryDark,
    marginBottom: 6,
    marginTop: 8
  },
  modalInput: {
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.cardBorderDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#ffffff',
    fontSize: 13
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18
  },
  modalCancel: {
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  modalCancelText: {
    color: COLORS.textMutedDark,
    fontSize: 13,
    fontWeight: '600'
  },
  modalConfirm: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  }
});
