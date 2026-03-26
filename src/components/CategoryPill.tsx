import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { Category } from '../types';
import { categoryEmojis, categoryColors } from '../constants/categories';
import { formatCurrency } from '../utils/formatCurrency';

interface Props {
  category: Category;
  amount: number;
}

export default function CategoryPill({ category, amount }: Props) {
  const { colors } = useTheme();
  const accentColor = categoryColors[category] ?? colors.accent.blue;
  const catInfo = colors.category[category as keyof typeof colors.category];

  return (
    <View style={[styles.container, { borderColor: accentColor + '60', backgroundColor: (catInfo?.bg ?? colors.bg.surface) }]}>
      <Text style={styles.emoji}>{categoryEmojis[category]}</Text>
      <View style={styles.textContent}>
        <Text style={[styles.name, { color: accentColor }]}>{category}</Text>
        <Text style={[styles.amount, { color: colors.text.primary }]}>{formatCurrency(Math.abs(amount))}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    gap: 8,
  },
  emoji: {
    fontSize: 16,
  },
  textContent: {
    gap: 1,
  },
  name: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  amount: {
    ...typography.label,
    fontWeight: '600',
  },
});
