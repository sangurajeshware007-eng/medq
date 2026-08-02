import { useRouter } from 'expo-router';
import {
  User,
  Stethoscope,
  Edit,
  Globe,
  ClipboardList,
  HelpCircle,
  LogOut,
  Mail,
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
  Briefcase,
  Activity,
  Users,
  Power,
  Trash2,
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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
// Phase 1: English only
// import LanguageToggle from '../../components/LanguageToggle';
import LogoHeader from '../../components/LogoHeader';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  useDoctorDashboard,
  useHospitalManagerDashboard,
  useDoctorOnboardingStatus,
  useHospitalOnboardingStatus,
  useDeactivateProfile,
} from '../../hooks/useApiHooks';
import { displayPhone } from '../../services/authService';
import { crossPlatformShadow } from '../../utils/shadow';

import { contentColumn } from '@/theme';

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
  const isReceptionist = user?.role === 'HOSPITAL_RECEPTIONIST';
  const isPatient = !user?.role || user.role === 'PATIENT';
  const { data: doctorData, isLoading: doctorLoading } = useDoctorDashboard({ enabled: isDoctor });
  const { data: hospitalData, isLoading: hospitalLoading } = useHospitalManagerDashboard({
    enabled: isHospitalManager,
  });
  // For patients: check if they've started any onboarding (drives smart CTA)
  const { data: doctorOnboardingStatus } = useDoctorOnboardingStatus({
    enabled: isPatient && isLoggedIn,
  });
  const { data: hospitalOnboardingStatus } = useHospitalOnboardingStatus({
    enabled: isPatient && isLoggedIn,
  });
  const deactivate = useDeactivateProfile();

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

  const handleDeactivate = () => {
    const doctorSuffix =
      isDoctor && doctorData
        ? '\n\nYour profile will no longer appear in patient searches and any upcoming appointments will be cancelled.'
        : '';
    Alert.alert(
      'Deactivate account?',
      `Your profile will be hidden and any upcoming bookings cancelled. You can log in again anytime to restore it.${doctorSuffix}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await deactivate.mutateAsync(undefined);
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Unable to deactivate account.';
              Alert.alert('Could not deactivate', message);
              return;
            }
            Alert.alert(
              'Account deactivated',
              'Your profile is now hidden and upcoming bookings have been cancelled. Sign in again anytime with the same phone number to restore your account.',
              [
                {
                  text: 'OK',
                  onPress: async () => {
                    await logout();
                    router.replace('/(auth)/login');
                  },
                },
              ],
              { cancelable: false },
            );
          },
        },
      ],
    );
  };

  const handleDeletePress = () => {
    router.push('/profile/delete-confirm');
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
            <Text style={styles.userPhone}>{displayPhone(user?.phone) || '—'}</Text>
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
              <Text style={styles.infoValue}>{displayPhone(user?.phone) || '—'}</Text>
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
                  <>
                    <TouchableOpacity
                      style={styles.addHospitalBtn}
                      onPress={() => router.push('/doctor/patients')}
                      activeOpacity={0.75}
                    >
                      <View style={styles.addHospitalLeft}>
                        <Users size={16} color={Colors.primary} strokeWidth={2.5} />
                        <Text style={styles.addHospitalText}>My Patients</Text>
                      </View>
                      <ChevronRight size={18} color={Colors.primary} strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.addHospitalBtn, { marginTop: 8 }]}
                      onPress={() => router.push('/doctor/add-hospital')}
                      activeOpacity={0.75}
                    >
                      <View style={styles.addHospitalLeft}>
                        <Building2 size={16} color={Colors.primary} strokeWidth={2.5} />
                        <Text style={styles.addHospitalText}>Join an Existing Hospital</Text>
                      </View>
                      <PlusCircle size={18} color={Colors.primary} strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.addHospitalBtn, { marginTop: 8 }]}
                      onPress={() => router.push('/onboarding/hospital/step1')}
                      activeOpacity={0.75}
                    >
                      <View style={styles.addHospitalLeft}>
                        <Building2 size={16} color={Colors.primary} strokeWidth={2.5} />
                        <Text style={styles.addHospitalText}>Register a New Hospital</Text>
                      </View>
                      <PlusCircle size={18} color={Colors.primary} strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.addHospitalBtn, { marginTop: 8 }]}
                      onPress={() => router.push('/staff/add-receptionist')}
                      activeOpacity={0.75}
                    >
                      <View style={styles.addHospitalLeft}>
                        <Users size={16} color={Colors.primary} strokeWidth={2.5} />
                        <Text style={styles.addHospitalText}>Add Receptionist</Text>
                      </View>
                      <PlusCircle size={18} color={Colors.primary} strokeWidth={2} />
                    </TouchableOpacity>
                  </>
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

                {hospitalData.approvalStatus === 'APPROVED' && (
                  <TouchableOpacity
                    style={styles.editHospitalBtn}
                    onPress={() => router.push('/onboarding/hospital/step1?mode=edit' as never)}
                    activeOpacity={0.85}
                  >
                    <Edit size={14} color={Colors.white} strokeWidth={2.2} />
                    <Text style={styles.editHospitalTxt}>Edit Hospital Details</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text style={styles.statusEmpty}>
                Complete hospital onboarding to see your profile.
              </Text>
            )}
          </Card>
        )}

        {/* Receptionist card */}
        {isReceptionist && (
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Briefcase size={18} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.statusTitle}>Reception Desk</Text>
            </View>
            <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 10 }}>
              You are a hospital receptionist. Access your front-desk tools below.
            </Text>
            <TouchableOpacity
              style={styles.addHospitalBtn}
              onPress={() => router.push('/reception')}
              activeOpacity={0.75}
            >
              <View style={styles.addHospitalLeft}>
                <Activity size={16} color={Colors.primary} strokeWidth={2.5} />
                <Text style={styles.addHospitalText}>Open Reception Desk</Text>
              </View>
              <ChevronRight size={18} color={Colors.primary} strokeWidth={2} />
            </TouchableOpacity>
          </Card>
        )}

        {/* Hospital Manager — Staff link */}
        {isHospitalManager && (
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/staff/manage')}>
            <Card style={styles.menuCard}>
              <View style={styles.menuRow}>
                <Users
                  size={18}
                  color={Colors.primary}
                  strokeWidth={2}
                  style={{ marginRight: 12 }}
                />
                <Text style={styles.menuText}>Manage Staff</Text>
                <ChevronRight size={16} color={Colors.textLight} strokeWidth={2} />
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {/* Language Setting */}
        <Card style={styles.settingCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Globe size={16} color={Colors.text} strokeWidth={2} />
            <Text style={styles.settingTitle}>{t('language')}</Text>
          </View>
          {/* Phase 1: English only */}
          {/* <LanguageToggle /> */}
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

        {/* Provider section — only for PATIENT role; state-aware per entity */}
        {isPatient && (
          <Card style={styles.providerCard}>
            <View style={styles.providerHeader}>
              <UserPlus size={22} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.providerTitle}>Join as a Provider</Text>
            </View>

            {/* Doctor CTA */}
            {(!doctorOnboardingStatus ||
              doctorOnboardingStatus.approvalStatus === 'NOT_STARTED') && (
              <TouchableOpacity
                style={styles.providerBtn}
                onPress={() => router.push('/onboarding/doctor/step1')}
              >
                <Stethoscope size={18} color={Colors.white} strokeWidth={2} />
                <Text style={styles.providerBtnText}>Become a Doctor</Text>
                <ArrowRight
                  size={14}
                  color={Colors.white}
                  strokeWidth={2.5}
                  style={{ marginLeft: 'auto' }}
                />
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
            {(!hospitalOnboardingStatus ||
              hospitalOnboardingStatus.approvalStatus === 'NOT_STARTED') && (
              <TouchableOpacity
                style={[styles.providerBtn, styles.providerBtnHospital]}
                onPress={() => router.push('/onboarding/hospital/step1')}
              >
                <Building2 size={18} color={Colors.primary} strokeWidth={2} />
                <Text style={[styles.providerBtnText, { color: Colors.primary }]}>
                  Add a Hospital
                </Text>
                <ArrowRight
                  size={14}
                  color={Colors.primary}
                  strokeWidth={2.5}
                  style={{ marginLeft: 'auto' }}
                />
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

        {/* Help & Support */}
        <View style={styles.helpCard}>
          <View style={styles.helpHeader}>
            <HelpCircle size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.helpTitle}>Help & Support</Text>
          </View>

          <TouchableOpacity
            style={styles.helpRow}
            onPress={() => Linking.openURL('tel:+919008036561')}
            activeOpacity={0.75}
          >
            <View style={styles.helpRowLeft}>
              <Phone size={16} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={styles.helpContact}>+91 90080 36561</Text>
            </View>
            <ChevronRight size={16} color={Colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.helpDivider} />

          <TouchableOpacity
            style={styles.helpRow}
            onPress={() => Linking.openURL('mailto:bookflow2026@gmail.com')}
            activeOpacity={0.75}
          >
            <View style={styles.helpRowLeft}>
              <Mail size={16} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={styles.helpContact}>bookflow2026@gmail.com</Text>
            </View>
            <ChevronRight size={16} color={Colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone — deactivate / delete */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerLabel}>Account</Text>

          <TouchableOpacity
            style={styles.dangerRow}
            onPress={handleDeactivate}
            activeOpacity={0.75}
            disabled={deactivate.isPending}
          >
            <View style={styles.dangerLeft}>
              <Power size={18} color={Colors.error} strokeWidth={2} />
              <View style={{ flex: 1 }}>
                <Text style={styles.dangerTitle}>Deactivate Account</Text>
                <Text style={styles.dangerHint}>
                  Hide your profile. Log in again anytime to restore.
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={Colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.dangerDivider} />

          <TouchableOpacity
            style={styles.dangerRow}
            onPress={handleDeletePress}
            activeOpacity={0.75}
          >
            <View style={styles.dangerLeft}>
              <Trash2 size={18} color={Colors.error} strokeWidth={2} />
              <View style={{ flex: 1 }}>
                <Text style={styles.dangerTitle}>Delete Account</Text>
                <Text style={styles.dangerHint}>
                  Permanently remove your account. This cannot be undone.
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={Colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

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
  contentContainer: { ...contentColumn, padding: 16 },
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
  helpCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  helpRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  helpContact: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  helpDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 2,
  },
  dangerZone: {
    marginTop: 16,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.errorLight ?? Colors.borderLight,
    paddingVertical: 4,
  },
  dangerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dangerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.error,
  },
  dangerHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dangerDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 16,
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
  editHospitalBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  editHospitalTxt: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '700' as const,
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
