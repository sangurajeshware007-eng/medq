/**
 * WelcomeHero — the brand-led greeting block at the top of the patient home tab.
 *
 * Visual layers (back to front):
 *   1. Solid teal canvas (primary brand colour)
 *   2. Two soft circular tints for organic depth (primaryDark + primaryLight)
 *   3. Brand glyph watermark anchored to the right edge at ~12% opacity
 *   4. Greeting + name + tagline (white text)
 *   5. Glass search bar (semi-transparent white) the user can tap to jump to /search
 *   6. Stat pills row (e.g. "🏥 12 hospitals", "👨‍⚕️ 47 doctors")
 *
 * Bottom corners are heavily rounded so the hero "spills" into the white content
 * canvas below, echoing the rounded brand glyph.
 */
import {
  Search,
  Sun,
  Sunrise,
  Moon,
  Hospital,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  Banknote,
  BadgePercent,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  Platform,
} from 'react-native';

import { Colors } from '../../constants/Colors';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { FORM_MAX_WIDTH } from '../../theme';
import { crossPlatformShadow } from '../../utils/shadow';

const GLYPH = require('../../assets/logo/new/app-icon.png');

const ROTATION_INTERVAL_MS = 5000;
const FADE_DURATION_MS = 400;

export interface HeroBackgroundImage {
  imageUrl: string;
  caption?: string | null;
}

interface WelcomeHeroProps {
  userName: string;
  isLoggedIn: boolean;
  tagline: string;
  hospitalsCount?: number;
  doctorsCount?: number;
  searchPlaceholder?: string;
  onSearchPress: () => void;
  /** When provided, the search bar becomes a real input; submitting calls this. */
  onSearchSubmit?: (query: string) => void;
  /**
   * One or more landmark photos. When provided, replaces the default teal
   * canvas with these images (auto-cycling every 5 s when count > 1) plus a
   * dark teal overlay so foreground text stays readable. Empty array or
   * undefined falls back to the default canvas.
   */
  backgroundImages?: HeroBackgroundImage[];
}

function getGreeting(): { text: string; Icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', Icon: Sunrise };
  if (hour < 17) return { text: 'Good Afternoon', Icon: Sun };
  return { text: 'Good Evening', Icon: Moon };
}

