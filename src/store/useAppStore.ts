import { create } from 'zustand';
import { format, subDays } from 'date-fns';
import {
  Transaction,
  Account,
  Goal,
  Subscription,
  ChatMessage,
  ChatSession,
  User,
  HealthScoreBreakdown,
  WeeklyChallengeData,
} from '../types';
import { demoUser, demoAccounts, demoTransactions, demoGoals, demoSubscriptions } from '../utils/demoData';
import { calculateHealthScore } from '../utils/healthScore';
import { generateWeeklyChallenge } from '../utils/weeklyChallenge';
import {
  getTransactions,
  insertTransaction,
  updateTransaction as supabaseUpdateTransaction,
  deleteTransaction as supabaseDeleteTransaction,
  getGoals,
  insertGoal,
  updateGoal as supabaseUpdateGoal,
  getAccounts,
  getChatSessions,
  insertChatMessage,
  getUserProfile,
  updateUserProfile,
  createUserProfile,
} from '../lib/supabase';

interface AppState {
  userId: string | null;
  user: User | null;
  isDemo: boolean;
  isLoading: boolean;
  isNewUser: boolean;
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  subscriptions: Subscription[];
  chatHistory: ChatMessage[];
  chatSessions: ChatSession[];
  currentConversationId: string | null;
  healthScore: HealthScoreBreakdown;
  currentStreak: number;
  weeklyChallenge: WeeklyChallengeData;
  isPlaidConnected: boolean;

  // Auth / init
  loadUserData: (userId: string) => Promise<void>;
  completeSetup: (userId: string, name: string, income: number, useSampleData: boolean) => Promise<void>;
  connectPlaid: (publicToken: string, institutionName: string, institutionId: string) => Promise<void>;
  initDemo: () => void;
  exitDemo: () => void;
  initReal: () => void;
  reset: () => void;

  wantsAuth: boolean;

  // Transactions
  addTransaction: (t: Transaction) => Promise<void>;
  updateTransaction: (id: string, changes: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Goals
  addGoal: (g: Goal) => Promise<Goal | null>;
  updateGoal: (id: string, changes: Partial<Goal>) => void;

  // Chat
  addChatMessage: (m: ChatMessage) => void;
  startNewConversation: () => void;

  // User
  setUser: (u: User) => void;
  setWeeklyChallenge: (challenge: WeeklyChallengeData) => void;

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

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const useAppStore = create<AppState>((set, get) => ({
  userId: null,
  user: null,
  isDemo: false,
  isLoading: false,
  isNewUser: false,
  wantsAuth: false,
  transactions: [],
  accounts: [],
  goals: [],
  subscriptions: [],
  chatHistory: [],
  chatSessions: [],
  currentConversationId: null,
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
      getChatSessions(userId),
    ]);

    const profile = profileRes.data;
    if (!profile) {
      if (profileRes.error) {
        // Real DB error — still route to setup so the user isn't stuck
        console.warn('Failed to load profile:', profileRes.error);
      }
      // New user (or profile error) — route to setup screen
      set({ isLoading: false, userId, isNewUser: true });
      return;
    }

    const transactions = transactionsRes.data ?? [];
    const goals = goalsRes.data ?? [];
    const accounts = accountsRes.data ?? [];
    const chatSessions = chatRes.data ?? [];

    const score = calculateHealthScore(transactions, goals, [], profile.monthly_income ?? 0);
    const streak = calculateStreak(transactions);
    const challenge = generateWeeklyChallenge(transactions);

    set({
      user: profile,
      userId,
      isDemo: false,
      isLoading: false,
      transactions: sortByDate(transactions),
      accounts,
      goals,
      subscriptions: [],
      chatHistory: [],
      chatSessions,
      currentConversationId: null,
      healthScore: score,
      currentStreak: streak,
      isPlaidConnected: accounts.length > 0,
      weeklyChallenge: challenge,
    });
  },

  completeSetup: async (userId: string, name: string, income: number, useSampleData: boolean) => {
    set({ isLoading: true });

    const { data: profile, error } = await createUserProfile(userId, {
      name,
      monthly_income: income,
    });

    if (error || !profile) {
      set({ isLoading: false });
      throw new Error(error ?? 'Failed to create profile. Please try again.');
    }

    if (useSampleData) {
      const score = calculateHealthScore(demoTransactions, demoGoals, demoSubscriptions, income);
      const streak = calculateStreak(demoTransactions);
      const challenge = generateWeeklyChallenge(demoTransactions);
      set({
        userId,
        user: profile,
        isDemo: false,
        isNewUser: false,
        isLoading: false,
        transactions: demoTransactions,
        accounts: demoAccounts,
        goals: demoGoals,
        subscriptions: demoSubscriptions,
        chatHistory: [],
        chatSessions: [],
        currentConversationId: null,
        healthScore: score,
        currentStreak: streak,
        isPlaidConnected: false,
        weeklyChallenge: challenge,
      });
    } else {
      const score = calculateHealthScore([], [], [], income);
      set({
        userId,
        user: profile,
        isDemo: false,
        isNewUser: false,
        isLoading: false,
        transactions: [],
        accounts: [],
        goals: [],
        subscriptions: [],
        chatHistory: [],
        chatSessions: [],
        currentConversationId: null,
        healthScore: score,
        currentStreak: 0,
        isPlaidConnected: false,
        weeklyChallenge: defaultWeeklyChallenge,
      });
    }
  },

  connectPlaid: async (publicToken: string, institutionName: string, institutionId: string) => {
    const { userId } = get();
    if (!userId) throw new Error('You must be signed in to connect a bank account.');

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

    const exchangeRes = await fetch(`${supabaseUrl}/functions/v1/plaid-exchange-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicToken, userId, institutionName, institutionId }),
    });
    const exchangeData = await exchangeRes.json();
    if (!exchangeRes.ok) throw new Error(exchangeData.error ?? 'Failed to exchange token');

    const syncRes = await fetch(`${supabaseUrl}/functions/v1/plaid-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const syncData = await syncRes.json();
    if (!syncRes.ok) throw new Error(syncData.error ?? 'Sync failed');

    // Reload everything from DB
    await get().loadUserData(userId);
  },

  initDemo: () => {
    const transactions = demoTransactions;
    const score = calculateHealthScore(transactions, demoGoals, demoSubscriptions, demoUser.monthly_income);
    const streak = calculateStreak(transactions);
    const challenge = generateWeeklyChallenge(transactions);

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
      chatSessions: [],
      currentConversationId: null,
      healthScore: score,
      currentStreak: streak,
      isPlaidConnected: false,
      weeklyChallenge: challenge,
    });
  },

