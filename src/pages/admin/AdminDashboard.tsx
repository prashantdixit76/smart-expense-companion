import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Clock, DollarSign, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, subDays, isAfter, parseISO } from 'date-fns';

interface ProfileRow { id: string; status: string; created_at: string; }
interface ExpenseRow { id: string; amount: number; date: string; }

const AdminDashboard = () => {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [p, e] = await Promise.all([
        supabase.from('profiles').select('id, status, created_at'),
        supabase.from('expenses').select('id, amount, date'),
      ]);
      setProfiles(p.data || []);
      setExpenses(e.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const stats = useMemo(() => {
    const totalUsers = profiles.length;
    const activeUsers = profiles.filter(u => u.status === 'approved').length;
    const pendingApprovals = profiles.filter(u => u.status === 'pending').length;
    const totalExpensesAmount = expenses.reduce((s, e) => s + e.amount, 0);

    const userGrowth: { date: string; users: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const count = profiles.filter(u => { try { return !isAfter(parseISO(u.created_at), day); } catch { return true; } }).length;
      userGrowth.push({ date: format(day, 'MMM dd'), users: count });
    }

    const expenseActivity: { date: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayExpenses = expenses.filter(e => e.date === dayStr);
      expenseActivity.push({ date: format(day, 'EEE'), amount: dayExpenses.reduce((s, e) => s + e.amount, 0) });
    }

    return { totalUsers, activeUsers, pendingApprovals, totalExpensesAmount, userGrowth, expenseActivity };
  }, [profiles, expenses]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Active Users', value: stats.activeUsers, icon: UserCheck, color: 'text-income' },
    { label: 'Pending Approvals', value: stats.pendingApprovals, icon: Clock, color: 'text-owe' },
    { label: 'Total Expenses', value: `₹${stats.totalExpensesAmount.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-expense' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <div className="flex items-center gap-2 mb-2"><c.icon className={`w-4 h-4 ${c.color}`} /><span className="text-xs text-muted-foreground font-medium">{c.label}</span></div>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base">User Growth (30 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.userGrowth}><XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Line type="monotone" dataKey="users" stroke="hsl(162,63%,41%)" strokeWidth={2} dot={false} /></LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base">Expense Activity (7 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.expenseActivity}><XAxis dataKey="date" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="amount" fill="hsl(200,70%,50%)" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
