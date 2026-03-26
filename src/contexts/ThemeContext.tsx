import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pulse_theme';

export type ThemeScheme = 'system' | 'dark' | 'light';

const darkColors = {
  bg: {
    primary: '#0F172A',
    surface: '#1E293B',
    elevated: '#273548',
    overlay: 'rgba(15, 23, 42, 0.85)',
  },
  accent: {
    blue: '#3B82F6',
    blueMid: '#2563EB',
    blueLight: '#60A5FA',
    blueGlow: 'rgba(59, 130, 246, 0.15)',
    green: '#22C55E',
    greenLight: '#4ADE80',
    greenGlow: 'rgba(34, 197, 94, 0.15)',
    amber: '#F59E0B',
    amberLight: '#FCD34D',
    amberGlow: 'rgba(245, 158, 11, 0.12)',
    red: '#EF4444',
    redLight: '#F87171',
    redGlow: 'rgba(239, 68, 68, 0.12)',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5E1',
    muted: '#94A3B8',
    disabled: '#475569',
  },
  border: {
    default: '#334155',
    subtle: '#1E293B',
    accent: '#3B82F6',
  },
  category: {
    'Dining Out': { bg: '#1C1917', accent: '#F97316', icon: '🍕' },
    'Groceries': { bg: '#14532D', accent: '#22C55E', icon: '🛒' },
    'Gas': { bg: '#1C1917', accent: '#EAB308', icon: '⛽' },
    'Shopping': { bg: '#1D3557', accent: '#60A5FA', icon: '🛍️' },
    'Entertainment': { bg: '#2E1065', accent: '#A78BFA', icon: '🎬' },
    'Health': { bg: '#164E63', accent: '#22D3EE', icon: '💊' },
    'Travel': { bg: '#1D3557', accent: '#38BDF8', icon: '✈️' },
    'Subscriptions': { bg: '#2D1B69', accent: '#8B5CF6', icon: '🔁' },
    'Income': { bg: '#14532D', accent: '#4ADE80', icon: '💰' },
    'Rent': { bg: '#1E1B4B', accent: '#818CF8', icon: '🏠' },
    'Utilities': { bg: '#1C1917', accent: '#A3A3A3', icon: '💡' },
    'Transfer': { bg: '#1E293B', accent: '#64748B', icon: '↔️' },
    'Other': { bg: '#1E293B', accent: '#94A3B8', icon: '📦' },
  },
} as const;

const lightColors = {
  bg: {
    primary: '#F8FAFC',
    surface: '#FFFFFF',
    elevated: '#F1F5F9',
    overlay: 'rgba(248, 250, 252, 0.92)',
  },
  accent: {
    blue: '#3B82F6',
    blueMid: '#2563EB',
    blueLight: '#2563EB',
    blueGlow: 'rgba(59, 130, 246, 0.12)',
    green: '#16A34A',
    greenLight: '#15803D',
    greenGlow: 'rgba(22, 163, 74, 0.12)',
    amber: '#D97706',
    amberLight: '#B45309',
    amberGlow: 'rgba(217, 119, 6, 0.10)',
    red: '#DC2626',
    redLight: '#B91C1C',
    redGlow: 'rgba(220, 38, 38, 0.10)',
  },
  text: {
    primary: '#0F172A',
    secondary: '#334155',
    muted: '#64748B',
    disabled: '#94A3B8',
  },
  border: {
    default: '#E2E8F0',
    subtle: '#F1F5F9',
    accent: '#3B82F6',
  },
  category: {
    'Dining Out': { bg: '#FFF7ED', accent: '#EA580C', icon: '🍕' },
    'Groceries': { bg: '#F0FDF4', accent: '#16A34A', icon: '🛒' },
    'Gas': { bg: '#FEFCE8', accent: '#CA8A04', icon: '⛽' },
    'Shopping': { bg: '#EFF6FF', accent: '#2563EB', icon: '🛍️' },
    'Entertainment': { bg: '#FAF5FF', accent: '#7C3AED', icon: '🎬' },
    'Health': { bg: '#ECFEFF', accent: '#0891B2', icon: '💊' },
    'Travel': { bg: '#EFF6FF', accent: '#0284C7', icon: '✈️' },
    'Subscriptions': { bg: '#F5F3FF', accent: '#6D28D9', icon: '🔁' },
    'Income': { bg: '#F0FDF4', accent: '#15803D', icon: '💰' },
    'Rent': { bg: '#EEF2FF', accent: '#4338CA', icon: '🏠' },
    'Utilities': { bg: '#F8FAFC', accent: '#52525B', icon: '💡' },
    'Transfer': { bg: '#F8FAFC', accent: '#475569', icon: '↔️' },
    'Other': { bg: '#F8FAFC', accent: '#64748B', icon: '📦' },
  },
} as const;

export type AppColors = typeof darkColors;

interface ThemeContextValue {
  colors: AppColors;
  isDark: boolean;
  scheme: ThemeScheme;
  setScheme: (s: ThemeScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  isDark: true,
  scheme: 'system',
  setScheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [scheme, setSchemeState] = useState<ThemeScheme>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'dark' || saved === 'light' || saved === 'system') {
          setSchemeState(saved);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const setScheme = (s: ThemeScheme) => {
    setSchemeState(s);
    AsyncStorage.setItem(STORAGE_KEY, s).catch(() => {});
  };

  const resolvedDark: boolean =
    scheme === 'system' ? (systemScheme === 'dark' || systemScheme == null) : scheme === 'dark';

  const colors: AppColors = resolvedDark ? darkColors : (lightColors as unknown as AppColors);

  return (
    <ThemeContext.Provider value={{ colors, isDark: resolvedDark, scheme, setScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
