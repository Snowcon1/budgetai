import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { ChatMessage, DataCard, ActionCard } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface Props {
  message: ChatMessage;
  onAcceptChallenge?: (card: ActionCard) => void;
  onAddToGoal?: (card: ActionCard) => void;
}

// ─── Data Cards (read-only visual) ───────────────────────────────────────────

function DataCardView({ card }: { card: DataCard }) {
  const { colors } = useTheme();
  const styles = makeDataStyles(colors);

  if (card.type === 'spending_chart') {
    const categories = (card.data as { categories: { name: string; amount: number }[] }).categories ?? [];
    return (
      <View style={styles.container}>
        {categories.map((c) => (
          <View key={c.name} style={styles.barRow}>
            <Text style={styles.barLabel}>{c.name}</Text>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.min((c.amount / (categories[0]?.amount || 1)) * 100, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.barAmount}>{formatCurrency(c.amount)}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (card.type === 'goal_progress') {
    const goals = (card.data as { goals: { name: string; current: number; target: number; monthly_needed: number }[] }).goals ?? [];
    return (
      <View style={styles.container}>
        {goals.map((g) => (
          <View key={g.name} style={styles.goalRow}>
            <Text style={styles.goalName}>{g.name}</Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${Math.min((g.current / g.target) * 100, 100)}%` }]} />
            </View>
            <Text style={styles.goalMeta}>Need {formatCurrency(g.monthly_needed)}/mo</Text>
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
      <View style={styles.container}>
        {subs.map((s) => (
          <View key={s.name} style={styles.subRow}>
            <Text style={[styles.subName, s.status === 'possibly_unused' && { color: colors.accent.amber }]}>
              {s.status === 'possibly_unused' ? '⚠️ ' : '✓ '}{s.name}
            </Text>
            <Text style={styles.subAmount}>{formatCurrency(s.amount)}/mo</Text>
          </View>
        ))}
        <View style={styles.subTotalRow}>
          <Text style={styles.subTotal}>Total: {formatCurrency(total)}/mo</Text>
          {savings > 0 && <Text style={styles.subSavings}>Potential savings: {formatCurrency(savings)}/mo</Text>}
        </View>
      </View>
    );
  }

  return null;
}

// ─── Action Cards (interactive) ──────────────────────────────────────────────

function ChallengeCard({ card, onAccept }: { card: ActionCard; onAccept: () => void }) {
  const { colors } = useTheme();
  const styles = makeActionStyles(colors);
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(true);
    onAccept();
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.icon}>💪</Text>
        <View style={styles.headerText}>
          <Text style={styles.tag}>WEEKLY CHALLENGE</Text>
          <Text style={styles.title}>{card.title}</Text>
        </View>
      </View>
      <Text style={styles.description}>{card.description}</Text>
      {card.savings != null && card.savings > 0 && (
        <View style={styles.savingsRow}>
          <Text style={styles.savingsLabel}>Potential weekly savings</Text>
          <Text style={styles.savingsValue}>${card.savings}</Text>
        </View>
      )}
      {card.goal_name && (
        <Text style={styles.goalLink}>Towards: {card.goal_name}</Text>
      )}
      {accepted ? (
        <View style={styles.acceptedRow}>
          <Text style={styles.acceptedText}>✓ Challenge accepted!</Text>
        </View>
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
            <Text style={styles.acceptButtonText}>Accept Challenge</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function AddToGoalCard({ card, onAdd }: { card: ActionCard; onAdd: () => void }) {
  const { colors } = useTheme();
  const styles = makeActionStyles(colors);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    setAdded(true);
    onAdd();
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.icon}>🎯</Text>
        <View style={styles.headerText}>
          <Text style={styles.tag}>ADD TO GOALS</Text>
          <Text style={styles.title}>{card.title}</Text>
        </View>
        {card.amount != null && (
          <Text style={styles.amount}>{formatCurrency(card.amount)}</Text>
        )}
      </View>
      <Text style={styles.description}>{card.description}</Text>
      {added ? (
        <View style={styles.acceptedRow}>
          <Text style={styles.acceptedText}>✓ Added to your goals!</Text>
        </View>
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.acceptButton} onPress={handleAdd}>
            <Text style={styles.acceptButtonText}>Add to Goals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissButton} onPress={() => setAdded(true)}>
            <Text style={styles.dismissText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Main ChatBubble ──────────────────────────────────────────────────────────

export default function ChatBubble({ message, onAcceptChallenge, onAddToGoal }: Props) {
  const { colors } = useTheme();
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 9 }),
    ]).start();
  }, []);

  const styles = makeBubbleStyles(colors);

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
      <View style={styles.bubbleCol}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.text, isUser && styles.userText]}>{message.content}</Text>
          {message.data_card && <DataCardView card={message.data_card} />}
        </View>
        {message.action_card?.type === 'challenge' && (
          <ChallengeCard
            card={message.action_card}
            onAccept={() => onAcceptChallenge?.(message.action_card!)}
          />
        )}
        {message.action_card?.type === 'add_to_goal' && (
          <AddToGoalCard
            card={message.action_card}
            onAdd={() => onAddToGoal?.(message.action_card!)}
          />
        )}
      </View>
    </Animated.View>
  );
}

function makeBubbleStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
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
      alignItems: 'flex-start',
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
      flexShrink: 0,
    },
    avatarText: { fontSize: 14 },
    bubbleCol: {
      maxWidth: '78%',
      gap: 8,
    },
    bubble: {
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
}

function makeDataStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
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
    goalRow: { marginBottom: 10 },
    goalName: { ...typography.label, color: colors.text.primary, fontWeight: '600', marginBottom: 4 },
    goalMeta: { ...typography.caption, color: colors.text.muted, marginTop: 4 },
    subRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
    },
    subName: { ...typography.label, color: colors.accent.green },
    subAmount: { ...typography.label, color: colors.text.primary },
    subTotalRow: { marginTop: 8 },
    subTotal: { ...typography.label, color: colors.text.primary, fontWeight: '600' },
    subSavings: { ...typography.caption, color: colors.accent.amber, marginTop: 2 },
  });
}

function makeActionStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.bg.elevated,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: 14,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent.blue,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 8,
    },
    icon: { fontSize: 22 },
    headerText: { flex: 1 },
    tag: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.accent.blue,
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    title: {
      ...typography.subheading,
      color: colors.text.primary,
      fontWeight: '700',
    },
    amount: {
      ...typography.subheading,
      color: colors.accent.green,
      fontWeight: '700',
    },
    description: {
      ...typography.caption,
      color: colors.text.muted,
      lineHeight: 18,
      marginBottom: 10,
    },
    savingsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.accent.greenGlow,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginBottom: 10,
    },
    savingsLabel: {
      ...typography.caption,
      color: colors.text.muted,
    },
    savingsValue: {
      ...typography.subheading,
      color: colors.accent.green,
      fontWeight: '700',
    },
    goalLink: {
      ...typography.caption,
      color: colors.accent.blue,
      marginBottom: 10,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 8,
    },
    acceptButton: {
      flex: 1,
      backgroundColor: colors.accent.blue,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
    },
    acceptButtonText: {
      color: '#fff',
      ...typography.label,
      fontWeight: '700',
    },
    dismissButton: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: 'center',
    },
    dismissText: {
      ...typography.label,
      color: colors.text.muted,
    },
    acceptedRow: {
      paddingVertical: 8,
      alignItems: 'center',
    },
    acceptedText: {
      ...typography.label,
      color: colors.accent.green,
      fontWeight: '600',
    },
  });
}
