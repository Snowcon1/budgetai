import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
import { Goal } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { differenceInDays } from 'date-fns';

interface Props {
  goal: Goal;
  compact?: boolean;
  onPress?: () => void;
}

function getGoalEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('japan') || lower.includes('trip') || lower.includes('travel')) return '\u2708\uFE0F';
  if (lower.includes('emergency') || lower.includes('safety')) return '\uD83D\uDEE1\uFE0F';
  if (lower.includes('macbook') || lower.includes('laptop') || lower.includes('computer')) return '\uD83D\uDCBB';
  if (lower.includes('car')) return '\uD83D\uDE97';
  if (lower.includes('house') || lower.includes('home')) return '\uD83C\uDFE0';
  if (lower.includes('wedding')) return '\uD83D\uDC8D';
  return '\uD83C\uDFAF';
}

export default function GoalCard({ goal, compact = false, onPress }: Props) {
  const progress = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
  const percentage = Math.round(progress * 100);
  const daysLeft = differenceInDays(new Date(goal.target_date), new Date());
  const emoji = getGoalEmoji(goal.name);

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.compactName} numberOfLines={1}>{goal.name}</Text>
        <View style={styles.compactBarBg}>
          <View style={[styles.compactBarFill, { width: `${Math.min(percentage, 100)}%` }]} />
        </View>
        <Text style={styles.compactPercent}>{percentage}%</Text>
      </TouchableOpacity>
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
        <View style={[styles.fullBarFill, { width: `${Math.min(percentage, 100)}%` }]} />
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
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 14,
    width: 150,
    marginRight: 12,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  compactName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  compactBarBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  compactBarFill: {
    height: '100%',
    backgroundColor: colors.accentBlue,
    borderRadius: 3,
  },
  compactPercent: {
    fontSize: theme.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  fullCard: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 16,
    marginBottom: 12,
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
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  daysLeft: {
    fontSize: theme.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  percentage: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: colors.accentBlue,
  },
  fullBarBg: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  fullBarFill: {
    height: '100%',
    backgroundColor: colors.accentBlue,
    borderRadius: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountCurrent: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  amountTarget: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 4,
  },
});
