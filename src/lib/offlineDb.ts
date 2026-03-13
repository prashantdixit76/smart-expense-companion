import { openDB, DBSchema } from 'idb';

interface OfflineExpense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paidBy: string;
  splitWith?: string[];
  type: 'personal' | 'group';
  createdAt: string;
  synced: boolean;
}

interface ExpenseTrackerDB extends DBSchema {
  'offline-expenses': {
    key: string;
    value: OfflineExpense;
    indexes: { 'by-synced': number };
  };
}

const DB_NAME = 'expense-tracker-offline';
const DB_VERSION = 1;

export const getDb = () =>
  openDB<ExpenseTrackerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore('offline-expenses', { keyPath: 'id' });
      store.createIndex('by-synced', 'synced');
    },
  });

export const saveOfflineExpense = async (expense: Omit<OfflineExpense, 'synced'>) => {
  const db = await getDb();
  await db.put('offline-expenses', { ...expense, synced: false });
};

export const getUnsyncedExpenses = async (): Promise<OfflineExpense[]> => {
  const db = await getDb();
  return db.getAllFromIndex('offline-expenses', 'by-synced', false);
};

export const markAsSynced = async (id: string) => {
  const db = await getDb();
  const expense = await db.get('offline-expenses', id);
  if (expense) {
    await db.put('offline-expenses', { ...expense, synced: true });
  }
};

export const clearSyncedExpenses = async () => {
  const db = await getDb();
  const synced = await db.getAllFromIndex('offline-expenses', 'by-synced', true);
  const tx = db.transaction('offline-expenses', 'readwrite');
  for (const item of synced) {
    await tx.store.delete(item.id);
  }
  await tx.done;
};
