import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import AnimatedNumber from './AnimatedNumber';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';

interface Props {
  streak: number;
  bestStreak?: number;
  freezesRemaining?: number;
  canFreeze?: boolean;
  onFreeze?: () => void;
}

export default function StreakCard({ streak, bestStreak = 0, freezesRemaining = 0, canFreeze = false, onFreeze }: Props) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (streak <= 0) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  }, [streak]);

  if (streak <= 0) return null;

  const styles = makeStyles(colors);

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
        <View style={styles.countRow}>
          <AnimatedNumber value={streak} duration={600} style={styles.count} />
          <Text style={styles.unit}>day streak</Text>
        </View>
        {bestStreak > 0 && (
          <Text style={styles.bestStreak}>Best: {bestStreak} days</Text>
        )}
      </View>
      <View style={styles.rightSection}>
        {canFreeze && freezesRemaining > 0 ? (
          <TouchableOpacity style={styles.freezeButton} onPress={onFreeze} activeOpacity={0.8}>
            <Text style={styles.freezeText}>🧊 ×{freezesRemaining}</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.message}>Keep tracking</Text>
            <Text style={styles.subMessage}>your spending!</Text>
            {freezesRemaining > 0 && (
              <Text style={styles.freezeInfo}>🧊 ×{freezesRemaining}</Text>
            )}
          </>
        )}
      </View>
    </Animated.View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
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
    },
    countRow: {
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
    bestStreak: {
      ...typography.caption,
      color: colors.text.disabled,
      marginTop: 2,
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
    freezeInfo: {
      ...typography.caption,
      color: colors.text.disabled,
      marginTop: 4,
    },
    freezeButton: {
      backgroundColor: colors.accent.blueGlow,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: colors.accent.blue + '40',
    },
    freezeText: {
      ...typography.label,
      color: colors.accent.blueLight,
      fontWeight: '600',
    },
  });
}
