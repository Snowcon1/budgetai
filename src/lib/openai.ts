import { Transaction, Account, Goal, Subscription, HealthScoreBreakdown, ChatMessage } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { format } from 'date-fns';

const SYSTEM_PROMPT = `You are SnapBudget's AI financial coach. You have access to the user's complete financial picture. Always give specific, actionable advice based on their actual data. Be conversational, direct, and encouraging. Never give generic advice — always reference their specific numbers. When relevant, respond with a JSON object that includes both a 'message' field (your conversational response) and optionally a 'data_card' field for visual data. Keep responses concise — 3-5 sentences max unless a detailed plan is needed.`;

interface FinancialContext {
  accounts: Account[];
  monthlyIncome: number;
  topCategories: { category: string; total: number }[];
  goals: Goal[];
  recentTransactions: Transaction[];
  healthScore: HealthScoreBreakdown;
  subscriptions: Subscription[];
}

function buildContextMessage(ctx: FinancialContext): string {
  const accountsSummary = ctx.accounts
    .map((a) => `${a.name} (${a.type}): ${formatCurrency(a.balance)}`)
    .join(', ');

  const categorySummary = ctx.topCategories
    .map((c) => `${c.category}: ${formatCurrency(c.total)}`)
    .join(', ');

  const goalsSummary = ctx.goals
    .map((g) => {
      const progress = g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0;
      return `${g.name}: ${formatCurrency(g.current_amount)}/${formatCurrency(g.target_amount)} (${progress}%)`;
    })
    .join(', ');

  const recentTxns = ctx.recentTransactions
    .slice(0, 10)
    .map((t) => `${t.merchant} ${formatCurrency(t.amount)} on ${format(new Date(t.date), 'MMM d')}`)
    .join(', ');

  const subTotal = ctx.subscriptions
    .filter((s) => s.is_active)
    .reduce((sum, s) => sum + s.amount, 0);

  return `FINANCIAL CONTEXT:
Accounts: ${accountsSummary}
Monthly income: ${formatCurrency(ctx.monthlyIncome)}
Top spending this month: ${categorySummary}
Goals: ${goalsSummary}
Recent transactions: ${recentTxns}
Health score: ${ctx.healthScore.total}/100 (spending: ${ctx.healthScore.spending_ratio}/25, savings: ${ctx.healthScore.savings_rate}/25, goals: ${ctx.healthScore.goal_progress}/25, subs: ${ctx.healthScore.subscription_efficiency}/25)
Total active subscriptions: ${formatCurrency(subTotal)}/month`;
}

interface AIResponse {
  message: string;
  data_card?: {
    type: 'spending_chart' | 'goal_progress' | 'transaction_list' | 'subscription_list';
    data: Record<string, unknown>;
  };
}

async function callViaEdgeFunction(
  userMessage: string,
  conversationHistory: ChatMessage[],
  context: FinancialContext
): Promise<AIResponse> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Supabase URL not configured.');

  const contextMessage = buildContextMessage(context);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: contextMessage },
    ...conversationHistory.slice(-20).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? `Edge function error: ${response.status}`);
  }

  const content: string = data.choices?.[0]?.message?.content ?? '';

  // Try to parse as structured JSON (message + optional data_card)
  try {
    const parsed = JSON.parse(content);
    if (parsed.message) return parsed as AIResponse;
  } catch {
    // Plain text response
  }

  return { message: content };
}

export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[],
  context: FinancialContext,
  isDemo: boolean
): Promise<AIResponse> {
  return callViaEdgeFunction(userMessage, conversationHistory, context);
}
