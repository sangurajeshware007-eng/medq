/**
 * WebShell — desktop framing for the phone-designed app (web only)
 *
 * On web, centers the app in a column so every screen looks intentional on
 * desktop without per-screen work ("mobile-web-first"). Screens that have a
 * real responsive layout opt into a wider column via WIDE_ROUTES.
 *
 * On native it renders children untouched.
 */
import { usePathname } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Colors } from '../../constants/Colors';
import { shadows } from '../../theme/shadows';

const PHONE_MAX_WIDTH = 480;
const WIDE_MAX_WIDTH = 1080;

/**
 * Route prefixes that get the wide column. Only list screens whose layout
 * actually adapts (via useBreakpoint) — a phone layout stretched to 1080px
 * looks worse than a centered 480px column.
 */
const WIDE_ROUTES = ['/search', '/hospitals'];

function isWideRoute(pathname: string): boolean {
  return WIDE_ROUTES.some((prefix) => pathname.startsWith(prefix));
}

export default function WebShell({ children }: { children: React.ReactNode }) {
  // Hooks must run unconditionally; the pathname is only used on web.
  const pathname = usePathname();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const maxWidth = isWideRoute(pathname) ? WIDE_MAX_WIDTH : PHONE_MAX_WIDTH;

  return (
    <View style={styles.page}>
      <View style={[styles.column, { maxWidth }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    // Slightly darker than the app background so the column edge reads.
    backgroundColor: '#E6EEF4',
  },
  column: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.background,
    ...shadows.lg,
  },
});
