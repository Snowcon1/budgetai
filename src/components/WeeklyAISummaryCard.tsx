import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { PERSONAS } from '../constants/personas';
import { WeeklySummary } from '../utils/weeklySummary';
import { formatCurrency } from '../utils/formatCurrency';

const PERSONA_COLORS: Record<string, string> = {
  advisor: '#3B82F6',
  hype: '#A855F7',
  cfo: '#F59E0B',
  that_girl: '#F472B6',
  old_money: '#64748B',
};

interface Props {
  summary: WeeklySummary;
  onFullRecap?: () => void;
}

export default function WeeklyAISummaryCard({ summary, onFullRecap }: Props) {
  const { colors } = useTheme();
  const { persona } = useAppStore();
  const personaData = PERSONAS[persona];
  const accentColor = PERSONA_COLORS[persona] ?? colors.accent.blue;

  if (summary.totalSpent === 0 && summary.vsLastWeek === 0) return null;

  const isPositiveDelta = summary.vsLastWeek > 0;
  const deltaAbs = Math.abs(summary.vsLastWeekPct);

  const styles = makeStyles(colors, accentColor);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.personaEmoji}>{personaData.emoji}</Text>
          <View>
            <Text style={styles.personaName}>{personaData.name}</Text>
            <Text style={styles.headerLabel}>Weekly Take</Text>
          </View>
        </View>
        {summary.totalSpent > 0 && (
          <View style={[styles.deltaBadge, { backgroundColor: isPositiveDelta ? colors.accent.redGlow : colors.accent.greenGlow }]}>
            <Text style={[styles.deltaText, { color: isPositiveDelta ? colors.accent.red : colors.accent.green }]}>
              {isPositiveDelta ? '↑' : '↓'} {deltaAbs}%
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.totalSpent}>{formatCurrency(summary.totalSpent)}</Text>
      <Text style={styles.spentLabel}>spent this week</Text>

      <View style={styles.insightBox}>
        <Text style={[styles.insightText, { color: colors.text.secondary }]}>
          "{summary.insightLine}"
        </Text>
      </View>

      {onFullRecap && (
        <TouchableOpacity style={styles.recapButton} onPress={onFullRecap} activeOpacity={0.8}>
          <Text style={[styles.recapText, { color: accentColor }]}>Full Recap →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors'], accentColor: string) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.bg.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    personaEmoji: {
      fontSize: 22,
    },
    personaName: {
      ...typography.label,
      color: accentColor,
      fontWeight: '700',
    },
    headerLabel: {
      ...typography.caption,
      color: colors.text.disabled,
      letterSpacing: 0.3,
    },
    deltaBadge: {
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    deltaText: {
      ...typography.caption,
      fontWeight: '700',
    },
    totalSpent: {
      ...typography.title,
      color: colors.text.primary,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    spentLabel: {
      ...typography.caption,
      color: colors.text.disabled,
      marginBottom: 10,
    },
    insightBox: {
      backgroundColor: accentColor + '10',
      borderRadius: 10,
      padding: 10,
      marginBottom: 10,
      borderLeftWidth: 2,
      borderLeftColor: accentColor + '60',
    },
    insightText: {
      ...typography.body,
      fontStyle: 'italic',
      lineHeight: 20,
    },
    recapButton: {
      alignSelf: 'flex-end',
    },
    recapText: {
      ...typography.label,
      fontWeight: '600',
    },
  });
}
