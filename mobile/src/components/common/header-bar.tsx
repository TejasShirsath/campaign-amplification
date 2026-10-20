import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Settings, Share2, Heart } from 'lucide-react-native';
import { Colors, Radii, Spacing, Typography } from '../../constants/theme';
import { useAuth } from '../../context/auth-context';
import { RippleUpLogo } from './rippleup-logo';

export interface HeaderBarProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showBell?: boolean;
  unreadCount?: number;
  onBellPress?: () => void;
  showAvatar?: boolean;
  showSettings?: boolean;
  onSettingsPress?: () => void;
  style?: ViewStyle;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  showLogo = false,
  showBack = false,
  onBack,
  rightAction,
  showBell = false,
  unreadCount = 0,
  onBellPress,
  showAvatar = false,
  showSettings = false,
  onSettingsPress,
  style,
}) => {
  const router = useRouter();
  const { user } = useAuth();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  const isBrandLogo = showLogo || title === 'RippleUp';

  return (
    <View style={[styles.header, style]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBack}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          {isBrandLogo ? (
            <RippleUpLogo size="md" />
          ) : (
            title && <Text style={styles.title}>{title}</Text>
          )}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      <View style={styles.right}>
        {rightAction}

        {showBell && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBellPress || (() => router.push('/(tabs)/activity'))}
            style={styles.iconButton}
          >
            <Bell size={20} color={Colors.text} />
            {unreadCount > 0 && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}

        {showSettings && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSettingsPress}
            style={styles.iconButton}
          >
            <Settings size={20} color={Colors.text} />
          </TouchableOpacity>
        )}

        {showAvatar && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.avatarButton}
          >
            <Image
              source={{
                uri:
                  user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
              }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export const FloatingHeroBar: React.FC<{
  onBack?: () => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
  onShare?: () => void;
}> = ({ onBack, isSaved, onToggleSave, onShare }) => {
  const router = useRouter();

  return (
    <View style={styles.floatingBar}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={
          onBack ||
          (() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)' as any);
            }
          })
        }
        style={styles.floatingCircle}
      >
        <ArrowLeft size={20} color={Colors.text} />
      </TouchableOpacity>

      <View style={styles.floatingRightGroup}>
        {onToggleSave && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onToggleSave}
            style={styles.floatingCircle}
          >
            <Heart
              size={20}
              color={isSaved ? Colors.error : Colors.text}
              fill={isSaved ? Colors.error : 'transparent'}
            />
          </TouchableOpacity>
        )}
        {onShare && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onShare}
            style={[styles.floatingCircle, { marginLeft: Spacing.sm }]}
          >
            <Share2 size={20} color={Colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
  },
  avatarButton: {
    marginLeft: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  floatingBar: {
    position: 'absolute',
    top: 50,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  floatingCircle: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
