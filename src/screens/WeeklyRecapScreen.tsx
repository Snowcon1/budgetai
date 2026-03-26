import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Share,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/formatCurrency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  navigation: { goBack: () => void };
  route: { params?: { weekNumber?: number } };
}

interface StatCard {
  label: string;
  value: string;
  icon: string;
  color: string;
  glowColor: string;
  delay: number;
}

function AnimatedStatCard({ icon, label, value, color, glowColor, delay }: StatCard) {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 90,
        friction: 8,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: (SCREEN_WIDTH - 48 - 12) / 2,
          backgroundColor: colors.bg.surface,
          borderRadius: 20,
          padding: 18,
          borderWidth: 1,
          alignItems: 'flex-start',
        },
        { borderColor: color + '40', opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View style={[{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, { backgroundColor: glowColor }]}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <Text style={[{ ...typography.heading, fontWeight: '700', marginBottom: 4, letterSpacing: -0.5 }, { color }]}>{value}</Text>
      <Text style={{ ...typography.caption, color: colors.text.muted, letterSpacing: 0.3 }}>{label}</Text>
    </Animated.View>
  );
}

export default function WeeklyRecapScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { transactions, goals, user } = useAppStore();
  const weekNumber = route.params?.weekNumber ?? Math.ceil(new Date().getDate() / 7) + (new Date().getMonth() * 4);

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weekTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= weekAgo && d <= now && t.amount < 0;
  });

  const totalSpent = weekTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const goalSavings = goals.reduce((sum, g) => {
    return sum + (g.current_amount ?? 0);
  }, 0);

  const categorySpend: Record<string, number> = {};
  weekTransactions.forEach((t) => {
    if (!categorySpend[t.category]) categorySpend[t.category] = 0;
    categorySpend[t.category] += Math.abs(t.amount);
  });
  const categoryCounts = Object.keys(categorySpend).length;
  const avgSpend = totalSpent / Math.max(categoryCounts, 1);
  const underBudget = Object.values(categorySpend).filter((v) => v < avgSpend).length;

  const healthScoreChange = Math.floor(Math.random() * 5) + 1;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(headerSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.timing(buttonFade, {
      toValue: 1,
      duration: 400,
      delay: 900,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `📊 My Week ${weekNumber} Pulse Recap\n\n💸 Spent: ${formatCurrency(totalSpent)}\n🎯 Saved toward goals: ${formatCurrency(goalSavings)}\n✅ ${underBudget} categories under budget\n📈 Health score: +${healthScoreChange} pts\n\nTracking my finances with Pulse!`,
        title: `Week ${weekNumber} Financial Recap`,
      });
    } catch {
      // ignore
    }
  };

  const styles = makeStyles(colors);

  const statCards: StatCard[] = [
    { icon: '💸', label: 'Total Spent', value: formatCurrency(totalSpent), color: colors.accent.red, glowColor: colors.accent.redGlow, delay: 200 },
    { icon: '🎯', label: 'Saved to Goals', value: formatCurrency(goalSavings), color: colors.accent.green, glowColor: colors.accent.greenGlow, delay: 350 },
    { icon: '✅', label: 'Under Budget', value: `${underBudget} cats`, color: colors.accent.blue, glowColor: colors.accent.blueGlow, delay: 500 },
    { icon: '📈', label: 'Health Score', value: `+${healthScoreChange} pts`, color: colors.accent.amber, glowColor: colors.accent.amberGlow, delay: 650 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <Animated.View
        style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}
      >
        <Text style={styles.weekLabel}>WEEK {weekNumber}</Text>
        <Text style={styles.headline}>Your Recap</Text>
        <Text style={styles.subheadline}>
          {user?.name ? `Nice work, ${user.name.split(' ')[0]}` : 'Great week'}! Here's how you did.
        </Text>
      </Animated.View>

      <View style={styles.grid}>
        {statCards.map((card) => (
          <AnimatedStatCard key={card.label} {...card} />
        ))}
      </View>

      <View style={styles.divider} />

      <Animated.View style={[styles.highlightRow, { opacity: buttonFade }]}>
        <Text style={styles.highlightIcon}>🔥</Text>
        <Text style={styles.highlightText}>
          {totalSpent < 500
            ? 'Incredible discipline this week!'
            : totalSpent < 1000
            ? 'Solid spending habits this week.'
            : 'Check your biggest categories next week.'}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.buttonContainer, { opacity: buttonFade }]}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
          <Text style={styles.shareIcon}>↑</Text>
          <Text style={styles.shareText}>Share My Week</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={() => navigation.goBack()}>
          <Text style={styles.skipText}>Close</Text>
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
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingBottom: 40,
    },
    orb1: {
      position: 'absolute',
      top: -80,
      right: -60,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: colors.accent.blueGlow,
    },
    orb2: {
      position: 'absolute',
      bottom: 60,
      left: -80,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: colors.accent.greenGlow,
    },
    closeButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 56 : 36,
      right: 24,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.bg.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border.default,
      zIndex: 10,
    },
    closeText: {
      color: colors.text.muted,
      fontSize: 14,
      fontWeight: '600',
    },
    header: {
      marginTop: 16,
      marginBottom: 32,
    },
    weekLabel: {
      ...typography.caption,
      color: colors.accent.blue,
      letterSpacing: 2,
      fontWeight: '700',
      marginBottom: 8,
    },
    headline: {
      ...typography.hero,
      color: colors.text.primary,
      marginBottom: 8,
    },
    subheadline: {
      ...typography.body,
      color: colors.text.muted,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border.subtle,
      marginBottom: 20,
    },
    highlightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 28,
    },
    highlightIcon: {
      fontSize: 22,
    },
    highlightText: {
      ...typography.subheading,
      color: colors.text.secondary,
      flex: 1,
    },
    buttonContainer: {
      gap: 12,
      marginTop: 'auto' as any,
    },
    shareButton: {
      backgroundColor: colors.accent.blue,
      borderRadius: 16,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      shadowColor: colors.accent.blue,
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    shareIcon: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '700',
    },
    shareText: {
      color: '#fff',
      ...typography.subheading,
      fontWeight: '700',
    },
    skipButton: {
      paddingVertical: 14,
      alignItems: 'center',
    },
    skipText: {
      ...typography.label,
      color: colors.text.muted,
    },
  });
}
