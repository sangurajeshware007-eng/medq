import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Home, Search, ClipboardList, User } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { crossPlatformShadow } from '../../utils/shadow';
import { useAuthStore } from '../../store/authStore';

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

export default function TabLayout() {
  const { isLoggedIn, initializing } = useAuthStore();

  if (!initializing && !isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
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
      <Tabs.Screen name="PremiumHomeScreen" options={{ href: null }} />
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
            <TabIcon IconComponent={ClipboardList} focused={focused} />
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
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 2, // Make border more visible
    borderTopColor: Colors.primaryLight, // Subtle premium border
    height: Platform.OS === 'ios' ? 85 : 64,
    paddingBottom: Platform.OS === 'ios' ? 22 : 6,
    paddingTop: 6,
    ...crossPlatformShadow({ color: Colors.shadowDark, offsetY: -6, opacity: 0.18, radius: 28, elevation: 18 }), // Stronger shadow
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabItem: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1.5, // Add border to tab icon
    borderColor: Colors.primaryLight,
    ...crossPlatformShadow({ color: Colors.primary, offsetY: 2, opacity: 0.10, radius: 8, elevation: 4 }), // Soft shadow for icon
  },
  tabItemActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary, // Highlight active tab
    borderWidth: 2,
    ...crossPlatformShadow({ color: Colors.primary, offsetY: 2, opacity: 0.18, radius: 12, elevation: 8 }), // Stronger shadow for active
  },
});
