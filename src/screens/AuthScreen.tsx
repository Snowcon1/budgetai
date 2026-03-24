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
import { supabase } from '../lib/supabase';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';

interface Props {
  navigation: { goBack: () => void };
}

export default function AuthScreen({ navigation }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) Alert.alert('Sign In Failed', error.message);
    // On success, RootNavigator's onAuthStateChange handles the rest
  };

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: name.trim() } },
    });
    setLoading(false);
    if (error) Alert.alert('Sign Up Failed', error.message);
    // On success, RootNavigator's onAuthStateChange handles the rest
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
        <Text style={styles.logo}>SnapBudget</Text>
        <Text style={styles.tagline}>Your AI-powered financial coach</Text>

        <View style={styles.card}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, mode === 'signin' && styles.tabActive]}
              onPress={() => setMode('signin')}
            >
              <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'signup' && styles.tabActive]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={mode === 'signin' ? handleSignIn : handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back to onboarding</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: theme.screenPadding,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.accentBlue,
    marginBottom: 8,
  },
  tagline: {
    fontSize: theme.fontSize.md,
    color: colors.textSecondary,
    marginBottom: 48,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 24,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm - 2,
  },
  tabActive: {
    backgroundColor: colors.accentBlue,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: theme.fontSize.md,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.accentBlue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 32,
    padding: 8,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
});
