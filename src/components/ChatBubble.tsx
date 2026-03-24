import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
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
            <Text style={[dataStyles.subName, s.status === 'possibly_unused' && { color: colors.amber }]}>
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

  return (
    <View style={[styles.row, isUser ? styles.userRow : styles.assistantRow]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>⚡</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isUser && styles.userText]}>{message.content}</Text>
        {message.data_card && <DataCardView card={message.data_card} />}
      </View>
    </View>
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
    backgroundColor: colors.accentBlue + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  avatarText: {
    fontSize: 14,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: theme.borderRadius.card,
    padding: 14,
  },
  userBubble: {
    backgroundColor: colors.accentBlue,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: theme.fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
});

const dataStyles = StyleSheet.create({
  container: {
    marginTop: 12,
    backgroundColor: colors.surfaceElevated,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabel: {
    fontSize: theme.fontSize.xs,
    color: colors.textSecondary,
    width: 80,
  },
  barBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.accentBlue,
    borderRadius: 3,
  },
  barAmount: {
    fontSize: theme.fontSize.xs,
    color: colors.textPrimary,
    width: 55,
    textAlign: 'right',
    fontWeight: '600',
  },
  goalRow: {
    marginBottom: 10,
  },
  goalName: {
    fontSize: theme.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalMeta: {
    fontSize: theme.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subName: {
    fontSize: theme.fontSize.sm,
    color: colors.green,
  },
  subAmount: {
    fontSize: theme.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  subTotalRow: {
    marginTop: 8,
  },
  subTotal: {
    fontSize: theme.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  subSavings: {
    fontSize: theme.fontSize.xs,
    color: colors.amber,
    marginTop: 2,
  },
});
