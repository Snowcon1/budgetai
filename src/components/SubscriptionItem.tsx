import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/theme';
import { Subscription } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { format } from 'date-fns';

interface Props {
  subscription: Subscription;
  onCancel?: () => void;
}

export default function SubscriptionItem({ subscription, onCancel }: Props) {
  const firstLetter = subscription.merchant.charAt(0).toUpperCase();
  const logoColor = subscription.possibly_unused ? colors.accent.amber : colors.accent.blue;
  const logoBg = subscription.possibly_unused ? colors.accent.amberGlow : colors.accent.blueGlow;

  return (
    <View style={[styles.container, subscription.possibly_unused && styles.unusedContainer]}>
      <View style={[styles.logo, { backgroundColor: logoBg, borderColor: logoColor + '30' }]}>
        <Text style={[styles.logoText, { color: logoColor }]}>{firstLetter}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{subscription.merchant}</Text>
        <Text style={styles.meta}>
          {subscription.frequency} · Last charged {format(new Date(subscription.last_charge), 'MMM d')}
        </Text>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.amount}>{formatCurrency(subscription.amount)}</Text>
        {subscription.possibly_unused ? (
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel help →</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.activeBadge}>Active</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  unusedContainer: {
    borderColor: colors.accent.amber + '40',
    backgroundColor: colors.accent.amberGlow,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  logoText: {
    ...typography.heading,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.subheading,
    color: colors.text.primary,
  },
  meta: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.subheading,
    color: colors.text.primary,
  },
  activeBadge: {
    ...typography.caption,
    color: colors.accent.green,
    marginTop: 2,
  },
  cancelText: {
    ...typography.caption,
    color: colors.accent.amber,
    fontWeight: '600',
    marginTop: 2,
  },
});
