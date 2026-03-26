import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { resolveIdentifier, checkRateLimit } from '../_shared/rateLimit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 50 scans/day — a heavy user scans 3–5; this only fires against abuse
const DAILY_LIMIT = 50;

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
    const allowed = await checkRateLimit(serviceClient, identifier, 'receipt', DAILY_LIMIT);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Daily receipt scan limit reached. Please try again tomorrow.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { base64Image } = await req.json();

    if (!base64Image || typeof base64Image !== 'string') {
      return new Response(JSON.stringify({ error: 'base64Image is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Limit image size to ~10 MB (base64 overhead ≈ 4/3x, so 10 MB binary ≈ 13.6 M chars)
    if (base64Image.length > 14_000_000) {
      return new Response(JSON.stringify({ error: 'Image is too large. Please use an image under 10 MB.' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Parse this receipt or transaction screenshot (including Venmo, Cash App, PayPal, Zelle, bank and credit card statements). Respond ONLY with JSON: { "merchant": string, "date": "MM/DD/YYYY", "total": number, "category": one of "Dining Out"|"Groceries"|"Gas"|"Shopping"|"Entertainment"|"Health"|"Travel"|"Subscriptions"|"Other" }. For payment app screenshots, use the recipient name as merchant and the payment amount as total. Use today\'s date if no date is visible. Best-guess any unclear fields.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 200,
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

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'Failed to parse receipt response from AI' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let parsed: { merchant?: unknown; date?: unknown; total?: unknown; category?: unknown };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to parse receipt JSON from AI' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!parsed.merchant || typeof parsed.total !== 'number') {
      return new Response(JSON.stringify({ error: 'Receipt data missing required fields' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
