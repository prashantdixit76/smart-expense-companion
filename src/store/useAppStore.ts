import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, Expense, Income, SystemLog, UdhariEntry } from '@/types/expense';

interface AppState {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  adminAuthenticated: boolean;
  adminUser: User | null;
  expenses: Expense[];
  incomes: Income[];
  customCategories: string[];
  systemLogs: SystemLog[];
  udhpiEntries: UdhariEntry[];

  // Auth
  signup: (user: Omit<User, 'id' | 'status' | 'role' | 'createdAt'>, password: string) => { success: boolean; message: string };
  login: (email: string, password: string) => { success: boolean; message: string };
  logout: () => void;

  // Admin auth
  adminLogin: (email: string, password: string) => { success: boolean; message: string };
  adminLogout: () => void;

  // User management
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  disableUser: (userId: string) => void;
  enableUser: (userId: string) => void;
  deleteUser: (userId: string) => void;
  changeUserRole: (userId: string, role: UserRole) => void;
  updateUser: (userId: string, data: Partial<Pick<User, 'fullName' | 'email' | 'phone'>>) => void;
  createUser: (user: Omit<User, 'id' | 'createdAt'>, password: string) => { success: boolean; message: string };
  resetUserPassword: (userId: string, newPassword: string) => void;

  // Data
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) => void;
  deleteExpense: (id: string) => void;
  clearAllExpenses: () => void;
  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => void;
  updateIncome: (id: string, data: Partial<Omit<Income, 'id' | 'createdAt'>>) => void;
  deleteIncome: (id: string) => void;
  addCustomCategory: (category: string) => void;

  // Udhari
  addUdhari: (entry: Omit<UdhariEntry, 'id' | 'createdAt' | 'settled'>) => void;
  updateUdhari: (id: string, data: Partial<Omit<UdhariEntry, 'id' | 'createdAt'>>) => void;
  deleteUdhari: (id: string) => void;
  settleUdhari: (id: string) => void;

  // Logs
  addLog: (action: string, details: string) => void;
}

// Simple password store (in production, use proper hashing)
const getPasswords = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem('expense-passwords') || '{}');
  } catch { return {}; }
};

const setPassword = (email: string, password: string) => {
  const p = getPasswords();
  p[email] = password;
  localStorage.setItem('expense-passwords', JSON.stringify(p));
};

const removePassword = (email: string) => {
  const p = getPasswords();
  delete p[email];
  localStorage.setItem('expense-passwords', JSON.stringify(p));
};

const checkPassword = (email: string, password: string): boolean => {
  const p = getPasswords();
  return p[email] === password;
};

// Always set admin password (force update)
setPassword('prashantdixit1650@gmail.com', '@Prashant252006');

