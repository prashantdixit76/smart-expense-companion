import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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

interface UdhariEntry { id: string; contact_name: string; phone: string | null; amount: number; type: string; description: string | null; date: string; settled: boolean | null; settled_date: string | null; created_at: string; }

export default function Udhari() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<UdhariEntry[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'given' | 'taken'>('all');
  const [editItem, setEditItem] = useState<UdhariEntry | null>(null);
  const [editForm, setEditForm] = useState({ contactName: '', phone: '', amount: '', type: 'given' as 'given' | 'taken', description: '', date: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ contactName: '', phone: '', amount: '', type: 'given' as 'given' | 'taken', description: '', date: new Date().toISOString().split('T')[0] });

  const fetchEntries = async () => {
    if (!user) return;
    const { data } = await supabase.from('udhari_entries').select('*').eq('user_id', user.id).order('date', { ascending: false });
    setEntries(data || []);
  };

  useEffect(() => { fetchEntries(); }, [user]);

  const summary = useMemo(() => {
    const allGiven = entries.filter(e => e.type === 'given').reduce((s, e) => s + e.amount, 0);
    const allTaken = entries.filter(e => e.type === 'taken').reduce((s, e) => s + e.amount, 0);
    const settledGiven = entries.filter(e => e.type === 'given' && e.settled).reduce((s, e) => s + e.amount, 0);
    const settledTaken = entries.filter(e => e.type === 'taken' && e.settled).reduce((s, e) => s + e.amount, 0);
    return { totalGiven: allGiven - settledGiven, totalTaken: allTaken - settledTaken, pendingGiven: allGiven - settledGiven, pendingTaken: allTaken - settledTaken };
  }, [entries]);

  const contacts = useMemo(() => {
    const map = new Map<string, UdhariEntry[]>();
    entries.filter(e => {
      const matchSearch = e.contact_name.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'all' || e.type === filterType;
      return matchSearch && matchType;
    }).forEach(e => { const list = map.get(e.contact_name) || []; list.push(e); map.set(e.contact_name, list); });
    return map;
  }, [entries, search, filterType]);

  const handleSubmit = async () => {
    if (!user || !form.contactName || !form.amount || Number(form.amount) <= 0) { toast.error('Please enter contact name and amount'); return; }
    await supabase.from('udhari_entries').insert({ user_id: user.id, contact_name: form.contactName.trim(), phone: form.phone.trim() || null, amount: Number(form.amount), type: form.type, description: form.description.trim(), date: form.date });
    toast.success('Entry added successfully!');
    setForm({ contactName: '', phone: '', amount: '', type: 'given', description: '', date: new Date().toISOString().split('T')[0] });
    setDialogOpen(false);
    fetchEntries();
  };

  const handleSettle = async (id: string) => {
    await supabase.from('udhari_entries').update({ settled: true, settled_date: new Date().toISOString() }).eq('id', id);
    toast.success('Marked as settled! ✅');
    fetchEntries();
  };

  const confirmDelete = async () => {
    if (deleteId) { await supabase.from('udhari_entries').delete().eq('id', deleteId); toast.success('Entry deleted.'); setDeleteId(null); fetchEntries(); }
  };

  const openEdit = (entry: UdhariEntry) => {
    setEditItem(entry);
    setEditForm({ contactName: entry.contact_name, phone: entry.phone || '', amount: String(entry.amount), type: entry.type as 'given' | 'taken', description: entry.description || '', date: entry.date });
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    const amount = parseFloat(editForm.amount);
    if (!amount || amount <= 0) { toast.error('Enter valid amount'); return; }
    await supabase.from('udhari_entries').update({ contact_name: editForm.contactName.trim(), phone: editForm.phone.trim() || null, amount, type: editForm.type, description: editForm.description.trim(), date: editForm.date }).eq('id', editItem.id);
    toast.success('Entry updated!');
    setEditItem(null);
    fetchEntries();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">Track lending & borrowing</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2 rounded-xl gradient-primary text-primary-foreground"><Plus className="w-4 h-4" /> New Entry</Button></DialogTrigger>
          <DialogContent className="glass-card rounded-2xl max-w-[calc(100vw-2rem)] sm:max-w-md">
            <DialogHeader><DialogTitle>Add New Entry</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant={form.type === 'given' ? 'default' : 'outline'} className="gap-2 rounded-xl" onClick={() => setForm(f => ({ ...f, type: 'given' }))}><ArrowUpCircle className="w-4 h-4" /> I Gave</Button>
                <Button type="button" variant={form.type === 'taken' ? 'default' : 'outline'} className="gap-2 rounded-xl" onClick={() => setForm(f => ({ ...f, type: 'taken' }))}><ArrowDownCircle className="w-4 h-4" /> I Took</Button>
              </div>
              <div><Label>Contact Name *</Label><Input placeholder="Enter name" className="rounded-xl" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} /></div>
              <div><Label>Phone (optional)</Label><Input placeholder="Phone number" className="rounded-xl" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div><Label>Amount (₹) *</Label><Input type="number" placeholder="0" className="rounded-xl" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div><Label>Description</Label><Textarea placeholder="What is this for..." className="rounded-xl" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div><Label>Date</Label><Input type="date" className="rounded-xl" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <Button className="w-full rounded-xl gradient-primary text-primary-foreground" onClick={handleSubmit}>Add Entry</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-3 animate-fade-in">
        <div className="stat-card border-l-4 border-l-destructive"><p className="text-xs text-muted-foreground font-medium">Total Given</p><p className="text-xl font-bold text-destructive">₹{summary.totalGiven.toLocaleString()}</p></div>
        <div className="stat-card border-l-4 border-l-green-500"><p className="text-xs text-muted-foreground font-medium">Total Taken</p><p className="text-xl font-bold text-income">₹{summary.totalTaken.toLocaleString()}</p></div>
        <div className="stat-card border-l-4 border-l-orange-500"><p className="text-xs text-muted-foreground font-medium">Pending to Receive</p><p className="text-xl font-bold text-owe">₹{summary.pendingGiven.toLocaleString()}</p></div>
        <div className="stat-card border-l-4 border-l-blue-500"><p className="text-xs text-muted-foreground font-medium">Pending to Pay</p><p className="text-xl font-bold text-primary">₹{summary.pendingTaken.toLocaleString()}</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search contacts..." className="pl-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}><SelectTrigger className="w-full sm:w-[150px] rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="given">I Gave</SelectItem><SelectItem value="taken">I Took</SelectItem></SelectContent></Select>
      </div>

      {contacts.size === 0 ? (
        <Card className="glass-card rounded-2xl animate-fade-in">
          <CardContent className="p-12 text-center text-muted-foreground">
            <IndianRupee className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-semibold">No entries yet</p>
            <p className="text-sm">Click "New Entry" above to add one</p>
          </CardContent>
        </Card>
      ) : (
        Array.from(contacts.entries()).map(([name, contactEntries], groupIdx) => {
          const contactPendingGiven = contactEntries.filter(e => e.type === 'given' && !e.settled).reduce((s, e) => s + e.amount, 0);
          const contactPendingTaken = contactEntries.filter(e => e.type === 'taken' && !e.settled).reduce((s, e) => s + e.amount, 0);
          return (
            <Card key={name} className="glass-card rounded-2xl overflow-hidden animate-fade-in" style={{ animationDelay: `${groupIdx * 60}ms` }}>
              <CardHeader className="pb-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{name}</CardTitle>
                      {contactEntries[0]?.phone && <p className="text-xs text-muted-foreground">{contactEntries[0].phone}</p>}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {contactPendingGiven > 0 && <p className="text-destructive font-semibold">To Receive: ₹{contactPendingGiven.toLocaleString()}</p>}
                    {contactPendingTaken > 0 && <p className="text-primary font-semibold">To Pay: ₹{contactPendingTaken.toLocaleString()}</p>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {contactEntries.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between px-4 py-3 border-t border-border/30 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {entry.type === 'given' ? <ArrowUpCircle className="w-5 h-5 text-destructive shrink-0" /> : <ArrowDownCircle className="w-5 h-5 text-income shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{entry.type === 'given' ? 'Given' : 'Taken'} — ₹{entry.amount.toLocaleString()}</p>
                        {entry.description && <p className="text-xs text-muted-foreground truncate">{entry.description}</p>}
                        <p className="text-xs text-muted-foreground">{format(new Date(entry.date), 'dd MMM yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {entry.settled ? (
                        <Badge variant="outline" className="text-income border-green-300/50 bg-green-50/50 dark:bg-green-950/30 gap-1 rounded-lg"><CheckCircle2 className="w-3 h-3" /> Settled</Badge>
                      ) : (
                        <Button size="sm" variant="outline" className="gap-1 text-xs rounded-lg" onClick={() => handleSettle(entry.id)}><CheckCircle2 className="w-3 h-3" /> Settle</Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-xl" onClick={() => openEdit(entry)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-xl" onClick={() => setDeleteId(entry.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })
      )}

      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="glass-card rounded-2xl max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Entry</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant={editForm.type === 'given' ? 'default' : 'outline'} className="gap-2 rounded-xl" onClick={() => setEditForm(f => ({ ...f, type: 'given' }))}><ArrowUpCircle className="w-4 h-4" /> I Gave</Button>
              <Button type="button" variant={editForm.type === 'taken' ? 'default' : 'outline'} className="gap-2 rounded-xl" onClick={() => setEditForm(f => ({ ...f, type: 'taken' }))}><ArrowDownCircle className="w-4 h-4" /> I Took</Button>
            </div>
            <div><Label>Contact Name</Label><Input className="rounded-xl" value={editForm.contactName} onChange={e => setEditForm(f => ({ ...f, contactName: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input className="rounded-xl" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>Amount (₹)</Label><Input type="number" className="rounded-xl" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea className="rounded-xl" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Date</Label><Input type="date" className="rounded-xl" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} /></div>
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
}