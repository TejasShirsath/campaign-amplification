import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { Colors, Radii, Spacing, Typography } from '../../constants/theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  showArrow?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  showArrow = false,
  icon,
  style,
  textStyle,
}) => {
  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radii.lg,
    };

    // Sizing
    if (size === 'sm') {
      base = { ...base, paddingVertical: Spacing.xs + 2, paddingHorizontal: Spacing.md, height: 36 };
    } else if (size === 'lg') {
      base = { ...base, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, height: 54 };
    } else {
      base = { ...base, paddingVertical: Spacing.md - 2, paddingHorizontal: Spacing.lg, height: 48 };
    }

    // Variants
    switch (variant) {
      case 'primary':
        base = { ...base, backgroundColor: Colors.darkPrimary };
        break;
      case 'secondary':
        base = { ...base, backgroundColor: Colors.surfaceSubtle, borderWidth: 1, borderColor: Colors.border };
        break;
      case 'outline':
        base = { ...base, backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border };
        break;
      case 'ghost':
        base = { ...base, backgroundColor: 'transparent' };
        break;
      case 'emerald':
        base = { ...base, backgroundColor: Colors.primary };
        break;
    }

    if (disabled) {
      base = { ...base, opacity: 0.5 };
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    let base: TextStyle = {
      fontWeight: Typography.weights.semibold,
      textAlign: 'center',
    };

    if (size === 'sm') {
      base = { ...base, fontSize: Typography.sizes.sm };
    } else if (size === 'lg') {
      base = { ...base, fontSize: Typography.sizes.md };
    } else {
      base = { ...base, fontSize: Typography.sizes.base };
    }

    switch (variant) {
      case 'primary':
      case 'emerald':
        base = { ...base, color: Colors.textInverse };
        break;
      case 'secondary':
      case 'outline':
      case 'ghost':
        base = { ...base, color: Colors.text };
        break;
    }

    return base;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'emerald' ? Colors.textInverse : Colors.text}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconMargin}>{icon}</View>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {showArrow && (
            <ArrowRight
              size={18}
              color={variant === 'primary' || variant === 'emerald' ? Colors.textInverse : Colors.text}
              style={styles.arrowMargin}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMargin: {
    marginRight: Spacing.sm,
  },
  arrowMargin: {
    marginLeft: Spacing.sm,
  },
});
