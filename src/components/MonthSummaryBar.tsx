import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
import { formatCurrency } from '../utils/formatCurrency';

interface Props {
  spent: number;
  income: number;
}

export default function MonthSummaryBar({ spent, income }: Props) {
  const ratio = income > 0 ? Math.min(spent / income, 1.2) : 0;
  const barColor = ratio > 0.9 ? colors.red : ratio > 0.7 ? colors.amber : colors.green;
  const remaining = income - spent;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dayOfMonth = new Date().getDate();
  const projectedSpend = dayOfMonth > 0 ? Math.round((spent / dayOfMonth) * daysInMonth) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {formatCurrency(spent)} spent of {formatCurrency(income)}
        </Text>
        <Text style={[styles.remainingText, { color: remaining >= 0 ? colors.green : colors.red }]}>
          {remaining >= 0 ? formatCurrency(remaining) + ' left' : formatCurrency(Math.abs(remaining)) + ' over'}
        </Text>
      </View>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${Math.min(ratio * 100, 100)}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={styles.projection}>
        Projected: {formatCurrency(projectedSpend)} by end of month
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 16,
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  remainingText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  barBackground: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  projection: {
    fontSize: theme.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 8,
  },
});
