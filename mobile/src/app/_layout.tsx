import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AuthProvider } from '../context/auth-context';
import { DraftProvider } from '../context/draft-context';
import { Colors } from '../constants/theme';
import { AnimatedSplashOverlay } from '../components/common/splash-screen-overlay';
import { OnboardingSlides, ONBOARDING_STORAGE_KEY } from '../components/common/onboarding-slides';
import { OfflineScreen } from '../components/common/offline-screen';

// Prevent native splash screen from auto-hiding before GIF splash mounts
SplashScreen.preventAutoHideAsync().catch(() => {});

// Strictly enforce Light Theme across the entire application
const LightTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: Colors.text,
    border: Colors.border,
    notification: Colors.primary,
  },
};

export default function RootLayout() {
  const [splashFinished, setSplashFinished] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Check onboarding completion in storage
    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)
      .then((completed) => {
        if (isMounted) {
          setHasSeenOnboarding(completed === 'true');
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasSeenOnboarding(true);
        }
      });

    // Safety timeout: guarantee hasSeenOnboarding is resolved
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setHasSeenOnboarding((prev) => (prev === null ? true : prev));
      }
    }, 1200);

    // Initial network connectivity check
    NetInfo.fetch().then((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      if (isMounted) setIsOffline(offline);
    });

    // Subscribe to live network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      if (isMounted) setIsOffline(offline);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider value={LightTheme}>
      <AuthProvider>
        <DraftProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#FFFFFF' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="campaign/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="campaign/contribute" options={{ headerShown: false }} />
            <Stack.Screen name="campaign/success" options={{ headerShown: false }} />
            <Stack.Screen name="campaign/report" options={{ headerShown: false }} />
            <Stack.Screen name="create/[step]" options={{ headerShown: false }} />
            <Stack.Screen name="create/preview" options={{ headerShown: false }} />
            <Stack.Screen name="user/campaigns" options={{ headerShown: false }} />
            <Stack.Screen name="user/contributions" options={{ headerShown: false }} />
            <Stack.Screen name="user/saved" options={{ headerShown: false }} />
          </Stack>

          {/* 1. Offline Screen (rendered underneath splash so no flash occurs if offline) */}
          {isOffline && (
            <OfflineScreen onRetrySuccess={() => setIsOffline(false)} />
          )}

          {/* 2. First-time Onboarding Slides (rendered underneath splash so it appears immediately when splash fades) */}
          {!isOffline && hasSeenOnboarding === false && (
            <OnboardingSlides onComplete={() => setHasSeenOnboarding(true)} />
          )}

          {/* 3. Animated Splash Screen overlay (always on top of everything until finished) */}
          {!splashFinished && (
            <AnimatedSplashOverlay
              ready={hasSeenOnboarding !== null}
              onFinish={() => setSplashFinished(true)}
            />
          )}
        </DraftProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
