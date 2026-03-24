import { format, subDays, startOfMonth, addMonths, setDate } from 'date-fns';
import { Transaction, Account, Goal, Subscription, User } from '../types';

function uid(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const CHECKING_ID = 'acct_checking_001';
const SAVINGS_ID = 'acct_savings_001';
const CREDIT_ID = 'acct_credit_001';

export const demoUser: User = {
  id: 'user_demo_001',
  name: 'Alex',
  monthly_income: 6800,
  is_demo: true,
};

export const demoAccounts: Account[] = [
  {
    id: CHECKING_ID,
    name: 'Chase Checking',
    institution: 'Chase',
    type: 'checking',
    balance: 2340,
    last_synced: new Date().toISOString(),
  },
  {
    id: SAVINGS_ID,
    name: 'Chase Savings',
    institution: 'Chase',
    type: 'savings',
    balance: 4180,
    last_synced: new Date().toISOString(),
  },
  {
    id: CREDIT_ID,
    name: 'Visa Credit Card',
    institution: 'Chase',
    type: 'credit',
    balance: -420,
    last_synced: new Date().toISOString(),
  },
];

function generateTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  const now = new Date();

  for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
    const date = subDays(now, daysAgo);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfMonth = date.getDate();
    const dayOfWeek = date.getDay();

    // Paychecks on 1st and 15th
    if (dayOfMonth === 1 || dayOfMonth === 15) {
      transactions.push({
        id: uid(),
        merchant: 'Employer - Direct Deposit',
        amount: 3400,
        category: 'Income',
        date: dateStr,
        account_id: CHECKING_ID,
        is_manual: false,
        is_receipt: false,
      });
    }

    // Rent on the 1st
    if (dayOfMonth === 1) {
      transactions.push({
        id: uid(),
        merchant: 'Austin Apartments',
        amount: -1200,
        category: 'Rent',
        date: dateStr,
        account_id: CHECKING_ID,
        is_manual: false,
        is_receipt: false,
      });
    }

    // Weekly HEB grocery run (Saturdays mostly)
    if (dayOfWeek === 6) {
      transactions.push({
        id: uid(),
        merchant: 'H-E-B',
        amount: -rand(60, 120),
        category: 'Groceries',
        date: dateStr,
        account_id: CREDIT_ID,
        is_manual: false,
        is_receipt: false,
      });
    }

    // DoorDash 2-3x per week
    if (dayOfWeek === 1 || dayOfWeek === 4 || (dayOfWeek === 6 && Math.random() > 0.5)) {
      transactions.push({
        id: uid(),
        merchant: 'DoorDash',
        amount: -rand(18, 45),
        category: 'Dining Out',
        date: dateStr,
        account_id: CREDIT_ID,
        is_manual: false,
        is_receipt: false,
      });
    }

    // Random dining out 4-6x per month
    if (dayOfMonth % 5 === 0 || (dayOfMonth % 7 === 0 && Math.random() > 0.4)) {
      const restaurants = ["Torchy's Tacos", 'Chick-fil-A', "P. Terry's", "Raising Cane's"];
      transactions.push({
        id: uid(),
        merchant: restaurants[randInt(0, restaurants.length - 1)],
        amount: -rand(10, 25),
        category: 'Dining Out',
        date: dateStr,
        account_id: CREDIT_ID,
        is_manual: false,
        is_receipt: false,
      });
    }

    // Uber 3-4x per month
    if (dayOfMonth === 3 || dayOfMonth === 10 || dayOfMonth === 18 || (dayOfMonth === 25 && Math.random() > 0.3)) {
      transactions.push({
        id: uid(),
        merchant: 'Uber',
        amount: -rand(12, 28),
        category: 'Travel',
        date: dateStr,
        account_id: CREDIT_ID,
        is_manual: false,
        is_receipt: false,
      });
    }

    // Shell Gas biweekly
    if (dayOfMonth === 5 || dayOfMonth === 19) {
      transactions.push({
        id: uid(),
        merchant: 'Shell',
        amount: -rand(45, 65),
        category: 'Gas',
        date: dateStr,
        account_id: CHECKING_ID,
        is_manual: false,
        is_receipt: false,
      });
    }

    // Monthly subscriptions on specific dates
    if (dayOfMonth === 8) {
      transactions.push({
        id: uid(),
        merchant: 'Spotify',
        amount: -9.99,
        category: 'Subscriptions',
        date: dateStr,
        account_id: CREDIT_ID,
        is_manual: false,
        is_receipt: false,
      });
    }
    if (dayOfMonth === 12) {
      transactions.push({
        id: uid(),
        merchant: 'Netflix',
        amount: -15.49,
        category: 'Subscriptions',
        date: dateStr,
        account_id: CREDIT_ID,
        is_manual: false,
        is_receipt: false,
      });
    }
    if (dayOfMonth === 3) {
      transactions.push({
        id: uid(),
        merchant: 'Apple iCloud',
        amount: -2.99,
        category: 'Subscriptions',
        date: dateStr,
        account_id: CREDIT_ID,
        is_manual: false,
        is_receipt: false,
      });
    }
    if (dayOfMonth === 1) {
      transactions.push({
        id: uid(),
        merchant: 'Planet Fitness',
        amount: -24.99,
        category: 'Health',
        date: dateStr,
        account_id: CHECKING_ID,
        is_manual: false,
        is_receipt: false,
      });
    }

    // Car insurance monthly on the 15th
    if (dayOfMonth === 15) {
      transactions.push({
        id: uid(),
        merchant: 'State Farm Insurance',
        amount: -187,
        category: 'Utilities',
        date: dateStr,
        account_id: CHECKING_ID,
        is_manual: false,
        is_receipt: false,
      });
    }

    // Amazon 2-3x per month
    if (dayOfMonth === 4 || dayOfMonth === 16 || (dayOfMonth === 27 && Math.random() > 0.4)) {
      transactions.push({
        id: uid(),
        merchant: 'Amazon',
        amount: -rand(15, 80),
        category: 'Shopping',
        date: dateStr,
        account_id: CREDIT_ID,
        is_manual: false,
        is_receipt: false,
      });
    }

    // Target run once per month
    if (dayOfMonth === 22) {
      transactions.push({
        id: uid(),
        merchant: 'Target',
        amount: -rand(45, 120),
        category: 'Shopping',
        date: dateStr,
        account_id: CREDIT_ID,
        is_manual: false,
        is_receipt: false,
      });
    }

    // Happy hour once a month
    if (dayOfMonth === 20) {
      transactions.push({
        id: uid(),
        merchant: 'The Roosevelt Room',
        amount: -rand(35, 65),
        category: 'Entertainment',
        date: dateStr,
        account_id: CREDIT_ID,
        is_manual: false,
        is_receipt: false,
      });
    }

    // Venmo occasional
    if (dayOfMonth === 11 || dayOfMonth === 24) {
      if (Math.random() > 0.4) {
        transactions.push({
          id: uid(),
          merchant: 'Venmo - Payment Sent',
          amount: -rand(20, 60),
          category: 'Other',
          date: dateStr,
          account_id: CHECKING_ID,
          is_manual: false,
          is_receipt: false,
        });
      }
    }
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const demoTransactions: Transaction[] = generateTransactions();

export const demoGoals: Goal[] = [
  {
    id: 'goal_001',
    name: 'Japan Trip',
    target_amount: 4500,
    current_amount: 1530,
    target_date: format(addMonths(new Date(), 14), 'yyyy-MM-dd'),
    type: 'savings',
    linked_account_id: SAVINGS_ID,
    created_at: format(subDays(new Date(), 120), 'yyyy-MM-dd'),
  },
  {
    id: 'goal_002',
    name: 'Emergency Fund',
    target_amount: 10000,
    current_amount: 4180,
    target_date: format(addMonths(new Date(), 18), 'yyyy-MM-dd'),
    type: 'savings',
    linked_account_id: SAVINGS_ID,
    created_at: format(subDays(new Date(), 200), 'yyyy-MM-dd'),
  },
  {
    id: 'goal_003',
    name: 'New MacBook',
    target_amount: 1299,
    current_amount: 420,
    target_date: format(addMonths(new Date(), 3), 'yyyy-MM-dd'),
    type: 'savings',
    created_at: format(subDays(new Date(), 60), 'yyyy-MM-dd'),
  },
];

export const demoSubscriptions: Subscription[] = [
  {
    id: 'sub_001',
    merchant: 'Spotify',
    amount: 9.99,
    frequency: 'monthly',
    last_charge: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
    is_active: true,
    possibly_unused: false,
  },
  {
    id: 'sub_002',
    merchant: 'Netflix',
    amount: 15.49,
    frequency: 'monthly',
    last_charge: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
    is_active: true,
    possibly_unused: false,
  },
  {
    id: 'sub_003',
    merchant: 'Apple iCloud',
    amount: 2.99,
    frequency: 'monthly',
    last_charge: format(subDays(new Date(), 20), 'yyyy-MM-dd'),
    is_active: true,
    possibly_unused: false,
  },
  {
    id: 'sub_004',
    merchant: 'Planet Fitness',
    amount: 24.99,
    frequency: 'monthly',
    last_charge: format(subDays(new Date(), 22), 'yyyy-MM-dd'),
    is_active: true,
    possibly_unused: true,
  },
];
