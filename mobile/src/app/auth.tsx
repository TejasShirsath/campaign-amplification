import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Colors, Spacing, Typography } from '../constants/theme';
import { RippleUpLogo } from '../components/common/rippleup-logo';
import { auth0Service } from '../services/auth0';
import { useAuth } from '../context/auth-context';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ code?: string; state?: string; error?: string; error_description?: string }>();
  const { completeAuth, closeAuthPrompt } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const handleCallback = async () => {
      // 1. In popup or standard WebBrowser mode, maybeCompleteAuthSession resolves the opening tab
      try {
        const completed = WebBrowser.maybeCompleteAuthSession();
        if (completed && completed.type === 'success') {
          closeAuthPrompt();
          return;
        }
      } catch {
        // ignore
      }

      // 2. Check for OAuth error in parameters
      if (params.error) {
        closeAuthPrompt();
        if (!isCancelled) {
          setErrorMsg(params.error_description || params.error);
        }
        setTimeout(() => {
          if (!isCancelled) router.replace('/(tabs)');
        }, 2000);
        return;
      }

      // 3. In full-page or deep-link redirect mode, exchange authorization code directly
      if (params.code) {
        try {
          const tokens = await auth0Service.exchangeCode(params.code);
          await completeAuth(tokens.accessToken);
        } catch (err: any) {
          console.warn('[AuthCallback] Code exchange error:', err?.message || err);
          // Check if tokens were already stored by concurrent handler
          const stored = await auth0Service.getStoredTokens();
          if (stored?.accessToken) {
            await completeAuth(stored.accessToken);
          }
        }
      }

      closeAuthPrompt();

      // 4. Navigate user back into application
      if (!isCancelled) {
        router.replace('/(tabs)');
      }
    };

    handleCallback();

    return () => {
      isCancelled = true;
    };
  }, [params.code, params.error, params.error_description, completeAuth, closeAuthPrompt, router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <RippleUpLogo size="lg" style={{ marginBottom: Spacing.lg }} />
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>
        {errorMsg ? `Authentication notice: ${errorMsg}` : 'Completing sign in...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  text: {
    marginTop: Spacing.md,
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
});
