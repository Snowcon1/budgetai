import { Platform } from 'react-native';

const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

let Haptics: typeof import('expo-haptics') | null = null;

// Lazy import to avoid crashing on web
function getHaptics() {
  if (!isSupported) return null;
  if (!Haptics) {
    try {
      Haptics = require('expo-haptics');
    } catch {
      return null;
    }
  }
  return Haptics;
}

export function hapticLight() {
  const h = getHaptics();
  if (h) h.impactAsync(h.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticMedium() {
  const h = getHaptics();
  if (h) h.impactAsync(h.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function hapticHeavy() {
  const h = getHaptics();
  if (h) h.impactAsync(h.ImpactFeedbackStyle.Heavy).catch(() => {});
}

export function hapticSuccess() {
  const h = getHaptics();
  if (h) h.notificationAsync(h.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticError() {
  const h = getHaptics();
  if (h) h.notificationAsync(h.NotificationFeedbackType.Error).catch(() => {});
}

export function hapticSelection() {
  const h = getHaptics();
  if (h) h.selectionAsync().catch(() => {});
}
