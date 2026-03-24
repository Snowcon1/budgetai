import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
import { Category } from '../types';
import { categoryEmojis, categoryColors } from '../constants/categories';
import { formatCurrency } from '../utils/formatCurrency';

interface Props {
  category: Category;
  amount: number;
}

export default function CategoryPill({ category, amount }: Props) {
  return (
    <View style={[styles.container, { borderColor: categoryColors[category] ?? colors.border }]}>
      <Text style={styles.emoji}>{categoryEmojis[category]}</Text>
      <Text style={styles.name}>{category}</Text>
      <Text style={styles.amount}>{formatCurrency(Math.abs(amount))}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  emoji: {
    fontSize: 14,
    marginRight: 6,
  },
  name: {
    fontSize: theme.fontSize.sm,
    color: colors.textPrimary,
    marginRight: 6,
  },
  amount: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
