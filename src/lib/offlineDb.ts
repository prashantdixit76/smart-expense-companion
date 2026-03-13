import { openDB } from 'idb';

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

const DB_NAME = 'expense-tracker-offline';
const DB_VERSION = 1;

export const getDb = () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('offline-expenses')) {
        const store = db.createObjectStore('offline-expenses', { keyPath: 'id' });
        store.createIndex('by-synced', 'synced');
      }
    },
  });

export const saveOfflineExpense = async (expense: Omit<OfflineExpense, 'synced'>) => {
  const db = await getDb();
  await db.put('offline-expenses', { ...expense, synced: false });
};

export const getUnsyncedExpenses = async (): Promise<OfflineExpense[]> => {
  const db = await getDb();
  const all = await db.getAll('offline-expenses');
  return (all as OfflineExpense[]).filter((e) => !e.synced);
};

export const markAsSynced = async (id: string) => {
  const db = await getDb();
  const expense = await db.get('offline-expenses', id) as OfflineExpense | undefined;
  if (expense) {
    await db.put('offline-expenses', { ...expense, synced: true });
  }
};

export const clearSyncedExpenses = async () => {
  const db = await getDb();
  const all = await db.getAll('offline-expenses') as OfflineExpense[];
  const tx = db.transaction('offline-expenses', 'readwrite');
  for (const item of all) {
    if (item.synced) {
      await tx.store.delete(item.id);
    }
  }
  await tx.done;
};
