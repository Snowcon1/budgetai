import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  'Other',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { merchants } = await req.json();

    if (!Array.isArray(merchants) || merchants.length === 0) {
      return new Response(JSON.stringify({ error: 'merchants must be a non-empty array' }), {
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
            content: `You are a transaction categorizer. Given a numbered list of merchant names, respond with ONLY a JSON array of category strings in the same order. Each category must be exactly one of: ${VALID_CATEGORIES.join(', ')}. No explanation, no extra text — just the JSON array.`,
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
