import { Transaction, Account, Goal, Subscription, HealthScoreBreakdown, ChatMessage, ActionCard } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const SYSTEM_PROMPT = `You are SnapBudget's AI financial coach. You have access to the user's real financial data — transactions from the last 90 days, account balances, goals, and spending breakdowns by month. Always give specific advice using their actual numbers. Be conversational and direct, like a knowledgeable friend. Never be generic.

You MUST respond with a raw JSON object — no markdown, no code fences, no extra text outside the JSON. Format:
{"message":"your plain text response","action_card":{"type":"challenge","title":"...","description":"...","savings":15,"category":"Dining Out","goal_name":"Emergency Fund"}}

The "action_card" field is OPTIONAL. Only include it in these two situations:
1. type "challenge" — ONLY when the user explicitly asks how to save more, reduce a specific spend, or reach a goal faster. Suggest a concrete weekly habit change (e.g. cut coffee runs, reduce dining out twice). Include realistic "savings" amount based on their actual spend, and link to a real goal they have.
2. type "add_to_goal" — ONLY when user asks "can I afford X?" or "should I buy X?" and the answer is no/not right now. Offer to add it as a savings goal. Include the "amount" they mentioned and suggest a "goal_name".

Never include an action_card for general questions. The "message" field must be plain conversational text — no markdown, no bullet points.`;

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

function buildCategoryTotals(transactions: Transaction[]): { category: string; total: number }[] {
  const map = new Map<string, number>();
  transactions
    .filter((t) => t.category !== 'Income' && t.amount < 0)
    .forEach((t) => {
      const cur = map.get(t.category) ?? 0;
      map.set(t.category, cur + Math.abs(t.amount));
    });
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, total]) => ({ category, total }));
}

function detectRecurring(transactions: Transaction[]): { merchant: string; amount: number }[] {
  // Find merchants that appear at least 2 months in a row with similar amounts
  const byMerchant = new Map<string, Transaction[]>();
  transactions.forEach((t) => {
    if (t.amount >= -200 && t.amount < -4) {
      const key = t.merchant.toLowerCase().trim();
      const existing = byMerchant.get(key) ?? [];
      byMerchant.set(key, [...existing, t]);
    }
  });

  const recurring: { merchant: string; amount: number }[] = [];
  byMerchant.forEach((txns, merchant) => {
    if (txns.length >= 2) {
      const months = new Set(txns.map((t) => t.date.substring(0, 7)));
      if (months.size >= 2) {
        const avgAmount = txns.reduce((s, t) => s + Math.abs(t.amount), 0) / txns.length;
        recurring.push({ merchant: txns[0].merchant, amount: Math.round(avgAmount * 100) / 100 });
      }
    }
  });
  return recurring.slice(0, 8);
}

function buildContextMessage(ctx: FinancialContext): string {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const thisMonthTxns = ctx.allTransactions.filter((t) => {
    const d = new Date(t.date);
    return d >= thisMonthStart && d <= thisMonthEnd;
  });
  const lastMonthTxns = ctx.allTransactions.filter((t) => {
    const d = new Date(t.date);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });

  const thisMonthCategories = buildCategoryTotals(thisMonthTxns);
  const lastMonthCategories = buildCategoryTotals(lastMonthTxns);

  const thisMonthTotal = thisMonthCategories.reduce((s, c) => s + c.total, 0);
  const lastMonthTotal = lastMonthCategories.reduce((s, c) => s + c.total, 0);

  const thisMonthIncome = thisMonthTxns
    .filter((t) => t.category === 'Income')
    .reduce((s, t) => s + t.amount, 0);
  const lastMonthIncome = lastMonthTxns
    .filter((t) => t.category === 'Income')
    .reduce((s, t) => s + t.amount, 0);

  const accountsSummary = ctx.accounts
    .map((a) => `${a.name} (${a.type}): ${formatCurrency(a.balance)}`)
    .join(', ') || 'No accounts connected';

  const goalsSummary = ctx.goals.length > 0
    ? ctx.goals.map((g) => {
        const progress = g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0;
        return `${g.name}: ${formatCurrency(g.current_amount)}/${formatCurrency(g.target_amount)} (${progress}% — target ${g.target_date})`;
      }).join('; ')
    : 'No goals set';

  // Subscriptions: use provided list or auto-detect from transactions
  let subsSummary: string;
  const activeSubs = ctx.subscriptions.filter((s) => s.is_active);
  if (activeSubs.length > 0) {
    const subTotal = activeSubs.reduce((s, sub) => s + sub.amount, 0);
    subsSummary = activeSubs.map((s) => `${s.merchant} ${formatCurrency(s.amount)}/mo`).join(', ') +
      ` — total ${formatCurrency(subTotal)}/mo`;
  } else {
    const recurring = detectRecurring(ctx.allTransactions);
    subsSummary = recurring.length > 0
      ? 'Detected recurring: ' + recurring.map((r) => `${r.merchant} ~${formatCurrency(r.amount)}/mo`).join(', ')
      : 'No subscriptions detected';
  }

  const recentTxns = ctx.allTransactions
    .slice(0, 15)
    .map((t) => `${t.merchant} ${formatCurrency(t.amount)} (${t.category}) on ${format(new Date(t.date), 'MMM d')}`)
    .join('; ');

  return `TODAY: ${format(now, 'MMMM d, yyyy')}

ACCOUNTS: ${accountsSummary}
MONTHLY INCOME: ${formatCurrency(ctx.monthlyIncome)}

THIS MONTH (${format(thisMonthStart, 'MMM yyyy')}):
  Total spent: ${formatCurrency(thisMonthTotal)}
  Income received: ${formatCurrency(thisMonthIncome)}
  By category: ${thisMonthCategories.slice(0, 7).map((c) => `${c.category} ${formatCurrency(c.total)}`).join(', ')}

LAST MONTH (${format(lastMonthStart, 'MMM yyyy')}):
  Total spent: ${formatCurrency(lastMonthTotal)}
  Income received: ${formatCurrency(lastMonthIncome)}
  By category: ${lastMonthCategories.slice(0, 7).map((c) => `${c.category} ${formatCurrency(c.total)}`).join(', ')}

GOALS: ${goalsSummary}
SUBSCRIPTIONS/RECURRING: ${subsSummary}
HEALTH SCORE: ${ctx.healthScore.total}/100
RECENT TRANSACTIONS: ${recentTxns}`;
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
  if (!response.ok) throw new Error(data.error ?? `Edge function error: ${response.status}`);

  const raw: string = data.choices?.[0]?.message?.content ?? '';

  // Strip markdown code fences if model still wraps response
  let jsonStr = raw;
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/s);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  // Parse JSON response
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed?.message) return parsed as AIResponse;
    // JSON has no message — use text before fence as message
    if (fenceMatch) {
      const textBefore = raw.substring(0, raw.indexOf('```')).trim();
      if (textBefore) return { message: textBefore };
    }
  } catch {}

  // Plain text fallback
  return { message: raw };
}

export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[],
  context: FinancialContext,
  _isDemo: boolean
): Promise<AIResponse> {
  return callViaEdgeFunction(userMessage, conversationHistory, context);
}
