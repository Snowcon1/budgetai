import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { Category } from '../types';
import DemoModeBanner from '../components/DemoModeBanner';
import HealthScore from '../components/HealthScore';
import MonthSummaryBar from '../components/MonthSummaryBar';
import GoalCard from '../components/GoalCard';
import CategoryPill from '../components/CategoryPill';
import CategorySpendBar from '../components/CategorySpendBar';
import TransactionItem from '../components/TransactionItem';
import StreakCard from '../components/StreakCard';
import WeeklyChallenge from '../components/WeeklyChallenge';
import WeeklyAISummaryCard from '../components/WeeklyAISummaryCard';
import ConfettiOverlay from '../components/ConfettiOverlay';
import BadgeUnlockModal from '../components/BadgeUnlockModal';
import { generateWeeklyChallenge } from '../utils/weeklyChallenge';
import { generateWeeklySummary } from '../utils/weeklySummary';
import { useStreakFreeze } from '../utils/streakFreeze';
import { hapticSuccess } from '../utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

export default function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const {
    transactions,
    goals,
    healthScore,
    currentStreak,
    bestStreak,
    weeklyChallenge,
    setWeeklyChallenge,
    user,
    accounts,
    persona,
    freezesRemaining,
    useStreakFreezeAction,
    newlyEarnedBadge,
    dismissBadge,
    challengesCompleted,
    incrementChallengesCompleted,
  } = useAppStore();

  const fabScale = useRef(new Animated.Value(1)).current;
  const [categoryView, setCategoryView] = useState<'pills' | 'bars'>('bars');
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const prevChallengeCompleted = useRef(weeklyChallenge.completed);

  // Load category view preference
  useEffect(() => {
    AsyncStorage.getItem('pulse_category_view').then((v) => {
      if (v === 'pills' || v === 'bars') setCategoryView(v);
    });
  }, []);

  // Watch for challenge completion
  useEffect(() => {
    if (!prevChallengeCompleted.current && weeklyChallenge.completed) {
      setCelebrationVisible(true);
      hapticSuccess();
    }
    prevChallengeCompleted.current = weeklyChallenge.completed;
  }, [weeklyChallenge.completed]);

  // Watch for badge earned
  useEffect(() => {
    if (newlyEarnedBadge) {
      setCelebrationVisible(true);
    }
  }, [newlyEarnedBadge]);

  const toggleCategoryView = () => {
    const next = categoryView === 'bars' ? 'pills' : 'bars';
    setCategoryView(next);
    AsyncStorage.setItem('pulse_category_view', next).catch(() => {});
  };

  // FAB idle pulse
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fabScale, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
        Animated.timing(fabScale, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const hour = now.getHours();
  const greeting =
    hour >= 5 && hour < 12 ? 'Good morning' :
    hour >= 12 && hour < 17 ? 'Good afternoon' :
    'Good evening';

  const monthlyData = useMemo(() => {
    const monthTxns = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const spent = monthTxns
      .filter((t) => t.category !== 'Income' && t.category !== 'Transfer')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const categoryTotals = new Map<Category, number>();
    monthTxns
      .filter((t) => t.category !== 'Income' && t.category !== 'Transfer')
      .forEach((t) => {
        const current = categoryTotals.get(t.category) ?? 0;
        categoryTotals.set(t.category, current + Math.abs(t.amount));
      });

    const topCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { spent, topCategories };
  }, [transactions, currentMonth, currentYear]);

  const weeklySummary = useMemo(
    () => generateWeeklySummary(transactions, persona, user?.monthly_income ?? 0),
    [transactions, persona, user?.monthly_income]
  );

  const recentTransactions = transactions.slice(0, 6);

  const totalCash = accounts
    .filter((a) => a.type === 'checking' || a.type === 'savings')
    .reduce((s, a) => s + a.balance, 0);
  const totalDebt = accounts
    .filter((a) => a.type === 'credit')
    .reduce((s, a) => s + Math.abs(a.balance), 0);

  // Freeze logic: can freeze if no transactions today but had some yesterday
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
  const hasTransactionToday = transactions.some((t) => t.date === todayStr);
  const hadTransactionYesterday = transactions.some((t) => t.date === yesterdayStr);
  const canFreeze = !hasTransactionToday && hadTransactionYesterday && currentStreak > 0;

  // Stagger animations for transactions
  const txnCount = recentTransactions.length;
  const txnFadesRef = useRef<Animated.Value[]>([]);
  const txnSlidesRef = useRef<Animated.Value[]>([]);

  if (txnFadesRef.current.length !== txnCount) {
    txnFadesRef.current = recentTransactions.map(() => new Animated.Value(0));
    txnSlidesRef.current = recentTransactions.map(() => new Animated.Value(12));
  }
  const txnFades = txnFadesRef.current;
  const txnSlides = txnSlidesRef.current;

  useEffect(() => {
    Animated.stagger(
      40,
      recentTransactions.map((_, i) =>
        Animated.parallel([
          Animated.timing(txnFades[i], { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(txnSlides[i], { toValue: 0, useNativeDriver: true, tension: 80, friction: 9 }),
        ])
      )
    ).start();
  }, [txnCount]);

  const handleFabPress = () => {
    Animated.sequence([
      Animated.spring(fabScale, { toValue: 0.92, useNativeDriver: true, tension: 200, friction: 8 }),
      Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start(() => navigation.navigate('ReceiptCapture'));
  };

  const handleFreeze = async () => {
    if (useStreakFreezeAction) {
      await useStreakFreezeAction();
    }
  };

  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <ConfettiOverlay
        visible={celebrationVisible}
        onComplete={() => setCelebrationVisible(false)}
      />
      {newlyEarnedBadge && (
        <BadgeUnlockModal
          badgeId={newlyEarnedBadge}
          visible={!!newlyEarnedBadge}
          onDismiss={dismissBadge}
        />
      )}
      <DemoModeBanner />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingSmall}>{greeting},</Text>
            <Text style={styles.greeting}>{user?.name ?? 'there'} 👋</Text>
          </View>
        </View>

        <HealthScore score={healthScore} />

        {accounts.length > 0 && (
          <TouchableOpacity
            style={styles.balanceCard}
            onPress={() => navigation.navigate('Accounts')}
            activeOpacity={0.8}
          >
            <View style={styles.balanceLeft}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceValue}>
                ${(totalCash - totalDebt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.balancePills}>
              <View style={styles.balancePill}>
                <Text style={styles.balancePillLabel}>Cash</Text>
                <Text style={[styles.balancePillValue, { color: colors.accent.green }]}>
                  ${totalCash.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </Text>
              </View>
              {totalDebt > 0 && (
                <View style={styles.balancePill}>
                  <Text style={styles.balancePillLabel}>Debt</Text>
                  <Text style={[styles.balancePillValue, { color: colors.accent.red }]}>
                    -${totalDebt.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.balanceArrow}>›</Text>
          </TouchableOpacity>
        )}

        <MonthSummaryBar spent={monthlyData.spent} income={user?.monthly_income ?? 0} />

        <WeeklyAISummaryCard summary={weeklySummary} onFullRecap={() => navigation.navigate('WeeklyRecap', {})} />

        {goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Goals</Text>
            <FlatList
              data={goals}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(g) => g.id}
              renderItem={({ item, index }) => (
                <GoalCard
                  goal={item}
                  compact
                  index={index}
                  onPress={() => navigation.navigate('GoalDetail', { goalId: item.id })}
                />
              )}
            />
          </View>
        )}

        {monthlyData.topCategories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Spending This Month</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TouchableOpacity onPress={toggleCategoryView}>
                  <Text style={styles.viewToggle}>{categoryView === 'bars' ? '⊞' : '≡'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('BudgetBreakdown', {})}>
                  <Text style={styles.seeAll}>See All →</Text>
                </TouchableOpacity>
              </View>
            </View>
            {categoryView === 'bars' ? (
              <View>
                {monthlyData.topCategories.map(([cat, amount], rank) => (
                  <CategorySpendBar
                    key={cat}
                    category={cat}
                    amount={amount}
                    income={user?.monthly_income ?? 0}
                    rank={rank}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.pillRow}>
                {monthlyData.topCategories.map(([cat, amount]) => (
                  <CategoryPill key={cat} category={cat} amount={amount} />
                ))}
              </View>
            )}
          </View>
        )}

        {currentStreak > 0 && (
          <StreakCard
            streak={currentStreak}
            bestStreak={bestStreak}
            freezesRemaining={freezesRemaining}
            canFreeze={canFreeze}
            onFreeze={handleFreeze}
          />
        )}

        {transactions.length > 0 && (
          <WeeklyChallenge
            challenge={weeklyChallenge}
            transactions={transactions}
            onOptIn={() => setWeeklyChallenge({ ...weeklyChallenge, opted_in: true })}
            onSkip={() => setWeeklyChallenge(generateWeeklyChallenge(transactions, weeklyChallenge.category, weeklyChallenge.description))}
            onComplete={() => {
              setCelebrationVisible(true);
              hapticSuccess();
              incrementChallengesCompleted();
            }}
          />
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {recentTransactions.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
                <Text style={styles.seeAll}>See All →</Text>
              </TouchableOpacity>
            )}
          </View>
          {recentTransactions.length === 0 ? (
            <View style={styles.emptyTxn}>
              <Text style={styles.emptyTxnIcon}>📋</Text>
              <Text style={styles.emptyTxnText}>No transactions yet</Text>
              <Text style={styles.emptyTxnSub}>Tap 📷 to add your first receipt</Text>
            </View>
          ) : (
            recentTransactions.map((t, i) => (
              <Animated.View
                key={t.id}
                style={{
                  opacity: txnFades[i] ?? 1,
                  transform: [{ translateY: txnSlides[i] ?? 0 }],
                }}
              >
                <TransactionItem
                  transaction={t}
                  onPress={() => navigation.navigate('TransactionDetail', { transactionId: t.id })}
                />
              </Animated.View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Animated.View style={[styles.fabWrapper, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={handleFabPress}
          activeOpacity={0.9}
        >
          <Text style={styles.fabIcon}>📷</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.primary,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    greetingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 4,
    },
    greetingSmall: {
      ...typography.caption,
      color: colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    greeting: {
      ...typography.title,
      color: colors.text.primary,
    },
    balanceCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    balanceLeft: {
      flex: 1,
    },
    balanceLabel: {
      ...typography.caption,
      color: colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 2,
    },
    balanceValue: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text.primary,
      letterSpacing: -0.5,
    },
    balancePills: {
      flexDirection: 'row',
      gap: 8,
      marginRight: 8,
    },
    balancePill: {
      alignItems: 'center',
    },
    balancePillLabel: {
      ...typography.caption,
      color: colors.text.disabled,
      marginBottom: 1,
    },
    balancePillValue: {
      ...typography.caption,
      fontWeight: '700',
    },
    balanceArrow: {
      ...typography.title,
      color: colors.text.muted,
      lineHeight: 24,
    },
    section: {
      marginBottom: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      ...typography.heading,
      color: colors.text.primary,
      marginBottom: 12,
    },
    seeAll: {
      ...typography.label,
      color: colors.accent.blue,
      fontWeight: '600',
      marginBottom: 12,
    },
    viewToggle: {
      ...typography.heading,
      color: colors.text.muted,
      marginBottom: 12,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    emptyTxn: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyTxnIcon: {
      fontSize: 32,
      marginBottom: 10,
    },
    emptyTxnText: {
      ...typography.subheading,
      color: colors.text.secondary,
      marginBottom: 4,
    },
    emptyTxnSub: {
      ...typography.caption,
      color: colors.text.muted,
    },
    fabWrapper: {
      position: 'absolute',
      right: 20,
      bottom: 24,
    },
    fab: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: colors.accent.blue,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: colors.accent.blue,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
    },
    fabIcon: {
      fontSize: 24,
    },
  });
}
