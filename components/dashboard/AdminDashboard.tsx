/**
 * AdminDashboard — shown on the Home tab for ADMIN role.
 *
 * Two distinct workflows:
 *  1. Pending Applications — Approve / Reject new doctor & hospital registrations
 *  2. Manage Doctors / Hospitals — Enable / Disable already-approved providers
 */
import {
  ShieldCheck,
  Users,
  Building2,
  Calendar,
  IndianRupee,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { Colors } from '../../constants/Colors';
import {
  useAdminDashboard,
  useAdminPending,
  useAdminDoctors,
  useAdminHospitals,
  useApproveDoctor,
  useRejectDoctor,
  useApproveHospital,
  useRejectHospital,
  useToggleDoctorStatus,
  useToggleHospitalStatus,
} from '../../hooks/useApiHooks';
import Card from '../Card';

import { contentColumn } from '@/theme';

// ── Types ──────────────────────────────────────────────────────────────────

type ModalTarget = { type: 'doctor' | 'hospital'; id: string; name: string } | null;

// ── Shared text-input modal ────────────────────────────────────────────────

interface TextModalProps {
  visible: boolean;
  title: string;
  subtitle: string;
  placeholder: string;
  required?: boolean;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: (text: string) => void;
  onCancel: () => void;
}

function TextModal({
  visible,
  title,
  subtitle,
  placeholder,
  required,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
}: TextModalProps) {
  const [text, setText] = useState('');
  const canConfirm = !required || text.trim().length > 0;

  function handleConfirm() {
    if (!canConfirm) return;
    const value = text.trim();
    setText('');
    onConfirm(value);
  }

  function handleCancel() {
    setText('');
    onCancel();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{title}</Text>
          {!!subtitle && <Text style={styles.modalSub}>{subtitle}</Text>}
          <TextInput
            style={styles.modalInput}
            placeholder={placeholder}
            placeholderTextColor={Colors.textLight}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            autoFocus
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={handleCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalConfirmBtn,
                { backgroundColor: canConfirm ? confirmColor : Colors.borderLight },
              ]}
              onPress={handleConfirm}
            >
              <Text
                style={[
                  styles.modalConfirmText,
                  { color: canConfirm ? Colors.white : Colors.textLight },
                ]}
              >
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Approval card (for pending applications) ───────────────────────────────

interface ApprovalCardProps {
  name: string;
  subtitle: string;
  type: 'DOCTOR' | 'HOSPITAL';
  onApprove: () => void;
  onReject: () => void;
}

function ApprovalCard({ name, subtitle, type, onApprove, onReject }: ApprovalCardProps) {
  return (
    <View style={styles.approvalRow}>
      <View
        style={[
          styles.approvalIcon,
          { backgroundColor: type === 'DOCTOR' ? Colors.primaryLight : Colors.goldLight },
        ]}
      >
        {type === 'DOCTOR' ? (
          <Users size={16} color={Colors.primary} strokeWidth={2} />
        ) : (
          <Building2 size={16} color={Colors.gold} strokeWidth={2} />
        )}
      </View>
      <View style={styles.approvalInfo}>
        <Text style={styles.approvalName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.approvalSub} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <TouchableOpacity style={styles.iconBtn} onPress={onApprove} hitSlop={8}>
        <CheckCircle size={26} color={Colors.trustGreen} strokeWidth={2} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} onPress={onReject} hitSlop={8}>
        <XCircle size={26} color={Colors.error} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

// ── Collapsible section header ─────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  count?: number;
  alertCount?: number;
  expanded: boolean;
  onToggle: () => void;
}

function SectionHeader({ title, count, alertCount, expanded, onToggle }: SectionHeaderProps) {
  return (
    <TouchableOpacity style={styles.sectionHeaderRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {alertCount !== undefined && alertCount > 0 && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>{alertCount}</Text>
          </View>
        )}
        {count !== undefined && (alertCount === undefined || alertCount === 0) && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{count}</Text>
          </View>
        )}
      </View>
      {expanded ? (
        <ChevronUp size={18} color={Colors.textSecondary} strokeWidth={2} />
      ) : (
        <ChevronDown size={18} color={Colors.textSecondary} strokeWidth={2} />
      )}
    </TouchableOpacity>
  );
}

// ── Status helpers ─────────────────────────────────────────────────────────

function statusBg(status: string): string {
  if (status === 'APPROVED') return Colors.trustGreenLight;
  if (status === 'REJECTED') return Colors.errorLight;
  return Colors.primaryLight;
}

function statusColor(status: string): string {
  if (status === 'APPROVED') return Colors.trustGreen;
  if (status === 'REJECTED') return Colors.error;
  return Colors.primary;
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [showPending, setShowPending] = useState(true);
  const [showDoctors, setShowDoctors] = useState(false);
  const [showHospitals, setShowHospitals] = useState(false);

  // Reject application modal
  const [rejectTarget, setRejectTarget] = useState<ModalTarget>(null);
  // Disable provider modal
  const [disableTarget, setDisableTarget] = useState<ModalTarget>(null);

  const { data: dash, isLoading } = useAdminDashboard();
  const { data: pending } = useAdminPending();
  const { data: allDoctors } = useAdminDoctors();
  const { data: allHospitals } = useAdminHospitals();

  const approveDoctor = useApproveDoctor();
  const rejectDoctor = useRejectDoctor();
  const approveHospital = useApproveHospital();
  const rejectHospital = useRejectHospital();
  const toggleDoctor = useToggleDoctorStatus();
  const toggleHospital = useToggleHospitalStatus();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const stats = dash?.platformStats;
  const pendingDoctors = pending?.pendingDoctors ?? [];
  const pendingHospitals = pending?.pendingHospitals ?? [];
  const totalPending = pendingDoctors.length + pendingHospitals.length;

  function handleDoctorToggle(doctorId: string, name: string, newValue: boolean) {
    if (!newValue) {
      setDisableTarget({ type: 'doctor', id: doctorId, name });
    } else {
      toggleDoctor.mutate({ doctorId, isActive: true });
    }
  }

  function handleHospitalToggle(hospitalId: string, name: string, newValue: boolean) {
    if (!newValue) {
      setDisableTarget({ type: 'hospital', id: hospitalId, name });
    } else {
      toggleHospital.mutate({ hospitalId, isActive: true });
    }
  }

  return (
    <>
      {/* ── Reject application modal ── */}
      <TextModal
        visible={!!rejectTarget}
        title="Reject Application"
        subtitle={rejectTarget?.name ?? ''}
        placeholder="Reason for rejection (required)…"
        required
        confirmLabel="Reject"
        confirmColor={Colors.error}
        onConfirm={(reason) => {
          if (!rejectTarget) return;
          if (rejectTarget.type === 'doctor') {
            rejectDoctor.mutate({ doctorId: rejectTarget.id, reason });
          } else {
            rejectHospital.mutate({ hospitalId: rejectTarget.id, reason });
          }
          setRejectTarget(null);
        }}
        onCancel={() => setRejectTarget(null)}
      />

      {/* ── Disable provider modal ── */}
      <TextModal
        visible={!!disableTarget}
        title={`Disable ${disableTarget?.type === 'doctor' ? 'Doctor' : 'Hospital'}`}
        subtitle={disableTarget?.name ?? ''}
        placeholder="Reason (optional) — e.g. left practice, on leave…"
        confirmLabel="Disable"
        confirmColor={Colors.gold}
        onConfirm={(reason) => {
          if (!disableTarget) return;
          if (disableTarget.type === 'doctor') {
            toggleDoctor.mutate({
              doctorId: disableTarget.id,
              isActive: false,
              reason: reason || undefined,
            });
          } else {
            toggleHospital.mutate({
              hospitalId: disableTarget.id,
              isActive: false,
              reason: reason || undefined,
            });
          }
          setDisableTarget(null);
        }}
        onCancel={() => setDisableTarget(null)}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.adminHeader}>
          <ShieldCheck size={22} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.adminTitle}>Admin Dashboard</Text>
        </View>

        {/* ── Platform stats ── */}
        <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Platform Overview</Text>
        <View style={styles.statsGrid}>
          <Card style={styles.gridCard}>
            <Users size={18} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.gridValue}>{stats?.activeDoctors ?? 0}</Text>
            <Text style={styles.gridLabel}>Active Doctors</Text>
            <Text style={styles.gridSub}>of {stats?.totalDoctors ?? 0} total</Text>
          </Card>
          <Card style={styles.gridCard}>
            <Building2 size={18} color={Colors.accent} strokeWidth={2} />
            <Text style={[styles.gridValue, { color: Colors.accent }]}>
              {stats?.activeHospitals ?? 0}
            </Text>
            <Text style={styles.gridLabel}>Active Hospitals</Text>
            <Text style={styles.gridSub}>of {stats?.totalHospitals ?? 0} total</Text>
          </Card>
          <Card style={styles.gridCard}>
            <Calendar size={18} color={Colors.gold} strokeWidth={2} />
            <Text style={[styles.gridValue, { color: Colors.gold }]}>
              {stats?.monthBookings ?? 0}
            </Text>
            <Text style={styles.gridLabel}>Month Bookings</Text>
            <Text style={styles.gridSub}>{stats?.todayBookings ?? 0} today</Text>
          </Card>
          <Card style={styles.gridCard}>
            <IndianRupee size={18} color={Colors.trustGreen} strokeWidth={2} />
            <Text style={[styles.gridValue, { color: Colors.trustGreen }]}>
              ₹{Number(stats?.monthRevenue ?? 0).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.gridLabel}>Month Revenue</Text>
          </Card>
        </View>

        {/* ── Pending Applications ── */}
        <SectionHeader
          title="Pending Applications"
          alertCount={totalPending}
          expanded={showPending}
          onToggle={() => setShowPending((v) => !v)}
        />
        {showPending && (
          <Card style={styles.listCard}>
            {totalPending === 0 ? (
              <View style={styles.emptyState}>
                <CheckCircle size={28} color={Colors.trustGreen} strokeWidth={2} />
                <Text style={styles.emptyText}>All clear — no pending applications.</Text>
              </View>
            ) : (
              <>
                {pendingDoctors.map((d, idx) => (
                  <View key={d.id}>
                    <ApprovalCard
                      name={d.name}
                      subtitle={d.specialization ?? 'Doctor'}
                      type="DOCTOR"
                      onApprove={() => approveDoctor.mutate(d.id)}
                      onReject={() => setRejectTarget({ type: 'doctor', id: d.id, name: d.name })}
                    />
                    {(idx < pendingDoctors.length - 1 || pendingHospitals.length > 0) && (
                      <View style={styles.divider} />
                    )}
                  </View>
                ))}
                {pendingHospitals.map((h, idx) => (
                  <View key={h.id}>
                    <ApprovalCard
                      name={h.name}
                      subtitle="Hospital"
                      type="HOSPITAL"
                      onApprove={() => approveHospital.mutate(h.id)}
                      onReject={() => setRejectTarget({ type: 'hospital', id: h.id, name: h.name })}
                    />
                    {idx < pendingHospitals.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </>
            )}
          </Card>
        )}

        {/* ── Manage Doctors ── */}
        <SectionHeader
          title="Manage Doctors"
          count={allDoctors?.length ?? 0}
          expanded={showDoctors}
          onToggle={() => setShowDoctors((v) => !v)}
        />
        {showDoctors && (
          <Card style={styles.listCard}>
            {(allDoctors?.length ?? 0) === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No doctors found.</Text>
              </View>
            ) : (
              allDoctors!.map((d, idx) => (
                <View key={d.doctorId}>
                  <View style={styles.manageRow}>
                    <View style={styles.manageAvatar}>
                      <Users size={14} color={Colors.primary} strokeWidth={2} />
                    </View>
                    <View style={styles.manageInfo}>
                      <Text style={styles.manageName} numberOfLines={1}>
                        {d.name}
                      </Text>
                      <Text style={styles.manageSub} numberOfLines={1}>
                        {d.specialization.replace(/_/g, ' ')}
                      </Text>
                    </View>
                    <View style={styles.manageRight}>
                      {d.approvalStatus === 'PENDING' ? (
                        <View style={styles.approvalBtnRow}>
                          <TouchableOpacity
                            style={styles.approveTextBtn}
                            onPress={() => approveDoctor.mutate(d.doctorId)}
                          >
                            <CheckCircle size={14} color={Colors.trustGreen} strokeWidth={2.5} />
                            <Text style={styles.approveTextBtnLabel}>Approve</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.rejectTextBtn}
                            onPress={() =>
                              setRejectTarget({ type: 'doctor', id: d.doctorId, name: d.name })
                            }
                          >
                            <XCircle size={14} color={Colors.error} strokeWidth={2.5} />
                            <Text style={styles.rejectTextBtnLabel}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: statusBg(d.approvalStatus) },
                            ]}
                          >
                            <Text
                              style={[styles.statusText, { color: statusColor(d.approvalStatus) }]}
                            >
                              {d.approvalStatus}
                            </Text>
                          </View>
                          {d.approvalStatus === 'APPROVED' && (
                            <View style={styles.toggleRow}>
                              <Text
                                style={[
                                  styles.toggleLabel,
                                  { color: d.isActive ? Colors.trustGreen : Colors.textLight },
                                ]}
                              >
                                {d.isActive ? 'Active' : 'Off'}
                              </Text>
                              <Switch
                                value={d.isActive}
                                onValueChange={(v) => handleDoctorToggle(d.doctorId, d.name, v)}
                                trackColor={{
                                  false: Colors.borderLight,
                                  true: Colors.trustGreenLight,
                                }}
                                thumbColor={d.isActive ? Colors.trustGreen : Colors.textSecondary}
                                ios_backgroundColor={Colors.borderLight}
                              />
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  </View>
                  {idx < allDoctors!.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            )}
          </Card>
        )}

        {/* ── Manage Hospitals ── */}
        <SectionHeader
          title="Manage Hospitals"
          count={allHospitals?.length ?? 0}
          expanded={showHospitals}
          onToggle={() => setShowHospitals((v) => !v)}
        />
        {showHospitals && (
          <Card style={styles.listCard}>
            {(allHospitals?.length ?? 0) === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No hospitals found.</Text>
              </View>
            ) : (
              allHospitals!.map((h, idx) => (
                <View key={h.hospitalId}>
                  <View style={styles.manageRow}>
                    <View style={[styles.manageAvatar, { backgroundColor: Colors.goldLight }]}>
                      <Building2 size={14} color={Colors.gold} strokeWidth={2} />
                    </View>
                    <View style={styles.manageInfo}>
                      <Text style={styles.manageName} numberOfLines={1}>
                        {h.name}
                      </Text>
                      <Text style={styles.manageSub} numberOfLines={1}>
                        {h.address}
                      </Text>
                    </View>
                    <View style={styles.manageRight}>
                      {h.approvalStatus === 'PENDING' ? (
                        <View style={styles.approvalBtnRow}>
                          <TouchableOpacity
                            style={styles.approveTextBtn}
                            onPress={() => approveHospital.mutate(h.hospitalId)}
                          >
                            <CheckCircle size={14} color={Colors.trustGreen} strokeWidth={2.5} />
                            <Text style={styles.approveTextBtnLabel}>Approve</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.rejectTextBtn}
                            onPress={() =>
                              setRejectTarget({
                                type: 'hospital',
                                id: h.hospitalId,
                                name: h.name,
                              })
                            }
                          >
                            <XCircle size={14} color={Colors.error} strokeWidth={2.5} />
                            <Text style={styles.rejectTextBtnLabel}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: statusBg(h.approvalStatus) },
                            ]}
                          >
                            <Text
                              style={[styles.statusText, { color: statusColor(h.approvalStatus) }]}
                            >
                              {h.approvalStatus}
                            </Text>
                          </View>
                          {h.approvalStatus === 'APPROVED' && (
                            <View style={styles.toggleRow}>
                              <Text
                                style={[
                                  styles.toggleLabel,
                                  { color: h.isActive ? Colors.trustGreen : Colors.textLight },
                                ]}
                              >
                                {h.isActive ? 'Active' : 'Off'}
                              </Text>
                              <Switch
                                value={h.isActive}
                                onValueChange={(v) => handleHospitalToggle(h.hospitalId, h.name, v)}
                                trackColor={{
                                  false: Colors.borderLight,
                                  true: Colors.trustGreenLight,
                                }}
                                thumbColor={h.isActive ? Colors.trustGreen : Colors.textSecondary}
                                ios_backgroundColor={Colors.borderLight}
                              />
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  </View>
                  {idx < allHospitals!.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            )}
          </Card>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { ...contentColumn, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  adminHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  adminTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  gridCard: { width: '47%', alignItems: 'center', padding: 12, gap: 4 },
  gridValue: { fontSize: 22, fontWeight: '900', color: Colors.text },
  gridLabel: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  gridSub: { fontSize: 10, color: Colors.textLight },

  // Section headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  alertBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  alertBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.white },
  countBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  // Cards and lists
  listCard: { padding: 0, marginBottom: 8 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 12 },
  emptyState: { alignItems: 'center', padding: 24, gap: 8 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },

  // Legend (for manage sections)
  legendRow: { gap: 4, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: 11, color: Colors.textSecondary },

  // Approval card
  approvalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  approvalIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvalInfo: { flex: 1 },
  approvalName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  approvalSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  iconBtn: { padding: 4 },

  // Manage rows
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  manageAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageInfo: { flex: 1 },
  manageName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  manageSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  manageRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleLabel: { fontSize: 11, fontWeight: '600' },

  // Inline approve / reject buttons (for PENDING rows in Manage lists)
  approvalBtnRow: { flexDirection: 'row', gap: 6 },
  approveTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.trustGreenLight,
    borderWidth: 1,
    borderColor: Colors.trustGreen,
  },
  approveTextBtnLabel: { fontSize: 11, fontWeight: '700', color: Colors.trustGreen },
  rejectTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  rejectTextBtnLabel: { fontSize: 11, fontWeight: '700', color: Colors.error },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  modalSub: { fontSize: 13, color: Colors.textSecondary, marginTop: -4 },
  modalInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: { fontSize: 14, fontWeight: '700' },
});
