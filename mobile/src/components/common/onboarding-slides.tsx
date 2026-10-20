import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_STORAGE_KEY = '@rippleup_onboarding_completed';

interface SlideData {
  id: string;
  image: any;
}

const SLIDES: SlideData[] = [
  {
    id: '1',
    image: require('../../../assets/images/slide1.webp'),
  },
  {
    id: '2',
    image: require('../../../assets/images/slide2.webp'),
  },
  {
    id: '3',
    image: require('../../../assets/images/slide3.webp'),
  },
];

interface OnboardingSlidesProps {
  onComplete: () => void;
}

export function OnboardingSlides({ onComplete }: OnboardingSlidesProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isFinishing = useRef(false);

  const handleFinish = async () => {
    if (isFinishing.current) return;
    isFinishing.current = true;

    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }

    // Smooth fade out transition to app
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      onComplete();
    });
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleFinish();
    }
  };

  const handleScrollEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / windowWidth);
    if (index >= 0 && index < SLIDES.length) {
      setCurrentIndex(index);
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleScrollEnd}
        decelerationRate="fast"
        snapToInterval={windowWidth}
        snapToAlignment="start"
        getItemLayout={(_, index) => ({
          length: windowWidth,
          offset: windowWidth * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: windowWidth, height: windowHeight }]}>
            <Image
              source={item.image}
              style={styles.fullscreenImage}
              contentFit="contain"
              contentPosition="top"
              priority="high"
            />
          </View>
        )}
      />

      {/* Floating Bottom Controls Bar matching reference design */}
      <View
        style={[
          styles.bottomControls,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        {/* Skip button on left */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleFinish}
          style={styles.skipButton}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Text style={styles.skipText}>
            {currentIndex === SLIDES.length - 1 ? '' : 'Skip'}
          </Text>
        </TouchableOpacity>

        {/* Center Pill Indicators */}
        <View style={styles.indicatorsRow}>
          {SLIDES.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => {
                  flatListRef.current?.scrollToIndex({ index: idx, animated: true });
                  setCurrentIndex(idx);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              >
                <View
                  style={[
                    styles.indicatorPill,
                    isActive ? styles.indicatorPillActive : styles.indicatorPillInactive,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Circular Emerald Arrow Button on right */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleNext}
          style={styles.nextButton}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <ArrowRight size={24} color="#FFFFFF" strokeWidth={2.8} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 99999,
  },
  slide: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 12,
    backgroundColor: 'transparent',
    zIndex: 20,
  },
  skipButton: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  indicatorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicatorPill: {
    height: 4.5,
    borderRadius: 3,
  },
  indicatorPillActive: {
    width: 26,
    backgroundColor: '#059669',
  },
  indicatorPillInactive: {
    width: 14,
    backgroundColor: '#D1D5DB',
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
