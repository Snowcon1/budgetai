import { create } from 'zustand';
import {
  Transaction,
  Account,
  Goal,
  Subscription,
  ChatMessage,
  User,
  HealthScoreBreakdown,
  WeeklyChallengeData,
} from '../types';
import { demoUser, demoAccounts, demoTransactions, demoGoals, demoSubscriptions } from '../utils/demoData';
import { calculateHealthScore } from '../utils/healthScore';

interface AppState {
  user: User | null;
  isDemo: boolean;
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  subscriptions: Subscription[];
  chatHistory: ChatMessage[];
  healthScore: HealthScoreBreakdown;
  currentStreak: number;
  weeklyChallenge: WeeklyChallengeData;
  isPlaidConnected: boolean;

  initDemo: () => void;
  initReal: () => void;
  addTransaction: (t: Transaction) => void;
  updateTransaction: (id: string, changes: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addGoal: (g: Goal) => void;
  updateGoal: (id: string, changes: Partial<Goal>) => void;
  addChatMessage: (m: ChatMessage) => void;
  clearChat: () => void;
  recalculateHealthScore: () => void;
  setUser: (u: User) => void;
  reset: () => void;
}

const defaultHealthScore: HealthScoreBreakdown = {
  total: 0,
  spending_ratio: 0,
  goal_progress: 0,
  savings_rate: 0,
  subscription_efficiency: 0,
};

function calculateStreak(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let checkDate = new Date(today);

  for (let i = 0; i < 30; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const hasTransaction = transactions.some((t) => t.date === dateStr);
    if (hasTransaction) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      // Allow today to not have a transaction yet
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return Math.floor(streak / 7);
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isDemo: false,
  transactions: [],
  accounts: [],
  goals: [],
  subscriptions: [],
  chatHistory: [],
  healthScore: defaultHealthScore,
  currentStreak: 0,
  weeklyChallenge: {
    description: 'Spend under $50 on dining out this week',
    completed: false,
    opted_in: false,
  },
  isPlaidConnected: false,

  initDemo: () => {
    const transactions = demoTransactions;
    const score = calculateHealthScore(transactions, demoGoals, demoSubscriptions, demoUser.monthly_income);
    const streak = calculateStreak(transactions);

    set({
      user: demoUser,
      isDemo: true,
      transactions,
      accounts: demoAccounts,
      goals: demoGoals,
      subscriptions: demoSubscriptions,
      chatHistory: [],
      healthScore: score,
      currentStreak: streak,
      isPlaidConnected: false,
      weeklyChallenge: {
        description: 'Spend under $50 on dining out this week',
        completed: false,
        opted_in: false,
      },
    });
  },

  initReal: () => {
    set({
      isDemo: false,
      isPlaidConnected: false,
    });
  },

  addTransaction: (t: Transaction) => {
    set((state) => {
      const transactions = [t, ...state.transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      return { transactions };
    });
    get().recalculateHealthScore();
  },

  updateTransaction: (id: string, changes: Partial<Transaction>) => {
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...changes } : t)),
    }));
    get().recalculateHealthScore();
  },

  deleteTransaction: (id: string) => {
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
    get().recalculateHealthScore();
  },

  addGoal: (g: Goal) => {
    set((state) => ({
      goals: [...state.goals, g],
    }));
    get().recalculateHealthScore();
  },

  updateGoal: (id: string, changes: Partial<Goal>) => {
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, ...changes } : g)),
    }));
    get().recalculateHealthScore();
  },

  addChatMessage: (m: ChatMessage) => {
    set((state) => ({
      chatHistory: [...state.chatHistory, m],
    }));
  },

  clearChat: () => {
    set({ chatHistory: [] });
  },

  recalculateHealthScore: () => {
    const { transactions, goals, subscriptions, user } = get();
    const score = calculateHealthScore(
      transactions,
      goals,
      subscriptions,
      user?.monthly_income ?? 0
    );
    set({ healthScore: score, currentStreak: calculateStreak(transactions) });
  },

  setUser: (u: User) => {
    set({ user: u });
  },

  reset: () => {
    set({
      user: null,
      isDemo: false,
      transactions: [],
      accounts: [],
      goals: [],
      subscriptions: [],
      chatHistory: [],
      healthScore: defaultHealthScore,
      currentStreak: 0,
      isPlaidConnected: false,
      weeklyChallenge: {
        description: 'Spend under $50 on dining out this week',
        completed: false,
        opted_in: false,
      },
    });
  },
}));
