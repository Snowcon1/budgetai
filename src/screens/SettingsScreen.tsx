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
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import DemoModeBanner from '../components/DemoModeBanner';

interface Props {
  navigation: {
    navigate: (screen: string) => void;
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
            // RootNavigator automatically routes to Onboarding when user is cleared
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <DemoModeBanner />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Settings</Text>

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
                  selectionColor={colors.accent.blue}
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
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
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
                  selectionColor={colors.accent.blue}
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

        <Text style={styles.sectionTitle}>Connected Accounts</Text>
        <View style={styles.card}>
          {accounts.length > 0 ? (
            <>
              {accounts.map((a) => (
                <View key={a.id} style={styles.row}>
                  <View>
                    <Text style={styles.rowLabel}>{a.name}</Text>
                    <Text style={styles.rowMeta}>{a.institution} · {a.type}</Text>
                  </View>
                  <View style={styles.syncBadge}>
                    <Text style={styles.syncText}>Synced</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]}>
                <Text style={styles.addAccountText}>+ Add Account</Text>
                <Text style={styles.rowArrow}>→</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.rowMeta}>Bank linking coming soon</Text>
              <Text style={styles.comingSoonBadge}>Soon</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          {[
            { label: 'Weekly Recap', value: notifWeekly, setter: setNotifWeekly },
            { label: 'Goal Nudges', value: notifGoals, setter: setNotifGoals },
            { label: 'Budget Warnings', value: notifBudget, setter: setNotifBudget },
            { label: 'Streak Reminders', value: notifStreak, setter: setNotifStreak },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.switchRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Switch
                value={item.value}
                onValueChange={item.setter}
                trackColor={{ false: colors.border.default, true: colors.accent.blue }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

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

        {!isDemo && (
          <>
            <Text style={styles.sectionTitle}>Account Actions</Text>
            <View style={styles.card}>
              <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={handleSignOut}>
                <Text style={[styles.rowLabel, { color: colors.accent.red }]}>Sign Out</Text>
                <Text style={styles.rowArrow}>→</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Export Data</Text>
            <Text style={styles.rowArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={handleDeleteAll}>
            <Text style={[styles.rowLabel, { color: colors.accent.red }]}>Delete All Data</Text>
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
    backgroundColor: colors.bg.primary,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  screenTitle: {
    ...typography.title,
    color: colors.text.primary,
    marginBottom: 20,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 20,
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  rowLabel: {
    ...typography.subheading,
    color: colors.text.primary,
  },
  rowValue: {
    ...typography.label,
    color: colors.text.secondary,
  },
  rowMeta: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  rowArrow: {
    ...typography.subheading,
    color: colors.text.muted,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: colors.text.primary,
    ...typography.label,
    minWidth: 90,
    borderWidth: 1,
    borderColor: colors.accent.blue + '60',
  },
  saveText: {
    ...typography.label,
    color: colors.accent.blue,
    fontWeight: '600',
  },
  syncBadge: {
    backgroundColor: colors.accent.greenGlow,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.accent.green + '30',
  },
  syncText: {
    ...typography.caption,
    color: colors.accent.green,
    fontWeight: '600',
  },
  addAccountText: {
    ...typography.label,
    color: colors.accent.blue,
    fontWeight: '600',
  },
  comingSoonBadge: {
    ...typography.caption,
    color: colors.text.disabled,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  demoCard: {
    backgroundColor: colors.accent.amberGlow,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accent.amber + '30',
    padding: 20,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.amber,
  },
  demoTitle: {
    ...typography.heading,
    color: colors.accent.amberLight,
    marginBottom: 8,
  },
  demoText: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  connectButton: {
    backgroundColor: colors.accent.blue,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    ...typography.label,
    fontWeight: '600',
  },
  version: {
    ...typography.caption,
    color: colors.text.disabled,
    textAlign: 'center',
    marginTop: 28,
  },
});
