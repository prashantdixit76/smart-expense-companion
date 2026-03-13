import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowUpCircle, ArrowDownCircle, CheckCircle2, Plus, IndianRupee, Search, User, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { UdhariEntry } from '@/types/expense';

export default function Udhari() {
  const { udhpiEntries, addUdhari, settleUdhari, deleteUdhari, updateUdhari } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'given' | 'taken'>('all');
  const [editItem, setEditItem] = useState<UdhariEntry | null>(null);
  const [editForm, setEditForm] = useState({ contactName: '', phone: '', amount: '', type: 'given' as 'given' | 'taken', description: '', date: '' });
  const [form, setForm] = useState({
    contactName: '', phone: '', amount: '', type: 'given' as 'given' | 'taken', description: '', date: new Date().toISOString().split('T')[0],
  });

  const summary = useMemo(() => {
    const allGiven = udhpiEntries.filter(e => e.type === 'given').reduce((s, e) => s + e.amount, 0);
    const allTaken = udhpiEntries.filter(e => e.type === 'taken').reduce((s, e) => s + e.amount, 0);
    const settledGiven = udhpiEntries.filter(e => e.type === 'given' && e.settled).reduce((s, e) => s + e.amount, 0);
    const settledTaken = udhpiEntries.filter(e => e.type === 'taken' && e.settled).reduce((s, e) => s + e.amount, 0);
    return { totalGiven: allGiven - settledGiven, totalTaken: allTaken - settledTaken, pendingGiven: allGiven - settledGiven, pendingTaken: allTaken - settledTaken };
  }, [udhpiEntries]);

  const contacts = useMemo(() => {
    const map = new Map<string, UdhariEntry[]>();
    udhpiEntries
      .filter(e => {
        const matchSearch = e.contactName.toLowerCase().includes(search.toLowerCase());
        const matchType = filterType === 'all' || e.type === filterType;
        return matchSearch && matchType;
      })
      .forEach(e => {
        const list = map.get(e.contactName) || [];
        list.push(e);
        map.set(e.contactName, list);
      });
    return map;
  }, [udhpiEntries, search, filterType]);

  const handleSubmit = () => {
    if (!form.contactName || !form.amount || Number(form.amount) <= 0) { toast.error('Please enter contact name and amount'); return; }
    addUdhari({ contactName: form.contactName.trim(), phone: form.phone.trim() || undefined, amount: Number(form.amount), type: form.type, description: form.description.trim(), date: form.date });
    toast.success('Entry added successfully!');
    setForm({ contactName: '', phone: '', amount: '', type: 'given', description: '', date: new Date().toISOString().split('T')[0] });
    setDialogOpen(false);
  };

  const handleSettle = (id: string) => { settleUdhari(id); toast.success('Marked as settled! ✅'); };

  const handleDelete = (id: string) => { deleteUdhari(id); toast.success('Entry deleted.'); };

  const openEdit = (entry: UdhariEntry) => {
    setEditItem(entry);
    setEditForm({ contactName: entry.contactName, phone: entry.phone || '', amount: String(entry.amount), type: entry.type, description: entry.description, date: entry.date });
  };

  const handleUpdate = () => {
    if (!editItem) return;
    const amount = parseFloat(editForm.amount);
    if (!amount || amount <= 0) { toast.error('Enter valid amount'); return; }
    updateUdhari(editItem.id, { contactName: editForm.contactName.trim(), phone: editForm.phone.trim() || undefined, amount, type: editForm.type, description: editForm.description.trim(), date: editForm.date });
    toast.success('Entry updated!');
    setEditItem(null);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Udhari</h1>
          <p className="text-sm text-muted-foreground">Track lending & borrowing</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> New Entry</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add New Entry</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant={form.type === 'given' ? 'default' : 'outline'} className="gap-2" onClick={() => setForm(f => ({ ...f, type: 'given' }))}><ArrowUpCircle className="w-4 h-4" /> I Gave</Button>
                <Button type="button" variant={form.type === 'taken' ? 'default' : 'outline'} className="gap-2" onClick={() => setForm(f => ({ ...f, type: 'taken' }))}><ArrowDownCircle className="w-4 h-4" /> I Took</Button>
              </div>
              <div><Label>Contact Name *</Label><Input placeholder="Enter name" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} /></div>
              <div><Label>Phone (optional)</Label><Input placeholder="Phone number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div><Label>Amount (₹) *</Label><Input type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div><Label>Description</Label><Textarea placeholder="What is this for..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <Button className="w-full" onClick={handleSubmit}>Add Entry</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-destructive"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Given</p><p className="text-xl font-bold text-destructive">₹{summary.totalGiven.toLocaleString()}</p></CardContent></Card>
        <Card className="border-l-4 border-l-green-500"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Taken</p><p className="text-xl font-bold text-green-600">₹{summary.totalTaken.toLocaleString()}</p></CardContent></Card>
        <Card className="border-l-4 border-l-orange-500"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pending to Receive</p><p className="text-xl font-bold text-orange-600">₹{summary.pendingGiven.toLocaleString()}</p></CardContent></Card>
        <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pending to Pay</p><p className="text-xl font-bold text-blue-600">₹{summary.pendingTaken.toLocaleString()}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="given">I Gave</SelectItem>
            <SelectItem value="taken">I Took</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contact-wise entries */}
      {contacts.size === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground"><IndianRupee className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-lg font-medium">No entries yet</p><p className="text-sm">Click "New Entry" above to add one</p></CardContent></Card>
      ) : (
        Array.from(contacts.entries()).map(([name, entries]) => {
          const contactPendingGiven = entries.filter(e => e.type === 'given' && !e.settled).reduce((s, e) => s + e.amount, 0);
          const contactPendingTaken = entries.filter(e => e.type === 'taken' && !e.settled).reduce((s, e) => s + e.amount, 0);
          return (
            <Card key={name} className="overflow-hidden">
              <CardHeader className="pb-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
                    <div>
                      <CardTitle className="text-base">{name}</CardTitle>
                      {entries[0]?.phone && <p className="text-xs text-muted-foreground">{entries[0].phone}</p>}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {contactPendingGiven > 0 && <p className="text-destructive font-semibold">To Receive: ₹{contactPendingGiven.toLocaleString()}</p>}
                    {contactPendingTaken > 0 && <p className="text-blue-600 font-semibold">To Pay: ₹{contactPendingTaken.toLocaleString()}</p>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
                  <div key={entry.id} className="flex items-center justify-between px-4 py-3 border-t border-border/50 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      {entry.type === 'given' ? <ArrowUpCircle className="w-5 h-5 text-destructive shrink-0" /> : <ArrowDownCircle className="w-5 h-5 text-green-600 shrink-0" />}
                      <div>
                        <p className="text-sm font-medium">{entry.type === 'given' ? 'Given' : 'Taken'} — ₹{entry.amount.toLocaleString()}</p>
                        {entry.description && <p className="text-xs text-muted-foreground">{entry.description}</p>}
                        <p className="text-xs text-muted-foreground">{format(new Date(entry.date), 'dd MMM yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {entry.settled ? (
                        <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 gap-1"><CheckCircle2 className="w-3 h-3" /> Settled</Badge>
                      ) : (
                        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleSettle(entry.id)}><CheckCircle2 className="w-3 h-3" /> Settle</Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(entry)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(entry.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Entry</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant={editForm.type === 'given' ? 'default' : 'outline'} className="gap-2" onClick={() => setEditForm(f => ({ ...f, type: 'given' }))}><ArrowUpCircle className="w-4 h-4" /> I Gave</Button>
              <Button type="button" variant={editForm.type === 'taken' ? 'default' : 'outline'} className="gap-2" onClick={() => setEditForm(f => ({ ...f, type: 'taken' }))}><ArrowDownCircle className="w-4 h-4" /> I Took</Button>
            </div>
            <div><Label>Contact Name</Label><Input value={editForm.contactName} onChange={e => setEditForm(f => ({ ...f, contactName: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>Amount (₹)</Label><Input type="number" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Date</Label><Input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} /></div>
            <Button className="w-full" onClick={handleUpdate}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
