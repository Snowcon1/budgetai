import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PLAID_ENV = Deno.env.get('PLAID_ENV') ?? 'sandbox';
const PLAID_BASE = `https://${PLAID_ENV}.plaid.com`;

const CATEGORY_MAP: Record<string, string> = {
  FOOD_AND_DRINK: 'Dining Out',
  GROCERIES: 'Groceries',
  TRANSPORTATION: 'Gas',
  TRAVEL: 'Travel',
  SHOPPING: 'Shopping',
  ENTERTAINMENT: 'Entertainment',
  HEALTH_AND_FITNESS: 'Health',
  MEDICAL: 'Health',
  SUBSCRIPTION: 'Subscriptions',
  INCOME: 'Income',
  RENT: 'Rent',
  HOME_IMPROVEMENT: 'Other',
  UTILITIES: 'Utilities',
  GENERAL_MERCHANDISE: 'Shopping',
  PERSONAL_CARE: 'Other',
  GENERAL_SERVICES: 'Other',
  GOVERNMENT_AND_NON_PROFIT: 'Other',
  // Credit card payments & internal transfers — exclude from spending
  LOAN_PAYMENTS: 'Transfer',
  TRANSFER_IN: 'Transfer',
  TRANSFER_OUT: 'Transfer',
  BANK_FEES: 'Other',
};

function mapCategory(plaidCategory: string): string {
  return CATEGORY_MAP[plaidCategory] ?? 'Other';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
    });
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all Plaid items for this user
    const { data: items, error: itemsError } = await supabase
      .from('plaid_items')
      .select('*')
      .eq('user_id', userId);

    if (itemsError || !items?.length) {
      return new Response(JSON.stringify({ error: 'No Plaid items found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Sync last 90 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let totalTransactions = 0;
    let totalAccounts = 0;

    for (const item of items) {
      // ── Fetch accounts ──────────────────────────────────────────────────────
      const accountsRes = await fetch(`${PLAID_BASE}/accounts/get`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: Deno.env.get('PLAID_CLIENT_ID'),
          secret: Deno.env.get('PLAID_SECRET'),
          access_token: item.access_token,
        }),
      });

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        const accounts = (accountsData.accounts ?? []).map((a: {
          account_id: string; name: string; official_name: string;
          type: string; subtype: string; balances: { current: number };
        }) => ({
          id: a.account_id,
          user_id: userId,
          name: a.official_name || a.name,
          institution: item.institution_name ?? 'Bank',
          // Credit balances are stored as negative in our app (debt)
          type: a.type === 'depository'
            ? (a.subtype === 'savings' ? 'savings' : 'checking')
            : 'credit',
          balance: a.type === 'credit'
            ? -(a.balances.current ?? 0)
            : (a.balances.current ?? 0),
          last_synced: new Date().toISOString(),
        }));

        for (const account of accounts) {
          await supabase.from('accounts').upsert(account, { onConflict: 'id' });
        }
        totalAccounts += accounts.length;
      }

      // ── Fetch transactions ──────────────────────────────────────────────────
      const txnRes = await fetch(`${PLAID_BASE}/transactions/get`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: Deno.env.get('PLAID_CLIENT_ID'),
          secret: Deno.env.get('PLAID_SECRET'),
          access_token: item.access_token,
          start_date: startDate,
          end_date: endDate,
          options: { count: 500 },
        }),
      });

      if (!txnRes.ok) continue;

      const txnData = await txnRes.json();
      const plaidTxns = txnData.transactions ?? [];

      for (const t of plaidTxns) {
        const category = mapCategory(t.personal_finance_category?.primary ?? 'OTHER');
        const isIncome = category === 'Income';

        // Plaid: positive = debit (money out), negative = credit (money in)
        // Our app: negative = expense/transfer, positive = income
        let amount: number;
        if (isIncome) {
          amount = Math.abs(t.amount);
        } else {
          // Plaid expense comes as positive → make negative
          amount = -Math.abs(t.amount);
        }

        const record = {
          id: t.transaction_id,
          user_id: userId,
          merchant: t.name,
          amount,
          category,
          date: t.date,
          account_id: t.account_id,
          is_manual: false,
          is_receipt: false,
        };

        // Upsert by Plaid transaction_id to prevent duplicates on re-sync
        await supabase.from('transactions').upsert(record, { onConflict: 'id' });
        totalTransactions++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, transactions: totalTransactions, accounts: totalAccounts }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
