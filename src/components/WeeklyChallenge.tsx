import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
import { WeeklyChallengeData } from '../types';

interface Props {
  challenge: WeeklyChallengeData;
  onOptIn: () => void;
  onSkip: () => void;
}

export default function WeeklyChallenge({ challenge, onOptIn, onSkip }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>⚡</Text>
        <Text style={styles.headerText}>Weekly Challenge</Text>
      </View>
      <Text style={styles.description}>{challenge.description}</Text>
      {!challenge.opted_in && !challenge.completed && (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optInButton} onPress={onOptIn}>
            <Text style={styles.optInText}>I'm in!</Text>
          </TouchableOpacity>
        </View>
      )}
      {challenge.opted_in && !challenge.completed && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Challenge accepted! Keep it up.</Text>
        </View>
      )}
      {challenge.completed && (
        <View style={styles.completedContainer}>
          <Text style={styles.completedText}>🎉 Challenge completed!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  headerText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: colors.accentBlueLight,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  skipButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  optInButton: {
    flex: 2,
    backgroundColor: colors.accentBlue,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  optInText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  progressContainer: {
    paddingVertical: 4,
  },
  progressText: {
    color: colors.accentBlueLight,
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
  },
  completedContainer: {
    paddingVertical: 4,
  },
  completedText: {
    color: colors.green,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
});