  exitDemo: () => {
    set({
      userId: null,
      user: null,
      isDemo: false,
      isLoading: false,
      isNewUser: false,
      wantsAuth: true,
      transactions: [],
      accounts: [],
      goals: [],
      subscriptions: [],
      chatHistory: [],
      chatSessions: [],
      currentConversationId: null,
      healthScore: defaultHealthScore,
      currentStreak: 0,
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
      isNewUser: false,
      wantsAuth: false,
      transactions: [],
      accounts: [],
      goals: [],
      subscriptions: [],
      chatHistory: [],
      chatSessions: [],
      currentConversationId: null,
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
    const { currentConversationId } = get();
    const msgWithConv = { ...m, conversation_id: currentConversationId ?? undefined };
    set((state) => ({ chatHistory: [...state.chatHistory, msgWithConv] }));

    const { isDemo, userId } = get();
    if (!isDemo && userId) {
      const { id: _tempId, ...msgData } = msgWithConv;
      insertChatMessage({ ...msgData, user_id: userId }).catch(() => {});
    }
  },

  startNewConversation: () => {
    const { chatHistory, chatSessions, currentConversationId } = get();

    // Archive current session if it had messages
    let updatedSessions = chatSessions;
    if (chatHistory.length > 0 && currentConversationId) {
      const alreadySaved = chatSessions.some((s) => s.id === currentConversationId);
      if (!alreadySaved) {
        updatedSessions = [
          { id: currentConversationId, startedAt: chatHistory[0].created_at, messages: chatHistory },
          ...chatSessions,
        ];
      }
    }

    set({ chatHistory: [], chatSessions: updatedSessions, currentConversationId: generateId() });
  },

  // ─── User ────────────────────────────────────────────────────────────────────

  setWeeklyChallenge: (challenge: WeeklyChallengeData) => {
    set({ weeklyChallenge: challenge });
  },

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
