import React, { useState } from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { Image, type ImageStyle } from 'expo-image';

interface AvatarImageProps {
  /** Image URI from API (may be a ui-avatars.com URL or actual photo) */
  uri: string | undefined | null;
  /** Name used to derive initials for the fallback */
  name: string;
  /** Size of the avatar (width & height) */
  size?: number;
  /** Border radius — defaults to size/2 (circle) */
  borderRadius?: number;
  /** Background color for the initials fallback */
  fallbackBg?: string;
  /** Text color for the initials */
  fallbackColor?: string;
  /** Extra style for the container */
  style?: ViewStyle;
}

/**
 * Reliable avatar using expo-image.
 * Shows colored initials when URI is missing or fails.
 */
export default function AvatarImage({
  uri,
  name,
  size = 60,
  borderRadius,
  fallbackBg = '#0052CC',
  fallbackColor = '#FFFFFF',
  style,
}: AvatarImageProps) {
  const [failed, setFailed] = useState(false);
  const radius = borderRadius ?? size / 2;

  // expo-image's Image.style expects ImageStyle, not ViewStyle
  const imageStyle: ImageStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    backgroundColor: '#E2E8F0',
    ...(style as ImageStyle),
  };

  const fallbackStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    overflow: 'hidden',
    backgroundColor: fallbackBg,
    justifyContent: 'center',
    alignItems: 'center',
    ...style,
  };

  // Show the real image if URI exists and hasn't failed
  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={imageStyle}
        contentFit="cover"
        transition={300}
        onError={() => setFailed(true)}
      />
    );
  }

  // Fallback: colored circle with initials
  const fontSize = Math.max(size * 0.38, 12);
  const initials = getInitials(name);

  return (
    <View style={fallbackStyle}>
      <Text style={{ color: fallbackColor, fontSize, fontWeight: '800', letterSpacing: 1 }}>
        {initials}
      </Text>
    </View>
  );
}

/** Extract up to 2 initials from a name string */
function getInitials(name: string): string {
  if (!name) return '?';
  const words = name.replace(/^Dr\.?\s*/i, '').trim().split(/\s+/);
  if (words.length === 0) return '?';
  if (words.length === 1) return (words[0] ?? '').substring(0, 2).toUpperCase();
  return ((words[0]?.[0] ?? '') + (words[words.length - 1]?.[0] ?? '')).toUpperCase();
}
