import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { useLanguage } from '../context/LanguageContext';
import { crossPlatformShadow } from '../utils/shadow';
import { getIcon, CATEGORY_ICON_COLORS } from '../constants/IconMap';

interface CategoryCardProps {
  icon: string;
  nameKey: string;
  color: string;
  isSelected?: boolean;
  onPress: () => void;
}

export default function CategoryCard({ icon, nameKey, color, isSelected, onPress }: CategoryCardProps) {
  const { t } = useLanguage();
  const IconComponent = getIcon(nameKey);
  const iconColor = isSelected ? Colors.primary : (CATEGORY_ICON_COLORS[nameKey] || '#555');

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isSelected ? Colors.primaryLight : color },
          isSelected && styles.iconContainerSelected,
        ]}
      >
        <IconComponent size={28} color={iconColor} strokeWidth={2} />
      </View>
      <Text style={[styles.label, isSelected && styles.labelSelected]} numberOfLines={2}>
        {t(nameKey)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 76,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...crossPlatformShadow({ color: Colors.shadowDark, offsetY: 3, opacity: 0.1, radius: 8, elevation: 3 }),
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  iconContainerSelected: {
    borderColor: Colors.primary,
    ...crossPlatformShadow({ color: Colors.primary, offsetY: 3, opacity: 0.25, radius: 8, elevation: 3 }),
  },
  icon: {
    fontSize: 28,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
  },
  labelSelected: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
