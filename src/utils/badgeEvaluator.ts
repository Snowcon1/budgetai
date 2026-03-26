import AsyncStorage from '@react-native-async-storage/async-storage';
import { BADGES, BadgeId, BadgeContext } from '../constants/badges';

const STORAGE_KEY = 'snapbudget_badges';

export async function loadEarnedBadges(): Promise<BadgeId[]> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY);
    if (!val) return [];
    return JSON.parse(val) as BadgeId[];
  } catch {
    return [];
  }
}

export async function saveEarnedBadges(badges: BadgeId[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(badges)).catch(() => {});
}

/** Returns newly earned badge IDs (not already in alreadyEarned). */
export function evaluateBadges(ctx: BadgeContext, alreadyEarned: BadgeId[]): BadgeId[] {
  const earned = new Set(alreadyEarned);
  const newlyEarned: BadgeId[] = [];

  for (const badge of BADGES) {
    if (!earned.has(badge.id) && badge.evaluator(ctx)) {
      newlyEarned.push(badge.id);
    }
  }

  return newlyEarned;
}
