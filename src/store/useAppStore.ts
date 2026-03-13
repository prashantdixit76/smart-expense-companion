import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Expense, Income } from '@/types/expense';

interface AppState {
  // Auth
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;

  // Data
  expenses: Expense[];
  incomes: Income[];
  customCategories: string[];

  // Auth actions
  signup: (user: Omit<User, 'id' | 'status'>, password: string) => { success: boolean; message: string };
  login: (email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  approveUser: (userId: string) => void;

  // Expense actions
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;

  // Income actions
  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => void;
  deleteIncome: (id: string) => void;

  // Category actions
  addCustomCategory: (category: string) => void;
}

interface PasswordStore {
  [email: string]: string;
}

const passwords: PasswordStore = {};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [
        {
          id: 'admin-1',
          fullName: 'Admin User',
          email: 'admin@expense.com',
          phone: '1234567890',
          status: 'approved',
        },
      ],
      isAuthenticated: false,
      expenses: [],
      incomes: [],
      customCategories: [],

      signup: (userData, password) => {
        const { users } = get();
        if (users.find((u) => u.email === userData.email)) {
          return { success: false, message: 'Email already registered.' };
        }
        const newUser: User = {
          ...userData,
          id: crypto.randomUUID(),
          status: 'pending',
        };
        passwords[userData.email] = password;
        set({ users: [...users, newUser] });
        return { success: true, message: 'Signup successful! Your account is pending admin approval.' };
      },

      login: (email, password) => {
        const { users } = get();
        const user = users.find((u) => u.email === email);
        if (!user) return { success: false, message: 'Invalid email or password.' };
        if (passwords[email] !== password && email !== 'admin@expense.com') {
          return { success: false, message: 'Invalid email or password.' };
        }
        if (email === 'admin@expense.com' && password !== 'admin123') {
          return { success: false, message: 'Invalid email or password.' };
        }
        if (email === 'admin@expense.com' && password === 'admin123') {
          // admin login with default password
          passwords[email] = password;
        }
        if (user.status === 'pending') {
          return { success: false, message: 'Your account is pending admin approval.' };
        }
        if (user.status === 'rejected') {
          return { success: false, message: 'Your account has been rejected.' };
        }
        set({ currentUser: user, isAuthenticated: true });
        return { success: true, message: 'Login successful!' };
      },

      logout: () => set({ currentUser: null, isAuthenticated: false }),

      approveUser: (userId) => {
        const { users } = get();
        set({
          users: users.map((u) => (u.id === userId ? { ...u, status: 'approved' } : u)),
        });
      },

      addExpense: (expense) => {
        const newExpense: Expense = {
          ...expense,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set({ expenses: [...get().expenses, newExpense] });
      },

      deleteExpense: (id) => {
        set({ expenses: get().expenses.filter((e) => e.id !== id) });
      },

      addIncome: (income) => {
        const newIncome: Income = {
          ...income,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set({ incomes: [...get().incomes, newIncome] });
      },

      deleteIncome: (id) => {
        set({ incomes: get().incomes.filter((i) => i.id !== id) });
      },

      addCustomCategory: (category) => {
        const { customCategories } = get();
        if (!customCategories.includes(category)) {
          set({ customCategories: [...customCategories, category] });
        }
      },
    }),
    {
      name: 'expense-tracker-storage',
    }
  )
);
