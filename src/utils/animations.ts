import { Animated, Easing } from 'react-native';

export const spring = (value: Animated.Value, toValue: number) =>
  Animated.spring(value, { toValue, useNativeDriver: true, tension: 80, friction: 9 });

export const springBounce = (value: Animated.Value, toValue: number) =>
  Animated.spring(value, { toValue, useNativeDriver: true, tension: 120, friction: 7 });

export const fadeIn = (value: Animated.Value, duration = 300, delay = 0) =>
  Animated.timing(value, {
    toValue: 1,
    duration,
    delay,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  });

export const slideUp = (value: Animated.Value, duration = 350, delay = 0) =>
  Animated.timing(value, {
    toValue: 0,
    duration,
    delay,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });

export const pulse = (value: Animated.Value) =>
  Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 0.4,
        duration: 900,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 1,
        duration: 900,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
