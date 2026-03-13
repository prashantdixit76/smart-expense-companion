import { useEffect, useCallback } from 'react';
import { getUnsyncedExpenses, markAsSynced, clearSyncedExpenses } from '@/lib/offlineDb';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

export const useOfflineSync = () => {
  const addExpense = useAppStore((s) => s.addExpense);

  const syncOfflineExpenses = useCallback(async () => {
    try {
      const unsynced = await getUnsyncedExpenses();
      if (unsynced.length === 0) return;

      for (const expense of unsynced) {
        addExpense({
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          date: expense.date,
          paidBy: expense.paidBy,
          splitWith: expense.splitWith,
          type: expense.type,
        });
        await markAsSynced(expense.id);
      }

      await clearSyncedExpenses();
      toast.success(`${unsynced.length} offline expense(s) synced!`);
    } catch (err) {
      console.error('Offline sync failed:', err);
    }
  }, [addExpense]);

  useEffect(() => {
    // Sync when coming back online
    const handleOnline = () => {
      syncOfflineExpenses();
    };

    window.addEventListener('online', handleOnline);

    // Also sync on mount if online
    if (navigator.onLine) {
      syncOfflineExpenses();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, [syncOfflineExpenses]);
};
