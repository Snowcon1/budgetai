import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { BADGES } from '../constants/badges';
import BadgeCard from '../components/BadgeCard';

const NUM_COLUMNS = 3;

export default function BadgesScreen() {
  const { colors } = useTheme();
  const { earnedBadges } = useAppStore();

  const earnedSet = new Set(earnedBadges);
  const earnedCount = earnedBadges.length;
  const totalCount = BADGES.length;

  // Sort: earned first, then by rarity (legendary > epic > rare > common)
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
  const sorted = [...BADGES].sort((a, b) => {
    const aEarned = earnedSet.has(a.id) ? 0 : 1;
    const bEarned = earnedSet.has(b.id) ? 0 : 1;
    if (aEarned !== bEarned) return aEarned - bEarned;
    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
  });

  // Build rows of 3
  const rows: (typeof BADGES)[] = [];
  for (let i = 0; i < sorted.length; i += NUM_COLUMNS) {
    rows.push(sorted.slice(i, i + NUM_COLUMNS));
  }

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Achievements</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{earnedCount} / {totalCount} Earned</Text>
          </View>
        </View>

        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((badge) => (
              <View key={badge.id} style={styles.cell}>
                <BadgeCard badge={badge} earned={earnedSet.has(badge.id)} />
              </View>
            ))}
            {/* Fill empty cells in last row */}
            {row.length < NUM_COLUMNS &&
              Array.from({ length: NUM_COLUMNS - row.length }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.cell} />
              ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg.primary,
    },
    scroll: {
      flex: 1,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      ...typography.heading,
      color: colors.text.primary,
      fontWeight: '700',
    },
    countBadge: {
      backgroundColor: colors.bg.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    countText: {
      ...typography.caption,
      color: colors.text.secondary,
      fontWeight: '600',
    },
    row: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    cell: {
      flex: 1,
    },
  });
}
