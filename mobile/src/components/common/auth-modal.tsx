import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { X, Sparkles, LogIn, AlertCircle } from 'lucide-react-native';
import { RippleUpLogo } from './rippleup-logo';
import { Button } from './button';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../constants/theme';

export interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSignIn: () => Promise<boolean>;
  onSignUp?: () => Promise<boolean>;
  title?: string;
  reason?: string;
  isAuthenticating?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  onSignIn,
  onSignUp,
  title = 'Join RippleUp',
  reason = 'Sign in or create an account to start campaigns, save causes, and track your impact.',
  isAuthenticating = false,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const handleSignIn = async () => {
    try {
      setErrorMsg(null);
      setActionLoading(true);
      const success = await onSignIn();
      if (success) {
        onClose();
      }
    } catch (err: any) {
      const isCancelled =
        err?.message === 'Authentication was cancelled' ||
        err?.message?.toLowerCase().includes('cancel') ||
        err?.message?.toLowerCase().includes('dismiss');
      if (!isCancelled) {
        setErrorMsg(err?.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const isBusy = isAuthenticating || actionLoading;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isBusy ? () => {} : onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            disabled={isBusy}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Logo & Header */}
          <View style={styles.header}>
            <RippleUpLogo size="md" style={styles.logo} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.reason}>{reason}</Text>
          </View>

          {/* Error Message */}
          {errorMsg && (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Sign In with Auth0"
              icon={<LogIn size={18} color="#FFFFFF" />}
              loading={actionLoading}
              disabled={isBusy}
              onPress={handleSignIn}
              style={styles.primaryBtn}
            />
          </View>

          {/* Security Note */}
          <View style={styles.footerNote}>
            <Text style={styles.footerText}>
              Protected by Auth0 industry-standard encryption.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xxl,
    padding: Spacing.xl,
    position: 'relative',
    ...Shadows.card,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  logo: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  reason: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: Radii.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: Typography.sizes.xs,
    color: '#DC2626',
    flex: 1,
    lineHeight: 16,
  },
  actions: {
    gap: Spacing.sm,
    width: '100%',
  },
  primaryBtn: {
    width: '100%',
  },
  footerNote: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  footerText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
