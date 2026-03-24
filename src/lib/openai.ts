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

const demoResponses: Record<string, AIResponse> = {
  'can i afford': {
    message:
      "Based on your current spending patterns, you have about $680 left this month after typical expenses. If it's under $500, you can likely swing it — but it would slow down your Japan Trip savings by about 2 weeks. What are you thinking of buying?",
  },
  'why did i overspend': {
    message:
      "Looking at this month, DoorDash is your biggest culprit — you've spent $247 on delivery so far, which is 40% more than last month. Dining out overall is $412, making it your #1 category. Cutting DoorDash to 1-2x per week could save you ~$120/month.",
    data_card: {
      type: 'spending_chart',
      data: {
        categories: [
          { name: 'Dining Out', amount: 412 },
          { name: 'Groceries', amount: 340 },
          { name: 'Shopping', amount: 195 },
          { name: 'Gas', amount: 110 },
          { name: 'Entertainment', amount: 52 },
        ],
      },
    },
  },
  'help me save': {
    message:
      "For your Japan Trip, you need to save $212/month to hit your goal. Right now you're on pace at about $109/month. Here's my suggestion: redirect half your DoorDash budget ($120) to savings and you're golden. Want me to set up a spending challenge for this?",
    data_card: {
      type: 'goal_progress',
      data: {
        goals: [
          { name: 'Japan Trip', current: 1530, target: 4500, monthly_needed: 212 },
          { name: 'Emergency Fund', current: 4180, target: 10000, monthly_needed: 323 },
          { name: 'New MacBook', current: 420, target: 1299, monthly_needed: 293 },
        ],
      },
    },
  },
  'audit my subscriptions': {
    message:
      "You're spending $53.46/month on subscriptions. I flagged Planet Fitness ($24.99) as possibly unused — I don't see any gym-related activity in your transactions. Canceling it would save you almost $300/year. Everything else looks actively used.",
    data_card: {
      type: 'subscription_list',
      data: {
        subscriptions: [
          { name: 'Planet Fitness', amount: 24.99, status: 'possibly_unused' },
          { name: 'Netflix', amount: 15.49, status: 'active' },
          { name: 'Spotify', amount: 9.99, status: 'active' },
          { name: 'Apple iCloud', amount: 2.99, status: 'active' },
        ],
        total: 53.46,
        potential_savings: 24.99,
      },
    },
  },
};

function getDemoResponse(userMessage: string): AIResponse {
  const lower = userMessage.toLowerCase();
  for (const [key, response] of Object.entries(demoResponses)) {
    if (lower.includes(key)) {
      return response;
    }
  }
  return {
    message: `Based on your financial snapshot, you're doing okay but there's room to improve. Your health score is in the mid-60s — the biggest opportunity is cutting back on dining out (currently ~$400/month) and putting that toward your Japan Trip goal. You're earning $6,800/month and spending about 85% of it. Want me to dig into any specific area?`,
  };
}

export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[],
  context: FinancialContext,
  isDemo: boolean
): Promise<AIResponse> {
  if (isDemo) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return getDemoResponse(userMessage);
  }

  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase not configured');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
      },
      body: JSON.stringify({
        userMessage,
        conversationHistory: conversationHistory.slice(-20).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        context,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? `Server error: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data as AIResponse;
  } catch (error) {
    throw new Error(
      `Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
