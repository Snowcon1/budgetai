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
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { format, addMonths } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
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
  const { colors } = useTheme();
  const { goals, addGoal, user, accounts } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newMonths, setNewMonths] = useState('6');
  const [newType, setNewType] = useState<'savings' | 'debt'>('savings');
  const [linkedAccountId, setLinkedAccountId] = useState<string | null>(null);

  const linkableAccounts = accounts.filter((a) =>
    newType === 'savings' ? a.type === 'savings' || a.type === 'checking' : a.type === 'credit'
  );

  const activeGoals = goals.filter((g) => (g.target_amount > 0 ? g.current_amount / g.target_amount : 0) < 1);
  const completedGoals = goals.filter((g) => (g.target_amount > 0 ? g.current_amount / g.target_amount : 0) >= 1);
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);

  const handleAddGoal = async () => {
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

    // For linked savings accounts, start current_amount at current balance
    const linkedAccount = linkedAccountId ? accounts.find((a) => a.id === linkedAccountId) : null;
    let initialAmount = 0;
    if (linkedAccount) {
      if (newType === 'savings') {
        initialAmount = Math.max(0, linkedAccount.balance);
      } else {
        // Debt: target is total debt, start at 0 paid off
        initialAmount = 0;
      }
    }

    const goal: Goal = {
      id: 'goal_' + Date.now().toString(),
      name: newName.trim(),
      target_amount: targetAmount,
      current_amount: initialAmount,
      target_date: targetDate,
      type: newType,
      linked_account_id: linkedAccountId ?? undefined,
      created_at: format(new Date(), 'yyyy-MM-dd'),
    };

    const saved = await addGoal(goal);
    if (!saved) {
      Alert.alert('Error', 'Failed to create goal. Please try again.');
      return;
    }

    setShowAddModal(false);
    setNewName('');
    setNewTarget('');
    setNewMonths('6');
    setLinkedAccountId(null);

    Alert.alert(
      'Goal Created!',
      `To hit this by ${format(new Date(targetDate), 'MMM yyyy')} you need to save ${formatCurrency(monthlySavings)}/month — that's ${feasibility} based on your current spending.`
    );
  };

  const styles = makeGoalsStyles(colors);

  return (
    <View style={styles.container}>
      <DemoModeBanner />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.totalLabel}>Total Saved</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalSaved)}</Text>
        </View>

        {activeGoals.map((g, index) => (
          <GoalCard
            key={g.id}
            goal={g}
            index={index}
            onPress={() => navigation.navigate('GoalDetail', { goalId: g.id })}
          />
        ))}

        {completedGoals.length > 0 && (
          <>
            <TouchableOpacity style={styles.completedToggle} onPress={() => setShowCompleted((v) => !v)}>
              <Text style={styles.completedToggleText}>
                {showCompleted ? `Hide completed (${completedGoals.length})` : `Show ${completedGoals.length} completed`}
              </Text>
            </TouchableOpacity>
            {showCompleted && completedGoals.map((g, index) => (
              <GoalCard
                key={g.id}
                goal={g}
                index={index}
                onPress={() => navigation.navigate('GoalDetail', { goalId: g.id })}
              />
            ))}
          </>
        )}

        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>+ Add Goal</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowAddModal(false)} />
            <View style={styles.modalSheet}>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>New Goal</Text>

                <Text style={styles.fieldLabel}>Goal Name</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="e.g. Vacation Fund"
                  placeholderTextColor={colors.text.disabled}
                />

                <Text style={styles.fieldLabel}>Target Amount ($)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={newTarget}
                  onChangeText={setNewTarget}
                  placeholder="5000"
                  placeholderTextColor={colors.text.disabled}
                  keyboardType="numeric"
                />

                <Text style={styles.fieldLabel}>Months to Achieve</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={newMonths}
                  onChangeText={setNewMonths}
                  placeholder="6"
                  placeholderTextColor={colors.text.disabled}
                  keyboardType="numeric"
                />

                <Text style={styles.fieldLabel}>Type</Text>
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[styles.typeButton, newType === 'savings' && styles.typeButtonActive]}
                    onPress={() => setNewType('savings')}
                  >
                    <Text style={[styles.typeText, newType === 'savings' && styles.typeTextActive]}>💰 Savings</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, newType === 'debt' && styles.typeButtonActive]}
                    onPress={() => setNewType('debt')}
                  >
                    <Text style={[styles.typeText, newType === 'debt' && styles.typeTextActive]}>💳 Debt Payoff</Text>
                  </TouchableOpacity>
                </View>

                {linkableAccounts.length > 0 && (
                  <>
                    <Text style={styles.fieldLabel}>Link Account (optional)</Text>
                    <View style={styles.accountRow}>
                      <TouchableOpacity
                        style={[styles.accountButton, !linkedAccountId && styles.accountButtonActive]}
                        onPress={() => setLinkedAccountId(null)}
                      >
                        <Text style={[styles.accountText, !linkedAccountId && styles.accountTextActive]}>None</Text>
                      </TouchableOpacity>
                      {linkableAccounts.map((a) => (
                        <TouchableOpacity
                          key={a.id}
                          style={[styles.accountButton, linkedAccountId === a.id && styles.accountButtonActive]}
                          onPress={() => setLinkedAccountId(a.id)}
                        >
                          <Text style={[styles.accountText, linkedAccountId === a.id && styles.accountTextActive]} numberOfLines={1}>
                            {a.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <TouchableOpacity style={styles.saveButton} onPress={handleAddGoal}>
                  <Text style={styles.saveButtonText}>Create Goal</Text>
                </TouchableOpacity>
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function makeGoalsStyles(colors: ReturnType<typeof useTheme>['colors']) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLabel: {
    ...typography.caption,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  totalAmount: {
    ...typography.hero,
    color: colors.accent.green,
  },
  completedToggle: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  completedToggleText: {
    ...typography.label,
    color: colors.accent.blue,
    fontWeight: '600',
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: colors.accent.blue + '60',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: colors.accent.blueGlow,
  },
  addButtonText: {
    ...typography.subheading,
    color: colors.accent.blue,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bg.elevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingHorizontal: 24,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderBottomWidth: 0,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.default,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.text.muted,
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldInput: {
    backgroundColor: colors.bg.surface,
    borderRadius: 10,
    padding: 14,
    ...typography.subheading,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: colors.accent.blue,
    backgroundColor: colors.accent.blueGlow,
  },
  typeText: {
    ...typography.label,
    color: colors.text.muted,
  },
  typeTextActive: {
    color: colors.accent.blue,
    fontWeight: '600',
  },
  accountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  accountButton: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  accountButtonActive: {
    borderColor: colors.accent.blue,
    backgroundColor: colors.accent.blueGlow,
  },
  accountText: {
    ...typography.caption,
    color: colors.text.muted,
  },
  accountTextActive: {
    color: colors.accent.blue,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.accent.blue,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: colors.accent.blue,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  saveButtonText: {
    color: '#fff',
    ...typography.subheading,
    fontWeight: '600',
  },
}); }
