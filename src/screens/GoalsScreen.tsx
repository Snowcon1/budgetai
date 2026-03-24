import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { format, addMonths } from 'date-fns';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { Goal } from '../types';
import GoalCard from '../components/GoalCard';
import DemoModeBanner from '../components/DemoModeBanner';
import { formatCurrency } from '../utils/formatCurrency';

interface Props {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

export default function GoalsScreen({ navigation }: Props) {
  const { goals, addGoal, user } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newMonths, setNewMonths] = useState('6');
  const [newType, setNewType] = useState<'savings' | 'debt'>('savings');

  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);

  const handleAddGoal = () => {
    if (!newName.trim() || !newTarget.trim()) {
      Alert.alert('Missing Info', 'Please fill in the goal name and target amount.');
      return;
    }

    const targetAmount = parseFloat(newTarget);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid target amount.');
      return;
    }

    const monthsNum = parseInt(newMonths, 10) || 6;
    const targetDate = format(addMonths(new Date(), monthsNum), 'yyyy-MM-dd');
    const monthlySavings = targetAmount / monthsNum;
    const monthlyIncome = user?.monthly_income ?? 0;
    const feasibility = monthlyIncome > 0 && monthlySavings < monthlyIncome * 0.2 ? 'achievable' : 'tight';

    const goal: Goal = {
      id: 'goal_' + Date.now().toString(),
      name: newName.trim(),
      target_amount: targetAmount,
      current_amount: 0,
      target_date: targetDate,
      type: newType,
      created_at: format(new Date(), 'yyyy-MM-dd'),
    };

    addGoal(goal);
    setShowAddModal(false);
    setNewName('');
    setNewTarget('');
    setNewMonths('6');

    Alert.alert(
      'Goal Created!',
      `To hit this by ${format(new Date(targetDate), 'MMM yyyy')} you need to save ${formatCurrency(monthlySavings)}/month — that's ${feasibility} based on your current spending.`
    );
  };

  return (
    <View style={styles.container}>
      <DemoModeBanner onPress={() => navigation.navigate('Settings')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.totalLabel}>Total Saved</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalSaved)}</Text>
        </View>

        {goals.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            onPress={() => navigation.navigate('GoalDetail', { goalId: g.id })}
          />
        ))}

        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>+ Add Goal</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddModal(false)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>New Goal</Text>

            <Text style={styles.fieldLabel}>Goal Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Vacation Fund"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.fieldLabel}>Target Amount ($)</Text>
            <TextInput
              style={styles.fieldInput}
              value={newTarget}
              onChangeText={setNewTarget}
              placeholder="5000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Months to Achieve</Text>
            <TextInput
              style={styles.fieldInput}
              value={newMonths}
              onChangeText={setNewMonths}
              placeholder="6"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeButton, newType === 'savings' && styles.typeButtonActive]}
                onPress={() => setNewType('savings')}
              >
                <Text style={[styles.typeText, newType === 'savings' && styles.typeTextActive]}>Savings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, newType === 'debt' && styles.typeButtonActive]}
                onPress={() => setNewType('debt')}
              >
                <Text style={[styles.typeText, newType === 'debt' && styles.typeTextActive]}>Debt Payoff</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddGoal}>
              <Text style={styles.saveButtonText}>Create Goal</Text>
            </TouchableOpacity>
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
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: '700',
    color: colors.green,
  },
  addButton: {
    borderWidth: 2,
    borderColor: colors.accentBlue,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.card,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: {
    color: colors.accentBlue,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  fieldInput: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: 14,
    fontSize: theme.fontSize.md,
    color: colors.textPrimary,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: colors.accentBlue,
    backgroundColor: colors.accentBlue + '20',
  },
  typeText: {
    color: colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
  },
  typeTextActive: {
    color: colors.accentBlue,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.accentBlue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});
