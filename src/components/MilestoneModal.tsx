import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/theme';

interface Props {
  visible: boolean;
  milestone: string;
  goalName: string;
  onDismiss: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COUNT = 30;
const CONFETTI_COLORS = [
  colors.accent.blue,
  colors.accent.green,
  colors.accent.amber,
  colors.accent.red,
  colors.accent.blueLight,
  '#A855F7',
];

function ConfettiPiece({ delay }: { delay: number }) {
  const fallAnim = useRef(new Animated.Value(-20)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const size = 6 + Math.random() * 8;
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const isCircle = Math.random() > 0.5;
  const xPos = Math.random() * SCREEN_WIDTH;
  const duration = 2000 + Math.random() * 1500;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fallAnim, {
          toValue: SCREEN_HEIGHT + 20,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 4 + Math.random() * 4,
          duration,
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
        left: xPos,
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
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
          <ConfettiPiece key={i} delay={i * 50} />
        ))}
        <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.congrats}>Milestone Reached!</Text>
          <Text style={styles.milestone}>{milestone}</Text>
          <Text style={styles.goalName}>{goalName}</Text>
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '82%',
    zIndex: 10,
    borderWidth: 1,
    borderColor: colors.accent.green + '40',
  },
  emoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  congrats: {
    ...typography.title,
    color: colors.text.primary,
    marginBottom: 8,
  },
  milestone: {
    ...typography.heading,
    color: colors.accent.green,
    marginBottom: 4,
  },
  goalName: {
    ...typography.body,
    color: colors.text.muted,
    marginBottom: 28,
    textAlign: 'center',
  },
  dismissButton: {
    backgroundColor: colors.accent.blue,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    shadowColor: colors.accent.blue,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  dismissText: {
    color: '#fff',
    ...typography.subheading,
    fontWeight: '600',
  },
});
