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

export function generateWeeklyChallenge(
  transactions: Transaction[],
  excludeCategory?: string
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

  if (!bestCategory) {
    return {
      description: 'Track every purchase this week — awareness is the first step to saving!',
      completed: false,
      opted_in: false,
    };
  }

  // Target = 25% reduction from average, rounded to nearest $5
  const target = Math.max(5, Math.round((bestAvg * 0.75) / 5) * 5);
  const label = CATEGORY_LABELS[bestCategory] ?? bestCategory.toLowerCase();

  return {
    description: `Spend under $${target} on ${label} this week`,
    completed: false,
    opted_in: false,
    category: bestCategory,
  };
}
