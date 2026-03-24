import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput } from 'react-native';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
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
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.title}>Receipt Scanned</Text>
      <Text style={styles.merchant}>{data.merchant}</Text>
      <Text style={styles.amount}>{formatCurrency(data.total)}</Text>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Category</Text>
        <Text style={styles.detailValue}>
          {categoryEmojis[data.category] ?? '📦'} {data.category}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Date</Text>
        <Text style={styles.detailValue}>{data.date}</Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.retakeButton} onPress={onRetake}>
          <Text style={styles.retakeText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={() => onSave(data)}>
          <Text style={styles.saveText}>Save Transaction</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  merchant: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  amount: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: theme.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  retakeText: {
    color: colors.textPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    backgroundColor: colors.accentBlue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});
