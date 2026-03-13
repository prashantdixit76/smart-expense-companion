import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CATEGORIES, CATEGORY_ICONS } from '@/types/expense';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Filter, Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { Expense } from '@/types/expense';

const Expenses = () => {
  const { expenses, deleteExpense, updateExpense, users, customCategories } = useAppStore();
  const allCategories = [...CATEGORIES, ...customCategories];

  const [filters, setFilters] = useState({ category: 'all', type: 'all', dateFrom: '', dateTo: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', category: '', description: '', date: '' });

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => {
        if (filters.category !== 'all' && e.category !== filters.category) return false;
        if (filters.type !== 'all' && e.type !== filters.type) return false;
        if (filters.dateFrom && e.date < filters.dateFrom) return false;
        if (filters.dateTo && e.date > filters.dateTo) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, filters]);

  const getUserName = (id: string) => users.find((u) => u.id === id)?.fullName || 'Unknown';

  const handleDelete = (id: string) => {
    deleteExpense(id);
    toast.success('Expense deleted.');
  };

  const openEdit = (e: Expense) => {
    setEditItem(e);
    setEditForm({ amount: String(e.amount), category: e.category, description: e.description, date: e.date });
  };

  const handleUpdate = () => {
    if (!editItem) return;
    const amount = parseFloat(editForm.amount);
    if (!amount || amount <= 0) { toast.error('Enter valid amount'); return; }
    updateExpense(editItem.id, { amount, category: editForm.category, description: editForm.description, date: editForm.date });
    toast.success('Expense updated!');
    setEditItem(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Expense History</h1>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4" /> Filters
        </Button>
      </div>

      {showFilters && (
        <Card className="border-border/50">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {allCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No expenses found</p>
          <p className="text-sm mt-1">Add your first expense to see it here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => (
            <Card key={e.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{CATEGORY_ICONS[e.category] || '📦'}</span>
                    <div>
                      <p className="font-medium text-foreground">{e.description || e.category}</p>
                      <p className="text-xs text-muted-foreground">{e.category} · {format(parseISO(e.date), 'dd MMM yyyy')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Paid by: {getUserName(e.paidBy)}</p>
                      {e.type === 'group' && e.splitWith.length > 0 && (
                        <p className="text-xs text-primary mt-0.5">
                          Split with: {e.splitWith.map(getUserName).join(', ')} · ₹{(e.amount / (e.splitWith.length + 1)).toFixed(2)} each
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-base font-bold text-expense mr-1">-₹{e.amount.toLocaleString('en-IN')}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(e)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(e.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Expense</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Amount (₹)</Label><Input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} /></div>
            <div>
              <Label>Category</Label>
              <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{allCategories.map((c) => <SelectItem key={c} value={c}>{CATEGORY_ICONS[c] || '📦'} {c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} /></div>
            <div><Label>Date</Label><Input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} /></div>
            <Button className="w-full" onClick={handleUpdate}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
