import { useRouter } from 'expo-router';
import {
  User,
  Stethoscope,
  Edit,
  Globe,
  ClipboardList,
  HelpCircle,
  LogOut,
  Phone,
  ChevronRight,
  Building2,
  UserPlus,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ArrowRight,
  PlusCircle,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import LanguageToggle from '../../components/LanguageToggle';
import LogoHeader from '../../components/LogoHeader';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  useDoctorDashboard,
  useHospitalManagerDashboard,
  useDoctorOnboardingStatus,
  useHospitalOnboardingStatus,
} from '../../hooks/useApiHooks';
import { crossPlatformShadow } from '../../utils/shadow';

export default function ProfileScreen() {
  const { t } = useLanguage();
  const { user, isLoggedIn, logout, updateProfile } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || 'Patient');
  const [email, setEmail] = useState(user?.email || '');

  // Role-specific status data — hooks always called (Rules of Hooks)
  const isDoctor = user?.role === 'DOCTOR';
  const isHospitalManager = user?.role === 'HOSPITAL_MANAGER';
  const isPatient = !user?.role || user.role === 'PATIENT';
  const { data: doctorData, isLoading: doctorLoading } = useDoctorDashboard({ enabled: isDoctor });
  const { data: hospitalData, isLoading: hospitalLoading } = useHospitalManagerDashboard({
    enabled: isHospitalManager,
  });
  // For patients: check if they've started any onboarding (drives smart CTA)
  const { data: doctorOnboardingStatus } = useDoctorOnboardingStatus({ enabled: isPatient && isLoggedIn });
  const { data: hospitalOnboardingStatus } = useHospitalOnboardingStatus({ enabled: isPatient && isLoggedIn });

  // If not logged in, show a simple prompt
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* App-wide logo header */}
        <LogoHeader />

        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <User size={22} color={Colors.text} strokeWidth={2.5} />
            <Text style={styles.headerTitle}>{t('myProfile')}</Text>
          </View>
        </View>
        <View style={styles.loginPrompt}>
          <Stethoscope size={64} color={Colors.primary} strokeWidth={1.5} />
          <Text style={styles.loginTitle}>{t('welcome')}</Text>
          <Text style={styles.loginSubtitle}>{t('loginSubtitle')}</Text>
          <Button
            title={t('login')}
            onPress={() => router.push('/(auth)/login')}
            style={styles.loginBtn}
          />
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLink}>{t('dontHaveAccount')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    const success = await updateProfile({
      name: name.trim(),
      email: email.trim() || undefined,
    });
    if (success) setEditing(false);
  };

  const handleLogout = async () => {
    Alert.alert(t('logout'), 'Are you sure you want to logout?', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* App-wide logo header */}
      <LogoHeader />

      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <User size={22} color={Colors.text} strokeWidth={2.5} />
          <Text style={styles.headerTitle}>{t('myProfile')}</Text>
        </View>
        {!editing && (
          <TouchableOpacity
            onPress={() => setEditing(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Edit size={14} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.editBtn}>{t('editProfile')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <User size={36} color={Colors.primary} strokeWidth={1.8} />
          </View>
          <Text style={styles.userName}>{user?.name || name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Phone size={14} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.userPhone}>{user?.phone || '9876543210'}</Text>
          </View>
        </View>

        {/* Profile Info */}
        {editing ? (
          <Card style={styles.editCard}>
            <Input
              label={t('fullName')}
              value={name}
              onChangeText={setName}
              placeholder={t('fullName')}
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.editActions}>
              <Button
                title={t('cancel')}
                variant="outline"
                onPress={() => setEditing(false)}
                style={styles.actionBtn}
              />
              <Button title={t('save')} onPress={handleSave} style={styles.actionBtn} />
            </View>
          </Card>
        ) : (
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('fullName')}</Text>
              <Text style={styles.infoValue}>{user?.name || name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('phone')}</Text>
              <Text style={styles.infoValue}>{user?.phone || '—'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || '—'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('language')}</Text>
              <Text style={styles.infoValue}>{user?.preferredLanguage || 'en'}</Text>
            </View>
          </Card>
        )}

        {/* Doctor status card — for approved doctors */}
        {isDoctor && (
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Stethoscope size={18} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.statusTitle}>Doctor Profile</Text>
              <TouchableOpacity
                onPress={() => router.push('/doctor/edit-profile')}
                style={styles.editProfileBtn}
              >
                <Edit size={13} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.editProfileBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
            {doctorLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 8 }} />
            ) : doctorData ? (
              <>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Status</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusBg(doctorData.approvalStatus) },
                    ]}
                  >
                    {doctorData.approvalStatus === 'APPROVED' ? (
                      <CheckCircle
                        size={12}
                        color={statusColor(doctorData.approvalStatus)}
                        strokeWidth={2.5}
                      />
                    ) : doctorData.approvalStatus === 'REJECTED' ? (
                      <XCircle
                        size={12}
                        color={statusColor(doctorData.approvalStatus)}
                        strokeWidth={2.5}
                      />
                    ) : (
                      <Clock
                        size={12}
                        color={statusColor(doctorData.approvalStatus)}
                        strokeWidth={2.5}
                      />
                    )}
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: statusColor(doctorData.approvalStatus) },
                      ]}
                    >
                      {doctorData.approvalStatus}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Specialization</Text>
                  <Text style={styles.statusValue}>
                    {doctorData.specialization.replace(/_/g, ' ')}
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Profile Strength</Text>
                  <Text style={styles.statusValue}>{doctorData.profileStrength}%</Text>
                </View>
                {doctorData.primaryHospital && (
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Primary Hospital</Text>
                    <Text style={styles.statusValue} numberOfLines={1}>
                      {doctorData.primaryHospital.hospitalName}
                    </Text>
                  </View>
                )}
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Month Revenue</Text>
                  <Text style={[styles.statusValue, { color: Colors.trustGreen }]}>
                    ₹{Number(doctorData.revenue.monthRevenue).toLocaleString('en-IN')}
                  </Text>
                </View>

                {doctorData.approvalStatus === 'APPROVED' && (
                  <TouchableOpacity
                    style={styles.addHospitalBtn}
                    onPress={() => router.push('/doctor/add-hospital')}
                    activeOpacity={0.75}
                  >
                    <View style={styles.addHospitalLeft}>
                      <Building2 size={16} color={Colors.primary} strokeWidth={2.5} />
                      <Text style={styles.addHospitalText}>
                        {doctorData.primaryHospital ? 'Add Another Hospital' : 'Add Your Hospital'}
                      </Text>
                    </View>
                    <PlusCircle size={18} color={Colors.primary} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text style={styles.statusEmpty}>Complete onboarding to see your profile.</Text>
            )}
          </Card>
        )}

        {/* Hospital Manager status card */}
        {isHospitalManager && (
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Building2 size={18} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.statusTitle}>Hospital Profile</Text>
            </View>
            {hospitalLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 8 }} />
            ) : hospitalData ? (
              <>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Status</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusBg(hospitalData.approvalStatus) },
                    ]}
                  >
                    {hospitalData.approvalStatus === 'APPROVED' ? (
                      <CheckCircle
                        size={12}
                        color={statusColor(hospitalData.approvalStatus)}
                        strokeWidth={2.5}
                      />
                    ) : hospitalData.approvalStatus === 'REJECTED' ? (
                      <XCircle
                        size={12}
                        color={statusColor(hospitalData.approvalStatus)}
                        strokeWidth={2.5}
                      />
                    ) : (
                      <Clock
                        size={12}
                        color={statusColor(hospitalData.approvalStatus)}
                        strokeWidth={2.5}
                      />
                    )}
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: statusColor(hospitalData.approvalStatus) },
                      ]}
                    >
                      {hospitalData.approvalStatus}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Hospital</Text>
                  <Text style={styles.statusValue} numberOfLines={1}>
                    {hospitalData.hospitalName}
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Linked Doctors</Text>
                  <Text style={styles.statusValue}>{hospitalData.totalDoctors}</Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Month Revenue</Text>
                  <Text style={[styles.statusValue, { color: Colors.trustGreen }]}>
                    ₹{Number(hospitalData.stats.monthRevenue).toLocaleString('en-IN')}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.statusEmpty}>
                Complete hospital onboarding to see your profile.
              </Text>
            )}
          </Card>
        )}

        {/* Language Setting */}
        <Card style={styles.settingCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Globe size={16} color={Colors.text} strokeWidth={2} />
            <Text style={styles.settingTitle}>{t('language')}</Text>
          </View>
          <LanguageToggle />
        </Card>

        {/* My Bookings shortcut */}
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/booking')}>
          <Card style={styles.menuCard}>
            <View style={styles.menuRow}>
              <ClipboardList
                size={18}
                color={Colors.primary}
                strokeWidth={2}
                style={{ marginRight: 12 }}
              />
              <Text style={styles.menuText}>{t('myBookings')}</Text>
              <ChevronRight size={16} color={Colors.textLight} strokeWidth={2} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Help */}
        <TouchableOpacity style={styles.menuItem}>
          <Card style={styles.menuCard}>
            <View style={styles.menuRow}>
              <HelpCircle
                size={18}
                color={Colors.primary}
                strokeWidth={2}
                style={{ marginRight: 12 }}
              />
              <Text style={styles.menuText}>{t('helpSupport')}</Text>
              <ChevronRight size={16} color={Colors.textLight} strokeWidth={2} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Provider section — only for PATIENT role; state-aware per entity */}
        {isPatient && (
          <Card style={styles.providerCard}>
            <View style={styles.providerHeader}>
              <UserPlus size={22} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.providerTitle}>Join as a Provider</Text>
            </View>

            {/* Doctor CTA */}
            {(!doctorOnboardingStatus || doctorOnboardingStatus.approvalStatus === 'NOT_STARTED') && (
              <TouchableOpacity
                style={styles.providerBtn}
                onPress={() => router.push('/onboarding/doctor/step1')}
              >
                <Stethoscope size={18} color={Colors.white} strokeWidth={2} />
                <Text style={styles.providerBtnText}>Become a Doctor</Text>
                <ArrowRight size={14} color={Colors.white} strokeWidth={2.5} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            )}

            {doctorOnboardingStatus?.approvalStatus === 'DRAFT' && (
              <TouchableOpacity
                style={styles.providerBtnInProgress}
                onPress={() => router.push('/onboarding/doctor/step1')}
              >
                <Stethoscope size={18} color={Colors.primary} strokeWidth={2} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.providerBtnText, { color: Colors.primary }]}>
                    Continue Doctor Application
                  </Text>
                  <Text style={styles.providerBtnSub}>
                    {doctorOnboardingStatus.profileStrength}% complete
                  </Text>
                </View>
                <ArrowRight size={14} color={Colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            )}

            {doctorOnboardingStatus?.approvalStatus === 'PENDING' && (
              <TouchableOpacity
                style={styles.providerBtnStatus}
                onPress={() => router.push('/onboarding/approval-pending?type=doctor')}
              >
                <Clock size={16} color={Colors.primary} strokeWidth={2} />
                <Text style={[styles.providerBtnText, { color: Colors.primary, flex: 1 }]}>
                  Doctor Application Under Review
                </Text>
                <ChevronRight size={14} color={Colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            )}

            {doctorOnboardingStatus?.approvalStatus === 'REJECTED' && (
              <View>
                <View style={styles.rejectionBanner}>
                  <AlertCircle size={14} color={Colors.error} strokeWidth={2} />
                  <Text style={styles.rejectionText} numberOfLines={2}>
                    {doctorOnboardingStatus.rejectionReason || 'Application was not approved.'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.providerBtnDanger}
                  onPress={() => router.push('/onboarding/doctor/step1')}
                >
                  <Stethoscope size={18} color={Colors.white} strokeWidth={2} />
                  <Text style={styles.providerBtnText}>Resubmit Doctor Application</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.providerDivider} />

            {/* Hospital CTA */}
            {(!hospitalOnboardingStatus || hospitalOnboardingStatus.approvalStatus === 'NOT_STARTED') && (
              <TouchableOpacity
                style={[styles.providerBtn, styles.providerBtnHospital]}
                onPress={() => router.push('/onboarding/hospital/step1')}
              >
                <Building2 size={18} color={Colors.primary} strokeWidth={2} />
                <Text style={[styles.providerBtnText, { color: Colors.primary }]}>
                  Add a Hospital
                </Text>
                <ArrowRight size={14} color={Colors.primary} strokeWidth={2.5} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            )}

            {hospitalOnboardingStatus?.approvalStatus === 'DRAFT' && (
              <TouchableOpacity
                style={styles.providerBtnInProgress}
                onPress={() => router.push('/onboarding/hospital/step1')}
              >
                <Building2 size={18} color={Colors.primary} strokeWidth={2} />
                <Text style={[styles.providerBtnText, { color: Colors.primary, flex: 1 }]}>
                  Continue Hospital Application
                </Text>
                <ArrowRight size={14} color={Colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            )}

            {hospitalOnboardingStatus?.approvalStatus === 'PENDING' && (
              <TouchableOpacity
                style={styles.providerBtnStatus}
                onPress={() => router.push('/onboarding/approval-pending?type=hospital')}
              >
                <Clock size={16} color={Colors.primary} strokeWidth={2} />
                <Text style={[styles.providerBtnText, { color: Colors.primary, flex: 1 }]}>
                  Hospital Application Under Review
                </Text>
                <ChevronRight size={14} color={Colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            )}

            {hospitalOnboardingStatus?.approvalStatus === 'REJECTED' && (
              <View>
                <View style={styles.rejectionBanner}>
                  <AlertCircle size={14} color={Colors.error} strokeWidth={2} />
                  <Text style={styles.rejectionText} numberOfLines={2}>
                    {hospitalOnboardingStatus.rejectionReason || 'Application was not approved.'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.providerBtnDanger}
                  onPress={() => router.push('/onboarding/hospital/step1')}
                >
                  <Building2 size={18} color={Colors.white} strokeWidth={2} />
                  <Text style={styles.providerBtnText}>Resubmit Hospital Application</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )}

        {/* Logout */}
        <Button
          title={t('logout')}
          variant="danger"
          onPress={handleLogout}
          icon={<LogOut size={16} color={Colors.white} strokeWidth={2} />}
          style={styles.logoutBtn}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function statusBg(status: string): string {
  switch (status) {
    case 'APPROVED':
      return Colors.trustGreenLight;
    case 'REJECTED':
      return Colors.errorLight;
    default:
      return Colors.primaryLight;
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'APPROVED':
      return Colors.trustGreen;
    case 'REJECTED':
      return Colors.error;
    default:
      return Colors.primary;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...crossPlatformShadow({
      color: Colors.shadow,
      offsetY: 2,
      opacity: 1,
      radius: 8,
      elevation: 3,
    }),
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
  },
  editBtn: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
    marginBottom: 10,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  userPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  editCard: {
    marginBottom: 16,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
  },
  genderOptionActive: {
    backgroundColor: Colors.primary,
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  genderTextActive: {
    color: Colors.white,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  settingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  menuItem: {
    marginBottom: 8,
  },
  menuCard: {
    padding: 14,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  menuArrow: {
    fontSize: 16,
    color: Colors.textLight,
  },
  logoutBtn: {
    marginTop: 16,
  },
  bottomSpacer: {
    height: 20,
  },
  loginPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loginEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  loginBtn: {
    width: '100%',
    marginBottom: 16,
  },
  registerLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  providerCard: {
    marginTop: 16,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed' as const,
  },
  providerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 6,
  },
  providerTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  providerDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  providerBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    marginBottom: 4,
  },
  providerBtnHospital: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  providerBtnInProgress: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: 4,
  },
  providerBtnStatus: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    marginBottom: 4,
  },
  providerBtnDanger: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.error,
    marginBottom: 4,
  },
  providerBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  providerBtnSub: {
    fontSize: 11,
    color: Colors.primary,
    marginTop: 1,
  },
  providerDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 8,
  },
  rejectionBanner: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 6,
    backgroundColor: Colors.errorLight,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  rejectionText: {
    flex: 1,
    fontSize: 12,
    color: Colors.error,
    lineHeight: 17,
  },
  editProfileBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginLeft: 'auto' as const,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  statusRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  statusLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    maxWidth: '55%' as const,
    textAlign: 'right' as const,
  },
  statusBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  statusEmpty: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  addHospitalBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed' as const,
  },
  addHospitalLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  addHospitalText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
});
