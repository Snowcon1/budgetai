import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import DemoModeBanner from '../components/DemoModeBanner';

interface Props {
  navigation: {
    navigate: (screen: string) => void;
    replace: (screen: string) => void;
  };
}

export default function SettingsScreen({ navigation }: Props) {
  const { user, isDemo, accounts, reset, setUser } = useAppStore();
  const [notifWeekly, setNotifWeekly] = useState(true);
  const [notifGoals, setNotifGoals] = useState(true);
  const [notifBudget, setNotifBudget] = useState(true);
  const [notifStreak, setNotifStreak] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? '');
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState(user?.monthly_income?.toString() ?? '');

  const handleSaveName = () => {
    if (user && nameInput.trim()) {
      setUser({ ...user, name: nameInput.trim() });
    }
    setEditingName(false);
  };

  const handleSaveIncome = () => {
    if (user) {
      const income = parseFloat(incomeInput);
      if (!isNaN(income) && income > 0) {
        setUser({ ...user, monthly_income: income });
      }
    }
    setEditingIncome(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          // RootNavigator's onAuthStateChange calls reset() automatically
        },
      },
    ]);
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete All Data',
      'This will reset the app completely. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            reset();
            navigation.replace('Onboarding');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <DemoModeBanner onPress={() => {}} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Name</Text>
            {editingName ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  onSubmitEditing={handleSaveName}
                  autoFocus
                />
                <TouchableOpacity onPress={handleSaveName}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingName(true)}>
                <Text style={styles.rowValue}>{user?.name ?? 'Not set'} ✏️</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Monthly Income</Text>
            {editingIncome ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={incomeInput}
                  onChangeText={setIncomeInput}
                  onSubmitEditing={handleSaveIncome}
                  keyboardType="numeric"
                  autoFocus
                />
                <TouchableOpacity onPress={handleSaveIncome}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingIncome(true)}>
                <Text style={styles.rowValue}>${user?.monthly_income?.toLocaleString() ?? '0'} ✏️</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Connected Accounts */}
        <Text style={styles.sectionTitle}>Connected Accounts</Text>
        <View style={styles.card}>
          {accounts.map((a) => (
            <View key={a.id} style={styles.row}>
              <View>
                <Text style={styles.rowLabel}>{a.name}</Text>
                <Text style={styles.rowMeta}>{a.institution} · {a.type}</Text>
              </View>
              <Text style={styles.rowValue}>Synced</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.addAccountButton}>
            <Text style={styles.addAccountText}>+ Add Account</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.rowLabel}>Weekly Recap</Text>
            <Switch
              value={notifWeekly}
              onValueChange={setNotifWeekly}
              trackColor={{ false: colors.border, true: colors.accentBlue }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.rowLabel}>Goal Nudges</Text>
            <Switch
              value={notifGoals}
              onValueChange={setNotifGoals}
              trackColor={{ false: colors.border, true: colors.accentBlue }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.rowLabel}>Budget Warnings</Text>
            <Switch
              value={notifBudget}
              onValueChange={setNotifBudget}
              trackColor={{ false: colors.border, true: colors.accentBlue }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>Streak Reminders</Text>
            <Switch
              value={notifStreak}
              onValueChange={setNotifStreak}
              trackColor={{ false: colors.border, true: colors.accentBlue }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Demo Mode */}
        {isDemo && (
          <>
            <Text style={styles.sectionTitle}>Demo Mode</Text>
            <View style={styles.demoCard}>
              <Text style={styles.demoTitle}>You're using demo data</Text>
              <Text style={styles.demoText}>
                Connect your real bank accounts to get personalized insights based on your actual spending.
              </Text>
              <TouchableOpacity style={styles.connectButton}>
                <Text style={styles.connectButtonText}>Connect Real Accounts</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Account actions */}
        {!isDemo && (
          <>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.card}>
              <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={handleSignOut}>
                <Text style={[styles.rowLabel, { color: colors.red }]}>Sign Out</Text>
                <Text style={styles.rowArrow}>→</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Privacy */}
        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Export Data</Text>
            <Text style={styles.rowArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={handleDeleteAll}>
            <Text style={[styles.rowLabel, { color: colors.red }]}>Delete All Data</Text>
            <Text style={styles.rowArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>SnapBudget v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingTop: 16,
  },
  screenTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 4,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: theme.fontSize.md,
    color: colors.textPrimary,
  },
  rowValue: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
  },
  rowMeta: {
    fontSize: theme.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowArrow: {
    fontSize: theme.fontSize.md,
    color: colors.textSecondary,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: colors.textPrimary,
    fontSize: theme.fontSize.sm,
    minWidth: 80,
  },
  saveText: {
    color: colors.accentBlue,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  addAccountButton: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  addAccountText: {
    color: colors.accentBlue,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  demoCard: {
    backgroundColor: colors.amber + '15',
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: colors.amber + '40',
    padding: 20,
    marginBottom: 8,
  },
  demoTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: colors.amber,
    marginBottom: 8,
  },
  demoText: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  connectButton: {
    backgroundColor: colors.accentBlue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  version: {
    fontSize: theme.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
});
