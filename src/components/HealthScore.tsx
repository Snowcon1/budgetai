import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated as RNAnimated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../constants/colors';
import { typography } from '../constants/theme';
import { HealthScoreBreakdown } from '../types';

interface Props {
  score: HealthScoreBreakdown;
}

const AnimatedCircle = RNAnimated.createAnimatedComponent(Circle);

export default function HealthScore({ score }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const animValue = useRef(new RNAnimated.Value(0)).current;

  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const strokeColor =
    score.total >= 70
      ? colors.accent.green
      : score.total >= 40
      ? colors.accent.amber
      : colors.accent.red;

  const glowColor =
    score.total >= 70
      ? colors.accent.greenGlow
      : score.total >= 40
      ? colors.accent.amberGlow
      : colors.accent.redGlow;

  useEffect(() => {
    // Animate ring
    RNAnimated.timing(animValue, {
      toValue: score.total / 100,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    // Count-up display score
    const duration = 1200;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score.total));
      if (progress < 1) setTimeout(tick, 16);
    };
    tick();
  }, [score.total]);

  const strokeDashoffset = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const breakdownItems = [
    { label: 'Spending Ratio', value: score.spending_ratio, max: 25 },
    { label: 'Savings Rate', value: score.savings_rate, max: 25 },
    { label: 'Goal Progress', value: score.goal_progress, max: 25 },
    { label: 'Subscription Efficiency', value: score.subscription_efficiency, max: 25 },
  ];

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={() => setShowModal(true)} activeOpacity={0.8}>
        {/* Glow behind ring */}
        <View
          style={[
            styles.glowRing,
            {
              backgroundColor: glowColor,
              shadowColor: strokeColor,
              shadowOpacity: 0.4,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        />
        <View style={styles.ringContainer}>
          <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.border.default}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </Svg>
          <View style={styles.scoreTextContainer}>
            <Text style={[styles.scoreNumber, { color: strokeColor }]}>{displayScore}</Text>
            <Text style={styles.scoreLabel}>Health Score</Text>
            <Text style={styles.scoreTap}>tap for details</Text>
          </View>
        </View>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Health Score Breakdown</Text>
            <View style={styles.totalRow}>
              <Text style={[styles.totalScore, { color: strokeColor }]}>{score.total}</Text>
              <Text style={styles.totalLabel}>/100</Text>
            </View>
            {breakdownItems.map((item) => (
              <View key={item.label} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{item.label}</Text>
                <View style={styles.breakdownBarContainer}>
                  <View
                    style={[
                      styles.breakdownBar,
                      { width: `${(item.value / item.max) * 100}%`, backgroundColor: strokeColor },
                    ]}
                  />
                </View>
                <Text style={styles.breakdownValue}>
                  {item.value}/{item.max}
                </Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  glowRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    elevation: 0,
  },
  ringContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreNumber: {
    ...typography.hero,
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  scoreTap: {
    fontSize: 10,
    color: colors.text.disabled,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  modalTitle: {
    ...typography.heading,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  totalScore: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  totalLabel: {
    ...typography.title,
    color: colors.text.muted,
    marginLeft: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownLabel: {
    ...typography.label,
    color: colors.text.secondary,
    width: 130,
  },
  breakdownBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border.default,
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  breakdownBar: {
    height: '100%',
    borderRadius: 3,
  },
  breakdownValue: {
    ...typography.label,
    color: colors.text.primary,
    width: 40,
    textAlign: 'right',
    fontWeight: '600',
  },
});
