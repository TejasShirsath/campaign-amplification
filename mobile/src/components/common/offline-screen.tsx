import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WifiOff, RotateCw, AlertCircle } from 'lucide-react-native';
import NetInfo from '@react-native-community/netinfo';

interface OfflineScreenProps {
  onRetrySuccess: () => void;
}

export function OfflineScreen({ onRetrySuccess }: OfflineScreenProps) {
  const insets = useSafeAreaInsets();
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    // Gentle pulse animation for the offline indicator ring
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Listen for connection restoration automatically
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = Boolean(
        state.isConnected &&
        (state.isInternetReachable === null || state.isInternetReachable === true)
      );
      if (isOnline) {
        onRetrySuccess();
      }
    });

    return () => {
      pulseLoop.stop();
      unsubscribe();
    };
  }, [pulseAnim, onRetrySuccess]);

  const handleManualRetry = async () => {
    setIsChecking(true);
    setErrorMessage(null);

    try {
      const state = await NetInfo.fetch();
      const isOnline = Boolean(
        state.isConnected &&
        (state.isInternetReachable === null || state.isInternetReachable === true)
      );

      if (isOnline) {
        onRetrySuccess();
      } else {
        setErrorMessage('Still unable to connect. Please check your Wi-Fi or cellular data.');
      }
    } catch {
      setErrorMessage('Unable to check network. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 40,
            paddingBottom: Math.max(insets.bottom, 24) + 20,
          },
        ]}
      >
        {/* Visual Badge with Concentric Ripples */}
        <View style={styles.iconSection}>
          <Animated.View
            style={[
              styles.outerRippleRing,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <View style={styles.middleRippleRing} />
          <View style={styles.iconCircle}>
            <WifiOff size={44} color="#059669" strokeWidth={2.2} />
          </View>
        </View>

        {/* Status Chip */}
        <View style={styles.chip}>
          <View style={styles.chipDot} />
          <Text style={styles.chipText}>No Connection Detected</Text>
        </View>

        {/* Informative Text */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>You're Offline</Text>
          <Text style={styles.description}>
            RippleUp requires an active internet connection to discover campaigns,
            track verified amplification, and connect with the community.
          </Text>
        </View>

        {/* Error Feedback Message if manual retry fails */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.retryButton, isChecking && styles.retryButtonDisabled]}
            activeOpacity={0.85}
            onPress={handleManualRetry}
            disabled={isChecking}
          >
            {isChecking ? (
              <View style={styles.buttonInner}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.buttonText}>Checking Connection...</Text>
              </View>
            ) : (
              <View style={styles.buttonInner}>
                <RotateCw size={20} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.buttonText}>Retry Connection</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    zIndex: 999998,
    elevation: 9998,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSection: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  outerRippleRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#ECFDF5',
  },
  middleRippleRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D1FAE5',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: 20,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 320,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    maxWidth: 320,
  },
  errorText: {
    fontSize: 13,
    color: '#B91C1C',
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    width: '100%',
    maxWidth: 320,
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  retryButtonDisabled: {
    opacity: 0.7,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
