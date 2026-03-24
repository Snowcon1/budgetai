import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';

interface Props {
  streak: number;
}

export default function StreakCard({ streak }: Props) {
  if (streak <= 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🔥</Text>
      <View style={styles.textContainer}>
        <Text style={styles.count}>{streak}</Text>
        <Text style={styles.label}>week streak</Text>
      </View>
      <Text style={styles.subtitle}>Keep tracking your spending!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3D2800',
    borderRadius: theme.borderRadius.card,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  emoji: {
    fontSize: 28,
    marginRight: 12,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 8,
  },
  count: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: colors.amber,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: colors.amber,
    marginLeft: 4,
  },
  subtitle: {
    flex: 1,
    fontSize: theme.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
  },
});
