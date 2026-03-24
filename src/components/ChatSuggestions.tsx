import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';

interface Props {
  onSelect: (text: string) => void;
}

const suggestions = [
  { icon: '💭', text: 'Can I afford something?' },
  { icon: '📊', text: 'Why did I overspend?' },
  { icon: '🎯', text: 'Help me save for a goal' },
  { icon: '📱', text: 'Audit my subscriptions' },
];

export default function ChatSuggestions({ onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ask your financial coach</Text>
      <View style={styles.grid}>
        {suggestions.map((s) => (
          <TouchableOpacity key={s.text} style={styles.chip} onPress={() => onSelect(s.text)} activeOpacity={0.7}>
            <Text style={styles.chipIcon}>{s.icon}</Text>
            <Text style={styles.chipText}>{s.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  chip: {
    width: '45%',
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  chipText: {
    fontSize: theme.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '500',
  },
});
