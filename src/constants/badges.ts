import { Transaction, Goal } from '../types';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface BadgeContext {
  transactions: Transaction[];
  goals: Goal[];
  currentStreak: number;
  bestStreak: number;
  healthScore: number;
  challengesCompleted: number;
  totalReceiptsScanned: number;
  monthlyIncome: number;
}

export interface BadgeDef {
  id: BadgeId;
  name: string;
  description: string;
  emoji: string;
  rarity: BadgeRarity;
  evaluator: (ctx: BadgeContext) => boolean;
}

export type BadgeId =
  | 'first_transaction'
  | 'streak_7'
  | 'streak_30'
  | 'streak_100'
  | 'goal_created'
  | 'goal_halfway'
  | 'goal_complete'
  | 'challenge_first'
  | 'challenge_5'
  | 'under_budget_month'
  | 'health_score_80'
  | 'health_score_100'
  | 'saver_1000'
  | 'saver_5000'
  | 'receipt_scanner_10'
  | 'transaction_50'
  | 'multi_goal'
  | 'debt_free';

export const BADGES: BadgeDef[] = [
  {
    id: 'first_transaction',
    name: 'First Step',
    description: 'Log your first transaction',
    emoji: '🎯',
    rarity: 'common',
    evaluator: (ctx) => ctx.transactions.length >= 1,
  },
  {
    id: 'transaction_50',
    name: 'Consistent Tracker',
    description: 'Log 50 transactions',
    emoji: '📒',
    rarity: 'common',
    evaluator: (ctx) => ctx.transactions.length >= 50,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day check-in streak',
    emoji: '🔥',
    rarity: 'common',
    evaluator: (ctx) => ctx.bestStreak >= 7,
  },
  {
    id: 'streak_30',
    name: 'Month Master',
    description: 'Maintain a 30-day check-in streak',
    emoji: '💪',
    rarity: 'rare',
    evaluator: (ctx) => ctx.bestStreak >= 30,
  },
  {
    id: 'streak_100',
    name: 'Century Club',
    description: 'Maintain a 100-day check-in streak',
    emoji: '🏆',
    rarity: 'legendary',
    evaluator: (ctx) => ctx.bestStreak >= 100,
  },
  {
    id: 'goal_created',
    name: 'Dream Builder',
    description: 'Create your first savings goal',
    emoji: '🌱',
    rarity: 'common',
    evaluator: (ctx) => ctx.goals.length >= 1,
  },
  {
    id: 'multi_goal',
    name: 'Ambitious',
    description: 'Have 3 active goals at once',
    emoji: '🎪',
    rarity: 'rare',
    evaluator: (ctx) => ctx.goals.filter((g) => g.current_amount < g.target_amount).length >= 3,
  },
  {
    id: 'goal_halfway',
    name: 'Halfway There',
    description: 'Reach 50% on any savings goal',
    emoji: '⛽',
    rarity: 'common',
    evaluator: (ctx) =>
      ctx.goals.some(
        (g) => g.target_amount > 0 && g.current_amount / g.target_amount >= 0.5
      ),
  },
  {
    id: 'goal_complete',
    name: 'Goal Getter',
    description: 'Complete a savings goal',
    emoji: '✅',
    rarity: 'rare',
    evaluator: (ctx) =>
      ctx.goals.some(
        (g) => g.target_amount > 0 && g.current_amount >= g.target_amount
      ),
  },
  {
    id: 'challenge_first',
    name: 'Challenge Accepted',
    description: 'Complete your first weekly challenge',
    emoji: '⚡',
    rarity: 'common',
    evaluator: (ctx) => ctx.challengesCompleted >= 1,
  },
  {
    id: 'challenge_5',
    name: 'Challenge Champion',
    description: 'Complete 5 weekly challenges',
    emoji: '🥇',
    rarity: 'epic',
    evaluator: (ctx) => ctx.challengesCompleted >= 5,
  },
  {
    id: 'health_score_80',
    name: 'Financially Fit',
    description: 'Reach a health score of 80 or above',
    emoji: '💚',
    rarity: 'rare',
    evaluator: (ctx) => ctx.healthScore >= 80,
  },
  {
    id: 'health_score_100',
    name: 'Perfect Score',
    description: 'Reach a perfect health score of 100',
    emoji: '💎',
    rarity: 'legendary',
    evaluator: (ctx) => ctx.healthScore >= 100,
  },
  {
    id: 'saver_1000',
    name: 'Four Figures',
    description: 'Save $1,000 across all goals',
    emoji: '💰',
    rarity: 'rare',
    evaluator: (ctx) =>
      ctx.goals.reduce((s, g) => s + g.current_amount, 0) >= 1000,
  },
  {
    id: 'saver_5000',
    name: 'High Roller',
    description: 'Save $5,000 across all goals',
    emoji: '🤑',
    rarity: 'epic',
    evaluator: (ctx) =>
      ctx.goals.reduce((s, g) => s + g.current_amount, 0) >= 5000,
  },
  {
    id: 'under_budget_month',
    name: 'Budget Boss',
    description: 'Spend less than your income in a calendar month',
    emoji: '📊',
    rarity: 'rare',
    evaluator: (ctx) => {
      if (ctx.monthlyIncome <= 0) return false;
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthSpend = ctx.transactions
        .filter(
          (t) =>
            t.category !== 'Income' &&
            t.category !== 'Transfer' &&
            t.amount < 0 &&
            t.date.startsWith(monthStr)
        )
        .reduce((s, t) => s + Math.abs(t.amount), 0);
      return monthSpend < ctx.monthlyIncome;
    },
  },
  {
    id: 'receipt_scanner_10',
    name: 'Receipt Ninja',
    description: 'Scan 10 receipts with the camera',
    emoji: '📷',
    rarity: 'rare',
    evaluator: (ctx) => ctx.totalReceiptsScanned >= 10,
  },
  {
    id: 'debt_free',
    name: 'Debt Slayer',
    description: 'Pay off a debt goal completely',
    emoji: '⚔️',
    rarity: 'epic',
    evaluator: (ctx) =>
      ctx.goals.some(
        (g) => g.type === 'debt' && g.target_amount > 0 && g.current_amount >= g.target_amount
      ),
  },
];
