import { create } from 'zustand';
import { format, subDays } from 'date-fns';
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
import {
  getTransactions,
  insertTransaction,
  updateTransaction as supabaseUpdateTransaction,
  deleteTransaction as supabaseDeleteTransaction,
  getGoals,
  insertGoal,
  updateGoal as supabaseUpdateGoal,
  getAccounts,
  getChatHistory,
  insertChatMessage,
  getUserProfile,
  updateUserProfile,
} from '../lib/supabase';

interface AppState {
  userId: string | null;
  user: User | null;
  isDemo: boolean;
  isLoading: boolean;
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  subscriptions: Subscription[];
  chatHistory: ChatMessage[];
  healthScore: HealthScoreBreakdown;
  currentStreak: number;
  weeklyChallenge: WeeklyChallengeData;
  isPlaidConnected: boolean;

  // Auth / init
  loadUserData: (userId: string) => Promise<void>;
  initDemo: () => void;
  initReal: () => void;
  reset: () => void;

  // Transactions
  addTransaction: (t: Transaction) => Promise<void>;
  updateTransaction: (id: string, changes: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Goals
  addGoal: (g: Goal) => Promise<Goal | null>;
  updateGoal: (id: string, changes: Partial<Goal>) => void;

  // Chat
  addChatMessage: (m: ChatMessage) => void;
  clearChat: () => void;

  // User
  setUser: (u: User) => void;

  recalculateHealthScore: () => void;
}

const defaultHealthScore: HealthScoreBreakdown = {
  total: 0,
  spending_ratio: 0,
  goal_progress: 0,
  savings_rate: 0,
  subscription_efficiency: 0,
};

const defaultWeeklyChallenge: WeeklyChallengeData = {
  description: 'Spend under $50 on dining out this week',
  completed: false,
  opted_in: false,
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
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return Math.floor(streak / 7);
}

function sortByDate(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export const useAppStore = create<AppState>((set, get) => ({
  userId: null,
  user: null,
  isDemo: false,
  isLoading: false,
  transactions: [],
  accounts: [],
  goals: [],
  subscriptions: [],
  chatHistory: [],
  healthScore: defaultHealthScore,
  currentStreak: 0,
  weeklyChallenge: defaultWeeklyChallenge,
  isPlaidConnected: false,

  // ─── Auth / Init ────────────────────────────────────────────────────────────

  loadUserData: async (userId: string) => {
    set({ isLoading: true, userId });

    const to = format(new Date(), 'yyyy-MM-dd');
    const from = format(subDays(new Date(), 90), 'yyyy-MM-dd');

    const [profileRes, accountsRes, transactionsRes, goalsRes, chatRes] = await Promise.all([
      getUserProfile(userId),
      getAccounts(userId),
      getTransactions(userId, from, to),
      getGoals(userId),
      getChatHistory(userId),
    ]);

    const profile = profileRes.data;
    if (!profile) {
      set({ isLoading: false });
      return;
    }

    const transactions = transactionsRes.data ?? [];
    const goals = goalsRes.data ?? [];
    const accounts = accountsRes.data ?? [];
    const chatHistory = chatRes.data ?? [];

    const score = calculateHealthScore(transactions, goals, [], profile.monthly_income ?? 0);
    const streak = calculateStreak(transactions);

    set({
      user: profile,
      userId,
      isDemo: false,
      isLoading: false,
      transactions: sortByDate(transactions),
      accounts,
      goals,
      subscriptions: [],
      chatHistory,
      healthScore: score,
      currentStreak: streak,
      isPlaidConnected: accounts.length > 0,
      weeklyChallenge: defaultWeeklyChallenge,
    });
  },

  initDemo: () => {
    const transactions = demoTransactions;
    const score = calculateHealthScore(transactions, demoGoals, demoSubscriptions, demoUser.monthly_income);
    const streak = calculateStreak(transactions);

    set({
      userId: null,
      user: demoUser,
      isDemo: true,
      isLoading: false,
      transactions,
      accounts: demoAccounts,
      goals: demoGoals,
      subscriptions: demoSubscriptions,
      chatHistory: [],
      healthScore: score,
      currentStreak: streak,
      isPlaidConnected: false,
      weeklyChallenge: defaultWeeklyChallenge,
    });
  },

  initReal: () => {
    set({ isDemo: false, isPlaidConnected: false });
  },

  reset: () => {
    set({
      userId: null,
      user: null,
      isDemo: false,
      isLoading: false,
      transactions: [],
      accounts: [],
      goals: [],
      subscriptions: [],
      chatHistory: [],
      healthScore: defaultHealthScore,
      currentStreak: 0,
      isPlaidConnected: false,
      weeklyChallenge: defaultWeeklyChallenge,
    });
  },

  // ─── Transactions ────────────────────────────────────────────────────────────

  addTransaction: async (t: Transaction) => {
    const { isDemo, userId } = get();

    if (!isDemo && userId) {
      // Strip temp id; let Supabase generate the real UUID
      const { id: _tempId, ...txnData } = t;
      const { data } = await insertTransaction({ ...txnData, user_id: userId });
      if (data) {
        set((state) => ({
          transactions: sortByDate([data as Transaction, ...state.transactions]),
        }));
        get().recalculateHealthScore();
      }
      return;
    }

    set((state) => ({
      transactions: sortByDate([t, ...state.transactions]),
    }));
    get().recalculateHealthScore();
  },

  updateTransaction: (id: string, changes: Partial<Transaction>) => {
    // Optimistic local update
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...changes } : t)),
    }));
    get().recalculateHealthScore();

    const { isDemo } = get();
    if (!isDemo) {
      supabaseUpdateTransaction(id, changes).catch(() => {
        // Silent — local state already updated
      });
    }
  },

  deleteTransaction: (id: string) => {
    // Optimistic local delete
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
    get().recalculateHealthScore();

    const { isDemo } = get();
    if (!isDemo) {
      supabaseDeleteTransaction(id).catch(() => {
        // Silent
      });
    }
  },

  // ─── Goals ───────────────────────────────────────────────────────────────────

  addGoal: async (g: Goal): Promise<Goal | null> => {
    const { isDemo, userId } = get();

    if (!isDemo && userId) {
      const { id: _tempId, ...goalData } = g;
      const { data } = await insertGoal({ ...goalData, user_id: userId });
      if (data) {
        set((state) => ({ goals: [data as Goal, ...state.goals] }));
        get().recalculateHealthScore();
        return data as Goal;
      }
      return null;
    }

    set((state) => ({ goals: [...state.goals, g] }));
    get().recalculateHealthScore();
    return g;
  },

  updateGoal: (id: string, changes: Partial<Goal>) => {
    // Optimistic local update
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, ...changes } : g)),
    }));
    get().recalculateHealthScore();

    const { isDemo } = get();
    if (!isDemo) {
      supabaseUpdateGoal(id, changes).catch(() => {
        // Silent
      });
    }
  },

  // ─── Chat ────────────────────────────────────────────────────────────────────

  addChatMessage: (m: ChatMessage) => {
    set((state) => ({ chatHistory: [...state.chatHistory, m] }));

    const { isDemo, userId } = get();
    if (!isDemo && userId) {
      const { id: _tempId, ...msgData } = m;
      insertChatMessage({ ...msgData, user_id: userId }).catch(() => {
        // Silent — chat history is already in local state
      });
    }
  },

  clearChat: () => {
    set({ chatHistory: [] });
  },

  // ─── User ────────────────────────────────────────────────────────────────────

  setUser: (u: User) => {
    set({ user: u });

    const { isDemo, userId } = get();
    if (!isDemo && userId) {
      updateUserProfile(userId, { name: u.name, monthly_income: u.monthly_income }).catch(() => {
        // Silent
      });
    }
  },

  // ─── Derived ─────────────────────────────────────────────────────────────────

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
}));
