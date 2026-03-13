import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORIES, CATEGORY_ICONS } from '@/types/expense';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Filter, Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface Expense { id: string; amount: number; category: string; description: string | null; date: string; paid_by: string | null; split_with: string[] | null; type: string | null; created_at: string; }

const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const allCategories = [...CATEGORIES];
  const [filters, setFilters] = useState({ category: 'all', type: 'all', dateFrom: '', dateTo: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', category: '', description: '', date: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchExpenses = async () => {
    if (!user) return;
    const { data } = await supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false });
    setExpenses(data || []);
  };

  useEffect(() => { fetchExpenses(); }, [user]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (filters.category !== 'all' && e.category !== filters.category) return false;
      if (filters.type !== 'all' && e.type !== filters.type) return false;
      if (filters.dateFrom && e.date < filters.dateFrom) return false;
      if (filters.dateTo && e.date > filters.dateTo) return false;
      return true;
    });
  }, [expenses, filters]);

  const confirmDelete = async () => {
    if (deleteId) {
      await supabase.from('expenses').delete().eq('id', deleteId);
      toast.success('Expense deleted.');
      setDeleteId(null);
      fetchExpenses();
    }
  };

  const openEdit = (e: Expense) => {
    setEditItem(e);
    setEditForm({ amount: String(e.amount), category: e.category, description: e.description || '', date: e.date });
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    const amount = parseFloat(editForm.amount);
    if (!amount || amount <= 0) { toast.error('Enter valid amount'); return; }
    await supabase.from('expenses').update({ amount, category: editForm.category, description: editForm.description, date: editForm.date }).eq('id', editItem.id);
    toast.success('Expense updated!');
    setEditItem(null);
    fetchExpenses();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between animate-fade-in">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Expense History</h1>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4" /> Filters
        </Button>
      </div>

      {showFilters && (
        <Card className="glass-card rounded-2xl animate-fade-in">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{[<SelectItem key="all" value="all">All Categories</SelectItem>, ...allCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)]}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="personal">Personal</SelectItem><SelectItem value="group">Group</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">From</Label><Input type="date" className="rounded-xl" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">To</Label><Input type="date" className="rounded-xl" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} /></div>
            </div>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground animate-fade-in">
          <p className="text-lg font-semibold">No expenses found</p>
          <p className="text-sm mt-1">Add your first expense to see it here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e, idx) => (
            <Card key={e.id} className="glass-card rounded-2xl card-hover-glow animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted/80 flex items-center justify-center text-lg shrink-0">
                      {CATEGORY_ICONS[e.category] || '📦'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{e.description || e.category}</p>
                      <p className="text-xs text-muted-foreground">{e.category} · {format(parseISO(e.date), 'dd MMM yyyy')}</p>
                      {e.type === 'group' && e.split_with && e.split_with.length > 0 && (
                        <p className="text-xs text-primary mt-0.5">Split with: {e.split_with.join(', ')} · ₹{(e.amount / (e.split_with.length + 1)).toFixed(2)} each</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 ml-2">
                    <span className="text-sm font-bold text-expense mr-1">-₹{e.amount.toLocaleString('en-IN')}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-xl" onClick={() => openEdit(e)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-xl" onClick={() => setDeleteId(e.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="glass-card rounded-2xl max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Expense</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Amount (₹)</Label><Input type="number" className="rounded-xl" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} /></div>
            <div><Label>Category</Label><Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{allCategories.map((c) => <SelectItem key={c} value={c}>{CATEGORY_ICONS[c] || '📦'} {c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Description</Label><Textarea className="rounded-xl" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} /></div>
            <div><Label>Date</Label><Input type="date" className="rounded-xl" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} /></div>
            <Button className="w-full rounded-xl gradient-primary text-primary-foreground" onClick={handleUpdate}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="glass-card rounded-2xl max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Expenses;