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
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import GoalDetailScreen from '../screens/GoalDetailScreen';
import ReceiptCaptureScreen from '../screens/ReceiptCaptureScreen';

type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  PlaidConnect: undefined;
  MainTabs: undefined;
  TransactionDetail: { transactionId: string };
  GoalDetail: { goalId: string };
  ReceiptCapture: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, loadUserData, reset } = useAppStore();
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      if (existing) {
        loadUserData(existing.user.id).finally(() => setAuthChecked(true));
      } else {
        setAuthChecked(true);
      }
    });

    // Listen for sign in / sign out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'SIGNED_IN' && newSession) {
        loadUserData(newSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!authChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accentBlue} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      {!user ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PlaidConnect" component={DemoModeScreen} options={{ title: 'Connect Accounts' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ title: 'Transaction' }} />
          <Stack.Screen name="GoalDetail" component={GoalDetailScreen} options={{ title: 'Goal Details' }} />
          <Stack.Screen
            name="ReceiptCapture"
            component={ReceiptCaptureScreen}
            options={{ headerShown: false, presentation: 'modal' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
