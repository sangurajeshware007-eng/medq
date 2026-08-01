/**
 * SideNav — desktop-web left navigation rail.
 *
 * Carries the app's primary destinations (the ones the bottom tab bar has
 * on phones) plus discovery shortcuts. Mounted beside the <Stack> in
 * app/_layout.tsx; null on native, below md, and on chrome-free flows.
 * TopNav keeps brand/location/language/profile; this rail owns navigation.
 */
import { Link, usePathname } from 'expo-router';
import {
  Calendar,
  Home,
  Hospital,
  LayoutDashboard,
  MapPin,
  Search,
  User,
} from 'lucide-react-native';
import React from 'react';
import type { ComponentType } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/Colors';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useAuthStore } from '../../store/authStore';

const CHROME_FREE_PREFIXES = ['/login', '/otp', '/register', '/complete-profile', '/onboarding'];

interface Item {
  label: string;
  href: string;
  Icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  exact?: boolean;
}

function RailLink({ item, active }: { item: Item; active: boolean }) {
  const { Icon } = item;
  // Link asChild drops function-style results from the wrapped Pressable,
  // so the visual styling lives on an inner View and hover is tracked
  // explicitly — this survives whatever style merging Link performs.
  const [hovered, setHovered] = React.useState(false);
  return (
    <Link href={item.href} asChild>
      <Pressable
        accessibilityRole="link"
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
      >
        <View style={[styles.item, hovered && styles.itemHovered, active && styles.itemActive]}>
          <Icon
            size={20}
            color={active ? Colors.primary : Colors.textSecondary}
            strokeWidth={active ? 2.4 : 1.9}
          />
          <Text style={[styles.itemText, active && styles.itemTextActive]}>{item.label}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

export default function SideNav() {
  // Hooks run unconditionally; gating below.
  const pathname = usePathname();
  const { isMd } = useBreakpoint();
  const { user } = useAuthStore();

  if (Platform.OS !== 'web' || !isMd) return null;
  if (CHROME_FREE_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const isDoctor = user?.role === 'DOCTOR';
  const primary: Item[] = [
    { label: 'Home', href: '/', Icon: Home, exact: true },
    { label: 'Search', href: '/search', Icon: Search },
    { label: 'Bookings', href: '/booking', Icon: Calendar },
    ...(isDoctor ? [{ label: 'Dashboard', href: '/dashboard', Icon: LayoutDashboard }] : []),
    { label: 'Profile', href: '/profile', Icon: User },
  ];
  const discover: Item[] = [
    { label: 'Hospitals', href: '/hospitals', Icon: Hospital },
    { label: 'Near Me', href: '/nearme', Icon: MapPin },
  ];
  const isActive = (item: Item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <View style={styles.rail} testID="side-nav">
      <View style={styles.group}>
        {primary.map((item) => (
          <RailLink key={item.href} item={item} active={isActive(item)} />
        ))}
      </View>
      <View style={styles.divider} />
      <Text style={styles.groupLabel}>Discover</Text>
      <View style={styles.group}>
        {discover.map((item) => (
          <RailLink key={item.href} item={item} active={isActive(item)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: 216,
    backgroundColor: Colors.white,
    borderRightWidth: 1,
    borderRightColor: Colors.borderLight,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  group: { gap: 2 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  itemHovered: { backgroundColor: Colors.background },
  itemActive: { backgroundColor: Colors.primaryLight },
  itemText: { fontSize: 14.5, fontWeight: '600', color: Colors.textSecondary },
  itemTextActive: { color: Colors.primary, fontWeight: '700' },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 14,
    marginHorizontal: 4,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.textLight,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
});
