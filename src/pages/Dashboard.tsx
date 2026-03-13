import { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORY_ICONS } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, CalendarDays, ArrowUpRight, ArrowDownRight, BarChart3, LifeBuoy } from 'lucide-react';
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
    { label: 'Total Balance', value: stats.balance, icon: Wallet, color: 'text-primary', bgColor: 'bg-primary/10', isPositive: stats.balance >= 0 },
    { label: 'Total Income', value: stats.totalIncome, icon: TrendingUp, color: 'text-income', bgColor: 'bg-green-500/10', isPositive: true },
    { label: 'Total Expenses', value: stats.totalExpenses, icon: TrendingDown, color: 'text-expense', bgColor: 'bg-red-500/10', isPositive: false },
    { label: 'This Month', value: stats.monthSpending, icon: CalendarDays, color: 'text-owe', bgColor: 'bg-orange-500/10', isPositive: false },
  ];

  return (
    <div className="space-y-6 gradient-bg min-h-full">
      {/* Welcome Section */}
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
          Welcome, <span className="text-gradient">{profile?.full_name?.split(' ')[0] || 'User'}</span> 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Here's your financial overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card, idx) => (
          <div
            key={card.label}
            className="stat-card card-hover-glow group animate-fade-in"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${card.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className={`w-4.5 h-4.5 ${card.color}`} />
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-medium ${card.isPositive ? 'text-income' : 'text-expense'}`}>
                {card.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-1">{card.label}</p>
            <p className={`text-xl md:text-2xl font-extrabold ${card.color}`}>
              ₹{card.value.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Reports Access - Mobile */}
      <div className="md:hidden animate-fade-in" style={{ animationDelay: '180ms' }}>
        <Link to="/reports" className="block">
          <Card className="glass-card rounded-2xl card-hover-glow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Reports & Analytics</p>
                  <p className="text-xs text-muted-foreground">View detailed financial reports</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="glass-card rounded-2xl animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              📊 Monthly Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyData.some((d) => d.income > 0 || d.expenses > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)' }} />
                  <Bar dataKey="income" fill="hsl(142,70%,45%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(0,72%,51%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data yet.</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              🍩 Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${CATEGORY_ICONS[name] || '📦'} ${(percent * 100).toFixed(0)}%`}>
                    {stats.categoryData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No expenses yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card className="glass-card rounded-2xl animate-fade-in" style={{ animationDelay: '400ms' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            🧾 Recent Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No expenses yet. Tap "Add Expense" to get started.</p>
          ) : (
            <div className="space-y-1">
              {expenses.slice(0, 5).map((e, idx) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-muted/50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted/80 flex items-center justify-center text-lg">
                      {CATEGORY_ICONS[e.category] || '📦'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{e.description || e.category}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(e.date), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-expense">-₹{e.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Support Card */}
      <Card className="glass-card rounded-2xl animate-fade-in" style={{ animationDelay: '500ms' }}>
        <CardContent className="p-5">
          <p className="text-sm font-bold text-foreground mb-3">💬 Need Help? Contact Support</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="tel:+917668974586" className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
              <Phone className="w-4 h-4" /> +91 7668974586 (Call)
            </a>
            <a href="https://wa.me/917668974586" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-green-600 hover:underline font-medium">
              <MessageCircle className="w-4 h-4" /> +91 7668974586 (WhatsApp)
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
