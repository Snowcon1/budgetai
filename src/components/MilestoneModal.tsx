import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';

interface Props {
  visible: boolean;
  milestone: string;
  goalName: string;
  onDismiss: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COUNT = 30;
const CONFETTI_COLORS = [colors.accentBlue, colors.green, colors.amber, colors.red, colors.accentBlueLight, '#A855F7'];

function ConfettiPiece({ delay }: { delay: number }) {
  const fallAnim = useRef(new Animated.Value(-20)).current;
  const horizAnim = useRef(new Animated.Value(Math.random() * SCREEN_WIDTH)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const size = 8 + Math.random() * 10;
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const isCircle = Math.random() > 0.5;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fallAnim, {
          toValue: SCREEN_HEIGHT + 20,
          duration: 2500 + Math.random() * 1500,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 3 + Math.random() * 5,
          duration: 2500 + Math.random() * 1500,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: Math.random() * SCREEN_WIDTH,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: isCircle ? size / 2 : 2,
        transform: [{ translateY: fallAnim }, { rotate }],
      }}
    />
  );
}

export default function MilestoneModal({ visible, milestone, goalName, onDismiss }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
          <ConfettiPiece key={i} delay={i * 60} />
        ))}
        <View style={styles.content}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.congrats}>Milestone Reached!</Text>
          <Text style={styles.milestone}>{milestone}</Text>
          <Text style={styles.goalName}>{goalName}</Text>
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>Awesome!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    zIndex: 10,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  congrats: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  milestone: {
    fontSize: theme.fontSize.lg,
    color: colors.green,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalName: {
    fontSize: theme.fontSize.md,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  dismissButton: {
    backgroundColor: colors.accentBlue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  dismissText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});
