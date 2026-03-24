import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/theme';
import { Category } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { categoryEmojis } from '../constants/categories';

interface ParsedData {
  merchant: string;
  total: number;
  category: Category;
  date: string;
}

interface Props {
  data: ParsedData;
  onSave: (data: ParsedData) => void;
  onRetake: () => void;
}

export default function ResultCard({ data, onSave, onRetake }: Props) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <>
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: backdropAnim },
        ]}
      />
      <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />
        <Text style={styles.label}>Receipt Scanned</Text>
        <Text style={styles.merchant}>{data.merchant}</Text>
        <Text style={styles.amount}>{formatCurrency(data.total)}</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category</Text>
          <Text style={styles.detailValue}>
            {categoryEmojis[data.category] ?? '📦'} {data.category}
          </Text>
        </View>
        <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>{data.date}</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.retakeButton} onPress={onRetake}>
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => onSave(data)}
          >
            <Text style={styles.saveText}>Save Transaction</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg.elevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderBottomWidth: 0,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.default,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  label: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  merchant: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  amount: {
    ...typography.hero,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  detailLabel: {
    ...typography.label,
    color: colors.text.muted,
  },
  detailValue: {
    ...typography.label,
    color: colors.text.primary,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  retakeText: {
    ...typography.subheading,
    color: colors.text.primary,
  },
  saveButton: {
    flex: 2,
    backgroundColor: colors.accent.blue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: colors.accent.blue,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  saveText: {
    color: '#fff',
    ...typography.subheading,
    fontWeight: '600',
  },
});
