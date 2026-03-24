import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

interface Props {
  navigation: { replace: (screen: string) => void };
}

export default function DemoModeScreen({ navigation }: Props) {
  const initDemo = useAppStore((s) => s.initDemo);

  const handleDemo = () => {
    initDemo();
    navigation.replace('MainTabs');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🏦</Text>
      <Text style={styles.title}>Connect Your Accounts</Text>
      <Text style={styles.subtitle}>
        Plaid integration coming soon. Connect your bank accounts securely to get personalized insights.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Coming Soon</Text>
        <Text style={styles.cardText}>
          Secure bank connection via Plaid will be available in the next update. For now, try the demo to explore all features.
        </Text>
      </View>
      <TouchableOpacity style={styles.demoButton} onPress={handleDemo}>
        <Text style={styles.demoButtonText}>Use Demo Instead</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: theme.screenPadding,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 56,
    marginBottom: 20,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: colors.amber,
    marginBottom: 8,
  },
  cardText: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  demoButton: {
    backgroundColor: colors.accentBlue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  demoButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});
