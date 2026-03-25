import { subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { Transaction, WeeklyChallengeData } from '../types';

const CHALLENGE_CATEGORIES = [
  'Dining Out',
  'Groceries',
  'Shopping',
  'Entertainment',
  'Gas',
  'Subscriptions',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  'Dining Out': 'dining out',
  'Groceries': 'groceries',
  'Shopping': 'shopping',
  'Entertainment': 'entertainment',
  'Gas': 'gas',
  'Subscriptions': 'subscriptions',
};

// Fallback challenges used when spending data is insufficient or a unique result is needed
const STATIC_FALLBACKS: WeeklyChallengeData[] = [
  { description: 'Cook at home at least 4 nights this week', completed: false, opted_in: false, category: 'Dining Out' },
  { description: 'Find one subscription you can pause or cancel this week', completed: false, opted_in: false, category: 'Subscriptions' },
  { description: 'Go one full day without spending any money', completed: false, opted_in: false },
  { description: 'Skip one impulse purchase and save $20 this week', completed: false, opted_in: false, category: 'Shopping' },
  { description: 'Meal prep on Sunday to cut your food costs this week', completed: false, opted_in: false, category: 'Groceries' },
  { description: 'Fill up at the cheapest gas station near you this week', completed: false, opted_in: false, category: 'Gas' },
  { description: 'Review your last 10 transactions and find one category to cut', completed: false, opted_in: false },
  { description: 'Bring lunch from home every day this week', completed: false, opted_in: false, category: 'Dining Out' },
];

export function generateWeeklyChallenge(
  transactions: Transaction[],
  excludeCategory?: string,
  currentDescription?: string
): WeeklyChallengeData {
  const now = new Date();

  // Calculate weekly spend totals for each category over the past 4 weeks
  const weeklyTotals: Record<string, number[]> = {};

  for (let w = 1; w <= 4; w++) {
    const weekStart = startOfWeek(subWeeks(now, w));
    const weekEnd = endOfWeek(subWeeks(now, w));

    for (const cat of CHALLENGE_CATEGORIES) {
      const total = transactions
        .filter((t) => {
          const d = new Date(t.date);
          return d >= weekStart && d <= weekEnd && t.category === cat && t.amount < 0;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      if (!weeklyTotals[cat]) weeklyTotals[cat] = [];
      weeklyTotals[cat].push(total);
    }
  }

  // Pick the category with the highest weekly average (skip excluded)
  let bestCategory = '';
  let bestAvg = 0;

  for (const cat of CHALLENGE_CATEGORIES) {
    if (cat === excludeCategory) continue;
    const weeks = weeklyTotals[cat] ?? [];
    const avg = weeks.reduce((s, v) => s + v, 0) / Math.max(weeks.length, 1);
    if (avg > bestAvg && avg > 5) {
      bestAvg = avg;
      bestCategory = cat;
    }
  }

  if (bestCategory) {
    // Target = 25% reduction from average, rounded to nearest $5
    const target = Math.max(5, Math.round((bestAvg * 0.75) / 5) * 5);
    const label = CATEGORY_LABELS[bestCategory] ?? bestCategory.toLowerCase();
    const description = `Spend under $${target} on ${label} this week`;

    // Only return this if it's different from the current challenge
    if (!currentDescription || description !== currentDescription) {
      return { description, completed: false, opted_in: false, category: bestCategory, target_amount: target };
    }
  }

  // Fall back to static challenges — pick one different from current and not in excluded category
  const available = STATIC_FALLBACKS.filter(
    (c) => c.description !== currentDescription && c.category !== excludeCategory
  );

  if (available.length > 0) {
    const pick = available[Math.floor(Math.random() * available.length)];
    return { ...pick, completed: false, opted_in: false };
  }

  // Last resort (should never happen)
  return {
    description: 'Track every purchase this week — awareness is the first step to saving!',
    completed: false,
    opted_in: false,
  };
}
