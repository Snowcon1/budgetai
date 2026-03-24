import { Platform } from 'react-native';
import { colors } from './colors';

export const typography = {
  hero: { fontSize: 36, fontWeight: '700' as const, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.3 },
  heading: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.2 },
  subheading: { fontSize: 16, fontWeight: '500' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0.1 },
  caption: { fontSize: 11, fontWeight: '400' as const, letterSpacing: 0.2 },
  mono: { fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' as const },
};

export const theme = {
  colors,
  typography,
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  // Keep legacy fontSize for backward compat
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    card: 16,
    lg: 20,
    full: 9999,
  },
  screenPadding: 20,
} as const;
