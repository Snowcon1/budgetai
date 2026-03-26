import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

interface Props {
  navigation: { replace: (screen: string) => void };
}

export default function DemoModeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const initDemo = useAppStore((s) => s.initDemo);

  const handleDemo = () => {
    initDemo();
  };

  const styles = makeStyles(colors);

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

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.primary,
      paddingHorizontal: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      fontSize: 56,
      marginBottom: 20,
    },
    title: {
      ...typography.title,
      color: colors.text.primary,
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.body,
      color: colors.text.muted,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
      paddingHorizontal: 10,
    },
    card: {
      backgroundColor: colors.bg.surface,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent.amber,
    },
    cardTitle: {
      ...typography.heading,
      color: colors.accent.amberLight,
      marginBottom: 8,
    },
    cardText: {
      ...typography.body,
      color: colors.text.secondary,
      lineHeight: 22,
    },
    demoButton: {
      backgroundColor: colors.accent.blue,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 40,
      shadowColor: colors.accent.blue,
      shadowOpacity: 0.4,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    demoButtonText: {
      color: '#fff',
      ...typography.subheading,
      fontWeight: '600',
    },
  });
}
