import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, TouchableWithoutFeedback, Platform } from 'react-native';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';

interface AnimatedSplashOverlayProps {
  onFinish?: () => void;
  duration?: number; // duration in ms before fade out (default 2000ms)
  ready?: boolean; // whether app prerequisites (e.g. checking onboarding / auth) are ready
}

/**
 * Animated Splash Screen overlay that displays SplashScreen.gif on app launch,
 * then gracefully fades out to reveal the application.
 */
export function AnimatedSplashOverlay({
  onFinish,
  duration = 2000,
  ready = true,
}: AnimatedSplashOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [visible, setVisible] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const isDismissing = useRef(false);

  useEffect(() => {
    // Hide static native splash screen as soon as the animated GIF overlay is mounted
    SplashScreen.hideAsync().catch(() => { });

    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, duration);

    // Fallback safety: ensure splash never stays stuck even if ready is delayed
    const fallbackTimer = setTimeout(() => {
      if (!isDismissing.current) {
        dismiss();
      }
    }, duration + 1500);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, [duration]);

  const dismiss = () => {
    if (isDismissing.current) return;
    isDismissing.current = true;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setVisible(false);
      onFinish?.();
    });
  };

  useEffect(() => {
    if (minTimeElapsed && ready && !isDismissing.current) {
      dismiss();
    }
  }, [minTimeElapsed, ready]);

  const handlePress = () => {
    if (ready && !isDismissing.current) {
      dismiss();
    }
  };

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Image
          source={require('../../../assets/images/SplashScreen.gif')}
          style={styles.image}
          contentFit="cover"
          autoplay
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    elevation: 9999,
    backgroundColor: '#249770',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
