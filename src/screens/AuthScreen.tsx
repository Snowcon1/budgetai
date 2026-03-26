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
import { typography } from '../constants/theme';

interface Props {
  navigation: { goBack: () => void; replace: (screen: string) => void };
}

export default function AuthScreen({ navigation }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [signUpSent, setSignUpSent] = useState(false);

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
    if (error) {
      if (error.message.toLowerCase().includes('invalid login')) {
        Alert.alert('Sign In Failed', 'Incorrect email or password. Please try again.');
      } else if (error.message.toLowerCase().includes('email not confirmed')) {
        Alert.alert(
          'Email Not Confirmed',
          'Please check your inbox and confirm your email address before signing in.'
        );
      } else {
        Alert.alert('Sign In Failed', error.message);
      }
    }
    // On success, onAuthStateChange in RootNavigator handles navigation automatically
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        Alert.alert('Email Taken', 'An account with this email already exists. Try signing in.');
        setMode('signin');
      } else {
        Alert.alert('Sign Up Failed', error.message);
      }
      return;
    }

    // If email confirmation is disabled in Supabase, the session is created immediately
    // and onAuthStateChange will fire → loadUserData → isNewUser → QuickSetupScreen.
    // If confirmation is enabled, the user needs to verify their email first.
    if (data.session) {
      // Auto-confirmed — onAuthStateChange will handle the rest
    } else {
      // Confirmation email sent
      setSignUpSent(true);
    }
  };

  if (signUpSent) {
    return (
      <View style={styles.confirmContainer}>
        <Text style={styles.confirmEmoji}>📬</Text>
        <Text style={styles.confirmTitle}>Check your email</Text>
        <Text style={styles.confirmBody}>
          We sent a confirmation link to{'\n'}
          <Text style={styles.confirmEmail}>{email.trim().toLowerCase()}</Text>
          {'\n\n'}Click the link in the email to activate your account, then come back to sign in.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            setSignUpSent(false);
            setMode('signin');
            setPassword('');
          }}
        >
          <Text style={styles.primaryButtonText}>Go to Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back to onboarding</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <View style={styles.logoSection}>
          <Text style={styles.logoIcon}>⚡</Text>
          <Text style={styles.logo}>Pulse</Text>
          <Text style={styles.tagline}>Your AI-powered financial coach</Text>
        </View>

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

          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={colors.text.disabled}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            selectionColor={colors.accent.blue}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.text.disabled}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            selectionColor={colors.accent.blue}
          />

          {mode === 'signup' && (
            <Text style={styles.passwordHint}>At least 6 characters</Text>
          )}

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

          {mode === 'signup' && (
            <Text style={styles.noCardNote}>
              No bank account or credit card required
            </Text>
          )}
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
    backgroundColor: colors.bg.primary,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  logo: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.accent.blue,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    ...typography.body,
    color: colors.text.muted,
  },
  card: {
    width: '100%',
    backgroundColor: colors.bg.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.bg.primary,
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.accent.blue,
  },
  tabText: {
    ...typography.label,
    color: colors.text.muted,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.bg.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...typography.body,
    color: colors.text.primary,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  passwordHint: {
    ...typography.caption,
    color: colors.text.disabled,
    marginBottom: 8,
    marginTop: -4,
    paddingLeft: 4,
  },
  primaryButton: {
    backgroundColor: colors.accent.blue,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: colors.accent.blue,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    ...typography.subheading,
    fontWeight: '700',
  },
  noCardNote: {
    ...typography.caption,
    color: colors.text.disabled,
    textAlign: 'center',
    marginTop: 12,
  },
  backButton: {
    marginTop: 28,
    padding: 8,
  },
  backText: {
    ...typography.label,
    color: colors.text.muted,
  },
  // Confirmation screen
  confirmContainer: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  confirmEmoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  confirmTitle: {
    ...typography.title,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  confirmBody: {
    ...typography.body,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  confirmEmail: {
    color: colors.accent.blue,
    fontWeight: '600',
  },
});
