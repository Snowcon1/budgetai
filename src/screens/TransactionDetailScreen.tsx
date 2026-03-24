import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { format } from 'date-fns';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { Category } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { categoryEmojis, categoryColors, allCategories } from '../constants/categories';

interface Props {
  navigation: { goBack: () => void };
  route: { params: { transactionId: string } };
}

export default function TransactionDetailScreen({ navigation, route }: Props) {
  const { transactionId } = route.params;
  const { transactions, updateTransaction, deleteTransaction } = useAppStore();
  const transaction = transactions.find((t) => t.id === transactionId);

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [notes, setNotes] = useState(transaction?.notes ?? '');

  if (!transaction) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Transaction not found</Text>
      </View>
    );
  }

  const isIncome = transaction.category === 'Income' || transaction.amount > 0;

  const handleCategoryChange = (cat: Category) => {
    updateTransaction(transactionId, { category: cat });
    setShowCategoryPicker(false);
  };

  const handleNotesBlur = () => {
    if (notes !== transaction.notes) {
      updateTransaction(transactionId, { notes });
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTransaction(transactionId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.merchant}>{transaction.merchant}</Text>
        <Text style={[styles.amount, { color: isIncome ? colors.green : colors.textPrimary }]}>
          {isIncome && transaction.amount > 0 ? '+' : ''}
          {formatCurrency(transaction.amount)}
        </Text>
        <Text style={styles.date}>{format(new Date(transaction.date), 'EEEE, MMMM d, yyyy')}</Text>

        {transaction.is_receipt && (
          <View style={styles.receiptBadge}>
            <Text style={styles.receiptBadgeText}>📷 Scanned Receipt</Text>
          </View>
        )}

        <View style={styles.detailSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account</Text>
            <Text style={styles.detailValue}>{transaction.account_id}</Text>
          </View>

          <TouchableOpacity style={styles.detailRow} onPress={() => setShowCategoryPicker(true)}>
            <Text style={styles.detailLabel}>Category</Text>
            <View style={styles.categoryValue}>
              <View style={[styles.categoryDot, { backgroundColor: categoryColors[transaction.category] }]} />
              <Text style={styles.detailValue}>
                {categoryEmojis[transaction.category]} {transaction.category}
              </Text>
              <Text style={styles.editIndicator}>Edit</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.notesSection}>
            <Text style={styles.detailLabel}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              onBlur={handleNotesBlur}
              placeholder="Add a note..."
              placeholderTextColor={colors.textSecondary}
              multiline
            />
          </View>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete Transaction</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showCategoryPicker} transparent animationType="slide" onRequestClose={() => setShowCategoryPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCategoryPicker(false)}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select Category</Text>
            {allCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.pickerItem, transaction.category === cat && styles.pickerItemActive]}
                onPress={() => handleCategoryChange(cat)}
              >
                <View style={[styles.pickerDot, { backgroundColor: categoryColors[cat] }]} />
                <Text style={styles.pickerEmoji}>{categoryEmojis[cat]}</Text>
                <Text style={styles.pickerLabel}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: theme.screenPadding,
    paddingTop: 24,
    paddingBottom: 40,
  },
  merchant: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  amount: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  date: {
    fontSize: theme.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  receiptBadge: {
    alignSelf: 'center',
    backgroundColor: colors.accentBlue + '20',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
  },
  receiptBadgeText: {
    color: colors.accentBlue,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  detailSection: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
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
  categoryValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  editIndicator: {
    fontSize: theme.fontSize.xs,
    color: colors.accentBlue,
    marginLeft: 8,
  },
  notesSection: {
    paddingTop: 14,
  },
  notesInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    marginTop: 8,
    fontSize: theme.fontSize.sm,
    color: colors.textPrimary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteText: {
    color: colors.red,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: theme.fontSize.md,
    textAlign: 'center',
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  pickerItemActive: {
    backgroundColor: colors.accentBlue + '20',
  },
  pickerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  pickerEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  pickerLabel: {
    fontSize: theme.fontSize.md,
    color: colors.textPrimary,
  },
});
