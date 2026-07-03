/**
 * Approval Pending Screen
 *
 * PENDING state: shows review status + full submitted profile in read-only mode.
 * APPROVED state: celebration + go-home CTA.
 * REJECTED state: rejection reason + edit-and-resubmit CTA.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Clock, CheckCircle, XCircle, Home, Bell, Shield, Users,
  User, GraduationCap, Stethoscope, Building2,
} from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { crossPlatformShadow } from '../../utils/shadow';
import onboardingService, { type DoctorOnboardingResponse } from '../../services/onboardingService';
import { useDoctorOnboardingStore } from '../../store/doctorOnboardingStore';
import { useHospitalOnboardingStore } from '../../store/hospitalOnboardingStore';
import Button from '../../components/Button';

const POLL_INTERVAL = 30_000;

type StatusValue = 'PENDING' | 'APPROVED' | 'REJECTED';

const DAY_LABELS: Record<number, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
};

export default function ApprovalPendingScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const isDoctor = type === 'doctor';

  const [status, setStatus] = useState<StatusValue>('PENDING');
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();
  const [polling, setPolling] = useState(true);
  const [profileData, setProfileData] = useState<DoctorOnboardingResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const resetDoctorStore = useDoctorOnboardingStore((s) => s.resetStore);
  const resetHospitalStore = useHospitalOnboardingStore((s) => s.resetStore);

  const fetchStatus = useCallback(async () => {
    try {
      const response = isDoctor
        ? await onboardingService.getDoctorOnboardingStatus()
        : await onboardingService.getHospitalOnboardingStatus();

      const raw = response.approvalStatus;
      const mapped: StatusValue =
        raw === 'APPROVED' ? 'APPROVED' : raw === 'REJECTED' ? 'REJECTED' : 'PENDING';

      setStatus(mapped);
      setRejectionReason(response.rejectionReason ?? undefined);

      if (mapped === 'APPROVED' || mapped === 'REJECTED') setPolling(false);
      if (mapped === 'APPROVED') {
        if (isDoctor) resetDoctorStore();
        else resetHospitalStore();
      }
    } catch { /* silently keep current status */ }
  }, [isDoctor, resetDoctorStore, resetHospitalStore]);

  // Fetch full submitted data so we can show it in read-only mode
  const fetchProfileData = useCallback(async () => {
    if (!isDoctor) return;
    setProfileLoading(true);
    try {
      const data = await onboardingService.getDoctorOnboarding();
      setProfileData(data);
    } catch { /* profile section simply won't render */ }
    finally { setProfileLoading(false); }
  }, [isDoctor]);

  useEffect(() => {
    fetchStatus();
    fetchProfileData();
  }, [fetchStatus, fetchProfileData]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [polling, fetchStatus]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isDoctor ? 'Doctor' : 'Hospital'} Application
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── PENDING ──────────────────────────────────────────────────────── */}
        {status === 'PENDING' && (
          <>
            {/* Status Hero */}
            <View style={styles.illustration}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.goldLight }]}>
                <Clock size={52} color={Colors.gold} strokeWidth={1.5} />
              </View>
            </View>

            <Text style={styles.title}>You're in the{'\n'}review queue!</Text>
            <Text style={styles.subtitle}>
              Our medical verification team personally reviews every profile — ensuring only qualified doctors serve patients on MedQ+.
            </Text>

            {/* Review journey */}
            <View style={styles.timeline}>
              <View style={styles.timelineStep}>
                <View style={[styles.timelineDot, styles.timelineDotDone]}>
                  <CheckCircle size={12} color={Colors.white} strokeWidth={3} />
                </View>
                <Text style={[styles.timelineLabel, styles.timelineLabelDone]}>Submitted</Text>
              </View>
              <View style={[styles.timelineBar, styles.timelineBarDone]} />
              <View style={styles.timelineStep}>
                <View style={[styles.timelineDot, styles.timelineDotCurrent]} />
                <Text style={[styles.timelineLabel, styles.timelineLabelCurrent]}>Verifying</Text>
              </View>
              <View style={styles.timelineBar} />
              <View style={styles.timelineStep}>
                <View style={styles.timelineDot} />
                <Text style={styles.timelineLabel}>Approved</Text>
              </View>
              <View style={styles.timelineBar} />
              <View style={styles.timelineStep}>
                <View style={styles.timelineDot} />
                <Text style={styles.timelineLabel}>Live</Text>
              </View>
            </View>

            {/* What happens */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>What happens during review</Text>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}><Shield size={16} color={Colors.primary} strokeWidth={2} /></View>
                <Text style={styles.infoText}>Medical council verifies your registration number and credentials</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}><Users size={16} color={Colors.primary} strokeWidth={2} /></View>
                <Text style={styles.infoText}>Our team reviews your qualifications and hospital affiliations</Text>
              </View>
              <View style={[styles.infoRow, { marginBottom: 0 }]}>
                <View style={styles.infoIcon}><Bell size={16} color={Colors.primary} strokeWidth={2} /></View>
                <Text style={styles.infoText}>You'll get an SMS and app notification the moment you're approved</Text>
              </View>
            </View>

            {/* Time expectation */}
            <View style={styles.timeNotice}>
              <Clock size={15} color="#D97706" strokeWidth={2} style={{ marginTop: 1 }} />
              <Text style={styles.timeNoticeText}>
                Approvals typically take{' '}
                <Text style={styles.timeNoticeBold}>1–3 working days</Text>.
                {' '}We review every application in the order received.
              </Text>
            </View>

            {/* ── Submitted Profile — Read-only ─────────────────────────── */}
            {isDoctor && (
              <View style={styles.profileSection}>
                <View style={styles.profileSectionHeader}>
                  <Text style={styles.profileSectionTitle}>Your Submitted Profile</Text>
                  <View style={styles.readOnlyBadge}>
                    <Text style={styles.readOnlyText}>Read-only</Text>
                  </View>
                </View>

                {profileLoading && (
                  <ActivityIndicator
                    size="small"
                    color={Colors.primary}
                    style={{ marginVertical: 24 }}
                  />
                )}

                {!profileLoading && profileData && (
                  <>
                    {/* Basic Info */}
                    {profileData.profile && (
                      <View style={styles.reviewCard}>
                        <View style={styles.reviewCardHeader}>
                          <User size={15} color={Colors.primary} strokeWidth={2} />
                          <Text style={styles.reviewCardTitle}>Basic Information</Text>
                        </View>
                        <ReviewRow
                          label="Specialization"
                          value={profileData.profile.specialization?.replace(/_/g, ' ') || '—'}
                        />
                        <ReviewRow
                          label="Registration No."
                          value={profileData.profile.registrationNumber || '—'}
                        />
                        <ReviewRow
                          label="Consultation Fee"
                          value={profileData.profile.consultationFee != null ? `₹${profileData.profile.consultationFee}` : '—'}
                        />
                        {profileData.profile.gender ? (
                          <ReviewRow label="Gender" value={profileData.profile.gender} />
                        ) : null}
                        {profileData.profile.clinicAddress ? (
                          <ReviewRow label="Clinic Address" value={profileData.profile.clinicAddress} />
                        ) : null}
                        {profileData.profile.bio ? (
                          <View style={styles.reviewRowColumn}>
                            <Text style={styles.reviewLabel}>Bio</Text>
                            <Text style={styles.reviewValueBlock} numberOfLines={4}>
                              {profileData.profile.bio}
                            </Text>
                          </View>
                        ) : null}
                        {profileData.profile.languagesSpoken && profileData.profile.languagesSpoken.length > 0 && (
                          <View style={styles.reviewRowColumn}>
                            <Text style={styles.reviewLabel}>Languages</Text>
                            <View style={styles.chipRow}>
                              {profileData.profile.languagesSpoken.map((l) => (
                                <View key={l} style={styles.chip}>
                                  <Text style={styles.chipText}>{l}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Qualifications */}
                    {profileData.details && profileData.details.qualifications.length > 0 && (
                      <View style={styles.reviewCard}>
                        <View style={styles.reviewCardHeader}>
                          <GraduationCap size={15} color={Colors.primary} strokeWidth={2} />
                          <Text style={styles.reviewCardTitle}>Qualifications</Text>
                        </View>
                        {profileData.details.qualifications.map((q, i) => (
                          <View key={i} style={styles.qualItem}>
                            <CheckCircle size={13} color={Colors.trustGreen} strokeWidth={2.5} />
                            <Text style={styles.qualText}>
                              {q.degree} — {q.institution}{q.year ? ` (${q.year})` : ''}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Services & Conditions */}
                    {profileData.details &&
                      (profileData.details.services.length > 0 || profileData.details.conditions.length > 0) && (
                      <View style={styles.reviewCard}>
                        <View style={styles.reviewCardHeader}>
                          <Stethoscope size={15} color={Colors.primary} strokeWidth={2} />
                          <Text style={styles.reviewCardTitle}>Services & Conditions</Text>
                        </View>
                        {profileData.details.services.length > 0 && (
                          <>
                            <Text style={styles.reviewSubLabel}>Services</Text>
                            <View style={styles.chipRow}>
                              {profileData.details.services.map((s) => (
                                <View key={s} style={styles.chip}>
                                  <Text style={styles.chipText}>{s}</Text>
                                </View>
                              ))}
                            </View>
                          </>
                        )}
                        {profileData.details.conditions.length > 0 && (
                          <>
                            <Text style={[styles.reviewSubLabel, { marginTop: 10 }]}>Conditions</Text>
                            <View style={styles.chipRow}>
                              {profileData.details.conditions.map((c) => (
                                <View key={c} style={[styles.chip, { backgroundColor: Colors.trustGreenLight }]}>
                                  <Text style={[styles.chipText, { color: '#16A34A' }]}>{c}</Text>
                                </View>
                              ))}
                            </View>
                          </>
                        )}
                        {profileData.details.awards && profileData.details.awards.length > 0 && (
                          <>
                            <Text style={[styles.reviewSubLabel, { marginTop: 10 }]}>Awards</Text>
                            {profileData.details.awards.map((a, i) => (
                              <View key={i} style={styles.qualItem}>
                                <CheckCircle size={13} color={Colors.gold} strokeWidth={2.5} />
                                <Text style={styles.qualText}>
                                  {a.title}{a.awardedBy ? ` — ${a.awardedBy}` : ''}{a.year ? ` (${a.year})` : ''}
                                </Text>
                              </View>
                            ))}
                          </>
                        )}
                      </View>
                    )}

                    {/* Linked Hospitals */}
                    {profileData.hospitals && profileData.hospitals.length > 0 && (
                      <View style={styles.reviewCard}>
                        <View style={styles.reviewCardHeader}>
                          <Building2 size={15} color={Colors.primary} strokeWidth={2} />
                          <Text style={styles.reviewCardTitle}>
                            Linked Hospitals ({profileData.hospitals.length})
                          </Text>
                        </View>
                        {profileData.hospitals.map((h, hi) => {
                          // Group flat availability by dayOfWeek
                          const byDay = h.availability.reduce<
                            Record<number, typeof h.availability>
                          >((acc, av) => {
                            (acc[av.dayOfWeek] = acc[av.dayOfWeek] || []).push(av);
                            return acc;
                          }, {});

                          return (
                            <View
                              key={h.hospitalId}
                              style={[
                                styles.hospitalItem,
                                hi < profileData.hospitals.length - 1 && styles.hospitalItemBorder,
                              ]}
                            >
                              <View style={styles.hospitalItemHeader}>
                                <Text style={styles.hospitalName}>{h.hospitalName}</Text>
                                {h.isPrimary && (
                                  <View style={styles.primaryBadge}>
                                    <Text style={styles.primaryBadgeText}>Primary</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.hospitalAddr}>{h.address}</Text>
                              <Text style={styles.hospitalFee}>₹{h.consultationFee} per consultation</Text>
                              {h.roomNumber ? (
                                <Text style={styles.hospitalRoom}>Room / OPD: {h.roomNumber}</Text>
                              ) : null}
                              {Object.entries(byDay).length > 0 && (
                                <View style={styles.availList}>
                                  {Object.entries(byDay).map(([day, sessions]) => (
                                    <View key={day} style={styles.availDay}>
                                      <Text style={styles.availDayLabel}>
                                        {DAY_LABELS[Number(day)]}
                                      </Text>
                                      <View style={{ flex: 1 }}>
                                        {sessions.map((s, si) => (
                                          <Text key={si} style={styles.availSession}>
                                            {s.startTime}–{s.endTime} · {s.sessionName}
                                          </Text>
                                        ))}
                                      </View>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            <Button
              title="Explore the App While You Wait"
              variant="outline"
              onPress={() => router.replace('/(tabs)')}
              size="large"
              style={{ width: '100%', marginTop: 8, marginBottom: 12 }}
            />
            <Text style={styles.pollingNote}>Status auto-checks every 30 seconds</Text>
          </>
        )}

        {/* ── APPROVED ─────────────────────────────────────────────────────── */}
        {status === 'APPROVED' && (
          <>
            <View style={styles.illustration}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.trustGreenLight }]}>
                <CheckCircle size={52} color={Colors.trustGreen} strokeWidth={1.5} />
              </View>
            </View>
            <Text style={styles.title}>You're approved!{'\n'}Welcome aboard!</Text>
            <Text style={styles.subtitle}>
              Your profile is now live. Patients across the region can discover and book appointments with you.
            </Text>
            <Button
              title="Go to Home"
              onPress={() => router.replace('/(tabs)')}
              icon={<Home size={18} color={Colors.white} strokeWidth={2} />}
              size="large"
              style={{ width: '100%' }}
            />
          </>
        )}

        {/* ── REJECTED ─────────────────────────────────────────────────────── */}
        {status === 'REJECTED' && (
          <>
            <View style={styles.illustration}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.errorLight }]}>
                <XCircle size={52} color={Colors.error} strokeWidth={1.5} />
              </View>
            </View>
            <Text style={styles.title}>Application{'\n'}Not Approved</Text>
            <Text style={styles.subtitle}>
              Please review the feedback below, update your profile, and resubmit. Our team is happy to re-review.
            </Text>
            {rejectionReason && (
              <View style={styles.rejectionCard}>
                <Text style={styles.rejectionTitle}>Reason for rejection</Text>
                <Text style={styles.rejectionText}>{rejectionReason}</Text>
              </View>
            )}
            <Button
              title="Edit & Resubmit"
              onPress={() => router.replace(isDoctor ? '/onboarding/doctor/step1' : '/onboarding/hospital/step1')}
              size="large"
              style={{ width: '100%' }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.white,
    ...crossPlatformShadow({ offsetY: 2, opacity: 0.08, radius: 8, elevation: 3 }),
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  content: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, paddingVertical: 28,
  },

  // ── Status hero ──────────────────────────────────────────────────────────
  illustration: { marginBottom: 20 },
  iconCircle: {
    width: 108, height: 108, borderRadius: 54,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 26, fontWeight: '900', color: Colors.text,
    textAlign: 'center', marginBottom: 10, lineHeight: 34,
  },
  subtitle: {
    fontSize: 15, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },

  // ── Timeline ─────────────────────────────────────────────────────────────
  timeline: { flexDirection: 'row', alignItems: 'flex-start', width: '100%', marginBottom: 24 },
  timelineStep: { alignItems: 'center', width: 52 },
  timelineDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.borderLight, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  timelineDotDone: { backgroundColor: Colors.trustGreen, borderColor: Colors.trustGreen },
  timelineDotCurrent: {
    backgroundColor: Colors.gold, borderColor: Colors.gold,
    shadowColor: Colors.gold, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  timelineBar: { flex: 1, height: 2, backgroundColor: Colors.border, marginTop: 12 },
  timelineBarDone: { backgroundColor: Colors.trustGreen },
  timelineLabel: {
    fontSize: 10, color: Colors.textLight, fontWeight: '700',
    marginTop: 6, textAlign: 'center',
  },
  timelineLabelDone: { color: Colors.trustGreen },
  timelineLabelCurrent: { color: '#D97706' },

  // ── Info card ────────────────────────────────────────────────────────────
  infoCard: {
    width: '100%', backgroundColor: Colors.white, borderRadius: 16,
    padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.borderLight,
    ...crossPlatformShadow({ offsetY: 2, opacity: 0.05, radius: 8, elevation: 2 }),
  },
  infoCardTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  infoIcon: {
    width: 34, height: 34, borderRadius: 9, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 19 },

  // ── Time notice ──────────────────────────────────────────────────────────
  timeNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.goldLight, borderRadius: 14, padding: 14,
    width: '100%', marginBottom: 24, borderWidth: 1, borderColor: Colors.gold,
  },
  timeNoticeText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 19 },
  timeNoticeBold: { fontWeight: '800', color: '#92400E' },

  // ── Profile section ──────────────────────────────────────────────────────
  profileSection: { width: '100%', marginBottom: 8 },
  profileSectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  profileSectionTitle: { fontSize: 17, fontWeight: '900', color: Colors.text },
  readOnlyBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: Colors.borderLight,
  },
  readOnlyText: { fontSize: 11, fontWeight: '700', color: Colors.textLight },

  // ── Review card (each section) ───────────────────────────────────────────
  reviewCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.borderLight,
    ...crossPlatformShadow({ offsetY: 1, opacity: 0.05, radius: 6, elevation: 1 }),
  },
  reviewCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  reviewCardTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  reviewRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  reviewRowColumn: { paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  reviewLabel: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  reviewValue: {
    fontSize: 13, fontWeight: '600', color: Colors.text,
    maxWidth: '55%', textAlign: 'right',
  },
  reviewValueBlock: { fontSize: 13, color: Colors.text, lineHeight: 18, marginTop: 4 },
  reviewSubLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    backgroundColor: Colors.primaryLight,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  qualItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 5 },
  qualText: { fontSize: 13, color: Colors.text, flex: 1, lineHeight: 18 },

  // ── Hospital item ────────────────────────────────────────────────────────
  hospitalItem: { paddingVertical: 12 },
  hospitalItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  hospitalItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  hospitalName: { fontSize: 14, fontWeight: '800', color: Colors.text, flex: 1 },
  primaryBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: Colors.primaryLight,
  },
  primaryBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  hospitalAddr: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  hospitalFee: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  hospitalRoom: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  availList: { marginTop: 8, gap: 6 },
  availDay: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  availDayLabel: {
    fontSize: 12, fontWeight: '700', color: Colors.primary,
    width: 34, paddingTop: 1,
  },
  availSession: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  // ── Rejection ────────────────────────────────────────────────────────────
  rejectionCard: {
    backgroundColor: Colors.errorLight, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.error, width: '100%', marginBottom: 20,
  },
  rejectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.error, marginBottom: 6 },
  rejectionText: { fontSize: 14, color: Colors.text, lineHeight: 20 },

  pollingNote: { fontSize: 12, color: Colors.textLight, textAlign: 'center', marginTop: 4 },
});
