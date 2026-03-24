import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated as RNAnimated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
import { HealthScoreBreakdown } from '../types';

interface Props {
  score: HealthScoreBreakdown;
}

const AnimatedCircle = RNAnimated.createAnimatedComponent(Circle);

export default function HealthScore({ score }: Props) {
  const [showModal, setShowModal] = useState(false);
  const animValue = useRef(new RNAnimated.Value(0)).current;

  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    RNAnimated.spring(animValue, {
      toValue: score.total / 100,
      friction: 6,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [score.total]);

  const strokeColor = score.total >= 70 ? colors.green : score.total >= 40 ? colors.amber : colors.red;

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
        <View style={styles.ringContainer}>
          <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.border}
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
            <Text style={[styles.scoreNumber, { color: strokeColor }]}>{score.total}</Text>
            <Text style={styles.scoreLabel}>Health Score</Text>
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
    fontSize: theme.fontSize.xxxl,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: theme.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: theme.borderRadius.card,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
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
  },
  totalLabel: {
    fontSize: theme.fontSize.xl,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownLabel: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
    width: 130,
  },
  breakdownBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  breakdownBar: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownValue: {
    fontSize: theme.fontSize.sm,
    color: colors.textPrimary,
    width: 40,
    textAlign: 'right',
    fontWeight: '600',
  },
});
