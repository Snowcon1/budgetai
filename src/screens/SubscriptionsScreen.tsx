import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
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
  const { colors } = useTheme();
  const { subscriptions } = useAppStore();

  const activeSubs = subscriptions.filter((s) => s.is_active);
  const unusedSubs = activeSubs.filter((s) => s.possibly_unused);
  const usedSubs = activeSubs.filter((s) => !s.possibly_unused);
  const totalMonthly = activeSubs.reduce((sum, s) => sum + s.amount, 0);
  const potentialSavings = unusedSubs.reduce((sum, s) => sum + s.amount, 0);

  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <DemoModeBanner />
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

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.primary,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 24,
    },
    totalLabel: {
      ...typography.caption,
      color: colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    totalAmount: {
      ...typography.hero,
      fontSize: 42,
      color: colors.text.primary,
    },
    annualNote: {
      ...typography.caption,
      color: colors.text.secondary,
      marginTop: 4,
    },
    unusedSection: {
      backgroundColor: colors.accent.amberGlow,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.accent.amber + '30',
      padding: 16,
      marginBottom: 24,
    },
    unusedHeader: {
      ...typography.heading,
      fontWeight: '700',
      color: colors.accent.amber,
      marginBottom: 4,
    },
    unusedSubtext: {
      ...typography.caption,
      color: colors.text.secondary,
      marginBottom: 12,
    },
    activeSection: {
      marginBottom: 16,
    },
    sectionTitle: {
      ...typography.heading,
      color: colors.text.primary,
      marginBottom: 12,
    },
  });
}
