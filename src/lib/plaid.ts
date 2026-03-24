import { Account, Transaction } from '../types';
import { aiCategorizeTransactions } from '../utils/categorize';

interface PlaidLinkResult {
  publicToken: string;
  accounts: { id: string; name: string; type: string; subtype: string }[];
}

interface PlaidConfig {
  clientId: string;
  secret: string;
  env: 'sandbox' | 'development' | 'production';
}

function getPlaidConfig(): PlaidConfig {
  return {
    clientId: process.env.EXPO_PUBLIC_PLAID_CLIENT_ID ?? '',
    secret: process.env.EXPO_PUBLIC_PLAID_SECRET ?? '',
    env: (process.env.EXPO_PUBLIC_PLAID_ENV as PlaidConfig['env']) ?? 'sandbox',
  };
}

export async function exchangePublicToken(publicToken: string): Promise<string> {
  const config = getPlaidConfig();

  const response = await fetch(`https://${config.env}.plaid.com/item/public_token/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.clientId,
      secret: config.secret,
      public_token: publicToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange Plaid token');
  }

  const data = await response.json();
  return data.access_token;
}

export async function fetchAccounts(accessToken: string): Promise<Account[]> {
  const config = getPlaidConfig();

  const response = await fetch(`https://${config.env}.plaid.com/accounts/get`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.clientId,
      secret: config.secret,
      access_token: accessToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Plaid accounts');
  }

  const data = await response.json();
  return data.accounts.map(
    (a: { account_id: string; name: string; official_name: string; type: string; subtype: string; balances: { current: number } }) => ({
      id: a.account_id,
      name: a.official_name || a.name,
      institution: 'Plaid',
      type: a.type === 'depository' ? (a.subtype === 'savings' ? 'savings' : 'checking') : 'credit',
      balance: a.type === 'credit' ? -(a.balances.current ?? 0) : (a.balances.current ?? 0),
      last_synced: new Date().toISOString(),
    })
  );
}

export async function fetchTransactions(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<Transaction[]> {
  const config = getPlaidConfig();

  const response = await fetch(`https://${config.env}.plaid.com/transactions/get`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.clientId,
      secret: config.secret,
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Plaid transactions');
  }

  const data = await response.json();
  const mapped: Transaction[] = data.transactions.map(
    (t: { transaction_id: string; name: string; amount: number; personal_finance_category: { primary: string }; date: string; account_id: string }) => ({
      id: t.transaction_id,
      merchant: t.name,
      amount: -t.amount,
      category: mapPlaidCategory(t.personal_finance_category?.primary ?? 'OTHER'),
      date: t.date,
      account_id: t.account_id,
      is_manual: false,
      is_receipt: false,
    })
  );

  // Run AI categorization (gpt-4o-mini) on anything Plaid couldn't classify
  const uncategorized = mapped.filter((t) => t.category === 'Other');
  if (uncategorized.length === 0) return mapped;

  const recategorized = await aiCategorizeTransactions(uncategorized);
  const recategorizedMap = new Map(recategorized.map((t) => [t.id, t.category]));

  return mapped.map((t) =>
    recategorizedMap.has(t.id) ? { ...t, category: recategorizedMap.get(t.id)! } : t
  );
}

function mapPlaidCategory(plaidCategory: string): string {
  const map: Record<string, string> = {
    FOOD_AND_DRINK: 'Dining Out',
    GROCERIES: 'Groceries',
    TRANSPORTATION: 'Gas',
    SHOPPING: 'Shopping',
    ENTERTAINMENT: 'Entertainment',
    HEALTH_AND_FITNESS: 'Health',
    TRAVEL: 'Travel',
    SUBSCRIPTION: 'Subscriptions',
    INCOME: 'Income',
    RENT: 'Rent',
    UTILITIES: 'Utilities',
  };
  return map[plaidCategory] ?? 'Other';
}

export function isPlaidConfigured(): boolean {
  const config = getPlaidConfig();
  return config.clientId !== '' && config.secret !== '';
}
