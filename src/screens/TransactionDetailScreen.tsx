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
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { Category } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { categoryEmojis, categoryColors, categoryBgColors, allCategories } from '../constants/categories';

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

  const accentColor = categoryColors[transaction.category] ?? colors.accent.blue;
  const iconBg = categoryBgColors[transaction.category] ?? colors.bg.elevated;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.heroSection}>
          <View style={[styles.categoryIcon, { backgroundColor: iconBg, borderColor: accentColor + '50' }]}>
            <Text style={styles.categoryEmoji}>{categoryEmojis[transaction.category] ?? '📦'}</Text>
          </View>
          <Text style={styles.merchant}>{transaction.merchant}</Text>
          <Text style={[styles.amount, { color: isIncome ? colors.accent.green : colors.text.primary }]}>
            {isIncome && transaction.amount > 0 ? '+' : ''}
            {formatCurrency(transaction.amount)}
          </Text>
          <Text style={styles.date}>{format(new Date(transaction.date), 'EEEE, MMMM d, yyyy')}</Text>

          {transaction.is_receipt && (
            <View style={styles.receiptBadge}>
              <Text style={styles.receiptBadgeText}>📷 Scanned Receipt</Text>
            </View>
          )}
        </View>

        {/* Details card */}
        <View style={styles.detailSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{transaction.account_id}</Text>
          </View>

          <TouchableOpacity style={styles.detailRow} onPress={() => setShowCategoryPicker(true)}>
            <Text style={styles.detailLabel}>Category</Text>
            <View style={styles.categoryValue}>
              <View style={[styles.categoryDot, { backgroundColor: accentColor }]} />
              <Text style={styles.detailValue}>
                {categoryEmojis[transaction.category]} {transaction.category}
              </Text>
              <Text style={styles.editIndicator}>Edit →</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.notesSection]}>
            <Text style={styles.detailLabel}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              onBlur={handleNotesBlur}
              placeholder="Add a note..."
              placeholderTextColor={colors.text.disabled}
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
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Select Category</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {allCategories.map((cat) => {
                const isSelected = transaction.category === cat;
                const catAccent = categoryColors[cat];
                const catBg = categoryBgColors[cat];
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.pickerItem, isSelected && { backgroundColor: catBg }]}
                    onPress={() => handleCategoryChange(cat)}
                  >
                    <View style={[styles.pickerIconCircle, { backgroundColor: catBg, borderColor: catAccent + '50' }]}>
                      <Text>{categoryEmojis[cat]}</Text>
                    </View>
                    <Text style={[styles.pickerLabel, isSelected && { color: catAccent, fontWeight: '600' }]}>{cat}</Text>
                    {isSelected && <Text style={[styles.pickerCheck, { color: catAccent }]}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  categoryEmoji: {
    fontSize: 26,
  },
  merchant: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: 'center',
  },
  amount: {
    ...typography.hero,
    textAlign: 'center',
    marginTop: 6,
  },
  date: {
    ...typography.body,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  receiptBadge: {
    backgroundColor: colors.accent.blueGlow,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.accent.blue + '30',
  },
  receiptBadgeText: {
    ...typography.caption,
    color: colors.accent.blueLight,
    fontWeight: '600',
  },
  detailSection: {
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  detailLabel: {
    ...typography.label,
    color: colors.text.muted,
  },
  detailValue: {
    ...typography.label,
    color: colors.text.primary,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  categoryValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  editIndicator: {
    ...typography.caption,
    color: colors.accent.blue,
    marginLeft: 4,
  },
  notesSection: {
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  notesInput: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    ...typography.body,
    color: colors.text.primary,
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.accent.red + '60',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.accent.redGlow,
  },
  deleteText: {
    ...typography.subheading,
    color: colors.accent.red,
  },
  errorText: {
    ...typography.body,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.bg.elevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '72%',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderBottomWidth: 0,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.default,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    ...typography.heading,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 10,
  },
  pickerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pickerLabel: {
    ...typography.subheading,
    color: colors.text.primary,
    flex: 1,
  },
  pickerCheck: {
    fontSize: 16,
    fontWeight: '700',
  },
});
