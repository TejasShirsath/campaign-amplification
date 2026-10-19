import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, TouchableWithoutFeedback, Platform } from 'react-native';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';

interface AnimatedSplashOverlayProps {
  onFinish?: () => void;
  duration?: number; // duration in ms before fade out (default 2600ms)
}

/**
 * Animated Splash Screen overlay that displays SplashScreen.gif on app launch,
 * then gracefully fades out to reveal the application.
 */
export function AnimatedSplashOverlay({
  onFinish,
  duration = 2000,
}: AnimatedSplashOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Hide static native splash screen as soon as the animated GIF overlay is mounted
    SplashScreen.hideAsync().catch(() => { });

    const timer = setTimeout(() => {
      dismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const dismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setVisible(false);
      onFinish?.();
    });
  };

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={dismiss}>
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
