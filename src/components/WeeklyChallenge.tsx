import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { WeeklyChallengeData, Transaction } from '../types';

interface Props {
  challenge: WeeklyChallengeData;
  transactions: Transaction[];
  onOptIn: () => void;
  onSkip: () => void;
  onComplete?: () => void;
}

export default function WeeklyChallenge({ challenge, transactions, onOptIn, onSkip, onComplete }: Props) {
  const { colors } = useTheme();
  const prevCompleted = useRef(challenge.completed);

  const progress = useMemo(() => {
    if (!challenge.category || !challenge.target_amount) return null;

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    const spent = transactions
      .filter(
        (t) =>
          t.category === challenge.category &&
          t.amount < 0 &&
          t.date >= weekStartStr &&
          t.date <= todayStr
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return { spent, target: challenge.target_amount };
  }, [challenge.category, challenge.target_amount, transactions]);

  useEffect(() => {
    if (!prevCompleted.current && challenge.completed && onComplete) {
      onComplete();
    }
    prevCompleted.current = challenge.completed;
  }, [challenge.completed]);

  const ratio = progress ? Math.min(progress.spent / progress.target, 1) : 0;
  const isOver = progress ? progress.spent > progress.target : false;
  const barColor = isOver ? colors.accent.red : ratio > 0.8 ? colors.accent.amber : colors.accent.green;

  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>⚡</Text>
        <Text style={styles.headerText}>Weekly Challenge</Text>
      </View>
      <Text style={styles.description}>{challenge.description}</Text>

      {progress && (challenge.opted_in || !challenge.completed) && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${ratio * 100}%` as any, backgroundColor: barColor }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressSpent, { color: isOver ? colors.accent.red : colors.text.primary }]}>
              ${progress.spent.toFixed(0)} spent
            </Text>
            <Text style={styles.progressTarget}>
              {isOver
                ? `$${(progress.spent - progress.target).toFixed(0)} over limit`
                : `$${(progress.target - progress.spent).toFixed(0)} remaining`}
            </Text>
          </View>
        </View>
      )}

      {!challenge.opted_in && !challenge.completed && (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optInButton} onPress={onOptIn}>
            <Text style={styles.optInText}>I'm in!</Text>
          </TouchableOpacity>
        </View>
      )}
      {challenge.opted_in && !challenge.completed && (
        <Text style={[styles.statusText, { color: isOver ? colors.accent.red : colors.accent.blueLight }]}>
          {isOver ? '⚠️ Over budget — watch your spending!' : '✓ Challenge accepted! Keep it up.'}
        </Text>
      )}
      {challenge.completed && (
        <Text style={styles.completedText}>🎉 Challenge completed!</Text>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.bg.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent.blue,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    headerIcon: {
      fontSize: 14,
      marginRight: 6,
    },
    headerText: {
      ...typography.label,
      color: colors.accent.blueLight,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    description: {
      ...typography.subheading,
      color: colors.text.primary,
      marginBottom: 12,
    },
    progressSection: {
      marginBottom: 12,
    },
    progressBar: {
      height: 6,
      backgroundColor: colors.border.default,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 6,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    progressSpent: {
      ...typography.caption,
      fontWeight: '600',
    },
    progressTarget: {
      ...typography.caption,
      color: colors.text.muted,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
    },
    skipButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
    },
    skipText: {
      ...typography.label,
      color: colors.text.muted,
    },
    optInButton: {
      flex: 2,
      backgroundColor: colors.accent.blue,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
    },
    optInText: {
      ...typography.label,
      color: '#fff',
      fontWeight: '600',
    },
    statusText: {
      ...typography.label,
    },
    completedText: {
      ...typography.label,
      color: colors.accent.green,
      fontWeight: '600',
    },
  });
}
