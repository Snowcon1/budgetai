import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import AddToHomeScreen from './src/components/AddToHomeScreen';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

// ── Web-only: inject PWA meta tags and set initial background ────────────────
// Runs at module load (before first render) to prevent white flash.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Background on html/body/#root so safe-area padding regions aren't white
  const darkBg = '#0F172A';
  document.documentElement.style.backgroundColor = darkBg;
  document.documentElement.style.height = '100%';
  document.body.style.backgroundColor = darkBg;
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.height = '100%';
  document.body.style.overflow = 'hidden';
  const root = document.getElementById('root');
  if (root) {
    root.style.height = '100%';
    root.style.backgroundColor = darkBg;
  }

  // Ensure viewport-fit=cover so env(safe-area-inset-*) works in PWA
  const vp = document.querySelector('meta[name="viewport"]');
  if (vp) {
    const content = vp.getAttribute('content') || '';
    if (!content.includes('viewport-fit=cover')) {
      vp.setAttribute('content', content + ', viewport-fit=cover');
    }
  }

  // PWA / iOS standalone meta tags
  const addMeta = (name: string, content: string, media?: string) => {
    const m = document.createElement('meta');
    m.setAttribute('name', name);
    m.setAttribute('content', content);
    if (media) m.setAttribute('media', media);
    document.head.appendChild(m);
  };
  addMeta('theme-color', '#0F172A', '(prefers-color-scheme: dark)');
  addMeta('theme-color', '#F8FAFC', '(prefers-color-scheme: light)');
  addMeta('apple-mobile-web-app-capable', 'yes');
  addMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
  addMeta('apple-mobile-web-app-title', 'Pulse');
  document.title = 'Pulse';
}

function AppContent() {
  const { isDark, colors } = useTheme();

  // Keep html/body/root bg in sync when user toggles dark ↔ light
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.style.backgroundColor = colors.bg.primary;
      document.body.style.backgroundColor = colors.bg.primary;
      const root = document.getElementById('root');
      if (root) root.style.backgroundColor = colors.bg.primary;
    }
  }, [colors.bg.primary]);

  const navTheme = {
    dark: isDark,
    colors: {
      primary: colors.accent.blue,
      background: colors.bg.primary,
      card: colors.bg.surface,
      text: colors.text.primary,
      border: colors.border.subtle,
      notification: colors.accent.red,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <NavigationContainer theme={navTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RootNavigator />
        <AddToHomeScreen />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
