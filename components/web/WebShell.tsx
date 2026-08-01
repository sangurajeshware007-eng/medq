/**
 * WebShell — desktop framing for the app (web only)
 *
 * Browsing surfaces are fluid: they fill the browser window up to a cap for
 * very large monitors, and adapt at every width via useBreakpoint in the
 * screens themselves. Form-centric flows (auth, onboarding) keep a narrow
 * centered column — stretched single-column forms are worse UX than a
 * readable one.
 *
 * On native it renders children untouched.
 */
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Colors } from '../../constants/Colors';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { shadows } from '../../theme/shadows';

/** Very large monitors get a centered column instead of a 2560px stretch. */
const FLUID_MAX_WIDTH = 1440;

export default function WebShell({ children }: { children: React.ReactNode }) {
  // Hook must run unconditionally; the value is only used on web.
  const { width } = useBreakpoint();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={styles.page}>
      <View style={[styles.column, width > FLUID_MAX_WIDTH && styles.framed]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    // Slightly darker than the app background so the column edge reads
    // when the window is wider than the content cap.
    backgroundColor: '#E6EEF4',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: FLUID_MAX_WIDTH,
    backgroundColor: Colors.background,
  },
  framed: {
    ...shadows.lg,
  },
});
