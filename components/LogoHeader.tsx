import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, AlertTriangle } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from './LanguageToggle';
import { crossPlatformShadow } from '../utils/shadow';

// New brand wordmark — 524×183 PNG with "MedQ+" baked in on a teal gradient.
const LOGO = require('../assets/logo/new/logo-icon.png');

/**
 * Shared logo header — shown at the top of every tab.
 * Displays the MedQ+ brand, location picker, and language toggle.
 */
export default function LogoHeader() {
    const router = useRouter();
    const { displayName, detecting } = useLocation();
    const { t } = useLanguage();

    return (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                {/* Brand wordmark — assets/logo/new/logo-icon.png */}
                <Image source={LOGO} style={styles.logo} resizeMode="contain" />

                {/* Location pill — sits to the right of the logo, fills available width */}
                <TouchableOpacity
                    style={styles.locationRow}
                    onPress={() => router.push('/location-picker')}
                    activeOpacity={0.6}
                >
                    <MapPin size={14} color={Colors.accent} strokeWidth={2.5} />
                    <Text style={styles.locationText} numberOfLines={1}>
                        {detecting ? t('detectingLocation') : displayName}
                    </Text>
                    <Text style={styles.locationDropdown}>▼</Text>
                </TouchableOpacity>

                <LanguageToggle />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: Colors.white,
        paddingHorizontal: 18,
        paddingBottom: 14,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        ...crossPlatformShadow({ color: Colors.shadowDark, offsetY: 4, opacity: 0.08, radius: 16, elevation: 5 }),
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',         // vertically centre logo, location pill and language toggle
        gap: 10,
        paddingTop: 8,
    },
    logo: {
        // Source PNG is 671×253 (≈ 2.65 : 1). Match that aspect so resizeMode="contain"
        // fills the box edge-to-edge and no transparent padding is visible.
        width: 95,
        height: 36,
    },
    appName: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.primary,
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    locationRow: {
        flex: 1,
        flexShrink: 1,
        minWidth: 0,                  // critical: lets the pill shrink below its content width
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
    },
    locationText: {
        flex: 1,
        flexShrink: 1,
        minWidth: 0,                  // same trick — allows numberOfLines={1} to truncate with …
        fontSize: 13,
        color: Colors.primary,
        fontWeight: '700',
    },
    locationDropdown: {
        fontSize: 9,
        color: Colors.primary,
        marginLeft: 4,
        fontWeight: '700',
    },
});
