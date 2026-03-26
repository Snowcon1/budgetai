import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { BadgeDef, BadgeRarity } from '../constants/badges';

const RARITY_COLORS: Record<BadgeRarity, string> = {
  common: '#64748B',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

const RARITY_LABELS: Record<BadgeRarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

interface Props {
  badge: BadgeDef;
  earned: boolean;
}

export default function BadgeCard({ badge, earned }: Props) {
  const { colors } = useTheme();
  const rarityColor = RARITY_COLORS[badge.rarity];
  const styles = makeStyles(colors, rarityColor, earned);

  return (
    <View style={styles.container}>
      <View style={styles.emojiWrap}>
        <Text style={[styles.emoji, !earned && styles.emojiLocked]}>{earned ? badge.emoji : '🔒'}</Text>
      </View>
      <Text style={[styles.name, !earned && styles.nameLocked]} numberOfLines={2}>
        {badge.name}
      </Text>
      <View style={styles.rarityBadge}>
        <Text style={[styles.rarityText, { color: earned ? rarityColor : colors.text.disabled }]}>
          {RARITY_LABELS[badge.rarity]}
        </Text>
      </View>
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  rarityColor: string,
  earned: boolean
) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.bg.surface,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: earned ? rarityColor + '60' : colors.border.default,
      opacity: earned ? 1 : 0.55,
    },
    emojiWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: earned ? rarityColor + '18' : colors.border.default,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    emoji: {
      fontSize: 22,
    },
    emojiLocked: {
      opacity: 0.6,
    },
    name: {
      ...typography.caption,
      color: colors.text.primary,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 16,
      marginBottom: 6,
    },
    nameLocked: {
      color: colors.text.disabled,
    },
    rarityBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    rarityText: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
  });
}
