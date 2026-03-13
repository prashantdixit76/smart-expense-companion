import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CATEGORY_ICONS } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

const COLORS = [
  'hsl(162,63%,41%)', 'hsl(200,70%,50%)', 'hsl(38,92%,50%)',
  'hsl(280,60%,55%)', 'hsl(0,72%,51%)', 'hsl(45,90%,55%)',
  'hsl(190,80%,42%)', 'hsl(330,65%,50%)', 'hsl(100,55%,45%)',
];

const Reports = () => {
  const { expenses, incomes } = useAppStore();
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const months = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => set.add(e.date.substring(0, 7)));
    incomes.forEach((i) => set.add(i.date.substring(0, 7)));
    set.add(currentMonth);
    return Array.from(set).sort().reverse();
  }, [expenses, incomes, currentMonth]);

  const stats = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    const mStart = startOfMonth(d);
    const mEnd = endOfMonth(d);

    const inRange = (date: string) => {
      try { return isWithinInterval(parseISO(date), { start: mStart, end: mEnd }); }
      catch { return false; }
    };

    const monthExpenses = expenses.filter((e) => inRange(e.date));
    const monthIncomes = incomes.filter((i) => inRange(i.date));

    const totalIncome = monthIncomes.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);

    const categoryMap: Record<string, number> = {};
    monthExpenses.forEach((e) => { categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount; });
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses, categoryData };
  }, [expenses, incomes, selectedMonth]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Monthly Reports</h1>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map((m) => <SelectItem key={m} value={m}>{format(parseISO(m + '-01'), 'MMMM yyyy')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground font-medium">Income</p>
          <p className="text-lg font-bold text-income">₹{stats.totalIncome.toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground font-medium">Expenses</p>
          <p className="text-lg font-bold text-expense">₹{stats.totalExpenses.toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground font-medium">Balance</p>
          <p className={`text-lg font-bold ${stats.balance >= 0 ? 'text-income' : 'text-expense'}`}>₹{stats.balance.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2"><CardTitle className="text-base">Category Breakdown</CardTitle></CardHeader>
        <CardContent>
          {stats.categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={stats.categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, percent }) => `${CATEGORY_ICONS[name] || '📦'} ${(percent * 100).toFixed(0)}%`}>
                    {stats.categoryData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {stats.categoryData.map((c, idx) => (
                  <div key={c.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span>{CATEGORY_ICONS[c.name] || '📦'} {c.name}</span>
                    </div>
                    <span className="font-medium">₹{c.value.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No expenses this month.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
