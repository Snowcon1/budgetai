import React, { useState, useEffect } from 'react';
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
import { useTheme, ThemeScheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import DemoModeBanner from '../components/DemoModeBanner';
import { PERSONA_LIST, PersonaId } from '../constants/personas';
import { hapticSelection } from '../utils/haptics';
import { loadNotifPrefs, saveNotifPrefs, NotificationPrefs, DEFAULT_NOTIF_PREFS } from '../utils/notificationPrefs';
import { scheduleAllNotifications } from '../utils/notifications';

interface Props {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

const APPEARANCE_OPTIONS: { label: string; value: ThemeScheme; emoji: string }[] = [
  { label: 'System', value: 'system', emoji: '⚙️' },
  { label: 'Dark', value: 'dark', emoji: '🌙' },
  { label: 'Light', value: 'light', emoji: '☀️' },
];

export default function SettingsScreen({ navigation }: Props) {
  const { colors, scheme, setScheme } = useTheme();
  const { user, isDemo, accounts, reset, setUser, userId, persona, setPersona, freezesRemaining, earnedBadges } = useAppStore();
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIF_PREFS);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? '');
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState(user?.monthly_income?.toString() ?? '');

  useEffect(() => {
    loadNotifPrefs().then(setNotifPrefs);
  }, []);

  const updateNotifPrefs = async (updated: NotificationPrefs) => {
    setNotifPrefs(updated);
    await saveNotifPrefs(updated);
  };

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
          },
        },
      ]
    );
  };

  const badgeCount = Object.keys(earnedBadges ?? {}).length;

  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <DemoModeBanner />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Settings</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* APPEARANCE */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          {APPEARANCE_OPTIONS.map((opt, i, arr) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.row, i === arr.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => { hapticSelection(); setScheme(opt.value); }}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.appearanceEmoji}>{opt.emoji}</Text>
                <Text style={styles.rowLabel}>{opt.label}</Text>
              </View>
              {scheme === opt.value && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ACCOUNT */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Name</Text>
            {isDemo ? (
              <Text style={styles.rowValue}>{user?.name ?? 'Demo User'}</Text>
            ) : editingName ? (
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
            {isDemo ? (
              <Text style={styles.rowValue}>${user?.monthly_income?.toLocaleString() ?? '0'}</Text>
            ) : editingIncome ? (
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

        {/* CONNECTED ACCOUNTS */}
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
              {!isDemo && (
                <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('PlaidConnectReal')}>
                  <Text style={styles.addAccountText}>+ Add Account</Text>
                  <Text style={styles.rowArrow}>→</Text>
                </TouchableOpacity>
              )}
            </>
          ) : !isDemo ? (
            <TouchableOpacity
              style={[styles.row, { borderBottomWidth: 0 }]}
              onPress={() => navigation.navigate('PlaidConnectReal')}
            >
              <Text style={styles.addAccountText}>+ Connect Bank Account</Text>
              <Text style={styles.rowArrow}>→</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.rowLabel}>No accounts in demo</Text>
            </View>
          )}
        </View>

        {/* ASSISTANT PERSONA */}
        <Text style={styles.sectionTitle}>Assistant Persona</Text>
        <View style={styles.personaGrid}>
          {PERSONA_LIST.map((p) => {
            const active = persona === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.personaCard, active && styles.personaCardActive]}
                onPress={() => { hapticSelection(); setPersona(p.id as PersonaId); }}
                activeOpacity={0.75}
              >
                <Text style={styles.personaEmoji}>{p.emoji}</Text>
                <Text style={[styles.personaName, active && styles.personaNameActive]}>{p.name}</Text>
                <Text style={styles.personaTagline}>{p.tagline}</Text>
                {active && <View style={styles.personaCheck}><Text style={styles.personaCheckText}>✓</Text></View>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* STREAK */}
        <Text style={styles.sectionTitle}>Streak</Text>
        <View style={styles.card}>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>🧊 Streak Freezes Remaining</Text>
            <Text style={styles.rowValue}>{freezesRemaining ?? 3}</Text>
          </View>
        </View>

        {/* ACHIEVEMENTS */}
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate('Badges')}
          >
            <View>
              <Text style={styles.rowLabel}>🏆 View Badges</Text>
              <Text style={styles.rowMeta}>{badgeCount} earned</Text>
            </View>
            <Text style={styles.rowArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* NOTIFICATIONS */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          {[
            { label: 'Weekly Recap', key: 'weeklyRecap' as const, sub: 'Every Monday' },
            { label: 'Goal Nudges', key: 'goalNudge' as const, sub: 'When behind schedule' },
            { label: 'Budget Warnings', key: 'budgetWarning' as const, sub: 'At 80% of budget' },
            { label: 'Streak Reminders', key: 'streakReminder' as const, sub: 'Daily if no activity' },
            { label: 'Daily Check-in', key: 'dailyCheckIn' as const, sub: 'Morning nudge' },
            { label: 'Milestone Alerts', key: 'milestoneAlerts' as const, sub: 'Badges & goals' },
          ].map((item, i, arr) => {
            const prefSection = notifPrefs[item.key] as { enabled: boolean };
            return (
              <View key={item.key} style={[styles.switchRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                <View>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowMeta}>{item.sub}</Text>
                </View>
                <Switch
                  value={prefSection.enabled}
                  onValueChange={(v) => {
                    const updated = {
                      ...notifPrefs,
                      [item.key]: { ...notifPrefs[item.key], enabled: v },
                    };
                    updateNotifPrefs(updated);
                  }}
                  trackColor={{ false: colors.border.default, true: colors.accent.blue }}
                  thumbColor="#fff"
                />
              </View>
            );
          })}
        </View>

        {/* DEMO MODE */}
        {isDemo && (
          <>
            <Text style={styles.sectionTitle}>Demo Mode</Text>
            <View style={styles.demoCard}>
              <Text style={styles.demoTitle}>You're using demo data</Text>
              <Text style={styles.demoText}>
                Connect your real bank accounts to get personalized insights based on your actual spending.
              </Text>
              <TouchableOpacity style={styles.connectButton} onPress={() => navigation.navigate('PlaidConnectReal')}>
                <Text style={styles.connectButtonText}>Connect Real Accounts</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ACCOUNT ACTIONS */}
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

        {/* PRIVACY */}
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

        <Text style={styles.version}>Pulse v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.primary,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    screenTitle: {
      ...typography.title,
      color: colors.text.primary,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.default,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeText: {
      color: colors.text.muted,
      fontSize: 14,
      fontWeight: '600',
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
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    appearanceEmoji: {
      fontSize: 16,
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
    checkBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.accent.blue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
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
    personaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    personaCard: {
      width: '47.5%',
      backgroundColor: colors.bg.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: 14,
      position: 'relative',
    },
    personaCardActive: {
      borderColor: colors.accent.blue,
      backgroundColor: colors.accent.blue + '12',
    },
    personaEmoji: {
      fontSize: 26,
      marginBottom: 6,
    },
    personaName: {
      ...typography.label,
      color: colors.text.primary,
      fontWeight: '600',
      marginBottom: 3,
    },
    personaNameActive: {
      color: colors.accent.blue,
    },
    personaTagline: {
      ...typography.caption,
      color: colors.text.muted,
      lineHeight: 15,
    },
    personaCheck: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.accent.blue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    personaCheckText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
    },
  });
}
