import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
import { Subscription } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { format } from 'date-fns';

interface Props {
  subscription: Subscription;
  onCancel?: () => void;
}

export default function SubscriptionItem({ subscription, onCancel }: Props) {
  const firstLetter = subscription.merchant.charAt(0).toUpperCase();
  const logoColor = subscription.possibly_unused ? colors.amber : colors.accentBlue;

  return (
    <View style={[styles.container, subscription.possibly_unused && styles.unusedContainer]}>
      <View style={[styles.logo, { backgroundColor: logoColor + '30' }]}>
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
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 14,
    marginBottom: 10,
  },
  unusedContainer: {
    borderWidth: 1,
    borderColor: colors.amber + '50',
    backgroundColor: colors.amber + '08',
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  meta: {
    fontSize: theme.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  activeBadge: {
    fontSize: theme.fontSize.xs,
    color: colors.green,
    marginTop: 2,
  },
  cancelText: {
    fontSize: theme.fontSize.xs,
    color: colors.amber,
    fontWeight: '600',
    marginTop: 2,
  },
});
