import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { differenceInDays, format } from 'date-fns';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/formatCurrency';
import MilestoneModal from '../components/MilestoneModal';

interface Props {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
  route: { params: { goalId: string } };
}

function getGoalEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('japan') || lower.includes('trip') || lower.includes('travel')) return '✈️';
  if (lower.includes('emergency') || lower.includes('safety')) return '🛡️';
  if (lower.includes('macbook') || lower.includes('laptop') || lower.includes('computer')) return '💻';
  return '🎯';
}

export default function GoalDetailScreen({ navigation, route }: Props) {
  const { goalId } = route.params;
  const { goals, transactions } = useAppStore();
  const goal = goals.find((g) => g.id === goalId);
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneText, setMilestoneText] = useState('');

  if (!goal) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Goal not found</Text>
      </View>
    );
  }

  const progress = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
  const percentage = Math.round(progress * 100);
  const daysLeft = differenceInDays(new Date(goal.target_date), new Date());
  const monthsLeft = Math.max(Math.ceil(daysLeft / 30), 1);
  const remaining = goal.target_amount - goal.current_amount;
  const monthlyNeeded = remaining / monthsLeft;

  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  const ringColor = percentage >= 75 ? colors.green : percentage >= 50 ? colors.accentBlue : colors.amber;

  useEffect(() => {
    const milestones = [25, 50, 75, 100];
    for (const m of milestones) {
      if (percentage >= m && percentage < m + 5) {
        setMilestoneText(`${m}% Complete!`);
        setShowMilestone(true);
        break;
      }
    }
  }, [percentage]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.emoji}>{getGoalEmoji(goal.name)}</Text>
          <Text style={styles.goalName}>{goal.name}</Text>
        </View>

        <View style={styles.ringContainer}>
          <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.border} strokeWidth={strokeWidth} fill="none" />
            <Circle
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
          <View style={styles.ringCenter}>
            <Text style={[styles.ringPercent, { color: ringColor }]}>{percentage}%</Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.currentAmount}>{formatCurrency(goal.current_amount)}</Text>
          <Text style={styles.targetAmount}> / {formatCurrency(goal.target_amount)}</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Target Date</Text>
            <Text style={styles.statValue}>{format(new Date(goal.target_date), 'MMM d, yyyy')}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Days Remaining</Text>
            <Text style={styles.statValue}>{daysLeft > 0 ? daysLeft : 'Past due'}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Monthly Savings Needed</Text>
            <Text style={[styles.statValue, { color: colors.amber }]}>{formatCurrency(monthlyNeeded)}</Text>
          </View>
          <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={styles.statValue}>{formatCurrency(remaining)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.coachButton}
          onPress={() =>
            navigation.navigate('Chat', {
              preloadMessage: `Help me with my ${goal.name} goal. I've saved ${formatCurrency(goal.current_amount)} of ${formatCurrency(goal.target_amount)} and have ${daysLeft} days left.`,
            })
          }
        >
          <Text style={styles.coachButtonText}>⚡ Ask Coach About This Goal</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <MilestoneModal
        visible={showMilestone}
        milestone={milestoneText}
        goalName={goal.name}
        onDismiss={() => setShowMilestone(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: theme.screenPadding,
    paddingTop: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  goalName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ringContainer: {
    alignSelf: 'center',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringPercent: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: '700',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  currentAmount: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  targetAmount: {
    fontSize: theme.fontSize.lg,
    color: colors.textSecondary,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 16,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: theme.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  coachButton: {
    backgroundColor: colors.accentBlue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  coachButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: theme.fontSize.md,
    textAlign: 'center',
    marginTop: 40,
  },
});
