import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';

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
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 9 }),
    ]).start();
  }, []);

  const handleChipPress = (text: string, scaleAnim: Animated.Value) => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, tension: 120, friction: 7 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 7 }),
    ]).start(() => onSelect(text));
  };

  const styles = makeStyles(colors);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.iconContainer}>
        <Text style={styles.headerIcon}>⚡</Text>
      </View>
      <Text style={styles.title}>Ask your financial coach</Text>
      <Text style={styles.subtitle}>Get personalized advice based on your spending</Text>
      <View style={styles.grid}>
        {suggestions.map((s) => {
          const scaleAnim = useRef(new Animated.Value(1)).current;
          return (
            <TouchableOpacity
              key={s.text}
              onPress={() => handleChipPress(s.text, scaleAnim)}
              activeOpacity={1}
            >
              <Animated.View style={[styles.chip, { transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.chipIcon}>{s.icon}</Text>
                <Text style={styles.chipText}>{s.text}</Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    iconContainer: {
      alignSelf: 'center',
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.accent.blueGlow,
      borderWidth: 1,
      borderColor: colors.accent.blue + '40',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    headerIcon: {
      fontSize: 24,
    },
    title: {
      ...typography.title,
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: 6,
    },
    subtitle: {
      ...typography.body,
      color: colors.text.muted,
      textAlign: 'center',
      marginBottom: 28,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'center',
    },
    chip: {
      width: 148,
      backgroundColor: colors.bg.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    chipIcon: {
      fontSize: 22,
      marginBottom: 10,
    },
    chipText: {
      ...typography.label,
      color: colors.text.primary,
      lineHeight: 18,
    },
  });
}
