import { Category } from '../types';

export const categoryEmojis: Record<Category, string> = {
  'Dining Out': '🍽️',
  'Groceries': '🛒',
  'Gas': '⛽',
  'Shopping': '🛍️',
  'Entertainment': '🎬',
  'Health': '💪',
  'Travel': '✈️',
  'Subscriptions': '📱',
  'Income': '💰',
  'Rent': '🏠',
  'Utilities': '💡',
  'Other': '📦',
};

export const categoryColors: Record<Category, string> = {
  'Dining Out': '#F97316',
  'Groceries': '#22C55E',
  'Gas': '#EAB308',
  'Shopping': '#EC4899',
  'Entertainment': '#8B5CF6',
  'Health': '#06B6D4',
  'Travel': '#3B82F6',
  'Subscriptions': '#A855F7',
  'Income': '#10B981',
  'Rent': '#F43F5E',
  'Utilities': '#64748B',
  'Other': '#6B7280',
};

export const allCategories: Category[] = [
  'Dining Out',
  'Groceries',
  'Gas',
  'Shopping',
  'Entertainment',
  'Health',
  'Travel',
  'Subscriptions',
  'Income',
  'Rent',
  'Utilities',
  'Other',
];
