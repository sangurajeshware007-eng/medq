import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { crossPlatformShadow } from '../utils/shadow';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      ...styles.base,
      ...sizeStyles[size],
    };

    switch (variant) {
      case 'primary':
        return { ...base, backgroundColor: Colors.primary };
      case 'secondary':
        return { ...base, backgroundColor: Colors.primaryLight };
      case 'outline':
        return { ...base, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary };
      case 'success':
        return { ...base, backgroundColor: Colors.trustGreen };
      case 'danger':
        return { ...base, backgroundColor: Colors.error };
      default:
        return { ...base, backgroundColor: Colors.primary };
    }
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = { ...styles.text, ...textSizeStyles[size] };
    switch (variant) {
      case 'secondary':
        return { ...base, color: Colors.primary };
      case 'outline':
        return { ...base, color: Colors.primary };
      default:
        return { ...base, color: Colors.white };
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.white} />
      ) : (
        <>
          {icon}
          {/* numberOfLines={1} prevents the awkward "Book Appointme / nt" wrapping seen on
              narrow phones (iPhone 12 / SE). adjustsFontSizeToFit gracefully shrinks the
              label by up to 20% before truncating with an ellipsis. */}
          <Text
            style={[getTextStyle(), textStyle]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const sizeStyles: Record<string, ViewStyle> = {
  small: { paddingVertical: 8, paddingHorizontal: 16 },
  medium: { paddingVertical: 14, paddingHorizontal: 24 },
  large: { paddingVertical: 18, paddingHorizontal: 32 },
};

const textSizeStyles: Record<string, TextStyle> = {
  small: { fontSize: 13 },
  medium: { fontSize: 16 },
  large: { fontSize: 18 },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...crossPlatformShadow({ color: Colors.shadowDark, offsetY: 4, opacity: 0.18, radius: 12, elevation: 5 }),
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

