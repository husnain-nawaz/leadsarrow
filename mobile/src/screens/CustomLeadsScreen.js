import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/theme';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LeadCard from '../components/LeadCard';

export default function CustomLeadsScreen({ navigation }) {
  const { isLoggedIn } = useAuth();
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [createClusterModal, setCreateClusterModal] = useState(false);
  const [newClusterName, setNewClusterName] = useState('');
  const [newClusterDesc, setNewClusterDesc] = useState('');
  const [creatingCluster, setCreatingCluster] = useState(false);

  const [addLeadModal, setAddLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({
    companyName: '',
    domain: '',
    industry: 'Enterprise Software & SaaS',
    contactName: '',
    contactTitle: 'VP of Operations',
    contactEmail: '',
    contactPhone: '',
    city: 'San Francisco, CA',
    country: 'United States',
    employeeRange: '51-200'
  });
  const [savingLead, setSavingLead] = useState(false);

  const loadClusterData = useCallback(async (clusterName = null) => {
    setLoading(true);
    try {
      const res = await api.fetchCustomLeads(clusterName || '');
      const fetchedClusters = res.clusters || [];
      const fetchedLeads = res.leads || [];

      setClusters(fetchedClusters);
      setLeads(fetchedLeads);

      // Auto-select most recently created cluster (index 0) if none selected or invalid
      if (fetchedClusters.length > 0) {
        const clusterNames = fetchedClusters.map((c) => c.name);
        if (!clusterName || !clusterNames.includes(clusterName)) {
          setSelectedCluster(res.activeCluster || fetchedClusters[0].name);
        } else {
          setSelectedCluster(clusterName);
        }
      } else {
        setSelectedCluster(null);
      }
    } catch (err) {
      console.warn('Failed to load custom leads:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadClusterData();
    }
  }, [isLoggedIn, loadClusterData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadClusterData(selectedCluster);
  };

  const handleSelectCluster = (name) => {
    setSelectedCluster(name);
    loadClusterData(name);
  };

  const handleCreateCluster = async () => {
    if (!newClusterName.trim()) {
      Alert.alert('Required', 'Please enter a cluster name');
      return;
    }
    setCreatingCluster(true);
    try {
      const res = await api.createCustomCluster(newClusterName.trim(), newClusterDesc.trim());
      setCreateClusterModal(false);
      setNewClusterName('');
      setNewClusterDesc('');
      Alert.alert('Success', `Cluster "${res.cluster?.name || newClusterName}" created!`);
      // Reload and auto-select the newly created cluster
      loadClusterData(res.cluster?.name || newClusterName.trim());
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not create cluster');
    } finally {
      setCreatingCluster(false);
    }
  };

  const handleAddLead = async () => {
    if (!selectedCluster) {
      Alert.alert('Required', 'Please select or create a cluster first.');
      return;
    }
    if (!leadForm.companyName.trim() || !leadForm.contactName.trim()) {
      Alert.alert('Required', 'Company name and Contact name are required.');
      return;
    }
    setSavingLead(true);
    try {
      await api.createCustomLead({
        ...leadForm,
        clusterName: selectedCluster
      });
      setAddLeadModal(false);
      setLeadForm({
        companyName: '',
        domain: '',
        industry: 'Enterprise Software & SaaS',
        contactName: '',
        contactTitle: 'VP of Operations',
        contactEmail: '',
        contactPhone: '',
        city: 'San Francisco, CA',
        country: 'United States',
        employeeRange: '51-200'
      });
      loadClusterData(selectedCluster);
      Alert.alert('Success', 'Custom lead added successfully!');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add custom lead');
    } finally {
      setSavingLead(false);
    }
  };

  const handleDeleteLead = (leadId, company) => {
    Alert.alert(
      'Delete Custom Lead',
      `Permanently delete ${company || 'this lead'} from cluster "${selectedCluster}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteCustomLead(leadId);
              setLeads((prev) => prev.filter((l) => l.id !== leadId));
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete lead');
            }
          }
        }
      ]
    );
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Header title="Custom Leads" onProfilePress={() => navigation.navigate('Profile')} />
        <View style={styles.authRequiredBox}>
          <Ionicons name="lock-closed" size={48} color="#f97316" />
          <Text style={styles.authTitle}>Private Custom Leads</Text>
          <Text style={styles.authSubtitle}>
            Sign in to manage your private lead clusters and custom imported decision makers.
          </Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.signInBtnText}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Custom Leads"
        onProfilePress={() => navigation.navigate('Profile')}
      />

      {/* Cluster Navigation Bar (Strictly no "All Clusters" button) */}
      <View style={styles.clusterBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.clusterBarContent}
        >
          {/* + Create Cluster button */}
          <TouchableOpacity
            style={styles.newClusterBtn}
            onPress={() => setCreateClusterModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={14} color="#f97316" />
            <Text style={styles.newClusterText}>+ Cluster</Text>
          </TouchableOpacity>

          {/* Individual Clusters (Newest First) */}
          {clusters.map((cluster) => {
            const isSelected = selectedCluster === cluster.name;
            return (
              <TouchableOpacity
                key={cluster.id || cluster.name}
                style={[styles.clusterTab, isSelected && styles.clusterTabActive]}
                onPress={() => handleSelectCluster(cluster.name)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="folder"
                  size={12}
                  color={isSelected ? '#ffffff' : '#f97316'}
                />
                <Text style={[styles.clusterTabText, isSelected && styles.clusterTabTextActive]}>
                  {cluster.name}
                </Text>
                <View style={[styles.clusterCountPill, isSelected && styles.clusterCountPillActive]}>
                  <Text style={[styles.clusterCountText, isSelected && styles.clusterCountTextActive]}>
                    {cluster.leadCount || 0}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Cluster Info & Add Lead Button */}
      {selectedCluster && (
        <View style={styles.clusterHeaderRow}>
          <View>
            <Text style={styles.currentClusterName}>
              Cluster: <Text style={{ color: '#f97316' }}>{selectedCluster}</Text>
            </Text>
            <Text style={styles.currentClusterMeta}>
              {leads.length} accounts in this private cluster
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addLeadBtn}
            onPress={() => setAddLeadModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add" size={13} color="#ffffff" />
            <Text style={styles.addLeadBtnText}>Add Lead</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Leads list */}
      {loading && !refreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : (
        <FlatList
          data={leads}
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
            <View style={styles.leadCardWrapper}>
              <LeadCard lead={{ ...item, isRevealed: true }} />
              <TouchableOpacity
                style={styles.deleteLeadBtn}
                onPress={() => handleDeleteLead(item.id, item.companyName)}
              >
                <Ionicons name="trash-outline" size={13} color={COLORS.danger} />
                <Text style={styles.deleteLeadText}>Delete custom lead</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyBox}>
                <Ionicons name="albums-outline" size={44} color={COLORS.textMutedDark} />
                <Text style={styles.emptyTitle}>No leads in this cluster</Text>
                <Text style={styles.emptySubtitle}>
                  {selectedCluster
                    ? `Tap "+ Add Lead" above to store your first decision maker in "${selectedCluster}".`
                    : 'Tap "+ Cluster" above to create your first cluster!'}
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Modal: Create Cluster */}
      <Modal
        visible={createClusterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateClusterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Create Cluster</Text>
              <TouchableOpacity onPress={() => setCreateClusterModal(false)}>
                <Ionicons name="close" size={20} color={COLORS.textMutedDark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Cluster / Campaign Name *</Text>
            <TextInput
              style={styles.modalInput}
              value={newClusterName}
              onChangeText={setNewClusterName}
              placeholder="e.g. San Francisco Series B Founders"
              placeholderTextColor={COLORS.textMutedDark}
              autoFocus
            />

            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.modalInput, { height: 55, textAlignVertical: 'top' }]}
              value={newClusterDesc}
              onChangeText={setNewClusterDesc}
              placeholder="Niche, target criteria or notes..."
              placeholderTextColor={COLORS.textMutedDark}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setCreateClusterModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={handleCreateCluster}
                disabled={creatingCluster}
              >
                {creatingCluster ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Create Cluster</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Add Lead */}
      <Modal
        visible={addLeadModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAddLeadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeading}>Add Custom Lead</Text>
                <Text style={{ fontSize: 11, color: '#f97316' }}>Cluster: {selectedCluster}</Text>
              </View>
              <TouchableOpacity onPress={() => setAddLeadModal(false)}>
                <Ionicons name="close" size={20} color={COLORS.textMutedDark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Company Name *</Text>
            <TextInput
              style={styles.modalInput}
              value={leadForm.companyName}
              onChangeText={(t) => setLeadForm((p) => ({ ...p, companyName: t }))}
              placeholder="e.g. Stripe, Inc."
              placeholderTextColor={COLORS.textMutedDark}
            />

            <Text style={styles.inputLabel}>Company Website / Domain</Text>
            <TextInput
              style={styles.modalInput}
              value={leadForm.domain}
              onChangeText={(t) => setLeadForm((p) => ({ ...p, domain: t }))}
              placeholder="e.g. stripe.com"
              placeholderTextColor={COLORS.textMutedDark}
            />

            <Text style={styles.inputLabel}>Executive Contact Name *</Text>
            <TextInput
              style={styles.modalInput}
              value={leadForm.contactName}
              onChangeText={(t) => setLeadForm((p) => ({ ...p, contactName: t }))}
              placeholder="e.g. Sarah Jenkins"
              placeholderTextColor={COLORS.textMutedDark}
            />

            <Text style={styles.inputLabel}>Job Title</Text>
            <TextInput
              style={styles.modalInput}
              value={leadForm.contactTitle}
              onChangeText={(t) => setLeadForm((p) => ({ ...p, contactTitle: t }))}
              placeholder="e.g. Chief Technology Officer"
              placeholderTextColor={COLORS.textMutedDark}
            />

            <Text style={styles.inputLabel}>Direct Email Address</Text>
            <TextInput
              style={styles.modalInput}
              value={leadForm.contactEmail}
              onChangeText={(t) => setLeadForm((p) => ({ ...p, contactEmail: t }))}
              placeholder="e.g. s.jenkins@company.com"
              placeholderTextColor={COLORS.textMutedDark}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Direct Phone Number</Text>
            <TextInput
              style={styles.modalInput}
              value={leadForm.contactPhone}
              onChangeText={(t) => setLeadForm((p) => ({ ...p, contactPhone: t }))}
              placeholder="e.g. +1 (415) 555-0192"
              placeholderTextColor={COLORS.textMutedDark}
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setAddLeadModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={handleAddLead}
                disabled={savingLead}
              >
                {savingLead ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Save Custom Lead</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  clusterBarWrapper: {
    backgroundColor: COLORS.cardDark,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorderDark,
    paddingVertical: 8
  },
  clusterBarContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center'
  },
  newClusterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)'
  },
  newClusterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f97316'
  },
  clusterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1,
    borderColor: COLORS.cardBorderDark
  },
  clusterTabActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c'
  },
  clusterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondaryDark
  },
  clusterTabTextActive: {
    color: '#ffffff',
    fontWeight: '800'
  },
  clusterCountPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10
  },
  clusterCountPillActive: {
    backgroundColor: '#c2410c'
  },
  clusterCountText: {
    fontSize: 10,
    color: COLORS.textMutedDark,
    fontWeight: '700'
  },
  clusterCountTextActive: {
    color: '#ffffff'
  },
  clusterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)'
  },
  currentClusterName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff'
  },
  currentClusterMeta: {
    fontSize: 10,
    color: COLORS.textMutedDark,
    marginTop: 1
  },
  addLeadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f97316',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  addLeadBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff'
  },
  listContent: {
    padding: 16,
    paddingBottom: 40
  },
  leadCardWrapper: {
    marginBottom: 6
  },
  deleteLeadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: -8,
    marginBottom: 10,
    marginRight: 6
  },
  deleteLeadText: {
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
  },
  authRequiredBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 12
  },
  authTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff'
  },
  authSubtitle: {
    fontSize: 13,
    color: COLORS.textMutedDark,
    textAlign: 'center',
    lineHeight: 18
  },
  signInBtn: {
    marginTop: 10,
    backgroundColor: '#ea580c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10
  },
  signInBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
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
  modalScrollCard: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorderDark,
    padding: 18,
    marginVertical: 40
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
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
    marginBottom: 4,
    marginTop: 8
  },
  modalInput: {
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.cardBorderDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: '800'
  }
});
