import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'pulse_celebrated_goals';

export async function loadCelebratedGoals(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export async function markGoalCelebrated(key: string): Promise<void> {
  try {
    const set = await loadCelebratedGoals();
    set.add(key);
    await AsyncStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    // Silent
  }
}
