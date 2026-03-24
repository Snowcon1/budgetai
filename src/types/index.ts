export type Category =
  | 'Dining Out'
  | 'Groceries'
  | 'Gas'
  | 'Shopping'
  | 'Entertainment'
  | 'Health'
  | 'Travel'
  | 'Subscriptions'
  | 'Income'
  | 'Rent'
  | 'Utilities'
  | 'Other';

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  category: Category;
  date: string;
  account_id: string;
  is_manual: boolean;
  is_receipt: boolean;
  notes?: string;
}

export interface Account {
  id: string;
  name: string;
  institution: string;
  type: 'checking' | 'savings' | 'credit';
  balance: number;
  last_synced: string;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  type: 'savings' | 'debt';
  linked_account_id?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  merchant: string;
  amount: number;
  frequency: 'monthly' | 'annual' | 'weekly';
  last_charge: string;
  is_active: boolean;
  possibly_unused: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  data_card?: DataCard;
  conversation_id?: string;
}

export interface ChatSession {
  id: string;
  startedAt: string;
  messages: ChatMessage[];
}

export interface DataCard {
  type: 'spending_chart' | 'goal_progress' | 'transaction_list' | 'subscription_list';
  data: Record<string, unknown>;
}

export interface User {
  id: string;
  name: string;
  monthly_income: number;
  is_demo: boolean;
}

export interface HealthScoreBreakdown {
  total: number;
  spending_ratio: number;
  goal_progress: number;
  savings_rate: number;
  subscription_efficiency: number;
}

export interface WeeklyChallengeData {
  description: string;
  completed: boolean;
  opted_in: boolean;
}
