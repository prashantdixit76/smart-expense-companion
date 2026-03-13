import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { INCOME_SOURCES } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowDownCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const AddIncome = () => {
  const { addIncome } = useAppStore();
  const [form, setForm] = useState({
    amount: '',
    source: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount.'); return; }
    if (!form.source) { toast.error('Select an income source.'); return; }

    addIncome({ amount, source: form.source, description: form.description, date: form.date });
    toast.success('Income added!');
    setForm({ amount: '', source: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Add Income</h1>
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
                <SelectContent>
                  {INCOME_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
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
            <Button type="submit" className="w-full gap-2">
              <ArrowDownCircle className="w-4 h-4" />
              Add Income
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddIncome;
