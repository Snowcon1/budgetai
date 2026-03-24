import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are SnapBudget's AI financial coach. You have access to the user's complete financial picture. Always give specific, actionable advice based on their actual data. Be conversational, direct, and encouraging. Never give generic advice — always reference their specific numbers. When relevant, respond with a JSON object that includes both a 'message' field (your conversational response) and optionally a 'data_card' field for visual data. Keep responses concise — 3-5 sentences max unless a detailed plan is needed.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userMessage, conversationHistory, context } = await req.json();

    if (!userMessage || typeof userMessage !== 'string') {
      return new Response(JSON.stringify({ error: 'userMessage is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured on server' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build financial context string from the structured data sent by the client
    const contextLines: string[] = [];
    if (context) {
      if (context.accounts?.length) {
        contextLines.push(
          'Accounts: ' +
            context.accounts.map((a: { name: string; type: string; balance: number }) =>
              `${a.name} (${a.type}): $${a.balance.toFixed(2)}`
            ).join(', ')
        );
      }
      if (context.monthlyIncome != null) {
        contextLines.push(`Monthly income: $${context.monthlyIncome.toFixed(2)}`);
      }
      if (context.topCategories?.length) {
        contextLines.push(
          'Top spending this month: ' +
            context.topCategories.map((c: { category: string; total: number }) =>
              `${c.category}: $${c.total.toFixed(2)}`
            ).join(', ')
        );
      }
      if (context.goals?.length) {
        contextLines.push(
          'Goals: ' +
            context.goals.map((g: { name: string; current_amount: number; target_amount: number }) => {
              const pct = g.target_amount > 0
                ? Math.round((g.current_amount / g.target_amount) * 100)
                : 0;
              return `${g.name}: $${g.current_amount.toFixed(2)}/$${g.target_amount.toFixed(2)} (${pct}%)`;
            }).join(', ')
        );
      }
      if (context.recentTransactions?.length) {
        contextLines.push(
          'Recent transactions: ' +
            context.recentTransactions.slice(0, 10).map((t: { merchant: string; amount: number; date: string }) =>
              `${t.merchant} $${Math.abs(t.amount).toFixed(2)} on ${t.date}`
            ).join(', ')
        );
      }
      if (context.healthScore) {
        const h = context.healthScore;
        contextLines.push(
          `Health score: ${h.total}/100 (spending: ${h.spending_ratio}/25, savings: ${h.savings_rate}/25, goals: ${h.goal_progress}/25, subs: ${h.subscription_efficiency}/25)`
        );
      }
      if (context.subscriptions?.length) {
        const subTotal = context.subscriptions
          .filter((s: { is_active: boolean; amount: number }) => s.is_active)
          .reduce((sum: number, s: { amount: number }) => sum + s.amount, 0);
        contextLines.push(`Total active subscriptions: $${subTotal.toFixed(2)}/month`);
      }
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(contextLines.length
        ? [{ role: 'system', content: 'FINANCIAL CONTEXT:\n' + contextLines.join('\n') }]
        : []),
      ...(conversationHistory ?? []).slice(-20).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      return new Response(JSON.stringify({ error: `OpenAI error: ${openaiRes.status}`, detail: err }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiData = await openaiRes.json();
    const content: string = openaiData.choices?.[0]?.message?.content ?? '';

    // Try to parse as structured JSON response
    try {
      const parsed = JSON.parse(content);
      if (parsed.message) {
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch {
      // Not JSON, return as plain message
    }

    return new Response(JSON.stringify({ message: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
