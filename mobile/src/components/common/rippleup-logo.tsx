import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../constants/theme';

interface RippleUpLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  theme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const RippleUpLogo: React.FC<RippleUpLogoProps> = ({
  size = 'md',
  showText = true,
  textColor,
  theme = 'light',
  style,
}) => {
  const heights = {
    sm: 24,
    md: 32,
    lg: 42,
    xl: 56,
  };

  const markHeight = heights[size];
  // Aspect ratio of the mark is ~1240 / 1193 ≈ 1.04
  const markWidth = Math.round(markHeight * 1.04);

  const fontSizes = {
    sm: 18,
    md: 23,
    lg: 29,
    xl: 38,
  };

  const currentFontSize = fontSizes[size];

  const rippleColor =
    textColor || (theme === 'dark' ? '#FFFFFF' : '#0F172A');
  const upColor = theme === 'dark' ? '#34D399' : '#059669';

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../../assets/images/rippleup-logo-mark.png')}
        style={{
          width: markWidth,
          height: markHeight,
        }}
        resizeMode="contain"
      />
      {showText && (
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.textBase,
              { fontSize: currentFontSize, color: rippleColor },
            ]}
          >
            Ripple
          </Text>
          <Text
            style={[
              styles.textBase,
              { fontSize: currentFontSize, color: upColor },
            ]}
          >
            Up
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  textBase: {
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
});
