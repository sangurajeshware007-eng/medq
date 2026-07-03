import { useRouter } from 'expo-router';
import {
  UserPlus, ChevronRight, CheckCircle, XCircle, Trash2,
  Phone, Clock, Users,
} from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useHospitalManagerDashboard } from '../../hooks/useApiHooks';
import staffService, { StaffMember } from '../../services/staffService';
import { normalizePhone } from '../../services/authService';
import { getApiErrorMessage } from '../../utils/apiError';

type Tab = 'active' | 'pending';

export default function ManageStaffScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: hospitalData } = useHospitalManagerDashboard({ enabled: user?.role === 'HOSPITAL_MANAGER' });

  const hospitalId = hospitalData?.hospitalId ?? '';

  const [tab, setTab] = useState<Tab>('active');
  const [activeStaff, setActiveStaff] = useState<StaffMember[]>([]);
  const [pendingStaff, setPendingStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);

  // Invite modal
  const [inviteVisible, setInviteVisible] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<'HOSPITAL_RECEPTIONIST' | 'HOSPITAL_MANAGER'>('HOSPITAL_RECEPTIONIST');
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      const [active, pending] = await Promise.all([
        staffService.managerListByHospital(hospitalId, 'ACTIVE'),
        staffService.managerListByHospital(hospitalId, 'PENDING'),
      ]);
      setActiveStaff(active);
      setPendingStaff(pending);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleApprove(id: string) {
    try {
      await staffService.managerApprove(id);
      load();
    } catch (e: unknown) {
      Alert.alert('Error', getApiErrorMessage(e, 'Failed to approve.'));
    }
  }

  async function handleReject(id: string) {
    Alert.alert('Reject Request', 'Are you sure you want to reject this request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          try { await staffService.managerReject(id); load(); }
          catch (e: unknown) { Alert.alert('Error', getApiErrorMessage(e, 'Failed.')); }
        }
      },
    ]);
  }

  async function handleRevoke(id: string, name: string | null) {
    Alert.alert('Revoke Access', `Remove ${name ?? 'this person'} from your staff?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke', style: 'destructive', onPress: async () => {
          try { await staffService.managerRevoke(id); load(); }
          catch (e: unknown) { Alert.alert('Error', getApiErrorMessage(e, 'Failed.')); }
        }
      },
    ]);
  }

  async function handleInvite() {
    if (!invitePhone.trim()) { Alert.alert('Enter a phone number'); return; }
    const phone = normalizePhone(invitePhone.trim());
    setInviting(true);
    try {
      await staffService.managerInvite(hospitalId, { phone, role: inviteRole });
      setInviteVisible(false);
      setInvitePhone('');
      load();
    } catch (e: unknown) {
      Alert.alert('Error', getApiErrorMessage(e, 'Failed to send invite.'));
    } finally {
      setInviting(false);
    }
  }

  const displayed = tab === 'active' ? activeStaff : pendingStaff;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronRight size={20} color={Colors.text} strokeWidth={2.5} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Staff Management</Text>
          {hospitalData && <Text style={styles.headerSub} numberOfLines={1}>{hospitalData.hospitalName}</Text>}
        </View>
        <TouchableOpacity style={styles.inviteBtn} onPress={() => setInviteVisible(true)}>
          <UserPlus size={16} color={Colors.white} strokeWidth={2.5} />
          <Text style={styles.inviteBtnText}>Invite</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['active', 'pending'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'active' ? `Active (${activeStaff.length})` : `Pending (${pendingStaff.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {displayed.length === 0 && (
            <View style={styles.empty}>
              <Users size={40} color={Colors.borderLight} strokeWidth={1.5} />
              <Text style={styles.emptyText}>
                {tab === 'active' ? 'No active staff yet. Invite someone!' : 'No pending requests.'}
              </Text>
            </View>
          )}
          {displayed.map((s) => (
            <View key={s.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardName}>{s.userName ?? s.phonePending ?? s.userPhone ?? '—'}</Text>
                <View style={styles.cardMeta}>
                  <Phone size={12} color={Colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.cardPhone}>{s.userPhone ?? s.phonePending ?? '—'}</Text>
                </View>
                <View style={[styles.roleBadge, s.role === 'HOSPITAL_MANAGER' && styles.roleBadgeManager]}>
                  <Text style={[styles.roleText, s.role === 'HOSPITAL_MANAGER' && styles.roleTextManager]}>
                    {s.role.replace(/_/g, ' ')}
                  </Text>
                </View>
                {s.status === 'PENDING' && s.invitedByName == null && (
                  <View style={styles.selfRequestTag}>
                    <Clock size={11} color={Colors.primary} strokeWidth={2} />
                    <Text style={styles.selfRequestText}>Self-requested</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardActions}>
                {tab === 'pending' && (
                  <>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(s.id)}>
                      <CheckCircle size={18} color={Colors.trustGreen} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(s.id)}>
                      <XCircle size={18} color={Colors.error} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </>
                )}
                {tab === 'active' && (
                  <TouchableOpacity style={styles.revokeBtn} onPress={() => handleRevoke(s.id, s.userName)}>
                    <Trash2 size={16} color={Colors.error} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Invite Modal */}
      <Modal visible={inviteVisible} transparent animationType="slide" onRequestClose={() => setInviteVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Invite Staff</Text>
            <Text style={styles.modalLabel}>Phone number</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="+91XXXXXXXXXX"
              keyboardType="phone-pad"
              value={invitePhone}
              onChangeText={setInvitePhone}
            />
            <Text style={[styles.modalLabel, { marginTop: 14 }]}>Role</Text>
            {(['HOSPITAL_RECEPTIONIST', 'HOSPITAL_MANAGER'] as const).map((r) => (
              <TouchableOpacity key={r} style={[styles.roleOption, inviteRole === r && styles.roleOptionSelected]} onPress={() => setInviteRole(r)}>
                <Text style={[styles.roleOptionText, inviteRole === r && { color: Colors.primary }]}>{r.replace(/_/g, ' ')}</Text>
                {inviteRole === r && <CheckCircle size={16} color={Colors.primary} strokeWidth={2.5} />}
              </TouchableOpacity>
            ))}
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => setInviteVisible(false)} style={{ flex: 1 }} />
              <Button title={inviting ? 'Sending…' : 'Send Invite'} onPress={handleInvite} disabled={inviting} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  inviteBtnText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  tabs: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  list: { flex: 1 },
  listContent: { padding: 16, gap: 10 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  cardLeft: { flex: 1, gap: 4 },
  cardName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardPhone: { fontSize: 12, color: Colors.textSecondary },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  roleBadgeManager: { backgroundColor: '#EDE9FE' },
  roleText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  roleTextManager: { color: '#7C3AED' },
  selfRequestTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  selfRequestText: { fontSize: 11, color: Colors.primary },
  cardActions: { flexDirection: 'row', gap: 8, marginLeft: 12 },
  approveBtn: { padding: 6, borderRadius: 8, backgroundColor: '#F0FDF4' },
  rejectBtn: { padding: 6, borderRadius: 8, backgroundColor: Colors.errorLight },
  revokeBtn: { padding: 6, borderRadius: 8, backgroundColor: Colors.errorLight },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.text, marginBottom: 18 },
  modalLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  modalInput: {
    borderWidth: 1.5, borderColor: Colors.borderLight, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: Colors.text,
  },
  roleOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.borderLight,
    marginBottom: 8,
  },
  roleOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  roleOptionText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
});
