import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

function isMobileWeb(): boolean {
  if (Platform.OS !== 'web') return false;
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS Safari standalone
  if ((window.navigator as any).standalone === true) return true;
  // Chrome/Android standalone
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  return false;
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

const DISMISSED_KEY = 'add_to_home_dismissed';

export default function AddToHomeScreen() {
  const { isDemo } = useAppStore();
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const slideAnim = React.useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (isDemo || !isMobileWeb() || isStandalone()) return;

    // Don't show if already dismissed
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch {}

    // Android: listen for Chrome's install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler as any);

    // Show after a short delay
    const timer = setTimeout(() => {
      setVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as any);
      clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setVisible(false));
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch {}
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') dismiss();
    }
    // iOS: can't auto-prompt, banner already shows instructions
  };

  if (!visible) return null;

  const ios = isIOS();

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>📱</Text>
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>Add to Home Screen</Text>
        <Text style={styles.sub}>
          {ios
            ? 'Tap Share → "Add to Home Screen" for the app experience'
            : 'Install for quick access like a native app'}
        </Text>
      </View>
      {!ios && deferredPrompt && (
        <TouchableOpacity style={styles.installBtn} onPress={handleInstall}>
          <Text style={styles.installText}>Install</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.closeBtn} onPress={dismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: colors.bg.elevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 9999,
  } as any,
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accent.blueGlow,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 18,
  },
  textCol: {
    flex: 1,
  },
  title: {
    ...typography.label,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  sub: {
    ...typography.caption,
    color: colors.text.muted,
    lineHeight: 15,
  },
  installBtn: {
    backgroundColor: colors.accent.blue,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexShrink: 0,
  },
  installText: {
    ...typography.label,
    color: '#fff',
    fontWeight: '600',
  },
  closeBtn: {
    flexShrink: 0,
    padding: 2,
  },
  closeText: {
    ...typography.caption,
    color: colors.text.muted,
    fontSize: 12,
  },
});
