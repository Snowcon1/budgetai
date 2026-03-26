import { Category } from '../types';
import { categorizeTransaction } from './categorize';
import { supabase } from '../lib/supabase';

interface ParsedReceipt {
  merchant: string;
  date: string;
  total: number;
  category: Category;
}

export async function parseReceipt(base64Image: string, isDemo: boolean): Promise<ParsedReceipt> {
  if (isDemo) {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
      merchant: 'H-E-B Grocery',
      date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      total: 67.43,
      category: 'Groceries',
    };
  }

  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase not configured');
    }

    // Prefer the user's session token so rate limiting tracks per-account.
    // Falls back to the anon key (demo / unauthenticated), rate-limited by IP.
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token ?? supabaseKey;

    const response = await fetch(`${supabaseUrl}/functions/v1/parse-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        apikey: supabaseKey,
      },
      body: JSON.stringify({ base64Image }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (response.status === 429) {
        throw new Error(err.error ?? 'Daily receipt scan limit reached. Please try again tomorrow.');
      }
      throw new Error(err.error ?? `Server error: ${response.status}`);
    }

    const parsed = await response.json() as ParsedReceipt;
    if (!parsed.category) {
      parsed.category = categorizeTransaction(parsed.merchant);
    }
    return parsed;
  } catch (error) {
    throw new Error(
      `Receipt parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
