import { Category } from '../types';
import { colors } from './colors';

export const categoryEmojis: Record<Category, string> = {
  'Dining Out': '🍕',
  'Groceries': '🛒',
  'Gas': '⛽',
  'Shopping': '🛍️',
  'Entertainment': '🎬',
  'Health': '💊',
  'Travel': '✈️',
  'Subscriptions': '🔁',
  'Income': '💰',
  'Rent': '🏠',
  'Utilities': '💡',
  'Other': '📦',
};

export const categoryColors: Record<Category, string> = {
  'Dining Out': colors.category['Dining Out'].accent,
  'Groceries': colors.category['Groceries'].accent,
  'Gas': colors.category['Gas'].accent,
  'Shopping': colors.category['Shopping'].accent,
  'Entertainment': colors.category['Entertainment'].accent,
  'Health': colors.category['Health'].accent,
  'Travel': colors.category['Travel'].accent,
  'Subscriptions': colors.category['Subscriptions'].accent,
  'Income': colors.category['Income'].accent,
  'Rent': colors.category['Rent'].accent,
  'Utilities': colors.category['Utilities'].accent,
  'Other': colors.category['Other'].accent,
};

export const categoryBgColors: Record<Category, string> = {
  'Dining Out': colors.category['Dining Out'].bg,
  'Groceries': colors.category['Groceries'].bg,
  'Gas': colors.category['Gas'].bg,
  'Shopping': colors.category['Shopping'].bg,
  'Entertainment': colors.category['Entertainment'].bg,
  'Health': colors.category['Health'].bg,
  'Travel': colors.category['Travel'].bg,
  'Subscriptions': colors.category['Subscriptions'].bg,
  'Income': colors.category['Income'].bg,
  'Rent': colors.category['Rent'].bg,
  'Utilities': colors.category['Utilities'].bg,
  'Other': colors.category['Other'].bg,
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
