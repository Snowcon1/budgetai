import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/formatCurrency';
import SubscriptionItem from '../components/SubscriptionItem';
import DemoModeBanner from '../components/DemoModeBanner';

interface Props {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

export default function SubscriptionsScreen({ navigation }: Props) {
  const { subscriptions } = useAppStore();

  const activeSubs = subscriptions.filter((s) => s.is_active);
  const unusedSubs = activeSubs.filter((s) => s.possibly_unused);
  const usedSubs = activeSubs.filter((s) => !s.possibly_unused);
  const totalMonthly = activeSubs.reduce((sum, s) => sum + s.amount, 0);
  const potentialSavings = unusedSubs.reduce((sum, s) => sum + s.amount, 0);

  return (
    <View style={styles.container}>
      <DemoModeBanner onPress={() => navigation.navigate('Settings')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.totalLabel}>Monthly Subscriptions</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalMonthly)}</Text>
          <Text style={styles.annualNote}>{formatCurrency(totalMonthly * 12)}/year</Text>
        </View>

        {unusedSubs.length > 0 && (
          <View style={styles.unusedSection}>
            <Text style={styles.unusedHeader}>⚠️ Review These</Text>
            <Text style={styles.unusedSubtext}>
              Potential savings: {formatCurrency(potentialSavings)}/month
            </Text>
            {unusedSubs.map((s) => (
              <SubscriptionItem
                key={s.id}
                subscription={s}
                onCancel={() =>
                  navigation.navigate('Chat', {
                    preloadMessage: `Help me cancel my ${s.merchant} subscription. What's the best way to do it?`,
                  })
                }
              />
            ))}
          </View>
        )}

        <View style={styles.activeSection}>
          <Text style={styles.sectionTitle}>Active Subscriptions</Text>
          {usedSubs.map((s) => (
            <SubscriptionItem key={s.id} subscription={s} />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: theme.screenPadding,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  annualNote: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  unusedSection: {
    backgroundColor: colors.amber + '10',
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: colors.amber + '30',
    padding: 16,
    marginBottom: 24,
  },
  unusedHeader: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: colors.amber,
    marginBottom: 4,
  },
  unusedSubtext: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  activeSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
});
