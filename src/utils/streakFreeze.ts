import AsyncStorage from '@react-native-async-storage/async-storage';

export const FREEZE_MAX = 3;

const FREEZE_COUNT_KEY = 'pulse_freeze_count';
const FROZEN_DATES_KEY = 'pulse_frozen_dates';

export async function loadFreezesRemaining(): Promise<number> {
  const val = await AsyncStorage.getItem(FREEZE_COUNT_KEY).catch(() => null);
  if (val === null) return FREEZE_MAX;
  const n = parseInt(val, 10);
  return isNaN(n) ? FREEZE_MAX : n;
}

export async function saveFreezesRemaining(count: number): Promise<void> {
  await AsyncStorage.setItem(FREEZE_COUNT_KEY, String(count)).catch(() => {});
}

export async function consumeFreeze(): Promise<boolean> {
  const current = await loadFreezesRemaining();
  if (current <= 0) return false;
  await saveFreezesRemaining(current - 1);
  return true;
}

export async function addFreeze(count: number): Promise<void> {
  const current = await loadFreezesRemaining();
  await saveFreezesRemaining(Math.min(current + count, FREEZE_MAX * 2));
}

export async function loadFrozenDates(): Promise<string[]> {
  const val = await AsyncStorage.getItem(FROZEN_DATES_KEY).catch(() => null);
  if (!val) return [];
  try {
    return JSON.parse(val) as string[];
  } catch {
    return [];
  }
}

export async function addFrozenDate(dateStr: string): Promise<void> {
  const dates = await loadFrozenDates();
  if (!dates.includes(dateStr)) {
    dates.push(dateStr);
    // Keep only last 30 days
    const recent = dates.slice(-30);
    await AsyncStorage.setItem(FROZEN_DATES_KEY, JSON.stringify(recent)).catch(() => {});
  }
}

// Renamed export for use as hook-style in store
export { consumeFreeze as useStreakFreeze };
