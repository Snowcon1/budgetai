import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { useAppStore } from '../store/useAppStore';

interface Props {
  onPress: () => void;
}

export default function DemoModeBanner({ onPress }: Props) {
  const isDemo = useAppStore((s) => s.isDemo);
  if (!isDemo) return null;

  return (
    <TouchableOpacity style={styles.banner} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.text}>Demo Mode — Try with your real data →</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.amber,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
});
