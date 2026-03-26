import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { Goal } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { differenceInDays } from 'date-fns';

interface Props {
  goal: Goal;
  compact?: boolean;
  onPress?: () => void;
  index?: number;
}

function getGoalEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('japan') || lower.includes('trip') || lower.includes('travel')) return '✈️';
  if (lower.includes('emergency') || lower.includes('safety')) return '🛡️';
  if (lower.includes('macbook') || lower.includes('laptop') || lower.includes('computer')) return '💻';
  if (lower.includes('car')) return '🚗';
  if (lower.includes('house') || lower.includes('home')) return '🏠';
  if (lower.includes('wedding')) return '💍';
  return '🎯';
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function GoalRing({ percentage, size, colors }: { percentage: number; size: number; colors: ReturnType<typeof useTheme>['colors'] }) {
  const strokeWidth = size === 52 ? 5 : 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const ringColor =
    percentage >= 80
      ? colors.accent.green
      : percentage >= 50
      ? colors.accent.amber
      : colors.accent.blue;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: Math.min(percentage, 100),
      tension: 60,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border.default}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ ...typography.caption, color: ringColor, fontWeight: '700', fontSize: size === 52 ? 10 : 13 }}>
          {percentage}%
        </Text>
      </View>
    </View>
  );
}

export default function GoalCard({ goal, compact = false, onPress, index = 0 }: Props) {
  const { colors } = useTheme();
  const progress = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
  const percentage = Math.round(progress * 100);
  const daysLeft = differenceInDays(new Date(goal.target_date), new Date());
  const emoji = getGoalEmoji(goal.name);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const delay = index * 80;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
      Animated.spring(progressAnim, {
        toValue: Math.min(percentage, 100),
        tension: 60,
        friction: 8,
        useNativeDriver: false,
      }),
    ]).start();
  }, [percentage]);

  const styles = makeStyles(colors);

  const isCompleted = percentage >= 100;

  if (compact) {
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <TouchableOpacity style={[styles.compactCard, isCompleted && { opacity: 0.8 }]} onPress={onPress} activeOpacity={0.8}>
          <View style={styles.compactTop}>
            <Text style={styles.emoji}>{emoji}</Text>
            <View>
              <GoalRing percentage={percentage} size={52} colors={colors} />
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>✓</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.compactName} numberOfLines={1}>{goal.name}</Text>
          {isCompleted && <Text style={[styles.compactName, { color: colors.accent.green, fontSize: 10 }]}>Completed</Text>}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  const animatedBarWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const ringColor =
    percentage >= 80
      ? colors.accent.green
      : percentage >= 50
      ? colors.accent.amber
      : colors.accent.blue;

  return (
    <TouchableOpacity style={[styles.fullCard, isCompleted && { opacity: 0.8 }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.headerRow}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View style={styles.headerText}>
          <Text style={styles.fullName}>{goal.name}</Text>
          {isCompleted ? (
            <Text style={[styles.daysLeft, { color: colors.accent.green, fontWeight: '600' }]}>Completed</Text>
          ) : (
            <Text style={styles.daysLeft}>
              {daysLeft > 0 ? `${daysLeft} days left` : 'Past due'}
            </Text>
          )}
        </View>
        <View>
          <GoalRing percentage={percentage} size={72} colors={colors} />
          {isCompleted && (
            <View style={[styles.completedBadge, { width: 22, height: 22, borderRadius: 11, bottom: 2, right: 2 }]}>
              <Text style={[styles.completedBadgeText, { fontSize: 12 }]}>✓</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.fullBarBg}>
        <Animated.View style={[styles.fullBarFill, { width: animatedBarWidth, backgroundColor: ringColor }]} />
      </View>
      <View style={styles.amountRow}>
        <Text style={styles.amountCurrent}>{formatCurrency(goal.current_amount)}</Text>
        <Text style={styles.amountTarget}>of {formatCurrency(goal.target_amount)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    compactCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: 16,
      padding: 14,
      width: 160,
      marginRight: 12,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    compactTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    emoji: {
      fontSize: 24,
    },
    compactName: {
      ...typography.label,
      color: colors.text.primary,
    },
    fullCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    headerText: {
      flex: 1,
      marginLeft: 10,
    },
    fullName: {
      ...typography.subheading,
      color: colors.text.primary,
    },
    daysLeft: {
      ...typography.caption,
      color: colors.text.muted,
      marginTop: 2,
    },
    fullBarBg: {
      height: 6,
      backgroundColor: colors.border.default,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 10,
    },
    fullBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    amountCurrent: {
      ...typography.subheading,
      color: colors.text.primary,
    },
    amountTarget: {
      ...typography.label,
      color: colors.text.muted,
      marginLeft: 4,
    },
    completedBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.accent.green,
      alignItems: 'center',
      justifyContent: 'center',
    },
    completedBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
    },
  });
}
