import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { Category } from '../types';
import { categoryEmojis, categoryColors } from '../constants/categories';
import { formatCurrency } from '../utils/formatCurrency';

interface Props {
  category: Category;
  amount: number;
  income: number;
  rank: number;
}

export default function CategorySpendBar({ category, amount, income, rank }: Props) {
  const { colors } = useTheme();
  const accentColor = categoryColors[category] ?? colors.accent.blue;
  const ratio = income > 0 ? Math.min(amount / income, 1) : 0;
  const pct = Math.round(ratio * 100);
  const isHighSpend = income > 0 && ratio > 0.15;

  const widthAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = rank * 60;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, delay, useNativeDriver: true }),
      Animated.spring(widthAnim, {
        toValue: ratio * 100,
        tension: 55,
        friction: 8,
        useNativeDriver: false,
      }),
    ]).start();
  }, [ratio]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const styles = makeStyles(colors, accentColor);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.leftCol}>
        <Text style={styles.emoji}>{categoryEmojis[category] ?? '📦'}</Text>
        <Text style={styles.name} numberOfLines={1}>{category}</Text>
      </View>
      <View style={styles.barCol}>
        <View style={styles.barBg}>
          <Animated.View style={[styles.barFill, { width: animatedWidth, backgroundColor: accentColor }]} />
          {isHighSpend && (
            <View style={[styles.warningDot, { left: '80%' }]} />
          )}
        </View>
      </View>
      <View style={styles.rightCol}>
        <Text style={styles.amount}>{formatCurrency(Math.abs(amount))}</Text>
        <Text style={styles.pct}>{pct}%</Text>
      </View>
    </Animated.View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors'], accentColor: string) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      gap: 8,
    },
    leftCol: {
      flexDirection: 'row',
      alignItems: 'center',
      width: 120,
      gap: 6,
    },
    emoji: {
      fontSize: 14,
    },
    name: {
      ...typography.caption,
      color: colors.text.secondary,
      flex: 1,
    },
    barCol: {
      flex: 1,
    },
    barBg: {
      height: 8,
      backgroundColor: colors.border.default,
      borderRadius: 4,
      overflow: 'visible',
      position: 'relative',
    },
    barFill: {
      height: '100%',
      borderRadius: 4,
    },
    warningDot: {
      position: 'absolute',
      top: -2,
      width: 4,
      height: 12,
      borderRadius: 2,
      backgroundColor: colors.accent.amber,
    },
    rightCol: {
      width: 60,
      alignItems: 'flex-end',
    },
    amount: {
      ...typography.caption,
      color: colors.text.primary,
      fontWeight: '600',
    },
    pct: {
      ...typography.caption,
      color: colors.text.disabled,
    },
  });
}
