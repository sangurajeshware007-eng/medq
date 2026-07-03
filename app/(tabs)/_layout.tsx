import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, Calendar, HeartPulse, User, LayoutDashboard } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { crossPlatformShadow } from '../../utils/shadow';
import { useAuthStore } from '../../store/authStore';
import ErrorFallback from '../../components/ErrorFallback';

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return <ErrorFallback error={error} retry={retry} />;
}

function TabIcon({ IconComponent, focused }: { IconComponent: React.ElementType; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <IconComponent
        size={24}
        color={focused ? Colors.primary : Colors.textLight}
        strokeWidth={focused ? 2.5 : 1.8}
      />
    </View>
  );
}

/**
 * BookingTabIcon — a custom composite icon that reads as "doctor appointment".
 *
 * Concept: a Calendar (scheduling) with a small HeartPulse (healthcare) badge
 * tucked into its bottom-right corner. Two universal symbols stacked into one
 * brand-unique mark — instantly communicates "your medical appointments" in a
 * way no single off-the-shelf icon does.
 *
 * Active-state polish:
 *   • Calendar fills with the brand teal
 *   • Heart-pulse badge becomes coral red (the "alive" medical accent)
 *   • Soft glow underneath for tactile lift
 */
function BookingTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      {/* Layer 1 — calendar base */}
      <Calendar
        size={24}
        color={focused ? Colors.primary : Colors.textLight}
        strokeWidth={focused ? 2.5 : 1.8}
      />

      {/* Layer 2 — heart-pulse mini-badge in the bottom-right corner.
          White circle background so it reads cleanly against the calendar's grid lines. */}
      <View
        style={[
          styles.bookingBadge,
          focused && styles.bookingBadgeActive,
        ]}
      >
        <HeartPulse
          size={9}
          color={focused ? Colors.accent : Colors.textLight}
          strokeWidth={focused ? 3 : 2.2}
          fill="transparent"
        />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { isLoggedIn, initializing, user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const isDoctor = user?.role === 'DOCTOR';

  // While auth state is being restored, show a loader instead of mounting <Tabs>.
  // Mounting Tabs and then switching to <Redirect> on the same render cycle leaves
  // React Navigation's internal state in an inconsistent shape and triggers
  // "Cannot read property 'stale' of undefined" on the next login.
  if (initializing) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 64 + insets.bottom,
            paddingBottom: 6 + insets.bottom,
          },
        ],
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon IconComponent={Home} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon IconComponent={Search} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <BookingTabIcon focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          href: isDoctor ? undefined : null,
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon IconComponent={LayoutDashboard} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon IconComponent={User} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 2,
    borderTopColor: Colors.primaryLight,
    paddingTop: 6,
    ...crossPlatformShadow({ color: Colors.shadowDark, offsetY: -6, opacity: 0.18, radius: 28, elevation: 18 }),
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabItem: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  tabItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  // ── Booking icon: calendar + heart-pulse composite ─────────────────────
  // The badge sits in the bottom-right of the calendar in its own white circle
  // so the heart-pulse glyph stays legible against the calendar's grid lines.
  bookingBadge: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: Colors.borderLight,
  },
  bookingBadgeActive: {
    borderColor: Colors.accent,             // coral border on active — pairs with the
    ...crossPlatformShadow({ color: Colors.accent, opacity: 0.35, offsetY: 2, radius: 4, elevation: 3 }),
  },
});
