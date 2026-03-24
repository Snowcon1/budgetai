import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { categoryColors } from '../constants/categories';
import { format } from 'date-fns';

interface Props {
  transaction: Transaction;
  onPress?: () => void;
}

export default function TransactionItem({ transaction, onPress }: Props) {
  const isIncome = transaction.category === 'Income' || transaction.amount > 0;
  const borderColor = categoryColors[transaction.category] ?? colors.border;

  return (
    <TouchableOpacity style={[styles.container, { borderLeftColor: borderColor }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.leftContent}>
        <Text style={styles.merchant} numberOfLines={1}>{transaction.merchant}</Text>
        <Text style={styles.category}>{transaction.category}</Text>
      </View>
      <View style={styles.rightContent}>
        <Text style={[styles.amount, { color: isIncome ? colors.green : colors.textPrimary }]}>
          {isIncome && transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
        </Text>
        <Text style={styles.date}>{format(new Date(transaction.date), 'MMM d')}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  leftContent: {
    flex: 1,
    marginRight: 12,
  },
  merchant: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  category: {
    fontSize: theme.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  date: {
    fontSize: theme.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
