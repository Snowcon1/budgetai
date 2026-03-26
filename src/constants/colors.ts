// Legacy export kept for any files not yet migrated to useTheme().
// Prefer useTheme().colors in components.
export const colors = {
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

export type CategoryKey = keyof typeof colors.category;
