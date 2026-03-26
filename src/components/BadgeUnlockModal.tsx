import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { BADGES, BadgeId, BadgeRarity } from '../constants/badges';

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
  legendary: 'Legendary ✨',
};

interface Props {
  badgeId: BadgeId | null;
  visible?: boolean;
  onDismiss: () => void;
}

export default function BadgeUnlockModal({ badgeId, onDismiss }: Props) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const badge = badgeId ? BADGES.find((b) => b.id === badgeId) : null;

  useEffect(() => {
    if (badge) {
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [badge?.id]);

  if (!badge) return null;

  const rarityColor = RARITY_COLORS[badge.rarity];
  const styles = makeStyles(colors, rarityColor);

  return (
    <Modal transparent visible animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.headline}>Badge Unlocked!</Text>

          <View style={styles.emojiWrap}>
            <Text style={styles.emoji}>{badge.emoji}</Text>
          </View>

          <Text style={styles.name}>{badge.name}</Text>
          <Text style={[styles.rarity, { color: rarityColor }]}>
            {RARITY_LABELS[badge.rarity]}
          </Text>
          <Text style={styles.description}>{badge.description}</Text>

          <TouchableOpacity style={[styles.button, { backgroundColor: rarityColor }]} onPress={onDismiss} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Claim</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors'], rarityColor: string) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    card: {
      backgroundColor: colors.bg.surface,
      borderRadius: 24,
      padding: 28,
      alignItems: 'center',
      width: '100%',
      borderWidth: 2,
      borderColor: rarityColor + '60',
    },
    headline: {
      ...typography.label,
      color: colors.text.disabled,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 20,
    },
    emojiWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: rarityColor + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      borderWidth: 2,
      borderColor: rarityColor + '40',
    },
    emoji: {
      fontSize: 38,
    },
    name: {
      ...typography.title,
      color: colors.text.primary,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 6,
    },
    rarity: {
      ...typography.label,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    description: {
      ...typography.body,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    button: {
      paddingHorizontal: 40,
      paddingVertical: 12,
      borderRadius: 12,
    },
    buttonText: {
      ...typography.label,
      color: '#fff',
      fontWeight: '700',
    },
  });
}
