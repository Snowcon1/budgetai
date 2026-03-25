import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import type { Session } from '@supabase/supabase-js';
import { colors } from '../constants/colors';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import MainTabNavigator from './MainTabNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import DemoModeScreen from '../screens/DemoModeScreen';
import PlaidConnectScreen from '../screens/PlaidConnectScreen';
import QuickSetupScreen from '../screens/QuickSetupScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import GoalDetailScreen from '../screens/GoalDetailScreen';
import ReceiptCaptureScreen from '../screens/ReceiptCaptureScreen';
import WeeklyRecapScreen from '../screens/WeeklyRecapScreen';
import SettingsScreen from '../screens/SettingsScreen';

type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  QuickSetup: undefined;
  PlaidConnect: undefined;
  PlaidConnectReal: undefined;
  MainTabs: undefined;
  TransactionDetail: { transactionId: string };
  GoalDetail: { goalId: string };
  ReceiptCapture: undefined;
  WeeklyRecap: { weekNumber?: number };
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, isNewUser, wantsAuth, loadUserData, reset, loadPersona } = useAppStore();
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    loadPersona();
  }, []);

  useEffect(() => {
    // INITIAL_SESSION fires once on subscription setup with the current session (or null).
    // Using it as the single source of truth avoids duplicate loadUserData calls from
    // both getSession() and onAuthStateChange firing SIGNED_IN simultaneously.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'INITIAL_SESSION') {
        if (newSession) {
          loadUserData(newSession.user.id).finally(() => setAuthChecked(true));
        } else {
          setAuthChecked(true);
        }
      } else if (event === 'SIGNED_IN' && newSession) {
        loadUserData(newSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!authChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.primary, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accent.blue} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.bg.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: { fontWeight: '600' },
        cardStyle: { backgroundColor: colors.bg.primary },
      }}
    >
      {!user && !isNewUser ? (
        // Unauthenticated screens — if coming from demo, show Auth first so they land there directly
        wantsAuth ? (
          <>
            <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PlaidConnect" component={DemoModeScreen} options={{ title: 'Connect Accounts' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PlaidConnect" component={DemoModeScreen} options={{ title: 'Connect Accounts' }} />
          </>
        )
      ) : !user && isNewUser ? (
        // New user — needs to complete profile setup
        <Stack.Screen name="QuickSetup" component={QuickSetupScreen} options={{ headerShown: false }} />
      ) : (
        // Authenticated screens
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ title: 'Transaction' }} />
          <Stack.Screen name="GoalDetail" component={GoalDetailScreen} options={{ title: 'Goal Details' }} />
          <Stack.Screen
            name="ReceiptCapture"
            component={ReceiptCaptureScreen}
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen
            name="WeeklyRecap"
            component={WeeklyRecapScreen}
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen
            name="PlaidConnectReal"
            component={PlaidConnectScreen}
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: false, presentation: 'modal' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
