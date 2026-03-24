import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { Category } from '../types';
import DemoModeBanner from '../components/DemoModeBanner';
import HealthScore from '../components/HealthScore';
import MonthSummaryBar from '../components/MonthSummaryBar';
import GoalCard from '../components/GoalCard';
import CategoryPill from '../components/CategoryPill';
import TransactionItem from '../components/TransactionItem';
import StreakCard from '../components/StreakCard';
import WeeklyChallenge from '../components/WeeklyChallenge';

interface Props {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

export default function HomeScreen({ navigation }: Props) {
  const {
    transactions,
    goals,
    healthScore,
    currentStreak,
    weeklyChallenge,
    user,
  } = useAppStore();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyData = useMemo(() => {
    const monthTxns = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const spent = monthTxns
      .filter((t) => t.category !== 'Income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const categoryTotals = new Map<Category, number>();
    monthTxns
      .filter((t) => t.category !== 'Income')
      .forEach((t) => {
        const current = categoryTotals.get(t.category) ?? 0;
        categoryTotals.set(t.category, current + Math.abs(t.amount));
      });

    const topCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return { spent, topCategories };
  }, [transactions, currentMonth, currentYear]);

  const recentTransactions = transactions.slice(0, 6);

  return (
    <View style={styles.container}>
      <DemoModeBanner onPress={() => navigation.navigate('Settings')} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Hey, {user?.name ?? 'there'} 👋</Text>

        <HealthScore score={healthScore} />
        <MonthSummaryBar spent={monthlyData.spent} income={user?.monthly_income ?? 0} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Goals</Text>
          <FlatList
            data={goals}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(g) => g.id}
            renderItem={({ item }) => (
              <GoalCard
                goal={item}
                compact
                onPress={() => navigation.navigate('GoalDetail', { goalId: item.id })}
              />
            )}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending This Month</Text>
          <View style={styles.pillRow}>
            {monthlyData.topCategories.map(([cat, amount]) => (
              <CategoryPill key={cat} category={cat} amount={amount} />
            ))}
          </View>
        </View>

        {currentStreak > 0 && <StreakCard streak={currentStreak} />}

        <WeeklyChallenge
          challenge={weeklyChallenge}
          onOptIn={() => {}}
          onSkip={() => {}}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.map((t) => (
            <TransactionItem
              key={t.id}
              transaction={t}
              onPress={() => navigation.navigate('TransactionDetail', { transactionId: t.id })}
            />
          ))}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ReceiptCapture')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.screenPadding,
    paddingTop: 16,
  },
  greeting: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
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
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: theme.fontSize.sm,
    color: colors.accentBlue,
    fontWeight: '600',
    marginBottom: 12,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.accentBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 30,
  },
});
