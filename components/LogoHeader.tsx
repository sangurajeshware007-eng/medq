import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, AlertTriangle } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from './LanguageToggle';
import MedQLogo from './brand/MedQLogo';
import { crossPlatformShadow } from '../utils/shadow';

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
                <View style={styles.headerLeft}>
                    {/* Brand glyph + wordmark — see components/brand/MedQLogo.tsx */}
                    <MedQLogo variant="wordmark" size={24} />
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
                </View>
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
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: 8,
    },
    headerLeft: {
        flex: 1,
        marginRight: 12,
    },
    appName: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.primary,
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        marginTop: 2,
    },
    locationText: {
        fontSize: 13,
        color: Colors.primary,
        fontWeight: '700',
        flex: 1,
    },
    locationDropdown: {
        fontSize: 9,
        color: Colors.primary,
        marginLeft: 4,
        fontWeight: '700',
    },
});
