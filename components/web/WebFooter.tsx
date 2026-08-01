/**
 * WebFooter — site footer for the web build (null on native).
 *
 * Because +html.tsx locks body scroll, each browsing screen appends this at
 * the end of its own scroller (home, search, doctor detail; hospitals uses
 * ListFooterComponent) — so it appears where a web user expects: at the end
 * of the page content.
 */
import { useRouter } from 'expo-router';
import { Mail, Phone } from 'lucide-react-native';
import React from 'react';
import { Image, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Colors } from '../../constants/Colors';

const LOGO = require('../../assets/logo/new/logo-icon.png');

const CONTACT_EMAIL = 'bookflow2026@gmail.com';
const CONTACT_PHONE = '+919008036561';

interface WebFooterProps {
  /** Per-screen inset compensation (e.g. negative margins to run full-bleed). */
  style?: StyleProp<ViewStyle>;
}

function FooterLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.link}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function WebFooter({ style }: WebFooterProps) {
  const router = useRouter();

  if (Platform.OS !== 'web') return null;

  return (
    <View style={[styles.footer, style]}>
      <View style={styles.inner}>
        <View style={styles.columns}>
          {/* Brand */}
          <View style={[styles.col, styles.brandCol]}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            <Text style={styles.blurb}>
              Book doctor appointments, track your live queue token, and find hospitals near you.
            </Text>
          </View>

          {/* Explore */}
          <View style={styles.col}>
            <Text style={styles.colTitle}>Explore</Text>
            <FooterLink label="Find Doctors" onPress={() => router.push('/(tabs)/search')} />
            <FooterLink label="Hospitals" onPress={() => router.push('/hospitals')} />
            <FooterLink label="Near Me" onPress={() => router.push('/nearme')} />
            <FooterLink label="My Bookings" onPress={() => router.push('/(tabs)/booking')} />
          </View>

          {/* Contact */}
          <View style={styles.col}>
            <Text style={styles.colTitle}>Contact</Text>
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`).catch(() => {})}
              activeOpacity={0.7}
            >
              <Mail size={14} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={styles.link}>{CONTACT_EMAIL}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`tel:${CONTACT_PHONE}`).catch(() => {})}
              activeOpacity={0.7}
            >
              <Phone size={14} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={styles.link}>{CONTACT_PHONE}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomBar}>
          <Text style={styles.copyright}>
            © {new Date().getFullYear()} MedQ+. All rights reserved.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: 32,
  },
  inner: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
  },
  columns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 40,
    rowGap: 24,
  },
  col: { gap: 8, minWidth: 160 },
  brandCol: { flex: 1, minWidth: 220, maxWidth: 360 },
  logo: { width: 95, height: 36, marginBottom: 4 },
  blurb: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  colTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.text,
    marginBottom: 4,
  },
  link: { fontSize: 13.5, color: Colors.textSecondary, fontWeight: '500' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: 24,
    paddingTop: 14,
  },
  copyright: { fontSize: 12, color: Colors.textLight },
});
