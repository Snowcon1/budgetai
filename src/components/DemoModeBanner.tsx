import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

export default function DemoModeBanner() {
  const isDemo = useAppStore((s) => s.isDemo);
  const exitDemo = useAppStore((s) => s.exitDemo);

  if (!isDemo) return null;

  return (
    <TouchableOpacity style={styles.banner} onPress={exitDemo} activeOpacity={0.85}>
      <Text style={styles.text}>⚡ Demo Mode — Connect real accounts →</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
