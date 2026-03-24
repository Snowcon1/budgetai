import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

interface Props {
  navigation: any;
}

export default function QuickSetupScreen({ navigation }: Props) {
  const { userId, completeSetup, reset } = useAppStore();
  const [name, setName] = useState('');
  const [income, setIncome] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async (useSampleData: boolean) => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter your name.');
      return;
    }
    const incomeNum = parseFloat(income.replace(/[^0-9.]/g, ''));
    if (!income.trim() || isNaN(incomeNum) || incomeNum <= 0) {
      Alert.alert('Invalid Income', 'Please enter your monthly take-home income.');
      return;
    }
    if (!userId) {
      Alert.alert('Error', 'Session expired. Please sign in again.');
      reset();
      return;
    }

    setLoading(true);
    await completeSetup(userId, name.trim(), incomeNum, useSampleData);
    setLoading(false);
    // RootNavigator will automatically navigate to MainTabs once user is set
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Account created!</Text>
          <Text style={styles.subtitle}>
            Let's get your budget set up in seconds — no bank linking required.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>What should we call you?</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.text.disabled}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
            selectionColor={colors.accent.blue}
            autoFocus
          />

          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Monthly take-home income</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={[styles.input, styles.incomeInput]}
              placeholder="0.00"
              placeholderTextColor={colors.text.disabled}
              value={income}
              onChangeText={setIncome}
              keyboardType="decimal-pad"
              selectionColor={colors.accent.blue}
            />
          </View>
          <Text style={styles.inputHint}>This helps calculate your financial health score.</Text>
        </View>

        {/* Setup options */}
        <View style={styles.optionsSection}>
          <Text style={styles.optionsTitle}>How do you want to start?</Text>

          <TouchableOpacity
            style={[styles.optionCard, styles.optionCardPrimary]}
            onPress={() => handleSetup(true)}
            disabled={loading}
            activeOpacity={0.85}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionEmoji}>⚡</Text>
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Quick Start</Text>
              <Text style={styles.optionDesc}>
                Load sample transactions so you can explore every feature right away. You can edit or delete them anytime.
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, styles.optionCardSecondary]}
            onPress={() => handleSetup(false)}
            disabled={loading}
            activeOpacity={0.85}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionEmoji}>✏️</Text>
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, styles.optionTitleSecondary]}>Start Fresh</Text>
              <Text style={[styles.optionDesc, styles.optionDescSecondary]}>
                Begin with a blank slate. Add your own transactions, accounts, and goals manually.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent.blue} />
            <Text style={styles.loadingText}>Setting up your account…</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.signOutLink}
          onPress={() => {
            reset();
            navigation.replace('Onboarding');
          }}
        >
          <Text style={styles.signOutText}>← Sign in with a different account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  title: {
    ...typography.title,
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: 24,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.bg.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...typography.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    ...typography.body,
    color: colors.text.muted,
    marginRight: 4,
  },
  incomeInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  inputHint: {
    ...typography.caption,
    color: colors.text.disabled,
    marginTop: 6,
  },
  optionsSection: {
    marginBottom: 24,
  },
  optionsTitle: {
    ...typography.subheading,
    color: colors.text.secondary,
    marginBottom: 14,
    fontWeight: '600',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    gap: 14,
  },
  optionCardPrimary: {
    backgroundColor: colors.accent.blue + '15',
    borderColor: colors.accent.blue,
  },
  optionCardSecondary: {
    backgroundColor: colors.bg.surface,
    borderColor: colors.border.default,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionEmoji: {
    fontSize: 20,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    ...typography.subheading,
    color: colors.accent.blue,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionTitleSecondary: {
    color: colors.text.primary,
  },
  optionDesc: {
    ...typography.caption,
    color: colors.text.muted,
    lineHeight: 18,
  },
  optionDescSecondary: {
    color: colors.text.muted,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.muted,
  },
  signOutLink: {
    alignItems: 'center',
    padding: 8,
  },
  signOutText: {
    ...typography.label,
    color: colors.text.disabled,
  },
});
