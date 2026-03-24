import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/theme';
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
        <Text style={styles.progressText}>Challenge accepted! Keep it up.</Text>
      )}
      {challenge.completed && (
        <Text style={styles.completedText}>🎉 Challenge completed!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.blue,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  headerText: {
    ...typography.label,
    color: colors.accent.blueLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    ...typography.subheading,
    color: colors.text.primary,
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  skipButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  skipText: {
    ...typography.label,
    color: colors.text.muted,
  },
  optInButton: {
    flex: 2,
    backgroundColor: colors.accent.blue,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  optInText: {
    ...typography.label,
    color: '#fff',
    fontWeight: '600',
  },
  progressText: {
    ...typography.label,
    color: colors.accent.blueLight,
  },
  completedText: {
    ...typography.label,
    color: colors.accent.green,
    fontWeight: '600',
  },
});