export default function WelcomeHero({
  userName,
  isLoggedIn,
  tagline,
  hospitalsCount,
  doctorsCount,
  searchPlaceholder = 'Search doctors, hospitals, or symptoms…',
  onSearchPress,
  onSearchSubmit,
  backgroundImages,
}: WelcomeHeroProps) {
  const { text: greeting, Icon: GreetingIcon } = getGreeting();
  // Desktop web: taller hero, larger type, constrained search width.
  const { isMd, isLg } = useBreakpoint();
  const wide = Platform.OS === 'web' && isMd;

  // Rotating placeholder suggestions — nudge users toward what search understands.
  // Phase 1: English/Latin only (transliterated terms like "bukhar" still
  // resolve via the fuzzy disease search).
  const suggestions = [
    'Try "fever"…',
    'Try "bukhar"…',
    'Try "dentist near me"…',
    'Try "skin specialist"…',
    'Try a doctor name…',
  ];
  const [searchText, setSearchText] = useState('');
  const [suggestionIdx, setSuggestionIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSuggestionIdx((i) => (i + 1) % suggestions.length), 3500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const submitSearch = () => {
    const q = searchText.trim();
    if (onSearchSubmit && q) onSearchSubmit(q);
    else onSearchPress();
  };

  const images = backgroundImages ?? [];
  const hasImages = images.length > 0;
  const [currentIdx, setCurrentIdx] = useState(0);
  const fadeOpacity = useRef(new Animated.Value(1)).current;

  // Reset to the first image whenever the list itself changes (user moved
  // to a different location, admin added new photos, etc.). Without this
  // a stale index could point past the end of the new array.
  useEffect(() => {
    setCurrentIdx(0);
    fadeOpacity.setValue(1);
  }, [images.length, images[0]?.imageUrl, fadeOpacity]);

  // Auto-rotate every 5s when there are 2+ images. Single image = no interval.
  useEffect(() => {
    if (images.length <= 1) return;
    let cancelled = false;
    const interval = setInterval(() => {
      Animated.timing(fadeOpacity, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }).start(() => {
        if (cancelled) return;
        setCurrentIdx((i) => (i + 1) % images.length);
        Animated.timing(fadeOpacity, {
          toValue: 1,
          duration: FADE_DURATION_MS,
          useNativeDriver: true,
        }).start();
      });
    }, ROTATION_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [images.length, fadeOpacity]);

  const currentImage = hasImages ? images[Math.min(currentIdx, images.length - 1)] : null;

  // Inner content shared between the image-backed and default canvas.
  const innerContent = (
    <>
      {/* Layer 4: greeting copy */}
      <View style={styles.copy}>
        <View style={styles.greetingRow}>
          <GreetingIcon size={16} color="rgba(255,255,255,0.85)" strokeWidth={2.5} />
          <Text style={styles.greetingText}>{greeting}</Text>
        </View>
        <Text style={[styles.title, wide && styles.titleWide]}>
          {isLoggedIn ? `${userName}!` : 'Welcome to MedQ+'}
        </Text>
        <Text style={[styles.subtitle, wide && styles.subtitleWide]} numberOfLines={2}>
          {tagline}
        </Text>
      </View>

      {/* Layer 5: glass search bar — a real input; typing here lands on /search */}
      <View style={[styles.searchBar, wide && styles.searchBarWide]}>
        <View style={styles.searchIcon}>
          <Search size={16} color={Colors.primary} strokeWidth={2.5} />
        </View>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder={searchText ? searchPlaceholder : suggestions[suggestionIdx]}
          placeholderTextColor="rgba(255,255,255,0.75)"
          returnKeyType="search"
          onSubmitEditing={submitSearch}
          autoCorrect={false}
        />
        <TouchableOpacity onPress={submitSearch} hitSlop={8} activeOpacity={0.8}>
          <ChevronRight size={18} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Trust strip — the reasons to book here, right where the eye lands */}
      <View style={styles.trustRow}>
        <View style={styles.trustChip}>
          <ShieldCheck size={11} color={Colors.white} strokeWidth={2.5} />
          <Text style={styles.trustText}>Verified doctors</Text>
        </View>
        <View style={styles.trustChip}>
          <Banknote size={11} color={Colors.white} strokeWidth={2.5} />
          <Text style={styles.trustText}>Pay at clinic</Text>
        </View>
        <View style={styles.trustChip}>
          <BadgePercent size={11} color={Colors.white} strokeWidth={2.5} />
          <Text style={styles.trustText}>₹0 booking fee</Text>
        </View>
      </View>

      {/* Layer 6: stat pills */}
      {(hospitalsCount !== undefined || doctorsCount !== undefined) && (
        <View style={styles.statRow}>
          {hospitalsCount !== undefined && (
            <View style={styles.statPill}>
              <Hospital size={11} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.statText}>
                {hospitalsCount} {hospitalsCount === 1 ? 'hospital' : 'hospitals'} nearby
              </Text>
            </View>
          )}
          {doctorsCount !== undefined && (
            <View style={styles.statPill}>
              <Stethoscope size={11} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.statText}>
                {doctorsCount} {doctorsCount === 1 ? 'doctor' : 'doctors'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Caption row — landmark name + photo count when multiple */}
      {currentImage && currentImage.caption && (
        <View style={styles.captionRow}>
          <Text style={styles.caption} numberOfLines={1}>
            📍 {currentImage.caption}
          </Text>
          {images.length > 1 && (
            <Text style={styles.captionCount}>
              {currentIdx + 1}/{images.length}
            </Text>
          )}
        </View>
      )}
    </>
  );

  // Image-backed variant: layered canvas — fading photo + brand-tinted overlay
  // + content stack on top.
  if (currentImage) {
    return (
      <View style={styles.wrap}>
        <View style={[styles.canvas, wide && (isLg ? styles.canvasLg : styles.canvasWide)]}>
          {/* Animated image layer — fades independently of overlay/content. */}
          <Animated.View style={[styles.imageLayer, { opacity: fadeOpacity }]} pointerEvents="none">
            <Image
              source={{ uri: currentImage.imageUrl }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          </Animated.View>
          {/* Dark teal overlay — keeps text readable, independent of fade. */}
          <View style={styles.imageOverlay} pointerEvents="none" />
          {innerContent}
        </View>
      </View>
    );
  }

  // Default canvas: solid teal + organic decorative blobs.
  return (
    <View style={styles.wrap}>
      <View style={[styles.canvas, wide && (isLg ? styles.canvasLg : styles.canvasWide)]}>
        <View style={[styles.blob, styles.blobOne]} />
        <View style={[styles.blob, styles.blobTwo]} />
        <View style={[styles.blob, styles.blobThree]} />

        {/* Brand glyph watermark — anchored bottom-right, very faded */}
        <Image source={GLYPH} style={styles.watermark} resizeMode="contain" />
        {innerContent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 28,
    overflow: 'hidden',
    ...crossPlatformShadow({
      color: Colors.primaryDark,
      offsetY: 10,
      opacity: 0.22,
      radius: 22,
      elevation: 12,
    }),
  },
  canvas: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  // Desktop-web variants — taller, roomier hero band.
  canvasWide: {
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 32,
    minHeight: 240,
    justifyContent: 'center',
  },
  canvasLg: {
    paddingHorizontal: 48,
    paddingTop: 48,
    paddingBottom: 40,
    minHeight: 280,
    justifyContent: 'center',
  },
  titleWide: { fontSize: 34 },
  subtitleWide: { fontSize: 15, maxWidth: FORM_MAX_WIDTH },
  searchBarWide: { maxWidth: FORM_MAX_WIDTH, paddingVertical: 13 },
  imageLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    // Brand-tinted dark gradient simulation — solid teal at 62% opacity keeps
    // foreground text readable while letting the landmark photo show through.
    backgroundColor: 'rgba(10, 126, 140, 0.62)',
  },
  captionRow: {
    position: 'absolute',
    right: 14,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  caption: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.3,
  },
  captionCount: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  // Decorative blobs — soft tinted circles add organic depth without a gradient lib
  blob: { position: 'absolute', borderRadius: 999 },
  blobOne: {
    width: 220,
    height: 220,
    top: -90,
    right: -80,
    backgroundColor: Colors.primaryDark,
    opacity: 0.28,
  },
  blobTwo: {
    width: 160,
    height: 160,
    bottom: -60,
    left: -40,
    backgroundColor: Colors.primaryLight,
    opacity: 0.1,
  },
  blobThree: {
    width: 90,
    height: 90,
    top: 30,
    left: 60,
    backgroundColor: Colors.white,
    opacity: 0.06,
  },
  watermark: {
    position: 'absolute',
    right: -20,
    bottom: -16,
    width: 150,
    height: 150,
    opacity: 0.12,
  },
  copy: { marginBottom: 18 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  greetingText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 4,
    lineHeight: 19,
    maxWidth: '85%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  searchIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.white,
    paddingVertical: 0,
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  statText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.2,
  },
});
