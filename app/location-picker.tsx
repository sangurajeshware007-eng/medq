import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Search, Building2, Satellite, Map, Clock, Star as StarIcon } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { useLanguage } from '../context/LanguageContext';
import { useLocation, LocationItem } from '../context/LocationContext';
import { searchLocations, getPopularCities, POPULAR_LOCATIONS } from '../utils/locationData';
import { crossPlatformShadow } from '../utils/shadow';

export default function LocationPickerScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { setLocation, recentLocations } = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationItem[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const popularCities = getPopularCities();

  useEffect(() => {
    // Auto-focus the search input
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  useEffect(() => {
    if (query.trim().length >= 2) {
      setResults(searchLocations(query));
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSelectLocation = (location: LocationItem) => {
    Keyboard.dismiss();
    setLocation(location);
    router.back();
  };

  const handleUseCurrentLocation = async () => {
    setGpsLoading(true);
    try {
      const ExpoLocation = await import('expo-location');
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Fallback to default
        handleSelectLocation(POPULAR_LOCATIONS[0]); // Hubli Vidyanagar
        return;
      }
      const loc = await ExpoLocation.getCurrentPositionAsync();

      // Find nearest location from our list
      const nearest = findNearestLocation(loc.coords.latitude, loc.coords.longitude);
      handleSelectLocation(nearest);
    } catch {
      // Fallback to Hubli
      handleSelectLocation(POPULAR_LOCATIONS[0]);
    } finally {
      setGpsLoading(false);
    }
  };

  const findNearestLocation = (lat: number, lng: number): LocationItem => {
    let minDist = Infinity;
    let nearest = POPULAR_LOCATIONS[0];
    for (const loc of POPULAR_LOCATIONS) {
      const dist = Math.sqrt(
        Math.pow(lat - loc.latitude, 2) + Math.pow(lng - loc.longitude, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = loc;
      }
    }
    return nearest;
  };

  const renderLocationItem = ({ item }: { item: LocationItem }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => handleSelectLocation(item)}
      activeOpacity={0.6}
    >
      <View style={styles.locationIcon}>
        <MapPin size={16} color={Colors.primary} strokeWidth={2.5} />
      </View>
      <View style={styles.locationInfo}>
        <Text style={styles.locationArea}>{item.area}</Text>
        <Text style={styles.locationCity}>
          {item.city}, {item.state}
          {item.pincode ? ` - ${item.pincode}` : ''}
        </Text>
      </View>
      <Text style={styles.locationArrow}>→</Text>
    </TouchableOpacity>
  );

  const renderCityChip = ({ item }: { item: LocationItem }) => (
    <TouchableOpacity
      style={styles.cityChip}
      onPress={() => handleSelectLocation(item)}
      activeOpacity={0.7}
    >
      <Building2 size={16} color={Colors.text} strokeWidth={2} />
      <Text style={styles.cityChipText}>{item.city}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('selectLocation')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={16} color={Colors.textLight} strokeWidth={2} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={t('searchLocationPlaceholder')}
            placeholderTextColor={Colors.textLight}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* GPS Button */}
      <TouchableOpacity
        style={styles.gpsButton}
        onPress={handleUseCurrentLocation}
        activeOpacity={0.7}
        disabled={gpsLoading}
      >
        {gpsLoading ? (
          <ActivityIndicator size="small" color={Colors.accent} />
        ) : (
          <Satellite size={22} color={Colors.accent} strokeWidth={2} />
        )}
        <View style={styles.gpsTextWrap}>
          <Text style={styles.gpsTitle}>{t('useCurrentLocation')}</Text>
          <Text style={styles.gpsSubtitle}>{t('usingGPS')}</Text>
        </View>
        <Text style={styles.gpsArrow}>→</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Content based on search state */}
      {query.trim().length >= 2 ? (
        // Search Results
        <View style={styles.listContainer}>
          {results.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>
                {results.length} {t('locationsFound')}
              </Text>
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                renderItem={renderLocationItem}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />
            </>
          ) : (
            <View style={styles.emptyState}>
              <Map size={40} color={Colors.textLight} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>{t('noLocationsFound')}</Text>
              <Text style={styles.emptyDesc}>{t('tryDifferentSearch')}</Text>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <>
              {/* Recent Locations */}
              {recentLocations.length > 0 && (
                <View style={styles.section}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} color={Colors.textSecondary} strokeWidth={2} />
                    <Text style={styles.sectionLabel}>{t('recentLocations')}</Text>
                  </View>
                  {recentLocations.map((loc) => (
                    <TouchableOpacity
                      key={loc.id}
                      style={styles.recentItem}
                      onPress={() => handleSelectLocation(loc)}
                      activeOpacity={0.6}
                    >
                      <View style={styles.recentIcon}>
                        <Clock size={14} color={Colors.gold} strokeWidth={2} />
                      </View>
                      <View style={styles.locationInfo}>
                        <Text style={styles.locationArea}>{loc.area}</Text>
                        <Text style={styles.locationCity}>{loc.city}, {loc.state}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Popular Cities */}
              <View style={styles.section}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <StarIcon size={14} color={Colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.sectionLabel}>{t('popularCities')}</Text>
                </View>
                <FlatList
                  data={popularCities}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  renderItem={renderCityChip}
                  contentContainerStyle={styles.cityChipList}
                />
              </View>

              {/* All Areas */}
              <View style={styles.section}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} color={Colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.sectionLabel}>{t('allAreas')}</Text>
                </View>
              </View>
            </>
          }
          keyExtractor={() => 'header'}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            <FlatList
              data={POPULAR_LOCATIONS.slice(0, 20)}
              keyExtractor={(item) => item.id}
              renderItem={renderLocationItem}
              scrollEnabled={false}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  searchContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
    ...Platform.select({
      web: { outlineStyle: 'none' as any },
    }),
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.accentLight,
    ...crossPlatformShadow({ color: Colors.accent, offsetY: 4, opacity: 0.1, radius: 12, elevation: 4 }),
  },
  gpsIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  gpsTextWrap: {
    flex: 1,
  },
  gpsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.accent,
  },
  gpsSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  gpsArrow: {
    fontSize: 18,
    color: Colors.accent,
    fontWeight: '700',
  },
  divider: {
    height: 8,
    backgroundColor: Colors.background,
    marginTop: 10,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  locationIconText: {
    fontSize: 18,
  },
  locationInfo: {
    flex: 1,
  },
  locationArea: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  locationCity: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
  },
  locationArrow: {
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '600',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentIconText: {
    fontSize: 16,
  },
  cityChipList: {
    paddingBottom: 4,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...crossPlatformShadow({ color: Colors.shadow, offsetY: 2, opacity: 0.06, radius: 8, elevation: 2 }),
  },
  cityChipIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  cityChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textLight,
  },
});

