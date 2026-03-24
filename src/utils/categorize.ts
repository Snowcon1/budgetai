import { Category, Transaction } from '../types';

const merchantCategoryMap: Record<string, Category> = {
  'heb': 'Groceries',
  'h-e-b': 'Groceries',
  'whole foods': 'Groceries',
  'trader joe': 'Groceries',
  'kroger': 'Groceries',
  'walmart grocery': 'Groceries',
  'doordash': 'Dining Out',
  'uber eats': 'Dining Out',
  'grubhub': 'Dining Out',
  'torchy': 'Dining Out',
  'chick-fil-a': 'Dining Out',
  'p. terry': 'Dining Out',
  'raising cane': 'Dining Out',
  'starbucks': 'Dining Out',
  'mcdonald': 'Dining Out',
  'shell': 'Gas',
  'exxon': 'Gas',
  'chevron': 'Gas',
  'bp': 'Gas',
  'spotify': 'Subscriptions',
  'netflix': 'Subscriptions',
  'apple': 'Subscriptions',
  'hulu': 'Subscriptions',
  'disney': 'Subscriptions',
  'planet fitness': 'Health',
  'gym': 'Health',
  'cvs': 'Health',
  'walgreens': 'Health',
  'amazon': 'Shopping',
  'target': 'Shopping',
  'walmart': 'Shopping',
  'best buy': 'Shopping',
  'uber': 'Travel',
  'lyft': 'Travel',
  'airbnb': 'Travel',
  'venmo': 'Other',
  'zelle': 'Other',
};

export function categorizeTransaction(merchant: string): Category {
  const lowerMerchant = merchant.toLowerCase();
  for (const [key, category] of Object.entries(merchantCategoryMap)) {
    if (lowerMerchant.includes(key)) {
      return category;
    }
  }
  return 'Other';
}

/**
 * AI-powered bulk categorization via Supabase Edge Function (gpt-4o-mini).
 * Pass in transactions that are already categorized as 'Other' — returns
 * the same array with AI-assigned categories filled in.
 */
export async function aiCategorizeTransactions(
  transactions: Transaction[]
): Promise<Transaction[]> {
  if (transactions.length === 0) return transactions;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return transactions;

  try {
    const merchants = transactions.map((t) => t.merchant);

    const response = await fetch(`${supabaseUrl}/functions/v1/categorize-transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
      },
      body: JSON.stringify({ merchants }),
    });

    if (!response.ok) return transactions;

    const data = await response.json();
    const categories: Category[] = data.categories ?? [];

    return transactions.map((t, i) => ({
      ...t,
      category: categories[i] ?? t.category,
    }));
  } catch {
    // On any failure, return original transactions unchanged
    return transactions;
  }
}
