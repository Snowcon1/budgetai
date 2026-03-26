import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { resolveIdentifier, checkRateLimit } from '../_shared/rateLimit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 30 calls/day — a user syncing once a day needs 1–3; this only fires against abuse
const DAILY_LIMIT = 30;

const VALID_CATEGORIES = [
  'Dining Out',
  'Groceries',
  'Gas',
  'Shopping',
  'Entertainment',
  'Health',
  'Travel',
  'Subscriptions',
  'Rent',
  'Utilities',
  'Income',
  'Transfer',
  'Other',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured on server' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Rate limiting ────────────────────────────────────────────────────────
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const identifier = await resolveIdentifier(req);
    const allowed = await checkRateLimit(serviceClient, identifier, 'categorize', DAILY_LIMIT);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Daily categorization limit reached. Please try again tomorrow.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { merchants } = await req.json();

    if (!Array.isArray(merchants) || merchants.length === 0) {
      return new Response(JSON.stringify({ error: 'merchants must be a non-empty array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (merchants.length > 50) {
      return new Response(JSON.stringify({ error: 'merchants array must not exceed 50 items' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build a numbered list so GPT returns a matching numbered list
    const merchantList = merchants
      .map((m: string, i: number) => `${i + 1}. ${m}`)
      .join('\n');

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a transaction categorizer. Given a numbered list of merchant names, respond with ONLY a JSON array of category strings in the same order. Each category must be exactly one of: ${VALID_CATEGORIES.join(', ')}.

Use "Transfer" for: credit card payments, autopayments to credit cards, bank transfers, loan payments, mortgage payments, internal account transfers, Venmo/Zelle/Cash App payments between people (not purchases).
Use "Income" for: payroll/direct deposits, interest income, tax refunds, reimbursements received.
No explanation, no extra text — just the JSON array.`,
          },
          {
            role: 'user',
            content: merchantList,
          },
        ],
        max_tokens: Math.max(merchants.length * 15, 100),
        temperature: 0,
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
    const content: string = openaiData.choices?.[0]?.message?.content ?? '[]';

    let categories: string[];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      categories = JSON.parse(jsonMatch?.[0] ?? '[]');
    } catch {
      categories = [];
    }

    // Validate each entry, fall back to 'Other' if invalid
    const validated = merchants.map((_: string, i: number) => {
      const cat = categories[i];
      return VALID_CATEGORIES.includes(cat) ? cat : 'Other';
    });

    return new Response(JSON.stringify({ categories: validated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
