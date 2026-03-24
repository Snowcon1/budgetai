import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors } from '../constants/colors';
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

export default function GoalCard({ goal, compact = false, onPress, index = 0 }: Props) {
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

  const animatedBarWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  if (compact) {
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.8}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.compactName} numberOfLines={1}>{goal.name}</Text>
          <View style={styles.compactBarBg}>
            <Animated.View style={[styles.compactBarFill, { width: animatedBarWidth }]} />
          </View>
          <Text style={styles.compactPercent}>{percentage}%</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <TouchableOpacity style={styles.fullCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.headerRow}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View style={styles.headerText}>
          <Text style={styles.fullName}>{goal.name}</Text>
          <Text style={styles.daysLeft}>
            {daysLeft > 0 ? `${daysLeft} days left` : 'Past due'}
          </Text>
        </View>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>
      <View style={styles.fullBarBg}>
        <Animated.View style={[styles.fullBarFill, { width: animatedBarWidth }]} />
      </View>
      <View style={styles.amountRow}>
        <Text style={styles.amountCurrent}>{formatCurrency(goal.current_amount)}</Text>
        <Text style={styles.amountTarget}>of {formatCurrency(goal.target_amount)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  compactCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    padding: 14,
    width: 150,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  compactName: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: 10,
  },
  compactBarBg: {
    height: 4,
    backgroundColor: colors.border.default,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  compactBarFill: {
    height: '100%',
    backgroundColor: colors.accent.blue,
    borderRadius: 2,
  },
  compactPercent: {
    ...typography.caption,
    color: colors.accent.blue,
    fontWeight: '600',
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
  percentage: {
    ...typography.title,
    color: colors.accent.blue,
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
    backgroundColor: colors.accent.blue,
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
});
