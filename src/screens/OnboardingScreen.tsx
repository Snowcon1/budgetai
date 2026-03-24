import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../constants/colors';
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

const { width } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 180;
const STROKE_WIDTH = 14;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TARGET_SCORE = 74;

interface Props {
  navigation: { replace: (screen: string) => void; navigate: (screen: string) => void };
}

export default function OnboardingScreen({ navigation }: Props) {
  const initDemo = useAppStore((s) => s.initDemo);
  const [displayScore, setDisplayScore] = useState(0);
  const ringAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const btnFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = 1500;

    // Ring draws in
    Animated.timing(ringAnim, {
      toValue: TARGET_SCORE / 100,
      duration,
      useNativeDriver: false,
    }).start();

    // Score counts up
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * TARGET_SCORE));
      if (progress < 1) setTimeout(tick, 16);
    };
    tick();

    // Headline slides up
    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 9 }),
      ]),
    ]).start();

    // Buttons fade in
    Animated.timing(btnFade, {
      toValue: 1,
      duration: 400,
      delay: 1200,
      useNativeDriver: true,
    }).start();
  }, []);

  const strokeDashoffset = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const handleDemo = () => {
    initDemo();
    // RootNavigator automatically switches to MainTabs when user is set
  };

  const handleConnect = () => {
    navigation.navigate('Auth');
  };

  return (
    <View style={styles.container}>
      {/* Ring graphic */}
      <View style={styles.ringSection}>
        <View style={[styles.glowRing, { shadowColor: colors.accent.green, shadowOpacity: 0.5, shadowRadius: 24 }]} />
        <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={colors.border.default}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={colors.accent.green}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={[styles.ringScore, { color: colors.accent.green }]}>{displayScore}</Text>
          <Text style={styles.ringLabel}>Health Score</Text>
        </View>
      </View>

      {/* Headline */}
      <Animated.View style={[styles.headlineSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.headline}>Your money, finally{'\n'}making sense.</Text>
        <Text style={styles.subheadline}>
          AI-powered insights based on your real spending — no spreadsheets required.
        </Text>
      </Animated.View>

      {/* Buttons */}
      <Animated.View style={[styles.buttonSection, { opacity: btnFade }]}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleDemo} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Try Demo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleConnect} activeOpacity={0.85}>
          <Text style={styles.secondaryButtonText}>Connect my accounts</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSection: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  glowRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: colors.accent.greenGlow,
    elevation: 0,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringScore: {
    ...typography.hero,
    fontSize: 44,
  },
  ringLabel: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  headlineSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  headline: {
    ...typography.title,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 12,
  },
  subheadline: {
    ...typography.body,
    color: colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  buttonSection: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.accent.blue,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: colors.accent.blue,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  primaryButtonText: {
    color: '#fff',
    ...typography.subheading,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: colors.accent.blue,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.accent.blue,
    ...typography.subheading,
    fontWeight: '600',
  },
});
