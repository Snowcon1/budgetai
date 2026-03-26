import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Modal, TextInput, Alert, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { differenceInDays, format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { hapticSuccess, hapticHeavy } from '../utils/haptics';
import ConfettiOverlay from '../components/ConfettiOverlay';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/formatCurrency';
import MilestoneModal from '../components/MilestoneModal';

interface Props {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
  route: { params: { goalId: string } };
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function getGoalEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('japan') || lower.includes('trip') || lower.includes('travel')) return '✈️';
  if (lower.includes('emergency') || lower.includes('safety')) return '🛡️';
  if (lower.includes('macbook') || lower.includes('laptop') || lower.includes('computer')) return '💻';
  return '🎯';
}

export default function GoalDetailScreen({ navigation, route }: Props) {
  const { goalId } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { goals, updateGoal, accounts } = useAppStore();
  const goal = goals.find((g) => g.id === goalId);
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneText, setMilestoneText] = useState('');
  const [showContribution, setShowContribution] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  const ringAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [displayPercent, setDisplayPercent] = useState(0);

  if (!goal) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Goal not found</Text>
      </View>
    );
  }

  const linkedAccount = goal.linked_account_id
    ? accounts.find((a) => a.id === goal.linked_account_id)
    : null;
  const isLinked = !!linkedAccount;

  const handleAddContribution = () => {
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    const newAmount = Math.min(goal.current_amount + amount, goal.target_amount);
    updateGoal(goal.id, { current_amount: newAmount });
    hapticSuccess();
    setShowContribution(false);
    setContributionAmount('');
  };

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

  useEffect(() => {
    // Animate ring
    Animated.timing(ringAnim, {
      toValue: Math.min(progress, 1),
      duration: 1200,
      useNativeDriver: false,
    }).start();

    // Count-up display
    const duration = 1200;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const prog = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      setDisplayPercent(Math.round(eased * percentage));
      if (prog < 1) setTimeout(tick, 16);
    };
    tick();

    // Milestone check + bounce
    const milestones = [25, 50, 75, 100];
    for (const m of milestones) {
      if (percentage >= m && percentage < m + 5) {
        setTimeout(() => {
          Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true, tension: 120, friction: 7 }),
            Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true, tension: 120, friction: 7 }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 7 }),
          ]).start();
          setMilestoneText(`${m}% Complete!`);
          setShowMilestone(true);
          hapticHeavy();
          if (m === 100) setShowCelebration(true);
        }, 1400);
        break;
      }
    }
  }, [percentage]);

  const strokeDashoffset = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const ringColor =
    percentage >= 75 ? colors.accent.green : percentage >= 50 ? colors.accent.blue : colors.accent.amber;
  const ringGlow =
    percentage >= 75 ? colors.accent.greenGlow : percentage >= 50 ? colors.accent.blueGlow : colors.accent.amberGlow;

  const styles = makeDetailStyles(colors);

  return (
    <View style={styles.container}>
      <ConfettiOverlay visible={showCelebration} onComplete={() => setShowCelebration(false)} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.emoji}>{getGoalEmoji(goal.name)}</Text>
          <Text style={styles.goalName}>{goal.name}</Text>
          <Text style={styles.goalType}>{goal.type === 'debt' ? 'Debt Payoff' : 'Savings Goal'}</Text>
        </View>

        <View style={styles.ringWrapper}>
          <View style={[styles.glowRing, { backgroundColor: ringGlow, shadowColor: ringColor, shadowOpacity: 0.5, shadowRadius: 20 }]} />
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <View style={styles.ringContainer}>
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
              <View style={styles.ringCenter}>
                <Text style={[styles.ringPercent, { color: ringColor }]}>{displayPercent}%</Text>
                <Text style={styles.ringLabel}>complete</Text>
              </View>
            </View>
          </Animated.View>
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
            <Text style={[styles.statValue, { color: colors.accent.amber }]}>{formatCurrency(monthlyNeeded)}</Text>
          </View>
          <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.statLabel}>Still Needed</Text>
            <Text style={styles.statValue}>{formatCurrency(remaining)}</Text>
          </View>
        </View>

        {/* Linked account badge */}
        {isLinked && (
          <View style={styles.linkedBadge}>
            <Text style={styles.linkedBadgeText}>
              🔗 Linked to {linkedAccount!.name} · Balance {formatCurrency(linkedAccount!.balance)}
            </Text>
          </View>
        )}

        {/* Add contribution — only for unlinked goals */}
        {!isLinked && (
          <TouchableOpacity
            style={styles.contributionButton}
            onPress={() => setShowContribution(true)}
          >
            <Text style={styles.contributionButtonText}>+ Add Contribution</Text>
          </TouchableOpacity>
        )}

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

        <View style={{ height: 80 + insets.bottom }} />
      </ScrollView>

      <MilestoneModal
        visible={showMilestone}
        milestone={milestoneText}
        goalName={goal.name}
        onDismiss={() => setShowMilestone(false)}
      />

      <Modal visible={showContribution} transparent animationType="slide" onRequestClose={() => setShowContribution(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowContribution(false)} />
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Add Contribution</Text>
              <Text style={styles.modalSub}>
                {formatCurrency(goal.current_amount)} saved · {formatCurrency(goal.target_amount - goal.current_amount)} to go
              </Text>
              <TextInput
                style={styles.amountInput}
                value={contributionAmount}
                onChangeText={setContributionAmount}
                placeholder="$0.00"
                placeholderTextColor={colors.text.disabled}
                keyboardType="numeric"
                autoFocus
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleAddContribution}>
                <Text style={styles.saveButtonText}>Save Progress</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function makeDetailStyles(colors: ReturnType<typeof useTheme>['colors']) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 44,
    marginBottom: 8,
  },
  goalName: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: 'center',
  },
  goalType: {
    ...typography.caption,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  ringWrapper: {
    alignSelf: 'center',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  glowRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    elevation: 0,
  },
  ringContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringPercent: {
    ...typography.hero,
  },
  ringLabel: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  currentAmount: {
    ...typography.title,
    color: colors.text.primary,
  },
  targetAmount: {
    ...typography.heading,
    color: colors.text.muted,
  },
  statsCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  statLabel: {
    ...typography.label,
    color: colors.text.muted,
  },
  statValue: {
    ...typography.label,
    color: colors.text.primary,
    fontWeight: '600',
  },
  coachButton: {
    backgroundColor: colors.accent.blue,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.accent.blue,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  coachButtonText: {
    color: '#fff',
    ...typography.subheading,
    fontWeight: '600',
  },
  errorText: {
    ...typography.body,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 40,
  },
  linkedBadge: {
    backgroundColor: colors.accent.blueGlow,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.accent.blue + '40',
  },
  linkedBadgeText: {
    ...typography.caption,
    color: colors.accent.blueLight,
    textAlign: 'center',
  },
  contributionButton: {
    borderWidth: 1.5,
    borderColor: colors.accent.green + '80',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.accent.greenGlow,
  },
  contributionButtonText: {
    ...typography.subheading,
    color: colors.accent.green,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bg.elevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderBottomWidth: 0,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.default,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSub: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: 20,
  },
  amountInput: {
    backgroundColor: colors.bg.surface,
    borderRadius: 14,
    padding: 16,
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    textAlign: 'center',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: colors.accent.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.accent.green,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  saveButtonText: {
    color: '#fff',
    ...typography.subheading,
    fontWeight: '600',
  },
}); }
