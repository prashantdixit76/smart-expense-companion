import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CATEGORIES, CATEGORY_ICONS } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const AddExpense = () => {
  const { addExpense, addCustomCategory, customCategories, users, currentUser } = useAppStore();
  const allCategories = [...CATEGORIES, ...customCategories];

  const [form, setForm] = useState({
    amount: '',
    category: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'personal' as 'personal' | 'group',
    splitWith: [] as string[],
  });
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  const otherUsers = users.filter((u) => u.id !== currentUser?.id && u.status === 'approved');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount.'); return; }
    if (!form.category) { toast.error('Select a category.'); return; }

    addExpense({
      amount,
      category: form.category,
      description: form.description,
      date: form.date,
      paidBy: currentUser?.id || '',
      splitWith: form.type === 'group' ? form.splitWith : [],
      type: form.type,
    });

    toast.success('Expense added!');
    setForm({ amount: '', category: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), type: 'personal', splitWith: [] });
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCustomCategory(newCategory.trim());
      setForm({ ...form, category: newCategory.trim() });
      setNewCategory('');
      setShowNewCategory(false);
      toast.success('Category added!');
    }
  };

  const toggleSplitUser = (userId: string) => {
    setForm((prev) => ({
      ...prev,
      splitWith: prev.splitWith.includes(userId)
        ? prev.splitWith.filter((id) => id !== userId)
        : [...prev.splitWith, userId],
    }));
  };

  const splitAmount = form.type === 'group' && form.splitWith.length > 0 && parseFloat(form.amount)
    ? parseFloat(form.amount) / (form.splitWith.length + 1)
    : 0;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Add Expense</h1>
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => { if (v === '__new__') { setShowNewCategory(true); } else { setForm({ ...form, category: v }); } }}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {allCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_ICONS[c] || '📦'} {c}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">➕ Add Custom Category</SelectItem>
                </SelectContent>
              </Select>
              {showNewCategory && (
                <div className="flex gap-2 mt-2">
                  <Input placeholder="New category name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
                  <Button type="button" size="sm" onClick={handleAddCategory}>Add</Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="What was this expense for?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Expense Type</Label>
              <RadioGroup value={form.type} onValueChange={(v) => setForm({ ...form, type: v as 'personal' | 'group', splitWith: [] })}>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="personal" id="personal" />
                    <Label htmlFor="personal" className="font-normal">Personal</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="group" id="group" />
                    <Label htmlFor="group" className="font-normal">Group</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {form.type === 'group' && (
              <div className="space-y-2">
                <Label>Split With</Label>
                {otherUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No other approved users to split with.</p>
                ) : (
                  <div className="space-y-2">
                    {otherUsers.map((u) => (
                      <div key={u.id} className="flex items-center gap-2">
                        <Checkbox checked={form.splitWith.includes(u.id)} onCheckedChange={() => toggleSplitUser(u.id)} id={u.id} />
                        <Label htmlFor={u.id} className="font-normal">{u.fullName}</Label>
                      </div>
                    ))}
                    {splitAmount > 0 && (
                      <div className="mt-2 p-3 rounded-lg bg-accent text-accent-foreground text-sm">
                        Each person pays: <strong>₹{splitAmount.toFixed(2)}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <Button type="submit" className="w-full gap-2">
              <PlusCircle className="w-4 h-4" />
              Add Expense
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddExpense;
