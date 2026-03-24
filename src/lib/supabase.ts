import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Transaction, Account, Goal, ChatMessage, User } from '../types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
});

interface SupabaseResponse<T> {
  data: T | null;
  error: string | null;
}

export async function getTransactions(
  userId: string,
  from: string,
  to: string
): Promise<SupabaseResponse<Transaction[]>> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: data as Transaction[], error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function insertTransaction(
  t: Transaction & { user_id: string }
): Promise<SupabaseResponse<Transaction>> {
  try {
    const { data, error } = await supabase.from('transactions').insert(t).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as Transaction, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateTransaction(
  id: string,
  changes: Partial<Transaction>
): Promise<SupabaseResponse<Transaction>> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update(changes)
      .eq('id', id)
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as Transaction, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function deleteTransaction(id: string): Promise<SupabaseResponse<null>> {
  try {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getGoals(userId: string): Promise<SupabaseResponse<Goal[]>> {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return { data: null, error: error.message };
    return { data: data as Goal[], error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function insertGoal(
  g: Goal & { user_id: string }
): Promise<SupabaseResponse<Goal>> {
  try {
    const { data, error } = await supabase.from('goals').insert(g).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as Goal, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateGoal(
  id: string,
  changes: Partial<Goal>
): Promise<SupabaseResponse<Goal>> {
  try {
    const { data, error } = await supabase.from('goals').update(changes).eq('id', id).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as Goal, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getAccounts(userId: string): Promise<SupabaseResponse<Account[]>> {
  try {
    const { data, error } = await supabase.from('accounts').select('*').eq('user_id', userId);
    if (error) return { data: null, error: error.message };
    return { data: data as Account[], error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function upsertAccount(
  a: Account & { user_id: string }
): Promise<SupabaseResponse<Account>> {
  try {
    const { data, error } = await supabase.from('accounts').upsert(a).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as Account, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getChatHistory(userId: string): Promise<SupabaseResponse<ChatMessage[]>> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) return { data: null, error: error.message };
    return { data: data as ChatMessage[], error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function insertChatMessage(
  m: ChatMessage & { user_id: string }
): Promise<SupabaseResponse<ChatMessage>> {
  try {
    const { data, error } = await supabase.from('chat_messages').insert(m).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as ChatMessage, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getUserProfile(userId: string): Promise<SupabaseResponse<User>> {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) return { data: null, error: error.message };
    return { data: data as User, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateUserProfile(
  userId: string,
  changes: Partial<User>
): Promise<SupabaseResponse<User>> {
  try {
    const { data, error } = await supabase.from('users').update(changes).eq('id', userId).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as User, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
