import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Radii, Typography } from '../../constants/theme';

export interface BadgeProps {
  label: string;
  category?: string;
  variant?: 'category' | 'pill' | 'activePill' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  category,
  variant = 'pill',
  size = 'sm',
  style,
  textStyle,
}) => {
  let bg: string = Colors.surfaceAlt;
  let textColor: string = Colors.textSecondary;
  let borderColor: string = Colors.border;

  if (category && (Colors.categories as any)[category]) {
    const catStyle = (Colors.categories as any)[category];
    bg = catStyle.bg;
    textColor = catStyle.text;
    borderColor = catStyle.border;
  } else if (variant === 'activePill') {
    bg = Colors.primary;
    textColor = Colors.textInverse;
    borderColor = Colors.primary;
  } else if (variant === 'pill') {
    bg = Colors.surface;
    textColor = Colors.textSecondary;
    borderColor = Colors.border;
  } else if (variant === 'success') {
    bg = Colors.successBg;
    textColor = Colors.primary;
    borderColor = Colors.primaryBorder;
  } else if (variant === 'warning') {
    bg = Colors.warningBg;
    textColor = Colors.warning;
    borderColor = '#FDE68A';
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: borderColor,
          paddingVertical: isSmall ? 3 : 6,
          paddingHorizontal: isSmall ? 8 : 12,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: isSmall ? Typography.sizes.xs : Typography.sizes.sm,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: Radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: Typography.weights.medium,
  },
});
