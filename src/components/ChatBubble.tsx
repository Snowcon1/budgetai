import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/theme';
import { ChatMessage, DataCard } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface Props {
  message: ChatMessage;
}

function DataCardView({ card }: { card: DataCard }) {
  if (card.type === 'spending_chart') {
    const categories = (card.data as { categories: { name: string; amount: number }[] }).categories ?? [];
    return (
      <View style={dataStyles.container}>
        {categories.map((c) => (
          <View key={c.name} style={dataStyles.barRow}>
            <Text style={dataStyles.barLabel}>{c.name}</Text>
            <View style={dataStyles.barBg}>
              <View
                style={[
                  dataStyles.barFill,
                  { width: `${Math.min((c.amount / (categories[0]?.amount || 1)) * 100, 100)}%` },
                ]}
              />
            </View>
            <Text style={dataStyles.barAmount}>{formatCurrency(c.amount)}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (card.type === 'goal_progress') {
    const goals = (card.data as { goals: { name: string; current: number; target: number; monthly_needed: number }[] }).goals ?? [];
    return (
      <View style={dataStyles.container}>
        {goals.map((g) => (
          <View key={g.name} style={dataStyles.goalRow}>
            <Text style={dataStyles.goalName}>{g.name}</Text>
            <View style={dataStyles.barBg}>
              <View style={[dataStyles.barFill, { width: `${Math.min((g.current / g.target) * 100, 100)}%` }]} />
            </View>
            <Text style={dataStyles.goalMeta}>
              Need {formatCurrency(g.monthly_needed)}/mo
            </Text>
          </View>
        ))}
      </View>
    );
  }

  if (card.type === 'subscription_list') {
    const subs = (card.data as { subscriptions: { name: string; amount: number; status: string }[]; total: number; potential_savings: number }).subscriptions ?? [];
    const total = (card.data as { total: number }).total ?? 0;
    const savings = (card.data as { potential_savings: number }).potential_savings ?? 0;
    return (
      <View style={dataStyles.container}>
        {subs.map((s) => (
          <View key={s.name} style={dataStyles.subRow}>
            <Text style={[dataStyles.subName, s.status === 'possibly_unused' && { color: colors.accent.amber }]}>
              {s.status === 'possibly_unused' ? '⚠️ ' : '✓ '}{s.name}
            </Text>
            <Text style={dataStyles.subAmount}>{formatCurrency(s.amount)}/mo</Text>
          </View>
        ))}
        <View style={dataStyles.subTotalRow}>
          <Text style={dataStyles.subTotal}>Total: {formatCurrency(total)}/mo</Text>
          {savings > 0 && <Text style={dataStyles.subSavings}>Potential savings: {formatCurrency(savings)}/mo</Text>}
        </View>
      </View>
    );
  }

  return null;
}

export default function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 9 }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.row,
        isUser ? styles.userRow : styles.assistantRow,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>⚡</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isUser && styles.userText]}>{message.content}</Text>
        {message.data_card && <DataCardView card={message.data_card} />}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.blueGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.accent.blue + '30',
  },
  avatarText: {
    fontSize: 14,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    padding: 14,
  },
  userBubble: {
    backgroundColor: colors.accent.blue,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.bg.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  text: {
    ...typography.body,
    color: colors.text.primary,
  },
  userText: {
    color: '#fff',
  },
});

const dataStyles = StyleSheet.create({
  container: {
    marginTop: 12,
    backgroundColor: colors.bg.elevated,
    borderRadius: 10,
    padding: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    width: 80,
  },
  barBg: {
    flex: 1,
    height: 5,
    backgroundColor: colors.border.default,
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.accent.blue,
    borderRadius: 3,
  },
  barAmount: {
    ...typography.caption,
    color: colors.text.primary,
    width: 55,
    textAlign: 'right',
    fontWeight: '600',
  },
  goalRow: {
    marginBottom: 10,
  },
  goalName: {
    ...typography.label,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalMeta: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 4,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  subName: {
    ...typography.label,
    color: colors.accent.green,
  },
  subAmount: {
    ...typography.label,
    color: colors.text.primary,
  },
  subTotalRow: {
    marginTop: 8,
  },
  subTotal: {
    ...typography.label,
    color: colors.text.primary,
    fontWeight: '600',
  },
  subSavings: {
    ...typography.caption,
    color: colors.accent.amber,
    marginTop: 2,
  },
});
