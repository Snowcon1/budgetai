import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import CategorySpendBar from '../components/CategorySpendBar';
import { Category } from '../types';

export default function BudgetBreakdownScreen() {
  const { colors } = useTheme();
  const { transactions, user } = useAppStore();
  const income = user?.monthly_income ?? 0;

  const categoryTotals = useMemo(() => {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const map = new Map<Category, number>();
    transactions
      .filter(
        (t) =>
          t.category !== 'Income' &&
          t.category !== 'Transfer' &&
          t.amount < 0 &&
          t.date.startsWith(monthStr)
      )
      .forEach((t) => {
        const cur = map.get(t.category) ?? 0;
        map.set(t.category, cur + Math.abs(t.amount));
      });

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount }));
  }, [transactions]);

  const totalSpent = categoryTotals.reduce((s, c) => s + c.amount, 0);

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Total Spent This Month</Text>
            <Text style={styles.summaryAmount}>
              ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          {income > 0 && (
            <View style={styles.incomeBadge}>
              <Text style={styles.incomeLabel}>of</Text>
              <Text style={styles.incomeAmount}>
                ${income.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Text>
              <Text style={styles.incomeLabel}>income</Text>
            </View>
          )}
        </View>

        {categoryTotals.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyText}>No spending data for this month yet.</Text>
          </View>
        ) : (
          <View style={styles.barsContainer}>
            <Text style={styles.sectionLabel}>BY CATEGORY</Text>
            {categoryTotals.map(({ category, amount }, index) => (
              <CategorySpendBar
                key={category}
                category={category}
                amount={amount}
                income={income}
                rank={index}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg.primary,
    },
    scroll: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    summaryLabel: {
      ...typography.caption,
      color: colors.text.disabled,
      marginBottom: 4,
    },
    summaryAmount: {
      ...typography.title,
      color: colors.text.primary,
      fontWeight: '700',
    },
    incomeBadge: {
      alignItems: 'center',
    },
    incomeLabel: {
      ...typography.caption,
      color: colors.text.disabled,
    },
    incomeAmount: {
      ...typography.label,
      color: colors.text.secondary,
      fontWeight: '600',
    },
    sectionLabel: {
      ...typography.caption,
      color: colors.text.disabled,
      letterSpacing: 1,
      marginBottom: 12,
    },
    barsContainer: {
      backgroundColor: colors.bg.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    empty: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyEmoji: {
      fontSize: 40,
      marginBottom: 12,
    },
    emptyText: {
      ...typography.body,
      color: colors.text.disabled,
    },
  });
}
