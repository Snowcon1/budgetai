import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { categoryEmojis, categoryColors, categoryBgColors } from '../constants/categories';
import { format } from 'date-fns';

interface Props {
  transaction: Transaction;
  onPress?: () => void;
  style?: object;
}

export default function TransactionItem({ transaction, onPress, style }: Props) {
  const { colors } = useTheme();
  const isIncome = transaction.category === 'Income' || transaction.amount > 0;
  const borderColor = categoryColors[transaction.category] ?? colors.border.default;
  const iconBg = categoryBgColors[transaction.category] ?? colors.bg.elevated;
  const icon = categoryEmojis[transaction.category] ?? '📦';
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(opacityAnim, { toValue: 0.6, duration: 80, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(opacityAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();
  };

  const styles = makeStyles(colors);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.container, { borderLeftColor: borderColor, opacity: opacityAnim }, style]}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <View style={styles.leftContent}>
          <Text style={styles.merchant} numberOfLines={1}>{transaction.merchant}</Text>
          <Text style={styles.category}>{transaction.category}</Text>
        </View>
        <View style={styles.rightContent}>
          <Text style={[styles.amount, { color: isIncome ? colors.accent.green : colors.text.primary }]}>
            {isIncome && transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
          </Text>
          <Text style={styles.date}>{format(new Date(transaction.date), 'MMM d')}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    iconText: {
      fontSize: 16,
    },
    leftContent: {
      flex: 1,
      marginRight: 12,
    },
    merchant: {
      ...typography.subheading,
      color: colors.text.primary,
    },
    category: {
      ...typography.caption,
      color: colors.text.muted,
      marginTop: 2,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    rightContent: {
      alignItems: 'flex-end',
    },
    amount: {
      ...typography.subheading,
      fontWeight: '600',
    },
    date: {
      ...typography.caption,
      color: colors.text.muted,
      marginTop: 2,
    },
  });
}
