import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/theme';

interface Props {
  streak: number;
}

export default function StreakCard({ streak }: Props) {
  const [displayCount, setDisplayCount] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (streak <= 0) return;

    // Count-up animation
    const duration = 600;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      setDisplayCount(Math.round(eased * streak));
      if (progress < 1) setTimeout(tick, 16);
    };
    tick();

    // Scale in
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  }, [streak]);

  if (streak <= 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          shadowColor: colors.accent.amber,
          shadowRadius: 16,
          shadowOpacity: 0.5,
          shadowOffset: { width: 0, height: 4 },
        },
      ]}
    >
      <View style={styles.leftSection}>
        <Text style={styles.emoji}>🔥</Text>
      </View>
      <View style={styles.centerSection}>
        <Text style={styles.count}>{displayCount}</Text>
        <Text style={styles.unit}>week streak</Text>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.message}>Keep tracking</Text>
        <Text style={styles.subMessage}>your spending!</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C0A00',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.accent.amber + '40',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.amber,
    elevation: 4,
  },
  leftSection: {
    marginRight: 14,
  },
  emoji: {
    fontSize: 32,
  },
  centerSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  count: {
    ...typography.hero,
    color: colors.accent.amberLight,
  },
  unit: {
    ...typography.label,
    color: colors.accent.amber,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  message: {
    ...typography.caption,
    color: colors.text.muted,
  },
  subMessage: {
    ...typography.caption,
    color: colors.text.muted,
  },
});
