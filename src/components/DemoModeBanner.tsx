import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

export default function DemoModeBanner() {
  const { colors } = useTheme();
  const isDemo = useAppStore((s) => s.isDemo);
  const exitDemo = useAppStore((s) => s.exitDemo);

  if (!isDemo) return null;

  const styles = makeStyles(colors);

  return (
    <TouchableOpacity style={styles.banner} onPress={exitDemo} activeOpacity={0.85}>
      <Text style={styles.text}>⚡ Demo Mode — Connect real accounts →</Text>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    banner: {
      backgroundColor: colors.accent.amber + '18',
      borderBottomWidth: 1,
      borderBottomColor: colors.accent.amber + '30',
      paddingVertical: 9,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    text: {
      ...typography.label,
      color: colors.accent.amberLight,
    },
  });
}
