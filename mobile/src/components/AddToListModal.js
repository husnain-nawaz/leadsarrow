import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/theme';
import { api } from '../services/api';

export default function AddToListModal({ visible, lead, onClose, onLeadAdded }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  
  // New list form
  const [showCreate, setShowCreate] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (visible) {
      loadLists();
      setShowCreate(false);
      setNewListName('');
    }
  }, [visible]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const res = await api.fetchSavedLists();
      setLists(res.lists || []);
    } catch (err) {
      console.warn('Failed to load saved lists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async (list) => {
    if (!lead?.id) return;
    setAddingId(list.id);
    try {
      await api.addLeadsToSavedList(list.id, [lead.id]);
      Alert.alert('Success', `Lead added to "${list.name}"!`);
      if (onLeadAdded) onLeadAdded(list.id);
      onClose();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add lead to list');
    } finally {
      setAddingId(null);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newListName.trim()) {
      Alert.alert('Required', 'Please enter a list name');
      return;
    }
    setCreating(true);
    try {
      const res = await api.createSavedList(newListName.trim(), '', [lead.id]);
      Alert.alert('Success', `List "${newListName}" created with this lead!`);
      if (onLeadAdded) onLeadAdded(res.list?.id);
      onClose();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create list');
    } finally {
      setCreating(false);
    }
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
              <Text style={styles.modalTitle}>Save to List</Text>
              <Text style={styles.modalSubtitle} numberOfLines={1}>
                {lead?.companyName || 'Lead'} • {lead?.contactName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textMutedDark} />
            </TouchableOpacity>
          </View>

          {/* Create new list toggle */}
          {showCreate ? (
            <View style={styles.createBox}>
              <Text style={styles.createLabel}>New List Name</Text>
              <TextInput
                style={styles.input}
                value={newListName}
                onChangeText={setNewListName}
                placeholder="e.g. Q4 Enterprise Outreach"
                placeholderTextColor={COLORS.textMutedDark}
                autoFocus
              />
              <View style={styles.createActions}>
                <TouchableOpacity
                  style={styles.cancelCreateBtn}
                  onPress={() => setShowCreate(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmCreateBtn}
                  onPress={handleCreateAndAdd}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmCreateText}>Create & Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.createToggleBtn}
              onPress={() => setShowCreate(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={18} color="#f97316" />
              <Text style={styles.createToggleText}>+ Create New List</Text>
            </TouchableOpacity>
          )}

          {/* List items */}
          {loading ? (
            <ActivityIndicator style={{ marginVertical: 30 }} color="#f97316" />
          ) : (
            <FlatList
              data={lists}
              keyExtractor={(item) => String(item.id)}
              style={styles.listContainer}
              renderItem={({ item }) => {
                const isAdding = addingId === item.id;
                const containsLead = Array.isArray(item.leadIds) && item.leadIds.includes(lead?.id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.listItem,
                      containsLead && styles.listItemDisabled
                    ]}
                    onPress={() => !containsLead && handleAddToList(item)}
                    disabled={isAdding || containsLead}
                    activeOpacity={0.7}
                  >
                    <View style={styles.listIconBox}>
                      <Ionicons
                        name="bookmark"
                        size={16}
                        color={containsLead ? COLORS.textMutedDark : '#f97316'}
                      />
                    </View>
                    <View style={styles.listInfo}>
                      <Text style={styles.listName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.listMeta}>
                        {item.leadCount || (item.leadIds?.length || 0)} leads
                        {containsLead ? ' • Already added' : ''}
                      </Text>
                    </View>
                    {isAdding ? (
                      <ActivityIndicator size="small" color="#f97316" />
                    ) : containsLead ? (
                      <Ionicons name="checkmark-done" size={18} color="#10b981" />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={COLORS.textMutedDark} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                !showCreate ? (
                  <Text style={styles.emptyText}>
                    No saved lists yet. Tap "+ Create New List" above!
                  </Text>
                ) : null
              }
            />
          )}
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
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: COLORS.cardBorderDark
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff'
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textMutedDark,
    marginTop: 2
  },
  closeBtn: {
    padding: 4
  },
  createToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    marginBottom: 12
  },
  createToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f97316'
  },
  createBox: {
    backgroundColor: COLORS.surfaceDark,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12
  },
  createLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondaryDark,
    marginBottom: 6
  },
  input: {
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.cardBorderDark,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 13
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10
  },
  cancelCreateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  cancelText: {
    fontSize: 12,
    color: COLORS.textMutedDark,
    fontWeight: '600'
  },
  confirmCreateBtn: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6
  },
  confirmCreateText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '800'
  },
  listContainer: {
    maxHeight: 280
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  listItemDisabled: {
    opacity: 0.6
  },
  listIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  listInfo: {
    flex: 1
  },
  listName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff'
  },
  listMeta: {
    fontSize: 11,
    color: COLORS.textMutedDark,
    marginTop: 1
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMutedDark,
    fontSize: 12,
    marginVertical: 20
  }
});
