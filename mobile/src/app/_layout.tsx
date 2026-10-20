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
    // Check onboarding completion in storage
    (async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        setHasSeenOnboarding(completed === 'true');
      } catch {
        setHasSeenOnboarding(true);
      }
    })();

    // Initial network connectivity check
    NetInfo.fetch().then((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
    });

    // Subscribe to live network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
    });

    return () => {
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

          {/* 1. Animated Splash Screen overlay */}
          {!splashFinished && (
            <AnimatedSplashOverlay onFinish={() => setSplashFinished(true)} />
          )}

          {/* 2. Offline Screen (shown after splash if user is offline) */}
          {splashFinished && isOffline && (
            <OfflineScreen onRetrySuccess={() => setIsOffline(false)} />
          )}

          {/* 3. First-time Onboarding Slides (shown after splash when online and not yet seen) */}
          {splashFinished && !isOffline && hasSeenOnboarding === false && (
            <OnboardingSlides onComplete={() => setHasSeenOnboarding(true)} />
          )}
        </DraftProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
