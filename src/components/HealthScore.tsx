import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated as RNAnimated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { HealthScoreBreakdown } from '../types';
import AnimatedNumber from './AnimatedNumber';

interface Props {
  score: HealthScoreBreakdown;
}

const AnimatedCircle = RNAnimated.createAnimatedComponent(Circle);

export default function HealthScore({ score }: Props) {
  const { colors } = useTheme();
  const [showModal, setShowModal] = useState(false);
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
    RNAnimated.timing(animValue, {
      toValue: score.total / 100,
      duration: 1200,
      useNativeDriver: false,
    }).start();
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

  const styles = makeStyles(colors);

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={() => setShowModal(true)} activeOpacity={0.8}>
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
            <AnimatedNumber value={score.total} duration={1200} style={[styles.scoreNumber, { color: strokeColor }]} />
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

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
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
}
