import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COUNT = 55;
const CONFETTI_COLORS = [
  '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#60A5FA', '#A855F7', '#F472B6', '#34D399', '#FCD34D',
];

interface ConfettiPieceProps {
  delay: number;
  isBurst: boolean;
}

function ConfettiPiece({ delay, isBurst }: ConfettiPieceProps) {
  const startY = isBurst ? SCREEN_HEIGHT * 0.5 : -20;
  const startX = isBurst ? SCREEN_WIDTH * 0.5 : Math.random() * SCREEN_WIDTH;

  const fallAnim = useRef(new Animated.Value(startY)).current;
  const xAnim = useRef(new Animated.Value(startX)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const size = 5 + Math.random() * 9;
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const isCircle = Math.random() > 0.4;
  const duration = 1800 + Math.random() * 1400;
  const xDrift = isBurst
    ? (Math.random() - 0.5) * SCREEN_WIDTH * 1.2
    : (Math.random() - 0.5) * 100;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fallAnim, {
          toValue: SCREEN_HEIGHT + 50,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(xAnim, {
          toValue: startX + xDrift,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 3 + Math.random() * 5,
          duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(duration * 0.55),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: duration * 0.45,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: isCircle ? size : size * 0.4,
        backgroundColor: color,
        borderRadius: isCircle ? size / 2 : 1,
        opacity: opacityAnim,
        transform: [
          { translateY: fallAnim },
          { translateX: xAnim },
          { rotate },
        ],
        left: 0,
        top: 0,
      }}
    />
  );
}

interface Props {
  visible: boolean;
  onComplete?: () => void;
}

export default function ConfettiOverlay({ visible, onComplete }: Props) {
  useEffect(() => {
    if (visible && onComplete) {
      const timer = setTimeout(onComplete, 2800);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
        <ConfettiPiece
          key={i}
          delay={i * 35}
          isBurst={i < 18}
        />
      ))}
    </View>
  );
}
