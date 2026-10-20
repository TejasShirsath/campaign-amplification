import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import { Colors, Radii, Typography } from '../../constants/theme';

export interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string | null;
  displayName?: string | null;
  email?: string | null;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: StyleProp<ViewStyle>;
}

const SIZE_MAP = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 64,
  xl: 84,
};

function getInitials(name?: string | null, displayName?: string | null, email?: string | null): string {
  const target = (displayName || name || '').trim();
  if (target) {
    const parts = target.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return target.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 1).toUpperCase();
  }
  return '';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  name,
  displayName,
  email,
  size = 'md',
  style,
}) => {
  const [imageError, setImageError] = useState(false);

  // Reset image error if avatarUrl changes
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const dim = typeof size === 'number' ? size : SIZE_MAP[size] || 44;
  const initials = getInitials(name, displayName, email);
  const fontSize = Math.max(11, Math.round(dim * 0.38));
  const iconSize = Math.round(dim * 0.48);

  const hasImage = !!avatarUrl && !imageError;

  return (
    <View
      style={[
        styles.container,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
        },
        style,
      ]}
    >
      {hasImage ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: dim, height: dim, borderRadius: dim / 2 }}
          contentFit="cover"
          transition={200}
          onError={() => setImageError(true)}
        />
      ) : initials ? (
        <View
          style={[
            styles.initialsContainer,
            { width: dim, height: dim, borderRadius: dim / 2 },
          ]}
        >
          <Text
            style={[
              styles.initialsText,
              { fontSize, lineHeight: fontSize + 2 },
            ]}
          >
            {initials}
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.fallbackContainer,
            { width: dim, height: dim, borderRadius: dim / 2 },
          ]}
        >
          <User size={iconSize} color={Colors.textMuted} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBg,
  },
  initialsText: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
    letterSpacing: -0.2,
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
});
