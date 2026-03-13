import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORY_ICONS } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, CalendarDays, Phone, MessageCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

const CHART_COLORS = [
  'hsl(162,63%,41%)', 'hsl(200,70%,50%)', 'hsl(38,92%,50%)',
  'hsl(280,60%,55%)', 'hsl(0,72%,51%)', 'hsl(45,90%,55%)',
  'hsl(190,80%,42%)', 'hsl(330,65%,50%)', 'hsl(100,55%,45%)',
];

interface Expense { id: string; amount: number; category: string; description: string | null; date: string; paid_by: string | null; split_with: string[] | null; type: string | null; created_at: string; }
interface Income { id: string; amount: number; source: string; description: string | null; date: string; created_at: string; }

const Dashboard = () => {
  const { profile, user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [expRes, incRes] = await Promise.all([
        supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('incomes').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      ]);
      setExpenses(expRes.data || []);
      setIncomes(incRes.data || []);
    };
    fetchData();
  }, [user]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const monthlyExpenses = expenses.filter((e) => {
      try { return isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd }); }
      catch { return false; }
    });
    const monthSpending = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

    const categoryMap: Record<string, number> = {};
    expenses.forEach((e) => { categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount; });
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    const monthlyData: { month: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = startOfMonth(d);
      const mEnd = endOfMonth(d);
      const mExpenses = expenses.filter((e) => {
        try { return isWithinInterval(parseISO(e.date), { start: mStart, end: mEnd }); } catch { return false; }
      }).reduce((s, e) => s + e.amount, 0);
      const mIncome = incomes.filter((inc) => {
        try { return isWithinInterval(parseISO(inc.date), { start: mStart, end: mEnd }); } catch { return false; }
      }).reduce((s, inc) => s + inc.amount, 0);
      monthlyData.push({ month: format(d, 'MMM'), income: mIncome, expenses: mExpenses });
    }

    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses, monthSpending, categoryData, monthlyData };
  }, [expenses, incomes]);

  const statCards = [
    { label: 'Total Balance', value: stats.balance, icon: Wallet, color: 'text-primary' },
    { label: 'Total Income', value: stats.totalIncome, icon: TrendingUp, color: 'text-income' },
    { label: 'Total Expenses', value: stats.totalExpenses, icon: TrendingDown, color: 'text-expense' },
    { label: 'This Month', value: stats.monthSpending, icon: CalendarDays, color: 'text-owe' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome, {profile?.full_name?.split(' ')[0] || 'User'}</h1>
        <p className="text-muted-foreground text-sm mt-1">Here's your financial overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground font-medium">{card.label}</span>
            </div>
            <p className={`text-xl md:text-2xl font-bold ${card.color}`}>
              ₹{card.value.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Monthly Overview</CardTitle></CardHeader>
          <CardContent>
            {stats.monthlyData.some((d) => d.income > 0 || d.expenses > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="income" fill="hsl(142,70%,45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(0,72%,51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data yet.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Spending by Category</CardTitle></CardHeader>
          <CardContent>
            {stats.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${CATEGORY_ICONS[name] || '📦'} ${(percent * 100).toFixed(0)}%`}>
                    {stats.categoryData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No expenses yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Recent Expenses</CardTitle></CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No expenses yet. Tap "Add Expense" to get started.</p>
          ) : (
            <div className="space-y-2">
              {expenses.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{CATEGORY_ICONS[e.category] || '📦'}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.description || e.category}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(e.date), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-expense">-₹{e.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Need Help? Contact Support</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="tel:+917668974586" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <Phone className="w-4 h-4" /> +91 7668974586 (Call)
            </a>
            <a href="https://wa.me/917668974586" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-green-600 hover:underline">
              <MessageCircle className="w-4 h-4" /> +91 7668974586 (WhatsApp)
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
