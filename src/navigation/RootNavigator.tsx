import React from 'react';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import { colors } from '../constants/colors';
import { useAppStore } from '../store/useAppStore';
import MainTabNavigator from './MainTabNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import DemoModeScreen from '../screens/DemoModeScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import GoalDetailScreen from '../screens/GoalDetailScreen';
import ReceiptCaptureScreen from '../screens/ReceiptCaptureScreen';

type RootStackParamList = {
  Onboarding: undefined;
  PlaidConnect: undefined;
  MainTabs: undefined;
  TransactionDetail: { transactionId: string };
  GoalDetail: { goalId: string };
  ReceiptCapture: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const user = useAppStore((s) => s.user);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        cardStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      {!user ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
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
