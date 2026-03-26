import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import ChatScreen from '../screens/ChatScreen';
import GoalsScreen from '../screens/GoalsScreen';
import AccountsScreen from '../screens/AccountsScreen';

const Tab = createBottomTabNavigator();

interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  size: number;
  hasBadge?: boolean;
}

function TabIcon({ name, focused, size, hasBadge = false }: TabIconProps) {
  const { colors } = useTheme();
  const dotScale = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(dotScale, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  }, [focused]);

  return (
    <View style={tabIconStyles.wrapper}>
      <View style={tabIconStyles.iconContainer}>
        <Ionicons
          name={focused ? name : (name.replace('-outline', '') + '-outline') as keyof typeof Ionicons.glyphMap}
          size={size}
          color={focused ? colors.accent.blue : colors.text.disabled}
        />
        {hasBadge && (
          <View style={[tabIconStyles.permanentBadge, { backgroundColor: colors.accent.blue }]} />
        )}
      </View>
      <Animated.View style={[tabIconStyles.activeDot, { backgroundColor: colors.accent.blue, transform: [{ scale: dotScale }] }]} />
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permanentBadge: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default function MainTabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.bg.primary,
          borderTopColor: colors.border.subtle,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: colors.bg.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
          letterSpacing: -0.2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home-outline" focused={focused} size={22} />
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="list-outline" focused={focused} size={22} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="chatbubble-outline" focused={focused} size={24} hasBadge />
          ),
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="trophy-outline" focused={focused} size={22} />
          ),
        }}
      />
      <Tab.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="wallet-outline" focused={focused} size={22} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
