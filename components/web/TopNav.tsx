/**
 * TopNav — desktop-web navigation bar (Practo/Zocdoc-style).
 *
 * Rendered once in app/_layout.tsx above the <Stack>, so it appears on every
 * route. Because +html.tsx locks body scroll (screens scroll internally), a
 * plain sibling View here is naturally sticky.
 *
 * Self-gating: renders nothing on native, below the md breakpoint (phone web
 * keeps the bottom tab bar), and on chrome-free flows (login/onboarding).
 * Auth comes from the provider-free zustand store; language/location hooks
 * work because this mounts inside those providers.
 */
import { Link, usePathname, useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation } from '../../context/LocationContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useAuthStore } from '../../store/authStore';
import { crossPlatformShadow } from '../../utils/shadow';
import LanguageToggle from '../LanguageToggle';

const LOGO = require('../../assets/logo/new/logo-icon.png');
// Brand size knob — source PNG is 671×253 (≈2.65:1); keep that ratio.
const LOGO_WIDTH = 132;
const LOGO_HEIGHT = Math.round(LOGO_WIDTH / 2.65);

const CHROME_FREE_PREFIXES = ['/login', '/otp', '/register', '/complete-profile', '/onboarding'];

export default function TopNav() {
  // All hooks run unconditionally; gating happens below.
  const router = useRouter();
  const pathname = usePathname();
  const { isMd } = useBreakpoint();
  const { t } = useLanguage();
  const { displayName, detecting } = useLocation();
  const { isLoggedIn, user, initializing } = useAuthStore();

  if (Platform.OS !== 'web' || !isMd) return null;
  if (CHROME_FREE_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const firstName = user?.name?.split(' ')[0] || 'Profile';

  return (
    <View style={styles.bar} testID="top-nav">
      <View style={styles.inner}>
        {/* Brand */}
        <Link href="/" asChild>
          <Pressable accessibilityRole="link">
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </Pressable>
        </Link>

        {/* Primary navigation lives in the SideNav rail */}
        <View style={styles.spacer} />

        {/* Location */}
        <TouchableOpacity
          style={styles.locationPill}
          onPress={() => router.push('/location-picker')}
          activeOpacity={0.7}
        >
          <MapPin size={14} color={Colors.accent} strokeWidth={2.5} />
          <Text style={styles.locationText} numberOfLines={1}>
            {detecting ? t('detectingLocation') : displayName}
          </Text>
          <Text style={styles.locationCaret}>▼</Text>
        </TouchableOpacity>

        <LanguageToggle />

        {/* Auth area — fixed width while auth restores to avoid a
            Sign-in → avatar flicker on reload for logged-in users. */}
        {initializing ? (
          <View style={styles.authPlaceholder} />
        ) : isLoggedIn ? (
          <TouchableOpacity
            style={styles.profileChip}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{firstName[0]?.toUpperCase() ?? 'U'}</Text>
            </View>
            <Text style={styles.profileName} numberOfLines={1}>
              {firstName}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.signInText}>Sign in</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    zIndex: 100,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 2,
      opacity: 0.05,
      radius: 8,
      elevation: 3,
    }),
  },
  inner: {
    width: '100%',
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  logo: { width: LOGO_WIDTH, height: LOGO_HEIGHT },
  spacer: { flex: 1 },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    maxWidth: 200,
  },
  locationText: { fontSize: 13, color: Colors.primary, fontWeight: '700', flexShrink: 1 },
  locationCaret: { fontSize: 9, color: Colors.primary, fontWeight: '700' },
  authPlaceholder: { width: 96, height: 38 },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
    paddingRight: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.white, fontSize: 14, fontWeight: '800' },
  profileName: { fontSize: 14, fontWeight: '600', color: Colors.text, maxWidth: 110 },
  signInBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  signInText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
});
