import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { formatCurrency } from '../utils/formatCurrency';
import AnimatedNumber from './AnimatedNumber';

interface Props {
  spent: number;
  income: number;
}

export default function MonthSummaryBar({ spent, income }: Props) {
  const { colors } = useTheme();
  const ratio = income > 0 ? Math.min(spent / income, 1.2) : 0;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const remaining = income - spent;

  const barColor =
    ratio > 0.9
      ? colors.accent.red
      : ratio > 0.7
      ? colors.accent.amber
      : colors.accent.green;

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dayOfMonth = new Date().getDate();
  const projectedSpend = dayOfMonth > 0 ? Math.round((spent / dayOfMonth) * daysInMonth) : 0;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: Math.min(ratio * 100, 100),
      tension: 60,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [ratio]);

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View>
          <Text style={styles.spentLabel}>Spent this month</Text>
          <AnimatedNumber value={spent} formatFn={formatCurrency} style={styles.spentAmount} />
        </View>
        <View style={styles.rightLabels}>
          <Text style={styles.incomeLabel}>of {formatCurrency(income)}</Text>
          <Text style={[styles.remainingText, { color: remaining >= 0 ? colors.accent.green : colors.accent.red }]}>
            {remaining >= 0 ? formatCurrency(remaining) + ' left' : formatCurrency(Math.abs(remaining)) + ' over'}
          </Text>
        </View>
      </View>
      <View style={styles.barBackground}>
        <Animated.View style={[styles.barFill, { width: animatedWidth, backgroundColor: barColor }]} />
      </View>
      <Text style={styles.projection}>
        Projected: {formatCurrency(projectedSpend)} by end of month
      </Text>
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
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 12,
    },
    spentLabel: {
      ...typography.caption,
      color: colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    spentAmount: {
      ...typography.title,
      color: colors.text.primary,
    },
    rightLabels: {
      alignItems: 'flex-end',
    },
    incomeLabel: {
      ...typography.caption,
      color: colors.text.muted,
      marginBottom: 2,
    },
    remainingText: {
      ...typography.label,
      fontWeight: '600',
    },
    barBackground: {
      height: 6,
      backgroundColor: colors.border.default,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 8,
    },
    barFill: {
      height: '100%',
      borderRadius: 3,
    },
    projection: {
      ...typography.caption,
      color: colors.text.disabled,
    },
  });
}