// Ensure admin user exists in persisted storage
try {
  const stored = JSON.parse(localStorage.getItem('expense-tracker-storage') || '{}');
  const users = stored?.state?.users || [];
  const adminExists = users.some((u: any) => u.email === 'prashantdixit1650@gmail.com');
  if (!adminExists) {
    // Clear old storage so default admin is re-created
    localStorage.removeItem('expense-tracker-storage');
  }
} catch {}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: (() => {
        // Check persisted state first
        try {
          const stored = JSON.parse(localStorage.getItem('expense-tracker-storage') || '{}');
          if (stored?.state?.users?.length) return stored.state.users;
        } catch {}
        return [
          {
            id: 'admin-1',
            fullName: 'Prashant Dixit',
            email: 'prashantdixit1650@gmail.com',
            phone: '1234567890',
            status: 'approved' as const,
            role: 'super_admin' as const,
            createdAt: new Date().toISOString(),
          },
        ];
      })(),
      isAuthenticated: false,
      adminAuthenticated: false,
      adminUser: null,
      expenses: [],
      incomes: [],
      customCategories: [],
      systemLogs: [],
      udhpiEntries: [],

      signup: (userData, password) => {
        const { users } = get();
        if (users.find((u) => u.email === userData.email)) {
          return { success: false, message: 'Email already registered.' };
        }
        const newUser: User = {
          ...userData,
          id: crypto.randomUUID(),
          status: 'pending',
          role: 'user',
          createdAt: new Date().toISOString(),
        };
        setPassword(userData.email, password);
        set({ users: [...users, newUser] });
        get().addLog('User Signup', `${userData.fullName} (${userData.email}) signed up`);
        return { success: true, message: 'Signup successful! Your account is pending admin approval.' };
      },

      login: (email, password) => {
        const { users } = get();
        const user = users.find((u) => u.email === email);
        if (!user) return { success: false, message: 'Invalid email or password.' };
        if (!checkPassword(email, password)) {
          return { success: false, message: 'Invalid email or password.' };
        }
        if (user.status === 'pending') {
          return { success: false, message: 'Your account is pending admin approval.' };
        }
        if (user.status === 'rejected') {
          return { success: false, message: 'Your account has been rejected.' };
        }
        if (user.status === 'disabled') {
          return { success: false, message: 'Your account has been disabled. Contact admin.' };
        }
        const updatedUser = { ...user, lastLogin: new Date().toISOString() };
        set({
          currentUser: updatedUser,
          isAuthenticated: true,
          users: users.map((u) => u.id === user.id ? updatedUser : u),
        });
        get().addLog('User Login', `${user.fullName} logged in`);
        return { success: true, message: 'Login successful!' };
      },

      logout: () => {
        const { currentUser } = get();
        if (currentUser) get().addLog('User Logout', `${currentUser.fullName} logged out`);
        set({ currentUser: null, isAuthenticated: false });
      },

      adminLogin: (email, password) => {
        const { users } = get();
        const user = users.find((u) => u.email === email);
        if (!user) return { success: false, message: 'Invalid admin credentials.' };
        if (!checkPassword(email, password)) {
          return { success: false, message: 'Invalid admin credentials.' };
        }
        if (user.role !== 'admin' && user.role !== 'super_admin') {
          return { success: false, message: 'Access denied. Admin privileges required.' };
        }
        if (user.status !== 'approved') {
          return { success: false, message: 'Account is not active.' };
        }
        const updatedUser = { ...user, lastLogin: new Date().toISOString() };
        set({
          adminUser: updatedUser,
          adminAuthenticated: true,
          users: users.map((u) => u.id === user.id ? updatedUser : u),
        });
        get().addLog('Admin Login', `${user.fullName} logged into admin panel`);
        return { success: true, message: 'Admin login successful!' };
      },

      adminLogout: () => {
        const { adminUser } = get();
        if (adminUser) get().addLog('Admin Logout', `${adminUser.fullName} logged out of admin panel`);
        set({ adminUser: null, adminAuthenticated: false });
      },

      approveUser: (userId) => {
        const { users, adminUser } = get();
        const user = users.find(u => u.id === userId);
        set({ users: users.map((u) => (u.id === userId ? { ...u, status: 'approved' } : u)) });
        if (user) get().addLog('User Approved', `${adminUser?.fullName || 'Admin'} approved ${user.fullName}`);
      },

      rejectUser: (userId) => {
        const { users, adminUser } = get();
        const user = users.find(u => u.id === userId);
        set({ users: users.map((u) => (u.id === userId ? { ...u, status: 'rejected' } : u)) });
        if (user) get().addLog('User Rejected', `${adminUser?.fullName || 'Admin'} rejected ${user.fullName}`);
      },

      disableUser: (userId) => {
        const { users, adminUser } = get();
        const user = users.find(u => u.id === userId);
        set({ users: users.map((u) => (u.id === userId ? { ...u, status: 'disabled' } : u)) });
        if (user) get().addLog('User Disabled', `${adminUser?.fullName || 'Admin'} disabled ${user.fullName}`);
      },

      enableUser: (userId) => {
        const { users, adminUser } = get();
        const user = users.find(u => u.id === userId);
        set({ users: users.map((u) => (u.id === userId ? { ...u, status: 'approved' } : u)) });
        if (user) get().addLog('User Enabled', `${adminUser?.fullName || 'Admin'} enabled ${user.fullName}`);
      },

      deleteUser: (userId) => {
        const { users, adminUser } = get();
        const user = users.find(u => u.id === userId);
        if (user) {
          removePassword(user.email);
          get().addLog('User Deleted', `${adminUser?.fullName || 'Admin'} deleted ${user.fullName}`);
        }
        set({ users: users.filter((u) => u.id !== userId) });
      },

      changeUserRole: (userId, role) => {
        const { users, adminUser } = get();
        const user = users.find(u => u.id === userId);
        set({ users: users.map((u) => (u.id === userId ? { ...u, role } : u)) });
        if (user) get().addLog('Role Changed', `${adminUser?.fullName || 'Admin'} changed ${user.fullName}'s role to ${role}`);
      },

      updateUser: (userId, data) => {
        const { users } = get();
        set({ users: users.map((u) => (u.id === userId ? { ...u, ...data } : u)) });
        get().addLog('User Updated', `User ${userId} profile updated`);
      },

      createUser: (userData, password) => {
        const { users } = get();
        if (users.find((u) => u.email === userData.email)) {
          return { success: false, message: 'Email already registered.' };
        }
        const newUser: User = {
          ...userData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        setPassword(userData.email, password);
        set({ users: [...users, newUser] });
        get().addLog('User Created', `Admin created user ${userData.fullName} (${userData.email})`);
        return { success: true, message: 'User created successfully!' };
      },

      resetUserPassword: (userId, newPassword) => {
        const { users } = get();
        const user = users.find(u => u.id === userId);
        if (user) {
          setPassword(user.email, newPassword);
          get().addLog('Password Reset', `Password reset for ${user.fullName}`);
        }
      },

      addExpense: (expense) => {
        const newExpense: Expense = { ...expense, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        set({ expenses: [...get().expenses, newExpense] });
      },

      updateExpense: (id, data) => {
        set({ expenses: get().expenses.map(e => e.id === id ? { ...e, ...data } : e) });
      },

      deleteExpense: (id) => set({ expenses: get().expenses.filter((e) => e.id !== id) }),

      addIncome: (income) => {
        const newIncome: Income = { ...income, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        set({ incomes: [...get().incomes, newIncome] });
      },

      updateIncome: (id, data) => {
        set({ incomes: get().incomes.map(i => i.id === id ? { ...i, ...data } : i) });
      },

      deleteIncome: (id) => set({ incomes: get().incomes.filter((i) => i.id !== id) }),

      addCustomCategory: (category) => {
        const { customCategories } = get();
        if (!customCategories.includes(category)) set({ customCategories: [...customCategories, category] });
      },

      addUdhari: (entry) => {
        const newEntry: UdhariEntry = {
          ...entry,
          id: crypto.randomUUID(),
          settled: false,
          createdAt: new Date().toISOString(),
        };
        set({ udhpiEntries: [...get().udhpiEntries, newEntry] });
      },

      updateUdhari: (id, data) => {
        set({ udhpiEntries: get().udhpiEntries.map(e => e.id === id ? { ...e, ...data } : e) });
      },

      deleteUdhari: (id) => {
        set({ udhpiEntries: get().udhpiEntries.filter(e => e.id !== id) });
      },

      settleUdhari: (id) => {
        set({
          udhpiEntries: get().udhpiEntries.map(e =>
            e.id === id ? { ...e, settled: true, settledDate: new Date().toISOString() } : e
          ),
        });
      },

      addLog: (action, details) => {
        const { systemLogs, currentUser, adminUser } = get();
        const actor = adminUser || currentUser;
        const log: SystemLog = {
          id: crypto.randomUUID(),
          action,
          userId: actor?.id || 'system',
          userName: actor?.fullName || 'System',
          details,
          timestamp: new Date().toISOString(),
        };
        set({ systemLogs: [log, ...systemLogs].slice(0, 500) });
      },
    }),
    { name: 'expense-tracker-storage' }
  )
);
