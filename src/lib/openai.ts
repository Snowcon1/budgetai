import { Transaction, Account, Goal, Subscription, HealthScoreBreakdown, ChatMessage, ActionCard } from '../types';
import { startOfMonth, endOfMonth } from 'date-fns';
import { PersonaId, DEFAULT_PERSONA } from '../constants/personas';
import { supabase } from './supabase';

export interface FinancialContext {
  accounts: Account[];
  monthlyIncome: number;
  allTransactions: Transaction[];
  goals: Goal[];
  healthScore: HealthScoreBreakdown;
  subscriptions: Subscription[];
}

interface AIResponse {
  message: string;
  data_card?: {
    type: 'spending_chart' | 'goal_progress' | 'transaction_list' | 'subscription_list';
    data: Record<string, unknown>;
  };
  action_card?: ActionCard;
}

function buildTopCategories(transactions: Transaction[]): { category: string; total: number }[] {
  const map = new Map<string, number>();
  transactions
    .filter((t) => t.category !== 'Income' && t.amount < 0)
    .forEach((t) => {
      const cur = map.get(t.category) ?? 0;
      map.set(t.category, cur + Math.abs(t.amount));
    });
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([category, total]) => ({ category, total }));
}

export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[],
  context: FinancialContext,
  persona: PersonaId = DEFAULT_PERSONA
): Promise<AIResponse> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl) throw new Error('Supabase URL not configured.');

  // Prefer the user's session token so rate limiting tracks per-account.
  // Falls back to the anon key (demo mode / unauthenticated) which the edge
  // function will then rate-limit by IP instead.
  const { data: { session } } = await supabase.auth.getSession();
  const authToken = session?.access_token ?? supabaseKey ?? '';

  const now = new Date();
  const thisMonthTxns = context.allTransactions.filter((t) => {
    const d = new Date(t.date);
    return d >= startOfMonth(now) && d <= endOfMonth(now);
  });

  const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      ...(supabaseKey && { apikey: supabaseKey }),
    },
    body: JSON.stringify({
      userMessage,
      persona,
      conversationHistory: conversationHistory
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content })),
      context: {
        accounts: context.accounts,
        monthlyIncome: context.monthlyIncome,
        topCategories: buildTopCategories(thisMonthTxns),
        goals: context.goals,
        recentTransactions: context.allTransactions.slice(0, 10),
        healthScore: context.healthScore,
        subscriptions: context.subscriptions,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(data.error ?? 'Daily message limit reached. Please try again tomorrow.');
    }
    throw new Error(data.error ?? `Edge function error: ${response.status}`);
  }

  if (data?.message) {
    // Strip any markdown code fences that slipped through
    data.message = (data.message as string)
      .replace(/```(?:json)?\s*[\s\S]*?```/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .trim();
    return data as AIResponse;
  }
  return { message: 'No response received.' };
}
