export type UserRole = 'user' | 'admin' | 'super_admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected' | 'disabled';
  role: UserRole;
  createdAt: string;
  lastLogin?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paidBy: string;
  splitWith: string[];
  type: 'personal' | 'group';
  createdAt: string;
}

export interface Income {
  id: string;
  amount: number;
  source: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface SystemLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  details: string;
  timestamp: string;
}

export const CATEGORIES = [
  'Food', 'Rent', 'Travel', 'Shopping', 'Medical',
  'Entertainment', 'Utilities', 'Recharge', 'Other',
] as const;

export const INCOME_SOURCES = [
  'Salary', 'Freelance', 'Pocket Money', 'Other',
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍔', Rent: '🏠', Travel: '✈️', Shopping: '🛍️',
  Medical: '🏥', Entertainment: '🎬', Utilities: '💡',
  Recharge: '📱', Other: '📦',
};
