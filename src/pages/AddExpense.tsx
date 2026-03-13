import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CATEGORIES, CATEGORY_ICONS } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusCircle, X, Users, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const AddExpense = () => {
  const { addExpense, addCustomCategory, customCategories, currentUser } = useAppStore();
  const allCategories = [...CATEGORIES, ...customCategories];

  const [form, setForm] = useState({
    amount: '',
    category: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'personal' as 'personal' | 'group',
  });

  // Group specific state
  const [members, setMembers] = useState<string[]>([]);
  const [newMember, setNewMember] = useState('');
  const [memberShares, setMemberShares] = useState<Record<string, string>>({}); // each member's paid amount

  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  const totalAmount = parseFloat(form.amount) || 0;
  const totalMembers = members.length + 1; // +1 for self
  const equalShare = totalMembers > 0 ? totalAmount / totalMembers : 0;

  const getMemberShare = (name: string) => {
    const val = memberShares[name];
    return val ? parseFloat(val) : equalShare;
  };
  const totalPaid = ['Me', ...members].reduce((sum, m) => sum + getMemberShare(m), 0);

  const handleAddMember = () => {
    const name = newMember.trim();
    if (!name) return;
    if (members.includes(name)) {
      toast.error('Member already added!');
      return;
    }
    setMembers([...members, name]);
    setNewMember('');
  };

  const handleRemoveMember = (name: string) => {
    setMembers(members.filter((m) => m !== name));
    const newShares = { ...memberShares };
    delete newShares[name];
    setMemberShares(newShares);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount.'); return; }
    if (!form.category) { toast.error('Select a category.'); return; }
    if (form.type === 'group' && members.length === 0) {
      toast.error('Add at least one member for group expense.');
      return;
    }

    addExpense({
      amount,
      category: form.category,
      description: form.type === 'group'
        ? `${form.description} | Group: ${['Me', ...members].join(', ')} | Paid by: ${paidBy} | My share: ₹${myShareAmount.toFixed(2)}`
        : form.description,
      date: form.date,
      paidBy: currentUser?.id || '',
      splitWith: members,
      type: form.type,
    });

    toast.success('Expense added!');
    setForm({ amount: '', category: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), type: 'personal' });
    setMembers([]);
    setNewMember('');
    setPaidBy('Me');
    setMyShare('');
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

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Add Expense</h1>
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>

            {/* Category */}
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

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="What was this expense for?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>

            {/* Expense Type */}
            <div className="space-y-2">
              <Label>Expense Type</Label>
              <RadioGroup value={form.type} onValueChange={(v) => { setForm({ ...form, type: v as 'personal' | 'group' }); setMembers([]); setPaidBy('Me'); setMyShare(''); }}>
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

            {/* Group Details */}
            {form.type === 'group' && (
              <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users className="w-4 h-4" />
                  Group Details
                </div>

                {/* Add Members */}
                <div className="space-y-2">
                  <Label>Members</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter member name"
                      value={newMember}
                      onChange={(e) => setNewMember(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMember(); } }}
                    />
                    <Button type="button" size="sm" variant="outline" onClick={handleAddMember} className="shrink-0">
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Member chips */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                      Me (You)
                    </span>
                    {members.map((m) => (
                      <span key={m} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                        {m}
                        <button type="button" onClick={() => handleRemoveMember(m)} className="ml-1 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Total {totalMembers} member{totalMembers > 1 ? 's' : ''} (including you)</p>
                </div>

                {/* Who Paid */}
                <div className="space-y-2">
                  <Label>Who Paid?</Label>
                  <Select value={paidBy} onValueChange={setPaidBy}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Me">Me</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* My Share */}
                <div className="space-y-2">
                  <Label>My Share (₹)</Label>
                  <Input
                    type="number"
                    placeholder={`Equal split: ₹${equalShare.toFixed(2)}`}
                    value={myShare}
                    onChange={(e) => setMyShare(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty for equal split</p>
                </div>

                {/* Split Summary */}
                {totalAmount > 0 && members.length > 0 && (
                  <div className="p-3 rounded-lg bg-accent/50 space-y-1 text-sm">
                    <p className="font-medium text-foreground">Split Summary</p>
                    <p className="text-muted-foreground">Total: <strong className="text-foreground">₹{totalAmount.toFixed(2)}</strong></p>
                    <p className="text-muted-foreground">Members: <strong className="text-foreground">{totalMembers}</strong></p>
                    <p className="text-muted-foreground">Equal share each: <strong className="text-foreground">₹{equalShare.toFixed(2)}</strong></p>
                    <p className="text-muted-foreground">Your share: <strong className="text-foreground">₹{myShareAmount.toFixed(2)}</strong></p>
                    <p className="text-muted-foreground">Paid by: <strong className="text-foreground">{paidBy}</strong></p>
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
