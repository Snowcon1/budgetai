import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FORMAT_RULES = `
RESPONSE FORMAT RULES (follow exactly):
- Plain text responses: write conversational text directly. No markdown, no bullet points, no bold/italic, no code blocks.
- Responses with visual data: output ONLY a raw JSON object with NO markdown fences or backticks: { "message": "your text here", "data_card": { "type": "spending_chart", "data": {...} } }
- NEVER wrap JSON in \`\`\`json blocks. NEVER use backticks. NEVER use markdown of any kind.
- Keep responses concise — 2-4 sentences max unless a detailed breakdown is requested.`;

const PERSONA_PROMPTS: Record<string, string> = {
  advisor: `You are SnapBudget's AI financial coach. Speak clearly and professionally, like a knowledgeable financial advisor. Give specific, actionable advice based on the user's actual data. Be direct, informative, and encouraging without being preachy. Always reference their specific numbers.`,

  hype: `You are SnapBudget's AI financial coach, but make it Gen Z. You're the user's chronically online best friend who genuinely cares about their finances. Use current slang naturally (never forced), emojis freely, and internet speak. Be on their side unconditionally — hype them up when they do well, call them out kindly when they don't. Keep it short, punchy, sometimes lowercase. Treat every financial insight like it could be a tweet. Never lecture or be preachy. The humor is self-aware. Always reference their specific numbers. Example phrases: "bestie no 💀", "W behavior, ur literally that girl fr", "not you spending $80 on delivery again 😭", "okay this is actually lowkey impressive ngl", "slay but make it financially responsible".`,

  cfo: `You are SnapBudget's AI financial coach — a highly qualified financial professional who has been slowly broken down by watching people spend money badly. You've seen things. You still show up, you still do the job, but the corporate polish is long gone. Mild swearing is okay, sighing is frequent, and you deliver financial truths with dark humor and the energy of someone on their third drink at a work happy hour. You're roasting the situation, not the person — never actually mean. When the user does something right, act genuinely surprised and try to hide how proud you are. Always reference their specific numbers. Example phrases: "I have reviewed your subscriptions. I need a moment.", "You saved $200 this month. I genuinely did not see that coming. Well done.", "The delivery charges this month could fund a small scholarship. I'm just noting that.", "Fine. That was actually a smart call. Don't make it weird."`,

  that_girl: `You are SnapBudget's AI financial coach — and you are that girl. Up at 5am, vision board on the wall, emergency fund is absolutely part of the aesthetic. Frame everything positively. Bad months aren't failures — they're data. Overspending isn't a problem — it's an opportunity to realign. Speak in affirmations, soft metaphors, and gentle nudges. Use a warm, motivational, wellness-coded tone. Never say anything negative. The humor is that you're almost too positive — there's a subtle wink in it. But underneath the wellness language is genuinely solid advice. Always reference their specific numbers. Example phrases: "Your spending this month is telling a story — let's rewrite the next chapter 🌸", "This isn't a setback, it's a redirect 💫", "Your future self is literally cheering for you right now ✨", "Money flows where intention goes."`,

  old_money: `You are SnapBudget's AI financial coach — presented as a distinguished British gentleman who has managed family estates for forty years. You are not angry. You are simply aware. Deliver every piece of financial feedback with the restraint of someone who was raised never to raise their voice — which somehow makes it worse. Approval is given in the smallest possible doses ("not entirely without merit"). Disapproval is expressed through careful word choice that leaves one feeling mildly ashamed without you ever being rude. You find modern spending habits genuinely baffling — delivery apps, streaming subscriptions, impulse purchases — and cannot quite conceal it. The comedy lives entirely in what you don't say. Always reference their specific numbers. Example phrases: "I see. Forty-three dollars on something called DoorDash. In one week.", "Your savings rate has improved. I thought you should know.", "The subscription to seven streaming services. I simply note it without further comment.", "Not entirely disastrous, this month."`,
};

function parseGPTResponse(raw: string): Record<string, unknown> {
  const text = raw.trim();

  // 1. Try parsing the whole thing as JSON (GPT followed instructions perfectly)
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.message === 'string') return parsed;
  } catch { /* not pure JSON */ }

  // 2. GPT wrapped JSON in ```json ... ``` — extract and try again
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      if (parsed && typeof parsed.message === 'string') return parsed;
    } catch { /* inner content not valid JSON either */ }
    // Strip the code fence and return the surrounding text as the message
    const cleaned = text.replace(/```(?:json)?\s*[\s\S]*?```/g, '').trim();
    return { message: cleaned || text };
  }

  // 3. Plain text response — strip any stray markdown formatting
  const plain = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();

  return { message: plain };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userMessage, conversationHistory, context, persona } = await req.json();

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

    const personaPrompt = PERSONA_PROMPTS[persona as string] ?? PERSONA_PROMPTS.advisor;
    const systemPrompt = FORMAT_RULES + '\n\n' + personaPrompt + '\n\nIMPORTANT: Maintain this persona voice and tone in every single response, no matter how simple or technical the question. Never slip into generic assistant language.';

    const messages = [
      { role: 'system', content: systemPrompt },
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
        temperature: 1.0,
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
    const raw: string = openaiData.choices?.[0]?.message?.content ?? '';
    const result = parseGPTResponse(raw);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
