import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { INCOME_SOURCES } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowDownCircle, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import type { Income } from '@/types/expense';

const AddIncome = () => {
  const { addIncome, incomes, deleteIncome, updateIncome } = useAppStore();
  const [form, setForm] = useState({ amount: '', source: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [editItem, setEditItem] = useState<Income | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', source: '', description: '', date: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount.'); return; }
    if (!form.source) { toast.error('Select an income source.'); return; }
    addIncome({ amount, source: form.source, description: form.description, date: form.date });
    toast.success('Income added!');
    setForm({ amount: '', source: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
  };

  const openEdit = (item: Income) => {
    setEditItem(item);
    setEditForm({ amount: String(item.amount), source: item.source, description: item.description, date: item.date });
  };

  const handleUpdate = () => {
    if (!editItem) return;
    const amount = parseFloat(editForm.amount);
    if (!amount || amount <= 0) { toast.error('Enter valid amount'); return; }
    updateIncome(editItem.id, { amount, source: editForm.source, description: editForm.description, date: editForm.date });
    toast.success('Income updated!');
    setEditItem(null);
  };

  const confirmDelete = () => {
    if (deleteId) { deleteIncome(deleteId); toast.success('Income deleted.'); setDeleteId(null); }
  };

  const sortedIncomes = [...incomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Add Income</h1>
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>{INCOME_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Details about this income" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <Button type="submit" className="w-full gap-2"><ArrowDownCircle className="w-4 h-4" /> Add Income</Button>
          </form>
        </CardContent>
      </Card>

      {/* Income History */}
      {sortedIncomes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Income History</h2>
          {sortedIncomes.map((item) => (
            <Card key={item.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{item.source}</p>
                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                    <p className="text-xs text-muted-foreground">{format(parseISO(item.date), 'dd MMM yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-base font-bold text-green-600 mr-1">+₹{item.amount.toLocaleString('en-IN')}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(item.id)}>
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
          <DialogHeader><DialogTitle>Edit Income</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Amount (₹)</Label><Input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} /></div>
            <div>
              <Label>Source</Label>
              <Select value={editForm.source} onValueChange={(v) => setEditForm({ ...editForm, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{INCOME_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
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

export default AddIncome;
